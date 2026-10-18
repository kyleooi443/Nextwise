import { newId } from "@/data/seed";
import { recommendNext } from "@/lib/scheduler";
import type { AppState, CalendarBlock, ScheduleRevision } from "@/types/nextwise";

function atLocalTime(date: Date, time: string): Date {
  const [hour, minute] = time.split(":").map(Number);
  const value = new Date(date);
  value.setHours(hour, minute, 0, 0);
  return value;
}

export function rebuildPlan(state: AppState, trigger: string, now = new Date()): ScheduleRevision {
  const previousPlan = state.blocks;
  const protectedBlocks = previousPlan.filter((block) => block.kind !== "flexible" || block.locked);
  const movable = previousPlan.filter((block) => block.kind === "flexible" && !block.locked);
  const dayEnd = atLocalTime(now, state.preferences.workEnd);
  let cursor = new Date(Math.max(now.getTime(), atLocalTime(now, state.preferences.workStart).getTime()));
  const durationCap = Math.min(state.preferences.availableMinutes, Math.max(0, Math.floor((dayEnd.getTime() - cursor.getTime()) / 60_000)));
  let scheduled = 0;
  const updated: CalendarBlock[] = [...protectedBlocks];
  const ranked = recommendNext(state, now).ranked.map((recommendation) => state.tasks.find((task) => task.id === recommendation.taskId)!).filter(Boolean);
  const rankedIds = new Set(ranked.map((task) => task.id));
  const candidates = [...ranked, ...state.tasks.filter((task) => task.status === "todo" && !rankedIds.has(task.id) && task.dependencies.every((id) => state.tasks.find((item) => item.id === id)?.status === "completed"))];

  for (const task of candidates) {
    if (scheduled >= durationCap) break;
    const old = movable.find((block) => block.taskId === task.id);
    const alreadyProtected = protectedBlocks.filter((block) => block.taskId === task.id).reduce((total, block) => total + (new Date(block.endAt).getTime() - new Date(block.startAt).getTime()) / 60_000, 0);
    const effortNeeded = Math.max(0, task.remainingMinutes - alreadyProtected);
    if (effortNeeded === 0) continue;
    const minutes = Math.min(effortNeeded, durationCap - scheduled);
    if (!task.splittable && minutes < effortNeeded) continue;
    if (minutes < 5) continue;
    const occupied = [...protectedBlocks, ...updated.filter((block) => block.kind === "flexible")];
    let overlaps = occupied.filter((block) => {
        const start = new Date(block.startAt).getTime();
        const end = new Date(block.endAt).getTime();
        return start < cursor.getTime() + minutes * 60_000 && end > cursor.getTime();
      }).sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime());
    while (overlaps.length) {
      cursor = new Date(overlaps[0].endAt);
      overlaps = occupied.filter((block) => {
        const start = new Date(block.startAt).getTime();
        const end = new Date(block.endAt).getTime();
        return start < cursor.getTime() + minutes * 60_000 && end > cursor.getTime();
      }).sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime());
    }
    if (cursor.getTime() + minutes * 60_000 > dayEnd.getTime()) continue;
    updated.push({ id: old?.id ?? newId("block"), title: task.title, startAt: cursor.toISOString(), endAt: new Date(cursor.getTime() + minutes * 60_000).toISOString(), kind: "flexible", locked: false, taskId: task.id });
    cursor = new Date(cursor.getTime() + minutes * 60_000);
    scheduled += minutes;
  }

  const unscheduled = candidates.filter((task) => {
    const scheduledMinutes = updated.filter((block) => block.taskId === task.id).reduce((total, block) => total + (new Date(block.endAt).getTime() - new Date(block.startAt).getTime()) / 60_000, 0);
    return scheduledMinutes < task.remainingMinutes;
  });
  const explanation = unscheduled.length
    ? `Your plan changed after ${trigger}. I moved available work into open time and kept fixed commitments in place. ${unscheduled.length} task${unscheduled.length === 1 ? "" : "s"} still need more time.`
    : `Your plan changed after ${trigger}. Flexible work has moved into your next open window; fixed commitments stayed in place.`;

  return { id: newId("revision"), trigger, previousPlan, updatedPlan: updated.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()), explanation, createdAt: now.toISOString(), accepted: false };
}

export function undoRevision(state: AppState, revisionId: string): AppState {
  const revision = state.revisions.find((item) => item.id === revisionId);
  if (!revision) return state;
  return { ...state, blocks: revision.previousPlan, revisions: state.revisions.map((item) => item.id === revisionId ? { ...item, undoneAt: new Date().toISOString() } : item) };
}

export function setBlockLocked(blocks: CalendarBlock[], blockId: string, locked: boolean): CalendarBlock[] {
  return blocks.map((block) => block.id === blockId ? { ...block, locked } : block);
}
