# NEXTWISE MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive NEXTWISE web app that recommends an achievable next task, explains why, and adapts the plan after focus outcomes.

**Architecture:** A Next.js App Router client application uses typed domain data, deterministic scheduling modules, and browser persistence. Small page and feature components render the app shell, Today, Inbox, Timeline, Focus, Review, Insights, and Settings; all scheduling decisions stay in plain TypeScript modules independent of React.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Lucide icons, browser localStorage. Use the package manager already present; if none exists, use npm.

**Spec:** `docs/superpowers/specs/2026-10-18-nextwise-mvp-design.md`

## Global Constraints

- Use the specified palette: Ink Black `#17191C`, Paper White `#FAFAF8`, Soft Gray `#F1F2F0`, Electric Blue `#315CF5`, Slate Gray `#70757D`, Border Gray `#E3E5E7`.
- Core scheduling and recommendation behavior must work without an LLM, external calendar, or configured Supabase project.
- Demo data and user changes persist in the browser; no task data is sent to external services.
- Fixed commitments and user-locked blocks never move automatically.
- Never invent task deadlines or show unsupported confidence percentages.
- Desktop uses compact left navigation and flexible content; mobile uses bottom navigation for Today, Inbox, Timeline, and Review.
- Respect keyboard access, visible focus, reduced motion, accessible labels, and mobile touch targets of at least 44px.
- Do not fabricate historical activity, performance patterns, or behavioral claims.

## Review Focus

- A task blocked by an incomplete prerequisite must not be recommended; keep it in the Inbox with the blocker visible.
- An urgent task that does not fit the current window must remain visible as a risk without pretending it fits.
- A schedule revision must preserve fixed and locked blocks, including when no flexible capacity remains.
- Invalid or unavailable localStorage must leave the app usable for the current session and surface a recoverable message.
- An empty or fully completed workload must produce a clear next action and no fabricated review or insight data.

---

### Task 1: App foundation and design system

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts` (if Tailwind version requires it), `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `components/app-shell.tsx`, `components/sidebar.tsx`, `components/mobile-nav.tsx`, `components/ui/icon-button.tsx`

**Interfaces:**
- Produces: `AppShell` accepts active route label, children, and an optional right context panel; navigation entries use routes `/today`, `/inbox`, `/timeline`, `/focus`, `/review`, `/insights`, `/settings`.

- [ ] Initialize Next.js App Router with TypeScript and Tailwind using compatible current dependencies.
- [ ] Define CSS variables for the required brand and semantic colors, type, spacing, borders, focus rings, and reduced-motion behavior.
- [ ] Build accessible desktop sidebar and mobile bottom navigation; highlight active destinations and provide a prominent Focus action.
- [ ] Add the shared page frame, responsive workspace, and root redirect to `/today`.
- [ ] Run `npm run build`; resolve type, CSS, and route errors before continuing.

### Task 2: Domain model, seed data, and persistence

**Files:**
- Create: `types/nextwise.ts`, `data/seed.ts`, `lib/storage.ts`, `hooks/use-nextwise.ts`

**Interfaces:**
- Produces `Task`, `TaskStatus`, `ReasoningLevel`, `EnergyLevel`, `CalendarBlock`, `FocusSession`, `Recommendation`, `RecommendationFactor`, `ScheduleRevision`, and `UserPreferences` types.
- `loadAppState(): AppState` returns seeded state when no saved state exists; `saveAppState(state: AppState): void` writes browser state safely.
- `useNextwise(): { state, updateTask, addTask, deleteTask, setPreferences, recordOutcome, undoRevision }` exposes persisted state to screens.

- [ ] Define typed entities for tasks, projects, dependencies, fixed and flexible blocks, focus sessions, recommendations, feedback, revisions, and preferences.
- [ ] Seed the six brief tasks plus realistic fixed commitments and a 30-minute, medium-energy user context, using dates relative to the current local day.
- [ ] Implement versioned localStorage loading/saving with guarded access and an in-session fallback when storage is unavailable or malformed.
- [ ] Add a state hook that loads after client mount to avoid hydration mismatch, persists updates, and exposes mutation methods.
- [ ] Confirm the app shell renders the seeded user after client hydration and handles storage failure with a visible, non-blocking status.

### Task 3: Deterministic recommendation engine

**Files:**
- Create: `lib/scheduler/scoring.ts`, `lib/scheduler/eligibility.ts`, `lib/scheduler/recommend.ts`, `lib/scheduler/explain.ts`

**Interfaces:**
- `getEligibleTasks(tasks: Task[], now: Date): Task[]` filters completed, blocked, and dependency-ineligible tasks.
- `scoreTask(task: Task, context: ScheduleContext): Recommendation` returns normalized factor values, score, duration, and task id.
- `recommendNext(state: AppState, now: Date): RecommendationResult` returns a ranked recommendation list and explicit empty/risk reasons.
- `explainRecommendation(recommendation: Recommendation): string[]` returns plain-language reasons based on top contributing factors.

- [ ] Implement hard eligibility and deadline-risk checks separately from the weighted score.
- [ ] Implement the specified `30U + 20I + 15F + 15E + 10D + 10S - P` model with factors normalized from 0 to 1 and penalties retained separately.
- [ ] Incorporate deadline proximity, importance, duration fit, energy/reasoning match, dependency unlocking, ease of starting, recent dismissal, and context-switch cost.
- [ ] Return a recommendation duration that fits the available window, reasoning level, first micro-step, alternatives, and explanation factors; omit confidence percentages.
- [ ] Exercise manually with the seeded 30-minute medium-energy state, empty workload, blocked dependency, and urgent task that exceeds the window; confirm results are transparent and deterministic.

### Task 4: Today and task Inbox

**Files:**
- Create: `app/today/page.tsx`, `app/inbox/page.tsx`
- Create: `components/today/next-action.tsx`, `components/today/why-panel.tsx`, `components/today/check-in.tsx`, `components/tasks/task-form.tsx`, `components/tasks/task-list.tsx`, `components/tasks/task-row.tsx`

**Interfaces:**
- Today consumes `useNextwise` and `recommendNext`, with actions for start, switch, snooze, block, and complete.
- Task form emits validated `TaskDraft`; task list receives filter/sort values and mutation callbacks.

- [ ] Build Today around one dominant next action with duration, L-level, deadline, first step, alternatives, and a “Why this task?” disclosure.
- [ ] Add skippable time and energy controls that update recommendations immediately.
- [ ] Implement task capture and editing with title, optional deadline, importance, estimate, remaining effort, reasoning level, and dependency fields; do not infer missing dates.
- [ ] Add Inbox views for all, today, upcoming, completed, overdue, and blocked tasks, with filtering and sorting by deadline, importance, reasoning level, effort, and status.
- [ ] Add completion, deletion, recommendation override, snooze, and blocked actions with clear status messages.
- [ ] Manually confirm task changes survive reload, recommendation updates on context changes, and empty states direct the user to a useful action.

### Task 5: Timeline and schedule revision engine

**Files:**
- Create: `lib/scheduler/reschedule.ts`, `app/timeline/page.tsx`, `components/timeline/day-timeline.tsx`, `components/timeline/week-timeline.tsx`, `components/timeline/revision-notice.tsx`

**Interfaces:**
- `rebuildPlan(state: AppState, trigger: RevisionTrigger, now: Date): ScheduleRevision` returns old/new flexible blocks and an explanation while retaining fixed/locked blocks.
- `undoRevision(state: AppState, revisionId: string): AppState` restores the prior plan while keeping the revision audit record.

- [ ] Build free-window calculation around fixed commitments, breaks, available hours, and current time.
- [ ] Reassign eligible flexible tasks into remaining windows in score order, splitting only when task data explicitly permits it; report unscheduled workload and conflicts.
- [ ] Record trigger, previous plan, updated plan, timestamp, and human-readable explanation for each schedule change.
- [ ] Build a readable day and week timeline with fixed/flexible distinction, current-time marker, lock controls, and mobile vertical layout.
- [ ] Add revision explanation, accept, and undo controls; confirm locked blocks remain unchanged when all other work is rescheduled.

### Task 6: Focus mode and adaptive outcomes

**Files:**
- Create: `app/focus/page.tsx`, `components/focus/focus-session.tsx`, `components/focus/session-outcome.tsx`, `lib/focus.ts`

**Interfaces:**
- `startFocus(taskId: string, minutes: number): FocusSession` creates a session.
- `finishFocus(sessionId: string, outcome: FocusOutcome, actualMinutes?: number, remainingMinutes?: number): AppState` updates task/session state and returns state for schedule revision.

- [ ] Implement recommended, five-minute starter, and custom duration controls with a working pause/resume timer.
- [ ] Keep active focus view minimal, accessible, and full-screen on mobile.
- [ ] Record completed, partially completed, blocked, and did-not-start outcomes plus actual effort where supplied.
- [ ] Update remaining effort using user input; on incomplete outcomes trigger schedule rebuild and persist the revision.
- [ ] Add a direct “How did it go?” outcome step and confirm each outcome changes the task and timeline state.

### Task 7: Review, Insights, and Settings

**Files:**
- Create: `app/review/page.tsx`, `app/insights/page.tsx`, `app/settings/page.tsx`
- Create: `components/review/review-summary.tsx`, `components/insights/insight-list.tsx`, `components/settings/preferences-form.tsx`, `lib/insights.ts`

**Interfaces:**
- `summarizeActivity(sessions: FocusSession[], tasks: Task[], period: ReviewPeriod): ReviewSummary` only aggregates recorded data.
- `deriveInsights(state: AppState): Insight[]` returns insights only when each has sufficient supporting observations.

- [ ] Build daily and weekly Review with completed work, focus time, estimation differences, disruptions, and reasoning-level distribution from recorded events.
- [ ] Build Insights with explicit minimum observation thresholds; show an empty explanation before evidence is sufficient.
- [ ] Add preference controls for name, timezone, work hours, default energy, available time, and right-panel visibility.
- [ ] Confirm zero-activity review and insufficient-insight states contain no fabricated statistics or behavior claims.

### Task 8: Product pass and delivery checks

**Files:**
- Modify: `app/globals.css` and feature components as needed.

**Interfaces:**
- No new domain interfaces; this task closes responsive, accessibility, and end-to-end interaction gaps from the spec.

- [ ] Review each destination at desktop and narrow mobile widths; fix overflow, cramped controls, and touch targets under 44px.
- [ ] Check keyboard navigation, focus visibility, labels, status announcements, contrast, and reduced-motion behavior.
- [ ] Walk through capture → recommendation → explanation → focus → partial/skip outcome → revision → undo/accept → next task using real app state.
- [ ] Run the available project checks (`npm run build` and any configured lint command); report any remaining prototype limitations precisely.
