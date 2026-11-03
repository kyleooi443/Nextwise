# NEXTWISE

**Stop planning. Start doing.**

NEXTWISE is a working, deployed productivity MVP in active development. It helps
people choose one meaningful next task, understand why it is recommended, and
adjust flexible focus blocks when plans change.

- **Live app:** [nextwise-pi.vercel.app](https://nextwise-pi.vercel.app)
- **Production branch:** `main`
- **Stack:** Next.js, TypeScript, Supabase Auth, Upstash Redis, Vercel
- **Current data model:** task and preference data stay in browser storage; they
  do not sync between devices yet.

## What works today

- Today view recommends a task using deadline, importance, time fit, energy,
  dependencies, start effort, and dismissal history.
- Inbox supports capture, editing, dependencies, filters, completion, and date
  phrases such as “today,” “tomorrow,” and “in 3 days.”
- Focus sessions support pause, resume, duration changes, and completed,
  partial, blocked, or not-started outcomes.
- Timeline supports day and week views, fixed commitments, flexible blocks,
  revisions, accept, and undo.
- Reviews, evidence-based insights, editable preferences, themes, and local
  persistence are available.
- Signup, email verification, login, and password recovery use Supabase Auth.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. If that port is in use, Next.js selects another
available port. Local authentication needs the variables described in
[Authentication](docs/authentication.md).

## Project checks

```bash
npm run lint
npm run build
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test lib/auth/security.test.mjs
```

## Project status

The deployed MVP is usable and the project is actively being developed. Cloud
sync for tasks and preferences, calendar sync, voice capture, and AI services
are not implemented. See [Deployment](docs/deployment.md) for the live setup and
remaining launch checks.

## Documentation

- [Authentication](docs/authentication.md): local setup, email links, sessions,
  and rate limits.
- [Deployment](docs/deployment.md): current Vercel setup and release checks.
- [Brand implementation](docs/brand-implementation.md): UI work, verification,
  and outstanding brand assets.
