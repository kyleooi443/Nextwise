# NEXTWISE Settings Design

## Goal

Make saved preferences understandable, validated, and effective throughout NEXTWISE while keeping user data in browser storage.

## Current state

Settings currently edits a draft and saves it through `setPreferences`. Work availability and energy affect recommendations, availability affects plan rebuilding, and the context panel setting affects Today. The theme preference writes a `data-theme` attribute but the stylesheet does not provide a complete dark theme. The time zone is stored but date formatting, day grouping, and schedule boundaries use the browser's local time zone. The form has no validation and leaves its draft mounted after saving.

## Design

Keep the existing Personal, Availability, Display, and Data sections and the explicit Save action. Use the established NEXTWISE surfaces, typography, spacing, and button styles. Make the section navigation work on desktop and collapse into a clear in-page selector on narrow screens. Show a persistent unsaved state while the draft differs from saved preferences, field-level validation messages, and a save confirmation after a successful save.

### Preference behavior

- Name is required after trimming whitespace. A valid save updates the app profile and greeting.
- Work start and end must both be valid times, and work end must be later than work start on the same day. Invalid values remain in the draft and display an error next to the field; they do not update saved state or rebuild the schedule.
- Available focus time and energy continue to update recommendation inputs and the schedule when saved.
- Context panel visibility continues to control Today’s context column.
- Time zone is a valid IANA time-zone identifier. The selected zone governs date and time formatting, local-day grouping, deadline interpretation, and work-window boundaries used for schedule rebuilding. Existing stored zones remain valid; invalid stored zones fall back to the device zone during state migration.
- Theme supports system, light, and dark. System follows `prefers-color-scheme` and responds if the operating-system preference changes. Light and dark apply to shared app surfaces, navigation, controls, forms, cards, and overlays, not only the Settings page.
- Save writes the validated draft through the existing provider and local-storage path. Rebuild the plan when availability, work hours, time zone, or energy changes because each affects schedule boundaries or ranking. Do not create a schedule revision for name, theme, or context-panel changes. Clear the draft after a successful save so subsequent edits begin from current state.
- Reset remains an explicit confirmation and restores demo tasks and default preferences in browser storage.

### Data and compatibility

Reuse the current `UserPreferences` fields and `AppProvider` local-storage model. Do not introduce accounts, remote storage, or new dependencies. Existing state remains version 1; migration fills missing fields and repairs only an invalid time zone, without discarding user tasks or sessions.

Centralize time-zone-aware date formatting and local-day/work-time conversion in a shared date utility. Use it for Today, Inbox date filters, Timeline, Review, Insights, relative deadline display, and schedule rebuilding. Persist block and deadline instants as ISO timestamps as today; only interpretation and presentation use the selected zone.

### Responsive and accessible behavior

- On narrow screens, stack fields and actions, keep controls at least 44px high, and avoid horizontal scrolling.
- Give every input a persistent label. Associate validation copy with its input and expose invalid state.
- Keep keyboard focus visible, section navigation keyboard usable, and save feedback in a status region.
- Respect reduced motion. Theme colors must preserve readable text, control, border, and focus contrast.

## Scope

Settings page, shared preference handling, shared date/time-zone utilities, schedule boundary conversion, date/time presentation and grouping that currently assumes the device zone, and global theme tokens/overrides required for complete theme behavior. No unrelated screen redesign.

## Acceptance criteria

1. Invalid names, time zones, and work windows cannot be saved; errors appear beside the relevant controls.
2. Saving valid preferences persists them across reload and updates the relevant app behavior.
3. Changing availability, work hours, time zone, or energy updates recommendations and rebuilds flexible schedule blocks; name, theme, and context-panel changes do not create an unnecessary schedule revision.
4. Selecting a time zone changes date/time display and day grouping consistently, and work-window calculations use that zone.
5. System, light, and dark themes render legibly across the app; system mode follows changes to the OS preference.
6. Reset requires confirmation and restores the demo state.
7. Settings remains usable at phone and desktop widths and with keyboard navigation.

## Risks and decisions

- Time-zone conversion must handle daylight-saving transitions. A requested local time that does not exist should advance to the first valid instant; an ambiguous local time should use the earlier occurrence. Tests must cover both cases.
- Existing data contains ISO instants created under device-local assumptions. Preserve those instants; changing the preference changes how they are shown, not the stored event itself.
- The stylesheet contains hard-coded light colors. Theme work must audit shared shell and interactive surfaces rather than relying on root variables alone.
