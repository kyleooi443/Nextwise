# Authentication implementation plan

Goal: Implement real email/password login and signup with recovery and server-enforced abuse controls, following the Supabase choice in the production design.
Spec: docs/superpowers/specs/2026-10-23-nextwise-production-design.md (authentication slice only).

Architecture: Next.js route groups separate public authentication screens from the server-protected workspace. Supabase manages credentials and verified cookie sessions. All form submissions go through same-origin server handlers. Shared Redis fixed-window counters enforce per-client and per-email limits atomically; memory counters are development-only and production fails closed without Redis. No database migration or cloud workspace sync is included.

- [x] Test validation, safe redirects, atomic rate-limit expiry, and production fail-closed behavior.
- [x] Implement server clients, proxy session refresh, protected layout and auth routes.
- [x] Implement shared accessible auth forms, lowercase branding and responsive dark editorial panel.
- [x] Namespace local workspace persistence by verified user ID; leave legacy data intact and do not auto-import it.
- [x] Add logout, setup instructions and environment template without secrets.
- [x] Run helper tests, lint/build, route/CSRF/rate-limit checks and responsive UI checks.

Constraints: Keep all existing URLs and business logic. Do not provision external accounts. Do not fake successful authentication when credentials are absent. Do not claim live email or multi-account integration verified without a configured project.

Live Supabase email/session tests remain pending project credentials. Local checks verified 403 CSRF rejection, 400 invalid input, 413 body size enforcement, 429 with Retry-After after repeated attempts, and 307 protected-route redirects. UI checked at 375/768/1440px.
