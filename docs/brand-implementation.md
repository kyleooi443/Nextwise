# NEXTWISE brand implementation

The supplied written palette is implemented without changing routes, scheduling,
storage, task state, focus outcomes, or insight derivation.

- `app/brand-theme.css`: fixed brand primitives, theme-aware semantic roles,
  shared control/card treatments, typography, focus styling, mobile refinements,
  and reduced-motion support. Existing `--blue` remains a compatibility alias
  for the jade interactive role; it does not represent a blue color.
- `app/globals.css`: existing layout preserved; repeated color literals now use
  semantic roles. Includes pre-existing uncommitted Timeline/Review work.
- `app/settings-theme.css`: retains Settings layout and sticky-save clearance;
  superseded per-component dark overrides removed in favor of semantic tokens.
- `app/insights-theme.css` and `app/insights/page.tsx`: themed charts, metrics,
  reflection and suggestions; outcome colors use CSS variables.
- `app/layout.tsx`: loads the brand stylesheet.
- `public/fonts`: self-hosted variable Manrope and its SIL Open Font License,
  downloaded from the Google Fonts repository. No runtime font-service request.

Manrope is a provisional typographic choice based on the written direction,
not a verified match to the unavailable identity board. Chart ticks retain their
compact sizing; explanatory prose and mobile inputs use larger readable sizes.
Primary actions use charcoal (light theme) or warm light foreground (dark theme).
Jade is reserved for selection, progress and success; apricot for warm reflections.

## Source assets still required

No identity-board attachment or original logo files were available in this task.
The existing crossed-bar mark and favicon remain legacy placeholders, not the
requested geometric N. No replacement geometry or custom X was invented.
The following assets are deliberately pending a reference or original vector:

- nextwise-logo.svg, nextwise-symbol.svg
- nextwise-logo-light.svg, nextwise-logo-dark.svg
- favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png

Once the source arrives, use one canonical geometry for all variants and raster
exports, then wire metadata/manifest icon references and verify at small sizes.
The brand rollout is not complete until this asset work is finished.

## Verification

- ESLint, production build and all 13 existing helper tests passed.
- Hydrated pages Today, Inbox, Timeline, Review, Insights, Settings and Focus
  setup checked at 375, 768, 1280 and 1440px in both themes: no page-level
  horizontal overflow (56 combinations).
- Inspected Today desktop, dark Focus, and dark mobile Insights visually.
- Focus start, pause and completed outcome smoke-tested; original browser data
  restored afterward.
- Measured primary, secondary, accent, warning, error and action text token pairs:
  light theme minimum 5.23:1; dark theme minimum 6.68:1.
- These checks are scoped verification, not a complete screen-reader or WCAG audit.

## Color revision

At user request, restored the previous blue, red, green, orange and purple UI
colors and neutral dark surfaces. Removed the recommendation card’s jade top
rule and colored outline. Typography, spacing and mobile refinements remain.
The earlier brand-palette contrast measurements above describe the previous
iteration, not the restored palette.
