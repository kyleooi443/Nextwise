# Authentication setup

## Run and preview

`npm run dev` serves `/login`, `/signup`, `/forgot-password` and
`/resend-verification`. The pages render without credentials, with an unavailable
notice and disabled submit button. There is no mock success or authentication
bypass. Protected workspace URLs redirect to login when signed out or unconfigured.

## Enable real accounts

1. Copy `.env.example` to `.env.local`. Fill in the Supabase project URL and
   publishable key from your project's Connect dialog. Do not use a service-role key.
2. Set `AUTH_SITE_URL` to the exact origin (local: `http://localhost:3000`).
   Production requires HTTPS. Rebuild/restart after changing environment variables.
3. In Supabase Auth, enable email/password and **Confirm email**. Set the provider
   password minimum to **12 characters** so direct provider requests also enforce
   the policy. Enable leaked-password protection if available on your plan.
4. Set Supabase's Site URL and allow these exact redirect URLs for each environment:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback?next=/reset-password`
   Use the corresponding HTTPS URLs in production; avoid wildcard production URLs.
5. Configure production SMTP and review the provider's Auth rate limits. Supabase
   endpoints are public, so their native limits are the final protection against
   requests that bypass this application's form handlers. Application rate limits
   complement them; they do not replace them.
6. Configure shared Upstash Redis with `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`. Generate `AUTH_RATE_LIMIT_SECRET` with
   `openssl rand -hex 32`. These values are server-only.
7. Verify signup, confirmation, logout, login, recovery, and expired-link handling
   against your project before deployment. No live project was connected during
   implementation; live email, cookies and multi-account flows remain to be verified.

Default confirmation links use PKCE and must be opened in the browser that began
the flow. For cross-device links, configure custom SMTP/email templates to point
at `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` for signup
and the same URL with `type=recovery` for recovery. The confirm endpoint only
accepts these two types and routes recovery to the protected reset-password page.

## Rate limiting and request protection

- Atomic Redis `INCR` + `EXPIRE` inside one Lua operation, shared across instances.
- Network bucket: 30 requests / 15 minutes across auth actions.
- Normalized-email buckets: login 10 / 15 minutes; signup + resend share
  5 / hour; password-reset emails 3 / hour. Password updates also have a verified-user bucket
  of 10 / 15 minutes.
- Keys contain hashed network identifiers and HMAC email identifiers, not passwords
  or raw email addresses. Passwords and tokens are not logged by application code.
- Returns HTTP 429 with `Retry-After`. The form displays the retry interval.
- Memory fallback is allowed only outside production. Production fails closed
  with HTTP 503 if shared limiting or its secret is absent/unavailable.
- Vercel uses its overwritten client-IP header. Other hosts must configure
  `AUTH_TRUSTED_IP_HEADER` only when their ingress strips/overwrites that header.
  Without a trusted header, clients share a conservative bucket. Never configure
  an arbitrary forwarded header that users can supply unchanged.
- Mutations require an exact same-origin `Origin`, JSON content type, server-side
  field validation, and a streamed 8 KiB body limit. Redirect destinations are
  restricted to workspace routes. Recovery and signup avoid account-existence
  disclosures in their success messages.

## Sessions and workspace data

Supabase manages password hashing and verification. Authentication is server-only;
its cookies use HttpOnly, SameSite=Lax and Secure in production. Next.js proxy
refreshes sessions; the workspace layout and password updates independently check
identity with Supabase. Auth responses are not cached. Signout uses POST and
same-origin validation. Password changes request global signout.

Workspace storage remains browser-local, under `nextwise-state-v1:<verified-user-id>`.
New accounts start empty and use their signup display name. The old demo key is
preserved and is **not** automatically claimed by the first account. This isolates
normal account switching; it is not encryption against someone who controls the
browser or its developer tools. Cloud persistence and RLS are separate work.

Existing task/schedule routes keep their URLs; their files now live in
`app/(workspace)` behind a server-verified layout. Public forms live in `app/(auth)`.

## Verification

Run `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test lib/auth/security.test.mjs`
and `npm run lint && npm run build`. The auth tests cover invalid input, safe
redirects, same-origin checks, concurrent limits, expiry, failed Redis responses,
production fail-closed behavior, and distinct account storage keys.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[password authentication](https://supabase.com/docs/guides/auth/passwords),
[provider rate limits](https://supabase.com/docs/guides/auth/rate-limits), and
[Upstash REST](https://upstash.com/docs/redis/features/restapi).
