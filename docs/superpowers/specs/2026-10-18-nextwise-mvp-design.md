# NEXTWISE MVP Design

## Purpose

NEXTWISE is a decision-first productivity application for people managing competing responsibilities. Its primary job is to recommend one practical next action, explain the recommendation using visible evidence, and help the user recover when a plan changes. The product should reduce task initiation and rescheduling effort without claiming to know the user's mental state.

The MVP is a realistic, interactive prototype. Core scheduling and recommendation behavior is deterministic and works without an LLM, external calendar, or configured Supabase project. Demo data and user changes persist in the browser.

## MVP scope

The application includes these destinations:

- **Today:** current date and greeting, Next Best Action, first micro-step, reasons, alternatives, lightweight time and energy check-in, and a compact view of today's schedule and risks.
- **Inbox:** create, edit, complete, delete, filter, and sort tasks; edit deadline, importance, duration, reasoning level, and dependency information.
- **Timeline:** day and week views that distinguish fixed commitments from flexible focus blocks, show conflicts, and explain schedule revisions.
- **Focus:** a distraction-reduced timer with recommended, five-minute starter, and custom durations. Outcomes include completed, partially completed, blocked, and did not start.
- **Review:** daily and weekly summaries based only on recorded activity.
- **Insights:** simple observations only when enough local history exists; otherwise show an explanation of what data will support future insights.
- **Settings:** editable availability, timezone, default energy, and interface preferences.

The responsive desktop layout uses compact left navigation, a flexible primary workspace, and a collapsible context panel where appropriate. Mobile uses bottom navigation for Today, Inbox, Timeline, and Review, with full-screen Focus and focused task interactions. All core actions remain reachable without horizontal scrolling.

## Product and visual principles

- Lead with one recommended action and its starting step.
- Keep recommendation factors inspectable through a “Why this task?” detail.
- Let users accept, switch, snooze, dismiss, correct, or complete recommendations.
- Separate urgency and importance from cognitive demand. Reasoning levels are L1 Light, L2 Moderate, L3 Deep, and L4 Intensive.
- Preserve fixed commitments and user-locked blocks during scheduling changes.
- Explain conflicts and insufficient availability directly; never imply all work fits when it does not.
- Use a restrained interface based on Ink Black `#17191C`, Paper White `#FAFAF8`, Soft Gray `#F1F2F0`, Electric Blue `#315CF5`, Slate Gray `#70757D`, and Border Gray `#E3E5E7`. Semantic colors are reserved for statuses.
- Use Geist or Inter for interface text and a monospace face only for compact time or reasoning metadata. Use thin dividers, restrained 6–10px radii, clear focus states, and little to no shadow.
- Respect keyboard access, visible focus, reduced motion, accessible labels, and touch targets of at least 44px on mobile.

## Architecture

The app follows the existing repository's framework and conventions where present. The starter workspace currently contains only a README, so implementation will establish the app structure appropriate to the requested Next.js, React, TypeScript, and Tailwind stack.

Presentation components remain separate from scheduling rules. The core domain types describe tasks, dependencies, calendar blocks, focus sessions, recommendation factors, feedback, and schedule revisions. A deterministic scheduler module accepts task state, fixed and flexible availability, current time, energy, and user feedback, then returns eligible actions, scores, explanations, and a revised plan. UI components call this module and persist its resulting state locally for the prototype.

Local persistence is a deliberate prototype boundary. The domain model should keep user ownership fields and relationships clear enough to move to Supabase later, but this phase does not require authentication, remote database access, external calendar sync, or AI calls. No task data is sent to an external service.

## Recommendation and scheduling behavior

The engine filters out completed, blocked, and dependency-ineligible tasks. Hard deadline and fixed-commitment conflicts are evaluated separately from the priority score. Eligible tasks receive normalized factor values for deadline urgency, importance, fit in the available window, energy/reasoning match, dependency-unlocking value, ease of starting, and penalties from context switching or repeated dismissal.

The initial score uses the brief's hypothesis: `30U + 20I + 15F + 15E + 10D + 10S - P`. Factors and their contribution are retained with each recommendation so the explanation can name the strongest reasons. These weights are editable implementation constants, not scientific claims. No confidence percentage is shown.

The available-time and energy check-in is optional and skippable. Low energy can favor lighter eligible work, but cannot suppress urgent responsibilities. Task deadlines are never invented during capture. Missing task details remain unset or receive a transparent prompt for user input.

When a user skips, snoozes, partially completes, or marks work blocked, the application records the outcome, updates remaining effort when supplied, and recomputes flexible blocks against remaining availability. Fixed commitments and locked blocks never move. Each change creates a revision record with the trigger, previous and updated plans, and a plain-language explanation. The interface offers undo for the latest revision where feasible and lets the user accept the revised plan.

## Signature interaction

1. The user captures or edits several tasks.
2. The engine evaluates deadline, importance, effort fit, reasoning level, dependencies, and feedback.
3. Today presents one Next Best Action, duration, reasoning level, first step, explanation, and alternatives.
4. “Why this task?” reveals the contributing factors.
5. The user starts a focus session.
6. The user completes, partially completes, blocks, skips, or does not start the task.
7. The engine updates task state and flexible schedule blocks while preserving fixed commitments.
8. The app shows the revised timeline and explains the change, with undo and accept actions.
9. The user can start the next recommendation.

This flow changes persisted application state at each step; it is not a presentation-only animation.

## Error and empty states

If no task is eligible, Today explains why and offers a direct action such as adding a task, resolving a dependency, or changing availability. If available time cannot fit all planned work, the timeline identifies the work that does not fit. Invalid or unavailable local storage produces an in-context error and keeps the interface usable for the current session. Empty Inbox and Review views offer a clear next action and do not imply activity that was not recorded.

## Delivery sequence

1. Establish the design system and responsive app shell.
2. Add domain types, seeded data, local persistence, task management, and reasoning levels.
3. Implement deterministic scoring and recommendation explanations.
4. Build Today and Inbox around the recommendation flow.
5. Add focus sessions, outcomes, automatic schedule revision, timeline, and undo.
6. Add Review, evidence-based Insights, and Settings.
7. Refine responsive states, accessibility, empty/error handling, and the end-to-end demo scenario.

## Acceptance criteria

- Navigation works across all listed destinations on desktop and mobile.
- The seeded 30-minute, medium-energy context produces a recommendation with a human-readable explanation and a first micro-step.
- Changing energy or available time recomputes the recommendation immediately.
- Task creation, editing, filtering, completion, and deletion work, and changes persist across reloads in the same browser.
- Reasoning levels can be viewed and edited independently of urgency and importance.
- Focus timer controls work, and all four outcomes update task/session state.
- A missed or partial session recomputes the flexible plan, preserves locked and fixed blocks, and shows a revision explanation and undo option.
- Timeline views distinguish fixed commitments from flexible focus blocks and disclose conflicts or insufficient time.
- Review and Insights never fabricate historical activity or behavioral patterns.
- Essential controls have labels, visible keyboard focus, adequate contrast, and usable mobile touch targets.

## Out of scope for this prototype

- Production authentication and Supabase persistence/security policies.
- External calendar connections or notifications.
- LLM-backed natural language extraction or task decomposition.
- Shared projects, collaboration, billing, and server-side analytics.

These can be added after the deterministic single-user workflow is validated.
