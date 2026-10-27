# NEXTWISE Production Readiness Design

## Goal

Move NEXTWISE from a single-browser prototype to a secure, multi-user application that can be configured for Supabase and deployed on Vercel. Preserve its deterministic recommendation and scheduling behavior while making everyday flows clearer and easier to use.

## Current State

- Next.js App Router with client-side screens and a shared React context.
- All application data is seeded or stored in `localStorage`; there is no account system or remote persistence.
- Scheduling and recommendation logic lives in plain TypeScript modules and can remain deterministic and independent from Supabase.
- No Supabase migrations, environment template, auth routes, or Vercel deployment guide exist.
- Today has several competing actions and dense secondary information. Some controls imply unavailable features (for example, voice capture and “ask anything” search).

## Product Scope

### Authentication and first use

- Add email/password sign-up, sign-in, sign-out, and password recovery through Supabase Auth.
- Use cookie-backed SSR sessions with the current Next.js file convention for session refresh. Protect application routes on the server and send signed-out users to a focused sign-in flow.
- On first account use, create preferences and an empty personal workspace; do not silently create fake task history.
- If a browser has prototype data, offer a clear, one-time import into the signed-in account. Keep the local copy until import succeeds, make retries safe, and explain if there is nothing to import.
- Account deletion and data export are not part of this first production slice; document these as follow-up product requirements before public launch if required by the product's operating context.

### Persistence and data model

Use normalized per-user tables so tasks, schedule blocks, focus sessions, preferences, and revisions can be queried and updated independently:

- `profiles` keyed to `auth.users.id`, for display name and onboarding metadata.
- `user_preferences` keyed by `user_id` for timezone, working hours, available minutes, energy, theme, and context-panel preference.
- `tasks` with ownership, deadlines, priority/effort fields, status, dependency relationships, and timestamps. Dependencies use a join table with same-owner enforcement.
- `calendar_blocks` with ownership and optional task relation, preserving fixed/flexible/break kind and locked state.
- `focus_sessions` with task relation, actual/planned durations, outcome, and timestamps.
- `schedule_revisions` with trigger, explanation, timestamp, accepted/undone state, and JSONB before/after block snapshots for audit and undo.

All exposed tables enable RLS. Policies name `authenticated`, use `auth.uid()` ownership predicates, and constrain writes with `WITH CHECK`. Foreign keys and database constraints prevent cross-user references. Add indexes for ownership and common user/date queries. No service-role key is used by browser code.

### Application architecture

- Keep recommendation and rescheduling functions pure and portable; screens consume a repository/data-access layer rather than directly depending on browser storage.
- Use `@supabase/ssr` clients for browser and server contexts, cookie handling, and route protection. Validate authenticated requests on the server; do not treat client-only route hiding as authorization.
- Move the app shell's initial data load and writes onto authenticated Supabase access. Keep any local browser state limited to transient UI state and the explicit legacy-data import path.
- Handle loading, empty, offline/error, and save-failure states without clearing user-entered data. Use clear retry feedback and prevent rapid duplicate submissions.
- Add application-level error boundaries and a non-sensitive health endpoint suitable for deployment checks.

### UX improvements in scope

- Establish a clearer visual hierarchy around one recommended next action and one primary start action.
- Reduce competing controls and move less-used recommendation details behind a disclosure.
- Improve label readability, tap targets, keyboard focus, form feedback, and narrow-screen layout.
- Remove unavailable or misleading controls; ensure search communicates its actual task-search behavior.
- Clarify destructive/irreversible actions and show feedback after task changes, session outcomes, schedule revisions, and saves.
- Preserve NEXTWISE's restrained visual identity and make the app usable with light, dark, and system themes.

### Deployment readiness

- Pin runtime dependencies and commit the lockfile; use supported, compatible versions rather than floating `latest` ranges.
- Add `.env.example` containing only public Supabase URL and publishable key names, with no secrets.
- Add Supabase local project configuration and ordered SQL migrations; document local setup, migration, auth redirect URLs, and production environment configuration.
- Document Vercel import/build setup, preview versus production environment variables, Supabase Auth URL allowlists, and deploy steps.
- Add production build/lint scripts and ensure no secret is exposed through `NEXT_PUBLIC_` variables. Keep server-only secrets absent unless a reviewed server feature requires them.
- The repository will be deployment-ready, but provisioning a live Supabase project, entering credentials, registering domains, and publishing a Vercel deployment requires the user's connected accounts/project details.

## Security and Reliability Requirements

- Every user-owned row is inaccessible to a different user, including through direct Data API requests.
- All mutations are validated on the server and rely on database RLS as the final ownership boundary.
- Auth refresh uses the supported Next.js convention for the installed version; protected data is not shared through public caching.
- Schema changes are migration-backed and repeatable. No manual production-only SQL is required.
- A partially completed save or failed import does not silently discard data; import is idempotent and reports its result.
- Avoid persisting sensitive task data in logs or health responses.

## Acceptance Criteria

1. A new user can create an account, sign in, recover access, and sign out.
2. Signed-out users cannot access application data; authenticated users load only their own persisted state.
3. A user can create, edit, complete, block, and delete tasks; update preferences; run focus sessions; and revise/undo schedules with state surviving reloads and another device session.
4. RLS denies reads and writes across two distinct users, and user-owned foreign-key relationships cannot point to another user's rows.
5. Existing browser prototype data can be explicitly imported once, safely retried, and retained locally until confirmed successful.
6. Recommendation and scheduling results remain deterministic for the same inputs; fixed commitments and locked blocks remain protected.
7. The improved flows work on desktop and mobile with accessible labels, visible focus, legible text, and usable touch targets.
8. Missing configuration produces a clear setup error in development rather than a runtime crash; production builds complete with configured public environment values.
9. A new developer can follow the repository documentation to run locally, apply migrations, configure Supabase Auth URLs, and deploy to Vercel.

## Out of Scope

- Live calendar integrations, shared workspaces, billing, AI task extraction, notifications, analytics, and collaboration.
- Provisioning or publishing live third-party projects without their account credentials.
- Account deletion/data export workflows beyond the follow-up requirement noted above.

## Implementation Sequence

1. Pin and verify the app toolchain; add environment and Supabase project scaffolding.
2. Define relational schema, constraints, indexes, RLS policies, and database verification artifacts.
3. Implement SSR Supabase clients, session refresh, auth screens, and protected routes.
4. Add typed persistence/data access and move app state from localStorage to per-user database state.
5. Implement safe legacy-data import and robust save/error/loading behavior.
6. Refine key UX flows and responsive/accessibility behavior.
7. Add deployment and operations documentation, health/error handling, and run available project checks.

## Current Guidance Reviewed

- Supabase SSR guidance uses cookie-based sessions and current framework-specific proxy/middleware conventions; the exact filename depends on the installed Next.js major version.
- Supabase RLS guidance requires both grants and policies, explicit role targeting, and ownership conditions. UPDATE access needs a SELECT policy; updates must prevent changing ownership.
- Vercel's current Next.js deployment documentation supports the framework directly; project-specific environment values and domain/Auth redirects still need configuration.
