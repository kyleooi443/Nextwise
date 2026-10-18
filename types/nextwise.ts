export type ReasoningLevel = 1 | 2 | 3 | 4;
export type EnergyLevel = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed";
export type FocusOutcome = "completed" | "partial" | "blocked" | "skipped";
export type ViewKey = "today" | "inbox" | "timeline" | "focus" | "review" | "insights" | "settings";

export type Task = {
  id: string;
  title: string;
  description?: string;
  project?: string;
  deadlineAt?: string;
  importance: number;
  estimatedMinutes: number;
  remainingMinutes: number;
  splittable: boolean;
  reasoningLevel: ReasoningLevel;
  status: TaskStatus;
  dependencies: string[];
  createdAt: string;
  ease: number;
  microStep: string;
  snoozedUntil?: string;
  dismissals: number;
}

export type CalendarBlock = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  kind: "fixed" | "flexible" | "break";
  locked: boolean;
  taskId?: string;
}

export type FocusSession = {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  plannedMinutes: number;
  actualMinutes?: number;
  outcome?: FocusOutcome;
  pausedAt?: string;
  pausedSeconds: number;
}

export type RecommendationFactor = {
  key: "urgency" | "importance" | "fit" | "energy" | "dependency" | "ease" | "penalty";
  label: string;
  value: number;
  points: number;
  reason: string;
}

export type Recommendation = {
  taskId: string;
  score: number;
  durationMinutes: number;
  factors: RecommendationFactor[];
  explanation: string;
}

export type ScheduleRevision = {
  id: string;
  trigger: string;
  previousPlan: CalendarBlock[];
  updatedPlan: CalendarBlock[];
  explanation: string;
  createdAt: string;
  accepted: boolean;
  undoneAt?: string;
}

export type UserPreferences = {
  name: string;
  timezone: string;
  workStart: string;
  workEnd: string;
  availableMinutes: number;
  energy: EnergyLevel;
  contextPanelOpen: boolean;
  theme: "light" | "dark" | "system";
}

export type AppState = {
  version: 1;
  tasks: Task[];
  blocks: CalendarBlock[];
  sessions: FocusSession[];
  revisions: ScheduleRevision[];
  preferences: UserPreferences;
  selectedTaskId?: string;
  recommendationOverrideId?: string;
  activeSessionId?: string;
  lastRecommendationId?: string;
}

export type TaskDraft = Omit<Task, "id" | "createdAt" | "status" | "dependencies" | "dismissals"> & {
  dependencies?: string[];
}

export type RecommendationResult = {
  ranked: Recommendation[];
  risks: Task[];
  unavailable: Task[];
}
