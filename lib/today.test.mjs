import assert from "node:assert/strict";
import test from "node:test";
import { deriveTodayActivity } from "./today.ts";

test("Today summary selects saved-zone blocks and ended focus time for the local day", () => {
  const state = {
    preferences: { timezone: "Asia/Manila" },
    blocks: [
      { id: "today-before-utc-midnight", title: "First", startAt: "2026-10-25T16:30:00.000Z", endAt: "2026-10-25T17:00:00.000Z", kind: "fixed", locked: true },
      { id: "today-late", title: "Last", startAt: "2026-10-26T14:00:00.000Z", endAt: "2026-10-26T15:00:00.000Z", kind: "flexible", locked: false },
      { id: "previous-day", title: "Yesterday", startAt: "2026-10-25T15:00:00.000Z", endAt: "2026-10-25T16:00:00.000Z", kind: "fixed", locked: true },
    ],
    sessions: [
      { id: "today", startedAt: "2026-10-25T15:30:00.000Z", endedAt: "2026-10-25T16:00:00.000Z", actualMinutes: 22, plannedMinutes: 25, pausedSeconds: 0 },
      { id: "yesterday", startedAt: "2026-10-25T14:00:00.000Z", endedAt: "2026-10-25T15:00:00.000Z", actualMinutes: 40, plannedMinutes: 40, pausedSeconds: 0 },
      { id: "active", startedAt: "2026-10-26T01:00:00.000Z", actualMinutes: 55, plannedMinutes: 60, pausedSeconds: 0 },
    ],
  };
  const summary = deriveTodayActivity(state, new Date("2026-10-26T01:00:00.000Z"));
  assert.equal(summary.dayKey, "2026-10-26");
  assert.deepEqual(summary.blocks.map(({ id }) => id), ["today-before-utc-midnight", "today-late"]);
  assert.equal(summary.focusMinutes, 22);
});
