# NEXTWISE

Stop planning. Start doing.

NEXTWISE is a decision-first productivity prototype. It uses a deterministic scoring engine to recommend one next task, explains the factors behind that choice, and revises flexible focus blocks after a missed, partial, or blocked session.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. If port 3000 is already in use, Next.js selects the next available port.

## Included in this prototype

- Today recommendation with editable time and energy context, factors, alternatives, and a first step.
- Task capture, date phrase parsing for “today,” “tomorrow,” and “in N days,” editing, dependencies, filters, and completion.
- Deterministic recommendation scoring using deadline, importance, time fit, energy match, dependency value, start effort, and dismissal history.
- Focus timer with pause/resume, duration changes, and completed, partial, blocked, and did-not-start outcomes.
- Day and week timeline, fixed commitment protection, lockable flexible blocks, revision history, accept, and undo.
- Daily and weekly review, evidence-gated insights, editable preferences, light/dark/system themes, and browser persistence.

Tasks and preferences stay in the current browser's local storage. Authentication, Supabase persistence, external calendar sync, voice capture, and AI services are not connected in this prototype.

## Project checks

```bash
npm run lint
npm run build
```

## Authentication and deployment

Login/signup use Supabase Auth when configured. See [authentication setup](docs/authentication.md)
and [GitHub, Supabase and Vercel deployment steps](docs/deployment.md).
Workspace content stays in per-account browser storage; Supabase data sync is not
implemented yet.
