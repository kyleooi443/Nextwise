# NEXTWISE Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make saved preferences reliable and effective throughout the app, including time-zone handling and complete theme behavior.

**Architecture:** Keep preference persistence in AppProvider and the existing Settings page as the edit surface. Add shared IANA time-zone utilities and apply them to formatting, local-day grouping, task deadline interpretation, and schedule boundaries. Keep the local-storage schema and migrate missing or invalid preference values without dropping user data.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, browser Intl APIs, existing localStorage provider.

**Spec:** docs/superpowers/specs/2026-10-26-nextwise-settings-design.md

## Global Constraints

- Keep user data in browser storage; introduce no accounts, remote storage, or new dependencies.
- Keep state at version 1; migrate missing fields and repair invalid time zones without discarding tasks or sessions.
- Preserve ISO timestamps as instants; interpret and display dates using the saved IANA time zone.
- Invalid names, time zones, and work windows must not be saved.
- System theme follows prefers-color-scheme; light and dark style shared app surfaces, controls, navigation, forms, cards, and overlays.
- Respect narrow screens, visible keyboard focus, reduced motion, and readable contrast.

## Review Focus

1. Daylight-saving spring gap: nonexistent work-start time advances to the first valid instant.
2. Daylight-saving fall overlap: ambiguous local time resolves to the earlier instant.
3. Zone change crossing UTC midnight: Today, Inbox, Timeline, Review, and Insights agree on local day.
4. Invalid or legacy stored zone: tasks and sessions survive hydration; device zone is used.
5. System theme changes while app is open: page updates without reload; explicit light/dark does not change.

---

## File Structure

- Create lib/date-time.ts for IANA zone validation, formatting, day keys, and local wall-time conversion.
- Modify components/app-provider.tsx for preference migration, theme synchronization, and schedule-affecting preference detection.
- Modify lib/reschedule.ts and lib/scheduler.ts for zone-aware work windows and relative dates.
- Modify components/tasks/task-editor.tsx, components/tasks/inbox-screen.tsx, components/today/today-screen.tsx, components/timeline/timeline-screen.tsx, components/review/review-screen.tsx, and app/insights/page.tsx to use shared zone helpers.
- Modify app/settings/page.tsx for field validation, dirty state, save/reset feedback, and functional zone selection.
- Modify app/globals.css for Settings layout and app-wide dark theme rules.

## Implementation Tasks

### Task 1: Add shared IANA date and time helpers

**Files:**
- Create lib/date-time.ts
- Modify lib/reschedule.ts

**Interfaces:**
- Produce isValidTimeZone(timeZone: string): boolean.
- Produce dayKeyInTimeZone(value: Date | string, timeZone: string): string using YYYY-MM-DD.
- Produce addDaysToDayKey(dayKey: string, days: number): string for calendar-day arithmetic independent of the device zone.
- Produce formatInTimeZone(value: Date | string, timeZone: string, options: Intl.DateTimeFormatOptions): string.
- Produce localTimeToInstant(date: Date, time: string, timeZone: string): Date. For DST gaps choose the first valid instant after the gap; for overlaps choose the earlier instant.
- Produce localDateTimeToInstant(dayKey: string, time: string, timeZone: string): Date for explicit user-selected calendar dates.
- reschedule consumes localTimeToInstant for work start/end.

- [ ] Implement IANA validation, formatting, and local-day keys with Intl.DateTimeFormat.
- [ ] Implement wall-time conversion with explicit gap/overlap handling; reject malformed HH:mm input.
- [ ] Update rebuildPlan so work-window boundaries use the saved zone and block timestamps remain ISO instants.
- [ ] Run npm run lint and npm run build; manually check America/Los_Angeles DST gap/overlap and a normal Asia/Manila work window.
- [ ] Commit the helper and schedule-boundary change.

### Task 2: Apply the saved time zone consistently

**Files:**
- Modify components/app-provider.tsx, lib/scheduler.ts, components/tasks/task-editor.tsx, components/tasks/inbox-screen.tsx, components/today/today-screen.tsx, components/timeline/timeline-screen.tsx, components/review/review-screen.tsx, and app/insights/page.tsx.

**Interfaces:**
- Consume isValidTimeZone, dayKeyInTimeZone, addDaysToDayKey, formatInTimeZone, localTimeToInstant, and localDateTimeToInstant from Task 1.
- Keep formatRelative's existing call shape and add an optional time zone after now, defaulting to the device zone.

- [ ] Migrate stored preferences by merging defaults and replacing only an invalid/missing zone with the device zone.
- [ ] Update relative deadline formatting, natural-language deadline parsing, Today heading, inbox date filters, Timeline grouping, Review labels, and Insights grouping to use the saved zone.
- [ ] Keep stored deadline/session/block instants unchanged; change only interpretation and presentation.
- [ ] Run npm run lint and npm run build; manually set a zone across UTC midnight and verify all date-sensitive screens agree.
- [ ] Commit the preference migration and screen integrations.

### Task 3: Make preference saving and validation dependable

**Files:**
- Modify app/settings/page.tsx, components/app-provider.tsx, lib/reschedule.ts, and app/globals.css.

**Interfaces:**
- Keep setPreferences(updates: Partial<UserPreferences>) as the provider API.
- Settings retains an editable UserPreferences draft until a valid save succeeds.

- [ ] Add trimmed-name, IANA-zone, and same-day work-window validation; associate inline errors and aria-invalid with fields.
- [ ] Show unsaved state, disable saving when clean or invalid, announce save result, and clear the draft after success.
- [ ] Rebuild when availability, work hours, time zone, or energy change; avoid schedule revisions for name, theme, or context-panel changes.
- [ ] Keep reset behind confirmation and persist the resulting default state.
- [ ] Run npm run lint and npm run build; manually verify invalid/valid submission, reload persistence, schedule revision behavior, and confirmed/cancelled reset.
- [ ] Commit form and provider behavior.

### Task 4: Finish responsive Settings layout and theme behavior

**Files:**
- Modify app/settings/page.tsx, components/app-provider.tsx, and app/globals.css.

**Interfaces:**
- Theme remains system | light | dark in UserPreferences.
- Provider writes the effective value to document.documentElement.dataset.theme.

- [ ] Build responsive section navigation and grouped Settings surfaces while preserving the four existing sections.
- [ ] Add dark theme tokens and overrides for shell, navigation, surfaces, buttons, fields, modals, task/schedule UI, focus mode, and Settings/Insights.
- [ ] Subscribe to system color-scheme changes only while theme is system; remove the listener on change/unmount.
- [ ] Run npm run lint and npm run build; manually inspect phone/desktop layouts, keyboard focus, saved light/dark themes, and a live system-theme change.
- [ ] Commit Settings presentation and theme support.

