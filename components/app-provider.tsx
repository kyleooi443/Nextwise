"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createSeedState, newId } from "@/data/seed";
import { rebuildPlan, undoRevision } from "@/lib/reschedule";
import type { AppState, FocusOutcome, Task, TaskDraft, UserPreferences } from "@/types/nextwise";

const STORAGE_KEY = "nextwise-state-v1";

type AppContextValue = {
  state: AppState;
  hydrated: boolean;
  storageWarning: boolean;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addTask: (draft: TaskDraft) => void;
  deleteTask: (id: string) => void;
  setPreferences: (updates: Partial<UserPreferences>) => void;
  setSelectedTask: (id: string) => void;
  setRecommendationOverride: (id: string | undefined) => void;
  startFocus: (taskId: string, minutes: number) => void;
  adjustFocus: (minutes: number) => void;
  toggleFocusPause: () => void;
  finishFocus: (outcome: FocusOutcome, actualMinutes?: number, remainingMinutes?: number) => void;
  snoozeTask: (id: string) => void;
  blockTask: (id: string) => void;
  completeTask: (id: string) => void;
  acceptRevision: (id: string) => void;
  toggleBlockLock: (id: string) => void;
  undoLatestRevision: () => void;
  resetDemo: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function readStoredState(): { state: AppState; warning: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: createSeedState(), warning: false };
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 1 || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.blocks) || !parsed.preferences || typeof parsed.preferences !== "object") return { state: createSeedState(), warning: true };
    const migrated: AppState = {
      ...parsed,
      tasks: parsed.tasks.map((task) => ({ ...task, splittable: task.splittable ?? true, dependencies: task.dependencies ?? [], dismissals: task.dismissals ?? 0 })),
      preferences: { ...createSeedState().preferences, ...parsed.preferences, theme: parsed.preferences.theme ?? "system" },
      sessions: (Array.isArray(parsed.sessions) ? parsed.sessions : []).map((session) => ({ ...session, pausedSeconds: session.pausedSeconds ?? 0 })),
      revisions: Array.isArray(parsed.revisions) ? parsed.revisions : [],
    };
    return { state: migrated, warning: false };
  } catch {
    return { state: createSeedState(), warning: true };
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = readStoredState();
      setState(stored.state);
      setStorageWarning(stored.warning);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = state.preferences.theme === "system" ? (prefersDark ? "dark" : "light") : state.preferences.theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.setTimeout(() => setStorageWarning(false), 0);
    } catch {
      window.setTimeout(() => setStorageWarning(true), 0);
    }
  }, [state, hydrated]);

  const reviseTask = useCallback((id: string, updates: Partial<Task>, trigger: string) => {
    setState((current) => {
      const base = { ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, ...updates } : task) };
      const revision = rebuildPlan(base, trigger);
      return { ...base, blocks: revision.updatedPlan, revisions: [revision, ...base.revisions] };
    });
  }, []);
  const updateTask = useCallback((id: string, updates: Partial<Task>) => reviseTask(id, updates, "task details changed"), [reviseTask]);
  const addTask = useCallback((draft: TaskDraft) => {
    const task: Task = { ...draft, id: newId("task"), createdAt: new Date().toISOString(), status: "todo", dependencies: draft.dependencies ?? [], dismissals: 0 };
    setState((current) => ({ ...current, tasks: [task, ...current.tasks], selectedTaskId: task.id }));
  }, []);
  const deleteTask = useCallback((id: string) => setState((current) => {
    const base = { ...current, tasks: current.tasks.filter((task) => task.id !== id).map((task) => ({ ...task, dependencies: task.dependencies.filter((dependency) => dependency !== id) })), blocks: current.blocks.filter((block) => block.taskId !== id) };
    const revision = rebuildPlan(base, "a task was removed");
    return { ...base, blocks: revision.updatedPlan, revisions: [revision, ...base.revisions] };
  }), []);
  const setPreferences = useCallback((updates: Partial<UserPreferences>) => setState((current) => {
    const preferences = { ...current.preferences, ...updates };
    const availabilityChanged = preferences.availableMinutes !== current.preferences.availableMinutes || preferences.workStart !== current.preferences.workStart || preferences.workEnd !== current.preferences.workEnd;
    const base = { ...current, preferences };
    if (!availabilityChanged) return base;
    const revision = rebuildPlan(base, "availability changed");
    return { ...base, blocks: revision.updatedPlan, revisions: [revision, ...base.revisions] };
  }), []);
  const setSelectedTask = useCallback((id: string) => setState((current) => ({ ...current, selectedTaskId: id })), []);
  const setRecommendationOverride = useCallback((id: string | undefined) => setState((current) => ({ ...current, recommendationOverrideId: id })), []);
  const startFocus = useCallback((taskId: string, minutes: number) => {
    setState((current) => {
      const session = { id: newId("session"), taskId, startedAt: new Date().toISOString(), plannedMinutes: minutes, pausedSeconds: 0 };
      return { ...current, selectedTaskId: taskId, activeSessionId: session.id, sessions: [session, ...current.sessions], tasks: current.tasks.map((task) => task.id === taskId ? { ...task, status: "in_progress" } : task) };
    });
  }, []);
  const adjustFocus = useCallback((minutes: number) => setState((current) => ({ ...current, sessions: current.sessions.map((session) => session.id === current.activeSessionId ? { ...session, plannedMinutes: Math.max(1, minutes) } : session) })), []);
  const toggleFocusPause = useCallback(() => setState((current) => ({ ...current, sessions: current.sessions.map((session) => {
    if (session.id !== current.activeSessionId) return session;
    if (!session.pausedAt) return { ...session, pausedAt: new Date().toISOString() };
    return { ...session, pausedSeconds: session.pausedSeconds + Math.floor((Date.now() - new Date(session.pausedAt).getTime()) / 1000), pausedAt: undefined };
  }) })), []);
  const finishFocus = useCallback((outcome: FocusOutcome, actualMinutes?: number, remainingMinutes?: number) => {
    setState((current) => {
      const session = current.sessions.find((item) => item.id === current.activeSessionId);
      if (!session) return current;
      const ended = { ...session, endedAt: new Date().toISOString(), actualMinutes: actualMinutes ?? Math.max(0, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60_000)), outcome };
      const tasks = current.tasks.map((task) => {
        if (task.id !== session.taskId) return task;
        if (outcome === "completed") return { ...task, status: "completed" as const, remainingMinutes: 0 };
        if (outcome === "blocked") return { ...task, status: "blocked" as const };
        return { ...task, status: "todo" as const, remainingMinutes: remainingMinutes ?? Math.max(5, task.remainingMinutes - (outcome === "partial" ? ended.actualMinutes ?? 0 : 0)), dismissals: task.dismissals + (outcome === "skipped" ? 1 : 0) };
      });
      const base = { ...current, tasks, sessions: current.sessions.map((item) => item.id === ended.id ? ended : item), activeSessionId: undefined };
      const trigger = outcome === "completed" ? "a completed focus session" : outcome === "skipped" ? "a missed focus session" : outcome === "partial" ? "a partial focus session" : "a blocked task";
      const revision = rebuildPlan(base, trigger);
      return { ...base, blocks: revision.updatedPlan, revisions: [revision, ...base.revisions] };
    });
  }, []);
  const snoozeTask = useCallback((id: string) => reviseTask(id, { snoozedUntil: new Date(Date.now() + 60 * 60_000).toISOString(), dismissals: (state.tasks.find((task) => task.id === id)?.dismissals ?? 0) + 1 }, "a task snoozed for one hour"), [reviseTask, state.tasks]);
  const blockTask = useCallback((id: string) => reviseTask(id, { status: "blocked" }, "a task marked blocked"), [reviseTask]);
  const completeTask = useCallback((id: string) => reviseTask(id, { status: "completed", remainingMinutes: 0 }, "a task was completed"), [reviseTask]);
  const acceptRevision = useCallback((id: string) => setState((current) => ({ ...current, revisions: current.revisions.map((revision) => revision.id === id ? { ...revision, accepted: true } : revision) })), []);
  const toggleBlockLock = useCallback((id: string) => setState((current) => ({ ...current, blocks: current.blocks.map((block) => block.id === id ? { ...block, locked: !block.locked } : block) })), []);
  const undoLatestRevision = useCallback(() => setState((current) => current.revisions[0] ? undoRevision(current, current.revisions[0].id) : current), []);
  const resetDemo = useCallback(() => setState(createSeedState()), []);

  const value = useMemo(() => ({ state, hydrated, storageWarning, updateTask, addTask, deleteTask, setPreferences, setSelectedTask, setRecommendationOverride, startFocus, adjustFocus, toggleFocusPause, finishFocus, snoozeTask, blockTask, completeTask, acceptRevision, toggleBlockLock, undoLatestRevision, resetDemo }), [state, hydrated, storageWarning, updateTask, addTask, deleteTask, setPreferences, setSelectedTask, setRecommendationOverride, startFocus, adjustFocus, toggleFocusPause, finishFocus, snoozeTask, blockTask, completeTask, acceptRevision, toggleBlockLock, undoLatestRevision, resetDemo]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useNextwise(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useNextwise must be used inside AppProvider");
  return context;
}
