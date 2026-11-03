# Deployment

NEXTWISE is deployed on Vercel and connected to GitHub, Supabase Auth, and
Upstash Redis. The production app is [nextwise-pi.vercel.app](https://nextwise-pi.vercel.app).
The `main` branch is the production branch. Changes merged to `main` trigger a
production deployment; other branches create previews.

## Production configuration

Vercel Project Settings → Environment Variables should contain these values for
**Production**. Apply the same names to Preview only if preview deployments need
auth. Never commit secret values.

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key | Public |
| `AUTH_SITE_URL` | Canonical production origin: `https://nextwise-pi.vercel.app` | Public |
| `UPSTASH_REDIS_REST_URL` | Shared auth rate-limit store | Secret |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash access token | Secret |
| `AUTH_RATE_LIMIT_SECRET` | HMAC key for rate-limit identifiers; 32+ characters | Secret |

After changing environment variables, redeploy so the production build receives
the new values. Enter values without quotes. Keep the Supabase service-role key
out of this app; it uses the publishable key.

## Supabase email configuration

In Supabase Auth URL Configuration:

- Set **Site URL** to `https://nextwise-pi.vercel.app`.
- Add `https://nextwise-pi.vercel.app/auth/callback` to allowed redirect URLs.
- Add `https://nextwise-pi.vercel.app/auth/callback?next=/reset-password` for
  recovery links.

For local signup, also allow `http://localhost:3000/auth/callback` and
`http://localhost:3000/auth/callback?next=/reset-password`. Production signup
links should return to the deployed HTTPS origin. If a link points to localhost,
check `AUTH_SITE_URL` and Supabase's Site URL, then request a new email; older
links can expire or retain a previous redirect.

Use Supabase's built-in email sender for development only. Configure custom SMTP
before inviting real users or relying on production email delivery.

## Release checklist

1. Review `git status` and the changes intended for release.
2. Run `npm run lint`, `npm run build`, and the auth security test command in the
   [README](../README.md).
3. Push or merge reviewed changes to `main`.
4. Check the Vercel deployment result and test the deployed app: signup, email
   confirmation, login, protected routes, signout, password recovery, and
   rate-limit behavior.
5. Keep `.env.local` and all secret values out of Git.

## Product limitation

Supabase currently stores authentication accounts only. Tasks, schedules, and
preferences remain in browser storage under the verified user's account key.
They do not sync across browsers or devices. Database tables, row-level security,
and cloud persistence remain future work, so describe NEXTWISE as a working
local-first MVP rather than a fully synced SaaS.

## References

- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Auth email delivery](https://supabase.com/docs/guides/auth/auth-smtp)
