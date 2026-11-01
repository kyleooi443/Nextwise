import type { AppState, EnergyLevel, Recommendation, RecommendationFactor, RecommendationResult, Task } from "@/types/nextwise";
import { dayKeyInTimeZone, formatInTimeZone } from "@/lib/date-time";

const MINUTES_PER_DAY = 24 * 60;

function minutesUntil(date: string | undefined, now: Date): number | undefined {
  if (!date) return undefined;
  return (new Date(date).getTime() - now.getTime()) / 60_000;
}

function urgency(task: Task, now: Date): number {
  const remaining = minutesUntil(task.deadlineAt, now);
  if (remaining === undefined) return 0.12;
  if (remaining <= 0) return 1;
  return Math.max(0.08, Math.min(1, 1 - remaining / (7 * MINUTES_PER_DAY)));
}

function energyMatch(level: number, energy: EnergyLevel): number {
  const target = energy === "low" ? 1.4 : energy === "medium" ? 2.4 : 3.3;
  return Math.max(0.15, 1 - Math.abs(level - target) / 3.4);
}

function isDependencyReady(task: Task, tasks: Task[]): boolean {
  return task.dependencies.every((id) => tasks.find((item) => item.id === id)?.status === "completed");
}

function recommendationFor(task: Task, state: AppState, now: Date): Recommendation {
  const available = Math.max(5, state.preferences.availableMinutes);
  const duration = Math.min(task.remainingMinutes, available);
  const u = urgency(task, now);
  const i = task.importance;
  const f = Math.min(1, available / Math.max(1, task.remainingMinutes));
  const e = energyMatch(task.reasoningLevel, state.preferences.energy);
  const d = state.tasks.some((candidate) => candidate.dependencies.includes(task.id) && candidate.status !== "completed") ? 1 : 0.15;
  const s = task.ease;
  const p = Math.min(24, task.dismissals * 8 + (task.status === "in_progress" ? 0 : 0));
  const score = 30 * u + 20 * i + 15 * f + 15 * e + 10 * d + 10 * s - p;
  const factors: RecommendationFactor[] = [
    { key: "urgency", label: "Deadline", value: u, points: 30 * u, reason: task.deadlineAt ? `Due ${formatRelative(task.deadlineAt, now, state.preferences.timezone)}` : "No deadline set" },
    { key: "importance", label: "Importance", value: i, points: 20 * i, reason: i >= 0.8 ? "Marked important" : "Importance set by you" },
    { key: "fit", label: "Time fit", value: f, points: 15 * f, reason: duration < task.remainingMinutes ? `A ${duration}-minute step fits now` : `Fits your ${available}-minute window` },
    { key: "energy", label: "Energy match", value: e, points: 15 * e, reason: `L${task.reasoningLevel} fits your ${state.preferences.energy} energy setting` },
    { key: "dependency", label: "Unblocks work", value: d, points: 10 * d, reason: d > 0.5 ? "Unblocks another task" : "No dependent task waiting" },
    { key: "ease", label: "Easy to start", value: s, points: 10 * s, reason: "Based on the task's start effort" },
    { key: "penalty", label: "Recent dismissals", value: p, points: -p, reason: p ? "Recently dismissed; score reduced" : "No recent dismissals" },
  ];
  const top = [...factors].filter((factor) => factor.key !== "penalty").sort((a, b) => b.points - a.points).slice(0, 2);
  const explanation = `${top[0]?.reason ?? "Available to work on"}. ${top[1]?.reason ?? "Fits your current window"}.`;
  return { taskId: task.id, score, durationMinutes: duration, factors, explanation };
}

export function recommendNext(state: AppState, now = new Date()): RecommendationResult {
  const tasks = state.tasks;
  const unavailable = tasks.filter((task) => task.status === "todo" && !isDependencyReady(task, tasks));
  const candidates = tasks.filter((task) => task.status === "todo" && isDependencyReady(task, tasks) && (!task.snoozedUntil || new Date(task.snoozedUntil) <= now) && (task.splittable || task.remainingMinutes <= state.preferences.availableMinutes));
  const ranked = candidates.map((task) => recommendationFor(task, state, now)).sort((a, b) => b.score - a.score);
  const riskWindow = Math.max(state.preferences.availableMinutes, 24 * 60);
  const risks = tasks.filter((task) => task.status !== "completed" && task.deadlineAt && minutesUntil(task.deadlineAt, now)! <= riskWindow && task.remainingMinutes > state.preferences.availableMinutes);
  return { ranked, risks, unavailable };
}

export function formatRelative(dateString: string, now = new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"): string {
  const deadline = new Date(dateString);
  const minutes = (deadline.getTime() - now.getTime()) / 60_000;
  if (minutes < 0) return "overdue";
  if (minutes < 60) return `in ${Math.max(1, Math.round(minutes))} min`;
  const todayKey = dayKeyInTimeZone(now, timeZone);
  const deadlineKey = dayKeyInTimeZone(deadline, timeZone);
  if (deadlineKey === todayKey) return "today";
  const days = Math.round((Date.parse(`${deadlineKey}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / MINUTES_PER_DAY / 60_000);
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  return formatInTimeZone(deadline, timeZone, { month: "short", day: "numeric" });
}

export function getTask(state: AppState, recommendation?: Recommendation): Task | undefined {
  return state.tasks.find((task) => task.id === (recommendation?.taskId ?? state.selectedTaskId));
}

export function levelName(level: number): string {
  return ({ 1: "Light", 2: "Moderate", 3: "Deep", 4: "Intensive" } as Record<number, string>)[level] ?? "Moderate";
}
