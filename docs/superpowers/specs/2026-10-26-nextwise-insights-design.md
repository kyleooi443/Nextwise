# NEXTWISE Insights Design

## Goal

Give users a clear view of their focus activity and useful next steps, using only activity already recorded in NEXTWISE.

## Current state

Insights currently derives up to two text observations after five eligible sessions. It has no charts, quote, range control, or suggestions. Sessions, outcomes, task details, and preferences are stored locally by `AppProvider`; there may be no recorded sessions on a new workspace.

## Design

Use the established NEXTWISE page heading and surfaces. Provide a 7-day / 30-day range control that updates all period-based metrics, charts, and suggestions. Show compact metrics, then a daily focus-time trend and a session-outcome comparison. Follow with a short original NEXTWISE reflection and a small set of suggested actions. Keep charts visible before any sessions exist; show a zero-data baseline and a direct explanation/CTA instead of fabricated bars or seeded history.

### Data and charts

- Group ended sessions by calendar day in the user's saved time zone.
- Focus-time chart shows actual focus minutes per day in the selected range, with labeled day ticks, a clear minute scale, and exact values available in the chart's accessible text alternative.
- Outcome chart compares completed, partial, blocked, and skipped session counts for the same range. Include labels and counts so color is never the only signal.
- Metrics include total focus time, ended session count, completed-session count, and average actual duration. Do not imply trends or personal patterns from insufficient data.
- Use native SVG/CSS and existing icons; add no chart dependency. Respect responsive widths, visible focus where chart controls exist, and reduced motion.

### Reflection and suggestions

- Display one short, original, unattributed NEXTWISE reflection. Select deterministically by local calendar day so it stays stable during the day and changes on the next day.
- Suggestions use deterministic rules over the selected period's sessions, task list, and saved preferences. Each suggestion states the evidence behind it when the evidence is activity-based and links to a useful in-app action such as Focus, Inbox, Timeline, or Settings.
- With no sessions, suggest starting a short focus session. With a small sample, describe counts and avoid asserting stable personal patterns. Existing five-session minimum remains the threshold for comparative pattern claims; raw counts and charts do not require that threshold.
- Suggestions must not infer health, mood, diagnosis, or unrecorded user intent. No AI service or network call is introduced.

### Empty and loading states

- Keep both chart frames, headings, and labels visible with a clear empty message and zero values when there is no activity in the selected range.
- If there is activity but no completed sessions, show the outcome counts and omit completion-only comparisons.
- Hydration uses the existing loading state. No-data suggestions point to Focus or task creation rather than leaving empty cards.

## Data and compatibility

Read `AppState.sessions`, `AppState.tasks`, and `AppState.preferences`; derive chart series and suggestions without persisting redundant analytics. Reuse shared time-zone/day helpers from the Settings work. Keep all data local and preserve existing stored state without migration.

## Scope

Insights page composition, pure analytics derivation in `lib/insights.ts`, chart rendering/accessibility, responsive styles, original reflection content, and rule-based suggestions. No external analytics, remote requests, export flow, or new dependencies.

## Acceptance criteria

1. Switching between 7 days and 30 days updates every period-based metric, chart, and suggestion.
2. Chart values equal the ended session records in the selected local-day range; no synthetic activity is shown.
3. Charts have readable scales, labels, counts, and screen-reader summaries.
4. Zero-session and zero-completion states remain informative and offer a useful next action.
5. Reflections are original, unattributed, and stable for a local calendar day.
6. Suggestions are deterministic, relevant to the available data/preferences, and avoid unsupported pattern claims below five eligible sessions.
7. Layout remains usable at phone and desktop widths, with no horizontal overflow.

## Risks and decisions

- Short time ranges can make a chart appear empty. Preserve all day buckets and zero baselines so the date range remains legible.
- Session outcomes may be absent on older/in-progress records. Only ended sessions with a recognized outcome count toward outcome categories; session duration may fall back to planned minutes only where the metric explicitly labels it as estimated.
- Pattern thresholds apply to claims, not raw activity. This keeps charts useful immediately while avoiding overconfident interpretation.
