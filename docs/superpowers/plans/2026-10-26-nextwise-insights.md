# NEXTWISE Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn local focus-session history into readable charts, measured reflections, and useful next actions.

**Architecture:** Derive a range-based report in lib/insights.ts from sessions, tasks, and preferences; keep charts as presentational SVG/CSS in the Insights route. Use the shared IANA date helpers from the Settings plan. Persist no analytics and add no network service.

**Tech Stack:** Next.js App Router, React, TypeScript, browser Intl APIs, inline SVG/CSS, existing Lucide icons.

**Spec:** docs/superpowers/specs/2026-10-26-nextwise-insights-design.md

## Global Constraints

- Use only recorded sessions; do not seed or fabricate activity.
- Keep all day buckets and zero baselines visible when there is no activity.
- Show labels, values, and accessible text alternatives; color is never the only signal.
- Keep the five-eligible-session threshold for comparative pattern claims, not raw charts/counts.
- Reflections are original and unattributed; suggestions are deterministic, data-grounded, and linked to in-app actions.
- Add no dependencies, network calls, or persisted analytics.
- Reuse the saved time zone and avoid horizontal overflow.

## Review Focus

1. No ended sessions: both charts remain visible with honest zero states and a Focus CTA.
2. One to four eligible sessions: raw counts appear without a stable comparative claim.
3. Exactly five eligible sessions: pattern suggestions may appear with their sample size.
4. Sessions near local midnight and across DST changes: buckets use the saved time zone.
5. Mixed, absent, or legacy outcomes: only recognized ended outcomes count; missing values do not inflate categories.

---

## File Structure

- Modify lib/insights.ts for a range-based deterministic report.
- Modify app/insights/page.tsx to own range state and compose metrics, charts, reflection, and suggestions.
- Modify app/globals.css for responsive graphs and insights, including dark theme rules from the Settings plan.
- Consume lib/date-time.ts from the Settings plan; do not duplicate time-zone logic.

## Implementation Tasks

### Task 1: Derive a range-based Insights report

**Files:**
- Modify lib/insights.ts
- Consume lib/date-time.ts from the Settings plan

**Interfaces:**
- Produce deriveInsightReport(state: AppState, rangeDays: 7 | 30, now?: Date): InsightReport.
- The range contains the selected number of consecutive local calendar days, ending on the current day in state.preferences.timezone.
- Define InsightDay as { dateKey: string; label: string; minutes: number; sessionCount: number }.
- Define InsightSuggestion as { id: string; title: string; evidence: string; actionLabel: string; href: "/focus" | "/inbox" | "/timeline" | "/settings" }.
- InsightReport contains rangeDays, focusByDay: InsightDay[], outcomes: Record<"completed" | "partial" | "blocked" | "skipped", number>, metrics { endedSessions: number; completedSessions: number; focusMinutes: number; averageActualMinutes?: number }, eligibleSampleCount, and suggestions: InsightSuggestion[].
- An eligible session is ended, has a recognized non-skipped outcome, and has actualMinutes.
- Produce getDailyReflection(now: Date, timeZone: string): { text: string; dayKey: string } from original statements.

- [ ] Define report types and a complete 7/30-day set of local-day buckets, including zero-session days.
- [ ] Aggregate ended sessions with actualMinutes into focus minutes; count only recognized outcomes; exclude records outside the selected range and ignore missing actual-minute values in duration totals.
- [ ] Implement deterministic suggestions: with no sessions, suggest starting focus; with at least two skipped/blocked sessions in range, suggest trying a shorter focus block; with at least two eligible completed sessions averaging at least five minutes over plan, suggest updating task estimates; when open tasks exist, include a link to Inbox. Include evidence and an in-app route, and show at most three suggestions in priority order.
- [ ] Disable comparative pattern suggestions below five eligible sessions while leaving raw values available.
- [ ] Add original reflection content and stable saved-zone local-day selection.
- [ ] Run npm run lint and npm run build; manually inspect zero, 1–4, 5, and mixed-outcome records in the Insights screen without adding a dependency or persisted sample data.
- [ ] Commit report derivation.

### Task 2: Build accessible focus-time and outcome graphs

**Files:**
- Modify app/insights/page.tsx and app/globals.css.

**Interfaces:**
- Consume deriveInsightReport, getDailyReflection, and dayKeyInTimeZone from Task 1/Settings.
- Add local rangeDays state with values 7 | 30; selected range feeds the whole report.

- [ ] Add a 7/30-day range control and period summary metrics.
- [ ] Render focus-time chart with labeled day ticks, minute scale, exact values, and zero buckets.
- [ ] Render session-outcome chart with category labels and counts, including zero-count outcomes.
- [ ] Add chart titles, accessible summaries, and a visually hidden values list.
- [ ] Keep both chart frames visible with no-activity copy and a Focus link when the range is empty.
- [ ] Run npm run lint and npm run build; manually inspect phone/desktop, 7/30 switching, zero data, and mixed outcomes.
- [ ] Commit chart composition and responsive styles.

### Task 3: Add original reflection and data-backed suggestions

**Files:**
- Modify app/insights/page.tsx and app/globals.css.

**Interfaces:**
- Consume deterministic suggestions and getDailyReflection from Task 1.
- Restrict suggestion hrefs to /focus, /inbox, /timeline, or /settings.

- [ ] Add a reflection panel that stays stable during one saved-zone calendar day.
- [ ] Render a small number of evidence-grounded suggestions with plain action labels and valid in-app links.
- [ ] Show a useful no-data suggestion and avoid unsupported patterns at low sample sizes.
- [ ] Add empty states for a range with no completed sessions and for workspaces with no open tasks.
- [ ] Run npm run lint and npm run build; manually inspect daily reflection stability, range changes, suggestion links, reduced motion, and both themes.
- [ ] Commit reflection and suggestion UI.
