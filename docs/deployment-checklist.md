# Puente ATX: production deployment checklist

Audit date: July 22, 2026. This document prepares the project for Vercel + Supabase with Bluehost DNS. It does not perform a deployment.

## Build profile

- Framework: React 18.2 client-rendered single-page application (SPA).
- Build tool: Vite 2.9.16.
- Styling: Tailwind CSS 3.4/PostCSS plus the project CSS token system.
- Language: JavaScript/JSX. There is no TypeScript configuration or typecheck script.
- Install command: `npm ci`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Development command: `npm run dev`.
- Checks: `npm run lint`, `npm test`, and `npm run build`.

## Environment variables

Set these in Vercel for Production (and Preview only if Preview should use the same Supabase project):

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ENABLE_DEMO_MODE=false
RESEND_API_KEY
CONVERSATION_TO_EMAIL
CONVERSATION_FROM_EMAIL
```

`VITE_SUPABASE_ANON_KEY` is the browser-safe Supabase anon/publishable key. Never create or expose a `VITE_SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, secret key, database password, or direct database connection string in Vercel's client build.

The three conversation-email values are server-only and must never use the `VITE_` prefix. For initial testing, set `CONVERSATION_TO_EMAIL` to the private test inbox and `CONVERSATION_FROM_EMAIL` to `Puente ATX <onboarding@resend.dev>`. Resend's test sender can deliver only to the email address associated with the Resend account. Verify a Puente ATX domain before sending to other recipients.

The production repository fails closed when Supabase values are absent. Demo login/data are enabled only by the Vite development environment or an explicit `VITE_ENABLE_DEMO_MODE=true`; never enable that variable in production.

## Supabase setup

Apply these migrations in order:

1. `supabase/migrations/001_resource_system.sql`
2. `supabase/migrations/002_seed_categories.sql`
3. `supabase/migrations/003_security_hardening.sql`
4. `supabase/migrations/004_publish_contact_methods.sql`
5. `supabase/migrations/005_mvp_summary_publish_requirement.sql`

Preferred workflow after installing the Supabase CLI:

```sh
supabase login
supabase link
supabase db push
```

No Supabase project is currently linked and no remote migration state was inspected. Before pushing, run `supabase migration list` and confirm the target project. Do not apply migrations to an unrelated or populated database without reviewing the diff and taking a backup.

Manual Auth steps:

1. In Supabase Auth settings, disable **Allow new users to sign up**.
2. Disable anonymous sign-ins.
3. Keep email/password sign-in enabled.
4. Set the production Site URL and permitted redirect URLs to the final HTTPS domain.
5. Create the first admin user manually in Supabase Auth.
6. Copy that user's UUID and create its profile using a trusted SQL session:

```sql
insert into public.admin_profiles (id, display_name, role)
values ('AUTH-USER-UUID', 'Administrator', 'admin');
```

There is no public signup UI. `/admin/login` only signs in an existing user. The app validates a stored session with Supabase before rendering admin content and refreshes the access token before expiration. Database authorization does not rely on this UI guard: RLS and grants enforce access at the Data API.

## RLS audit

RLS is enabled on `categories`, `resources`, `resource_categories`, and `admin_profiles`.

- `anon` can select active categories.
- `anon` can select only resources whose status is `published`.
- Public resource reads exclude internal verification notes and staff UUIDs.
- Public resource/category-link rows must belong to a published resource.
- `anon` receives SELECT grants only and has no INSERT, UPDATE, or DELETE policy.
- Authenticated users require an `admin_profiles` row with an allowed role before writing.
- Editors can create/update drafts but cannot publish them; category links for editors are restricted to drafts.
- Normal resource removal is archival. The client has no service-role or secret key.

These conclusions are from static migration review. After applying the migrations, verify them against the actual project with anon-key REST requests and authenticated admin/editor sessions before launch.

## Vercel SPA configuration

The production build generates `robots.txt`, `sitemap.xml`, route-specific metadata, structured data, and prerendered HTML for every published resource available from Supabase at build time. `vercel.json` serves generated files first and falls back to `/index.html` for History API routes.

Publishing or archiving a resource in the admin does not rebuild the static sitemap. Run a new Preview and Production deployment after public resource changes so search engines receive the current resource inventory.

The SPA fallback supports direct reloads of routes such as:

- `/conversacion`
- `/recursos`
- `/recursos/:slug`
- `/mi-lista`
- `/privacidad`
- `/terminos`
- `/admin`
- `/admin/login`
- `/admin/recursos`

Vercel should use the root containing `package.json`, framework preset **Vite**, build command `npm run build`, and output directory `dist`.

Because no Git remote is used, deployment should later be performed from the local project with the Vercel CLI. Do not run `vercel` or `vercel --prod` until the Supabase project, variables, migrations, and domain are ready.

## Bluehost DNS and domain

Bluehost remains the DNS provider only.

1. Add the final domain to the Vercel project first.
2. In Bluehost DNS, enter the exact A/CNAME records Vercel displays for that domain.
3. Remove only conflicting parking or old hosting records after confirming they are no longer needed.
4. Preserve mail-related MX/TXT records.
5. Wait for Vercel to verify DNS and issue HTTPS before making the site public.

Do not guess Vercel's DNS targets; use the values shown in the Vercel project because they can differ by configuration.

## Preflight before deployment

- Replace all fictional resource records with reviewed production data in Supabase.
- Confirm the privacy contact, hosting/provider disclosures, and retention policy on `/privacidad`.
- Complete legal review of `/privacidad` and `/terminos`.
- Verify Auth signup and anonymous sign-ins are disabled.
- Test admin, editor, anon, draft, published, and archived access against the remote Supabase project.
- Test direct browser reloads on every route after a Vercel preview deployment.
- Test the custom domain, `www`/apex redirect choice, HTTPS, sharing URLs, printing, WhatsApp, maps, and language switching.
- Keep `VITE_ENABLE_DEMO_MODE=false` in every production environment.
