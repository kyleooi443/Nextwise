import assert from "node:assert/strict";
import test from "node:test";
import { deriveInsightReport, getDailyReflection } from "./insights.ts";

const prefs = { name: "Ari", timezone: "Asia/Manila", workStart: "09:00", workEnd: "17:00", availableMinutes: 60, energy: "medium", theme: "system", contextPanelOpen: true };
const stateWith = (sessions = [], tasks = []) => ({ version: 1, tasks, blocks: [], sessions, revisions: [], preferences: prefs });
const session = (date, outcome = "completed", actualMinutes = 20, plannedMinutes = 25) => ({ id: `${date}-${outcome}`, taskId: "task", startedAt: `${date}T01:00:00.000Z`, endedAt: `${date}T01:20:00.000Z`, actualMinutes, plannedMinutes, outcome, pausedSeconds: 0 });

test("builds every saved-zone day, including zero buckets, with no invented activity", () => {
  const report = deriveInsightReport(stateWith(), 7, new Date("2026-10-26T01:00:00.000Z"));
  assert.equal(report.focusByDay.length, 7);
  assert.equal(report.focusByDay.at(-1).dateKey, "2026-10-26");
  assert.equal(report.focusByDay.at(-1).minutes, 0);
  assert.equal(report.metrics.endedSessions, 0);
  assert.equal(report.metrics.focusMinutes, 0);
  assert.equal(report.suggestions[0].href, "/focus");
});

test("aggregates only ended records in range and recognized outcome categories", () => {
  const records = [
    session("2026-10-26", "completed", 30),
    session("2026-10-25", "partial", 12),
    { ...session("2026-10-24", "blocked"), actualMinutes: undefined },
    session("2026-10-23", "skipped", 0),
    { ...session("2026-10-22", undefined, 8), endedAt: undefined },
    session("2026-09-01", "completed", 50),
    { ...session("2026-10-21", "unknown", 9) },
  ];
  const report = deriveInsightReport(stateWith(records), 7, new Date("2026-10-26T01:00:00.000Z"));
  assert.equal(report.metrics.endedSessions, 5);
  assert.equal(report.metrics.completedSessions, 1);
  assert.equal(report.metrics.focusMinutes, 51);
  assert.equal(report.focusByDay.find((day) => day.dateKey === "2026-10-26").minutes, 30);
  assert.deepEqual(report.outcomes, { completed: 1, partial: 1, blocked: 1, skipped: 1 });
});

test("limits comparative suggestions below five eligible samples and offers useful actions", () => {
  const tasks = [{ id: "open", status: "todo", remainingMinutes: 10 }];
  const sparse = deriveInsightReport(stateWith([session("2026-10-26"), session("2026-10-25", "blocked", 15), session("2026-10-24", "skipped", 0)], tasks), 7, new Date("2026-10-26T01:00:00.000Z"));
  assert.deepEqual(sparse.suggestions.map(({ id }) => id), ["shorter-session", "inbox", "keep-recording"]);
  assert.equal(sparse.eligibleSampleCount, 2);

  const records = Array.from({ length: 5 }, (_, index) => session(`2026-10-2${6 - index}`, "completed", 31, 25));
  const enough = deriveInsightReport(stateWith(records, tasks), 7, new Date("2026-10-26T01:00:00.000Z"));
  assert.equal(enough.eligibleSampleCount, 5);
  assert.ok(enough.suggestions.some(({ id }) => id === "estimates"));
  assert.ok(enough.suggestions.length <= 3);
});

test("daily reflection is stable by saved-zone day and changes across local midnight", () => {
  const first = getDailyReflection(new Date("2026-10-25T16:00:00.000Z"), "Asia/Manila");
  const sameDay = getDailyReflection(new Date("2026-10-26T01:00:00.000Z"), "Asia/Manila");
  const nextDay = getDailyReflection(new Date("2026-10-26T16:00:00.000Z"), "Asia/Manila");
  assert.deepEqual(first, sameDay);
  assert.notEqual(first.dayKey, nextDay.dayKey);
  assert.notEqual(first.text, "");
});
