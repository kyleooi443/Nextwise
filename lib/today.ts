import { dayKeyInTimeZone } from "./date-time.ts";
import type { AppState } from "@/types/nextwise";

export function deriveTodayActivity(state: Pick<AppState, "blocks" | "sessions" | "preferences">, now: Date = new Date()) {
  const { timezone } = state.preferences;
  const dayKey = dayKeyInTimeZone(now, timezone);
  const blocks = state.blocks.filter((block) => dayKeyInTimeZone(block.startAt, timezone) === dayKey);
  const focusMinutes = state.sessions.reduce((total, session) => {
    if (!session.endedAt || dayKeyInTimeZone(session.endedAt, timezone) !== dayKey) return total;
    return typeof session.actualMinutes === "number" && Number.isFinite(session.actualMinutes) && session.actualMinutes > 0
      ? total + session.actualMinutes
      : total;
  }, 0);
  return { dayKey, blocks, focusMinutes };
}
