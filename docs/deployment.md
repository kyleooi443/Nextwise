# Deploy NEXTWISE with GitHub, Supabase and Vercel

The repository already has a GitHub `origin` remote on `main`. The current
workspace still has uncommitted changes, so Vercel cannot deploy those changes
from Git until they are committed and pushed. No Supabase project, Redis database,
or Vercel project is connected yet.

## 1. Prepare GitHub

1. Review `git status` and `git diff`, including the new auth files and previous
   UI work. Keep the sample insight screenshots only if you want them in the repo.
2. Run `npm run lint`, `npm run build`, and
   `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test lib/auth/security.test.mjs`.
3. Commit the reviewed files to `main` and push to the configured GitHub `origin`.
   Do not add `.env.local`, `.env.production`, or any real secret to Git. `.env*`
   is ignored except `.env.example`.

## 2. Create the Supabase Auth project

1. Create a Supabase project and keep its database password in a password manager.
2. In **Connect**, copy the Project URL and publishable key. The browser-safe
   publishable key is expected to use the `NEXT_PUBLIC_` prefix; never use a
   `service_role` or secret key in this app.
3. Under Auth providers, enable email/password and **Confirm email**. Set the
   password minimum to 12 characters. Configure custom SMTP before inviting
   real users; Supabase's default sender is for testing and has delivery limits.
4. Under Auth URL configuration, set the Site URL to the eventual HTTPS production
   domain. Allow these exact callback paths:
   - `https://YOUR-DOMAIN/auth/callback`
   - `https://YOUR-DOMAIN/auth/callback?next=/reset-password`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback?next=/reset-password`
5. For Vercel preview authentication, allow the preview callback URLs too. Supabase
   supports a pattern like `https://*-YOUR-VERCEL-TEAM.vercel.app/**`; keep that
   limited to your Vercel team slug. Prefer a separate Supabase staging project
   for previews, so tests cannot touch production accounts. `VERCEL_URL` is used
   to build the current preview's callback origin.
6. Add the corresponding `AUTH_SITE_URL` to local `.env.local`, then test signup,
   email confirmation, login, password recovery, reset, and logout locally.

## 3. Create shared rate-limit storage

Create an Upstash Redis database. Generate a separate HMAC key with
`openssl rand -hex 32`. Keep both values private. App-level rate limits use these
server-only variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `AUTH_RATE_LIMIT_SECRET`

Production auth returns unavailable if shared Redis or the HMAC key is missing.
Use separate Redis databases or namespaces for preview and production where practical.

## 4. Import the GitHub repository into Vercel

1. In Vercel, choose **Add New → Project**, connect GitHub, and import
   `kyleooi443/Nextwise`.
2. Keep the detected Next.js framework, repository root, install command and build
   command defaults. Production branch: `main`.
3. Add the environment variables below to Vercel Project Settings. Select the
   intended environment for each variable. Preview and Production values must be
   added separately, and changes take effect on the next deployment.

| Variable | Preview | Production | Secret? |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Staging Supabase URL | Production Supabase URL | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Staging publishable key | Production publishable key | No |
| `AUTH_SITE_URL` | Optional preview fallback | `https://YOUR-DOMAIN` | No |
| `UPSTASH_REDIS_REST_URL` | Preview Redis URL | Production Redis URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Preview Redis token | Production Redis token | Yes |
| `AUTH_RATE_LIMIT_SECRET` | Preview random key | Production random key | Yes |

Vercel supplies `VERCEL_ENV` and `VERCEL_URL` automatically. For previews, the
app uses `https://${VERCEL_URL}` for auth callback links. `AUTH_SITE_URL` is the
fallback for local development and the required exact HTTPS origin in production.

4. Import and deploy to create a Preview deployment first. Add its generated
   callback URL to the staging Supabase allow-list and test real email flows.
5. Add your production domain under Vercel Project Settings → Domains. Set
   `AUTH_SITE_URL` and Supabase Site URL to that exact HTTPS origin, add the exact
   production callback URLs, then redeploy.
6. Merge or push reviewed changes to `main` for the Production deployment. Test
   login, signup, email verification, recovery, protected routes, signout, and
   rate limiting on the actual domain.

Vercel automatically creates Preview deployments for non-production Git branches
and Production deployments for the configured production branch. You do not need
to add a separate GitHub Actions workflow just to deploy this Next.js app.

## Important product limitation

Supabase currently stores authentication accounts only. Tasks, schedules, and
preferences remain in browser storage, separated by verified user ID. There are
no Supabase app-data tables or migrations yet, so data will not sync across
browsers or devices. This is suitable for an authenticated local-first preview;
complete multi-device persistence requires the separate database/RLS work in the
production design before presenting it as a fully synced SaaS.

## References

- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Auth email delivery](https://supabase.com/docs/guides/auth/auth-smtp)
