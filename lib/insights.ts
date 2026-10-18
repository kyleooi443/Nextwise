import type { AppState, FocusSession } from "@/types/nextwise";

export type EvidenceInsight = { title: string; detail: string; sample: string };

export function deriveInsights(state: AppState): EvidenceInsight[] {
  const sessions = state.sessions.filter((session) => session.outcome && session.outcome !== "skipped" && session.actualMinutes !== undefined);
  if (sessions.length < 5) return [];
  const results: EvidenceInsight[] = [];
  const completed = sessions.filter((session) => session.outcome === "completed");
  const avg = Math.round(sessions.reduce((sum, session) => sum + (session.actualMinutes ?? 0), 0) / sessions.length);
  results.push({ title: "Your focus sessions", detail: `Your last ${sessions.length} recorded sessions averaged ${avg} minutes.`, sample: `${sessions.length} sessions` });
  const byLevel = new Map<number, FocusSession[]>();
  for (const session of completed) {
    const level = state.tasks.find((task) => task.id === session.taskId)?.reasoningLevel;
    if (!level) continue;
    byLevel.set(level, [...(byLevel.get(level) ?? []), session]);
  }
  const strongest = [...byLevel.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (strongest && strongest[1].length >= 3) {
    const average = Math.round(strongest[1].reduce((sum, session) => sum + (session.actualMinutes ?? 0), 0) / strongest[1].length);
    results.push({ title: `Completed L${strongest[0]} work`, detail: `Your completed L${strongest[0]} sessions averaged ${average} minutes.`, sample: `${strongest[1].length} completed sessions` });
  }
  return results;
}
