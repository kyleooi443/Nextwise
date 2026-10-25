import { addDaysToDayKey, dayKeyInTimeZone } from "./date-time.ts";
import type { AppState, FocusOutcome, FocusSession } from "@/types/nextwise";

export type InsightDay = { dateKey: string; label: string; minutes: number; sessionCount: number };
export type InsightSuggestion = {
  id: string;
  title: string;
  evidence: string;
  actionLabel: string;
  href: "/focus" | "/inbox" | "/timeline" | "/settings";
};
export type InsightReport = {
  rangeDays: 7 | 30;
  focusByDay: InsightDay[];
  outcomes: Record<FocusOutcome, number>;
  metrics: { endedSessions: number; completedSessions: number; focusMinutes: number; averageActualMinutes?: number };
  eligibleSampleCount: number;
  suggestions: InsightSuggestion[];
};
export type EvidenceInsight = { title: string; detail: string; sample: string };

const OUTCOMES: FocusOutcome[] = ["completed", "partial", "blocked", "skipped"];
const REFLECTIONS = [
  "A small, clear next step is enough to begin.",
  "Protect one useful block of attention today.",
  "Progress grows when the next action feels doable.",
  "Make room for the work that matters most.",
  "A thoughtful pause can help you choose what comes next.",
  "Keep the plan flexible and the next step concrete.",
  "Steady effort gives important work a place to land.",
  "Start with what you can move forward now.",
];

function isEndedInRange(session: FocusSession, keys: Set<string>, timeZone: string): boolean {
  return Boolean(session.endedAt && keys.has(dayKeyInTimeZone(session.endedAt, timeZone)));
}

export function deriveInsightReport(state: AppState, rangeDays: 7 | 30, now: Date = new Date()): InsightReport {
  const timeZone = state.preferences.timezone;
  const today = dayKeyInTimeZone(now, timeZone);
  const firstDay = addDaysToDayKey(today, -(rangeDays - 1));
  const dateKeys = Array.from({ length: rangeDays }, (_, index) => addDaysToDayKey(firstDay, index));
  const dayMap = new Map(dateKeys.map((dateKey) => [dateKey, { dateKey, label: "", minutes: 0, sessionCount: 0 }]));
  const range = new Set(dateKeys);
  const rangedSessions = state.sessions.filter((session) => isEndedInRange(session, range, timeZone));
  const outcomes: Record<FocusOutcome, number> = { completed: 0, partial: 0, blocked: 0, skipped: 0 };
  let actualMinutesTotal = 0;
  let actualMinutesCount = 0;
  for (const session of rangedSessions) {
    const day = dayMap.get(dayKeyInTimeZone(session.endedAt!, timeZone))!;
    day.sessionCount += 1;
    if (typeof session.actualMinutes === "number" && Number.isFinite(session.actualMinutes) && session.actualMinutes >= 0) {
      day.minutes += session.actualMinutes;
      actualMinutesTotal += session.actualMinutes;
      actualMinutesCount += 1;
    }
    if (OUTCOMES.includes(session.outcome as FocusOutcome)) outcomes[session.outcome as FocusOutcome] += 1;
  }
  const labels = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...(rangeDays === 7 ? { weekday: "short" } : {}), month: rangeDays === 7 ? "short" : "numeric", day: "numeric" });
  const focusByDay = [...dayMap.values()].map((day) => ({ ...day, label: labels.format(new Date(`${day.dateKey}T12:00:00.000Z`)) }));
  const eligible = rangedSessions.filter((session) => OUTCOMES.includes(session.outcome as FocusOutcome)
    && session.outcome !== "skipped"
    && typeof session.actualMinutes === "number"
    && Number.isFinite(session.actualMinutes));
  const completed = rangedSessions.filter((session) => session.outcome === "completed");
  const suggestions: InsightSuggestion[] = [];
  if (rangedSessions.length === 0) {
    suggestions.push({ id: "start-focus", title: "Start with a short focus block", evidence: "There are no ended focus sessions in this date range yet.", actionLabel: "Start focus", href: "/focus" });
  } else {
    const interruptions = outcomes.blocked + outcomes.skipped;
    if (interruptions >= 2) suggestions.push({ id: "shorter-session", title: "Try a shorter focus block", evidence: `${interruptions} sessions were blocked or skipped in this range.`, actionLabel: "Choose a focus block", href: "/focus" });
    const completedWithActual = rangedSessions.filter((session) => session.outcome === "completed" && typeof session.actualMinutes === "number" && Number.isFinite(session.actualMinutes));
    const averageOverPlan = completedWithActual.length
      ? completedWithActual.reduce((sum, session) => sum + session.actualMinutes! - session.plannedMinutes, 0) / completedWithActual.length
      : 0;
    if (eligible.length >= 5 && completedWithActual.length >= 2 && averageOverPlan >= 5) {
      suggestions.push({ id: "estimates", title: "Refresh task time estimates", evidence: `${completedWithActual.length} completed sessions averaged ${Math.round(averageOverPlan)} minutes longer than planned.`, actionLabel: "Review tasks", href: "/inbox" });
    }
  }
  const openTaskCount = state.tasks.filter((task) => task.status !== "completed").length;
  if (openTaskCount > 0) suggestions.push({ id: "inbox", title: "Choose what to work on next", evidence: `${openTaskCount} open ${openTaskCount === 1 ? "task is" : "tasks are"} available in your Inbox.`, actionLabel: "Open Inbox", href: "/inbox" });
  if (suggestions.length < 3 && rangedSessions.length > 0 && eligible.length < 5) {
    suggestions.push({ id: "keep-recording", title: "Keep recording focus sessions", evidence: `${eligible.length} eligible session${eligible.length === 1 ? "" : "s"} so far; comparisons need at least 5.`, actionLabel: "View timeline", href: "/timeline" });
  }
  return {
    rangeDays,
    focusByDay,
    outcomes,
    metrics: {
      endedSessions: rangedSessions.length,
      completedSessions: completed.length,
      focusMinutes: actualMinutesTotal,
      ...(actualMinutesCount ? { averageActualMinutes: Math.round(actualMinutesTotal / actualMinutesCount) } : {}),
    },
    eligibleSampleCount: eligible.length,
    suggestions: suggestions.slice(0, 3),
  };
}

export function getDailyReflection(now: Date, timeZone: string): { text: string; dayKey: string } {
  const dayKey = dayKeyInTimeZone(now, timeZone);
  const dayNumber = Math.floor(Date.parse(`${dayKey}T12:00:00.000Z`) / 86_400_000);
  return { text: REFLECTIONS[dayNumber % REFLECTIONS.length], dayKey };
}

// Retained until the Insights page switches to the range-based report.
export function deriveInsights(state: AppState): EvidenceInsight[] {
  const sessions = state.sessions.filter((session) => session.endedAt && session.outcome && session.outcome !== "skipped" && session.actualMinutes !== undefined);
  if (sessions.length < 5) return [];
  const average = Math.round(sessions.reduce((sum, session) => sum + (session.actualMinutes ?? 0), 0) / sessions.length);
  return [{ title: "Your focus sessions", detail: `Your last ${sessions.length} recorded sessions averaged ${average} minutes.`, sample: `${sessions.length} sessions` }];
}
