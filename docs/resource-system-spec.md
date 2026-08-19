# Puente ATX resource system

## Architecture

The existing React 18 + Vite application remains a client-rendered SPA. `App.jsx` owns lightweight History API routing. Public and administrative pages consume repository interfaces from `src/data/`; components do not call Supabase directly. The repository selector uses Supabase only when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist. Sample records are available during Vite development or when `VITE_ENABLE_DEMO_MODE=true` is explicitly set. A production build without Supabase configuration fails closed instead of enabling the demo repository.

Public state is split into URL state (search, filters, sort, page), localized UI/content, and versioned saved-resource slugs in localStorage. No visitor personal data is persisted. Admin session tokens are held in sessionStorage and sent only to authenticated repository methods.

## Routes

- `/` homepage
- `/conversacion` conversation request prototype
- `/recursos` published resource results
- `/recursos/:slug` published resource detail
- `/mi-lista` locally saved or shared list
- `/admin/login` administrative sign-in
- `/admin` dashboard
- `/admin/recursos` resource management
- `/admin/recursos/importar` CSV import with validation and draft preview
- `/admin/recursos/nuevo` create resource
- `/admin/recursos/:id/editar` edit resource

CSV imports use a downloadable UTF-8 template, accept quoted commas and line breaks, validate category slugs and controlled values before writing, and are limited to 100 rows per file. Multiple values use `|` as the separator. Every imported resource is created as a draft so an administrator can review it before publication.
- `/admin/categorias` category management

## Data model

The canonical JSDoc model is in `src/data/resourceTypes.js`; PostgreSQL tables, enums, checks, indexes, triggers and RLS are in `supabase/migrations/001_resource_system.sql`. A resource has one primary category and optional additional categories through `resource_categories`. Public queries expose only `published` resources. Missing optional values are omitted from UI.

All seed records in `src/data/demoResources.js` are fictional sample records. They must not be treated as production data.

## Security

Supabase Auth provides email/password admin authentication. Stored sessions are checked against Supabase before the admin interface is shown and refreshed shortly before token expiration. There is no public registration UI; public signup must also be disabled manually in the Supabase Auth settings. `admin_profiles` maps authenticated users to `admin` or `editor`. RLS permits anonymous reads only for published resources and active categories and denies anonymous writes. Authenticated writes require an enabled admin profile. `service_role` is never accepted by client configuration.

Editors can create/update content; destructive category/profile operations and permanent deletion remain admin-only. Normal deletion is archive. Draft previews remain inside authenticated admin UI.

## Filters and sorting

URL parameters: `q`, repeated comma-delimited `categoria`, `idioma`, `metodo`, `costo`, `area`, `reciente`, `orden`, and `pagina`. Search covers localized titles, organization, summaries, descriptions, keywords, categories and service area. Filters are combinable; values within one filter use OR and filter groups use AND.

The location-oriented `/buscador` experience is documented separately in `docs/resource-finder.md`. It reuses the same published resources and category records, supports Travis, Williamson, Bastrop, Hays, and Caldwell county ZIP centroids, and requires reviewed latitude/longitude values for physical resource locations.

Sort values are `relevance`, `updated`, `az`, and `za`. Results use button-based pagination (six initially), never infinite scroll. The recent-verification threshold is centralized at 180 days.

## Saved resources

Key: `puente-atx:saved-resources:v1`. Stored data contains version, unique public slugs and an optional technical timestamp only. `src/services/savedResources.js` handles unavailable/corrupt storage, deduplication, import/export, limits shared lists to 20 validated slugs, and synchronizes tabs with the `storage` event.

Shared lists use `/mi-lista?recursos=slug-1,slug-2`. They are previewed before explicit import and never overwrite a local list automatically.

## Sharing and WhatsApp

Canonical public URLs contain only slugs. WhatsApp uses `https://wa.me/?text=...`. Web Share is used when available; fallback copies the URL. User cancellation is silent. Individual messages omit missing fields; list messages prioritize the shared URL and limit names to avoid excessive length.

## Printing

Public resource detail and saved-list HTML is printable. `@media print` removes navigation, filters, drawers and actions, uses dark text on white, exposes URLs, preserves verification and legal notices, and avoids splitting cards where possible. Printing calls `window.print()`; no screenshots are generated.

## Admin dashboard

The dashboard uses separate navigation and displays local mode only when the sample repository is active. It supports metrics, search/filter/sort, create/edit/duplicate, draft/publish/archive/restore, category editing, bilingual completeness checks and unsaved-change warnings. Public navigation is not rendered inside admin routes.

## Assumptions and decisions

- Existing JavaScript is retained; centralized JSDoc types provide typed contracts without a TypeScript migration.
- No Supabase credentials are present. Production data/auth requires creating a project, running migrations and setting environment variables.
- Local sample-data mutations are in-memory and reset on reload; the UI labels this clearly.
- No real organizations, contact details or eligibility rules are included.
- Public content falls back to the other language only when a localized field is empty; the admin UI flags incomplete translations.
- Deployment must configure SPA rewrites so direct route loads return `index.html`.
