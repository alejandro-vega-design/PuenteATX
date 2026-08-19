# Puente ATX Insights MVP

## Purpose

Puente ATX Insights is an administrator-only view of anonymous, aggregate product actions and resource-directory maintenance. It measures observed actions, not service completion, social impact, unique people, successful connections, or confirmed assistance.

The approved visual reference is `references/puente-atx-insights-overview.png`. The implementation reuses the existing admin shell, Poppins typography, CSS tokens, Material Symbols Outlined icons, controls, tables, borders, radii, and responsive conventions.

## Architecture

- Public React components call one client utility: `trackPuenteEvent()`.
- The utility adds a session-only UUID, language, device type, path, environment hint and schema version.
- `POST /api/analytics/events` validates and removes unknown properties, determines the deployment environment server-side, validates referenced published resources and inserts through a server-only Supabase service-role key.
- Browsers have no direct insert or read privileges on `analytics_events`.
- Authenticated administrators query `get_insights_snapshot(...)` and `get_insights_time_series(...)`. Both PostgreSQL RPCs verify the `admin` role and return only aggregates.
- Editors cannot execute Insights queries.
- Vercel Web Analytics remains the source for general traffic and page/referrer statistics.
- Vercel Speed Insights remains the source for Core Web Vitals and route/device performance.

## Data sources

1. Anonymous Puente ATX product events in `analytics_events`.
2. Existing resources, categories and publication/verification fields in Supabase.

Vercel Web Analytics se utiliza para estadísticas generales del sitio. Puente ATX Insights utiliza eventos propios para medir acciones relacionadas con la búsqueda y los recursos.

## Allowed events

The allowlist and property contract live in `src/analytics/events.js`:

- `search_submitted`
- `search_no_results`
- `category_selected`
- `area_selected`
- `resource_viewed`
- `resource_saved`
- `resource_removed`
- `call_clicked`
- `whatsapp_clicked`
- `website_clicked`
- `directions_clicked`
- `list_shared`
- `list_printed`
- `resource_printed`
- `conversation_requested`
- `shared_list_opened`

No arbitrary event name is accepted.

## Schema and security

Migrations:

- `supabase/migrations/006_insights_mvp.sql`: event storage, RLS and primary aggregate snapshot.
- `supabase/migrations/007_insights_time_series.sql`: admin-only aggregate time series.

## Datos ficticios para Preview

Para revisar el potencial visual de todos los paneles sin contaminar métricas
reales, existe un seed manual y reversible:

- `supabase/demo/seed_insights_preview.sql`
- `supabase/demo/clear_insights_preview.sql`

El seed usa exclusivamente `environment = 'preview'`, no crea ni modifica
recursos y marca cada fila con `metadata.demo_seed =
'puente-atx-insights-v1'`. Incluye dos periodos comparables, categorías, ZIP
codes con suficiente volumen agregado, búsquedas sin resultados y acciones
sobre recursos publicados existentes. Puede ejecutarse nuevamente sin crear
duplicados porque primero elimina solamente las filas de ese mismo seed.

Estos archivos no son migraciones y no deben ejecutarse como parte automática
de un despliegue de producción. Para visualizar los datos, ejecuta manualmente
el seed en Supabase y selecciona `Preview` en el filtro **Entorno** de Insights.

`analytics_events` stores a generated UUID, server timestamp, anonymous session UUID, validated event name, optional resource/category/area/search aggregates, language, coarse device type, path without query parameters, server-determined environment, schema version and limited JSON metadata.

It must never store names, email addresses, telephone numbers, street addresses, GPS, IP addresses, full user agents, fingerprints, advertising identifiers, authentication information or conversation content.

RLS is enabled and forced. `anon` and `authenticated` receive no table privileges. The tracking Vercel Function inserts with a server-only service role after validation. Both aggregate RPCs are `SECURITY DEFINER`, fix `search_path`, reject non-admin users, validate filters and return only aggregate JSON.

## Filters

Global filters are period, language, device and environment. They are represented in `/admin/insights` query parameters. Production and the last 30 days are defaults. Preview and Development never mix with Production.

## Activity over time

The full-width time-series panel appears directly below the primary KPI cards. It displays one selected aggregate metric at a time: active sessions, searches, saves, contact actions or searches without results. Buckets adapt to the selected range: daily through 31 days, weekly through 100 days and monthly for longer ranges. Missing buckets are returned as zeroes so the chart does not imply breaks in collection. The panel includes keyboard-accessible data points and a semantic table alternative.

## Privacy thresholds

Central product thresholds:

- Map: at least 20 `search_submitted` events and 10 distinct session IDs per ZIP.
- No-results terms: at least 5 occurrences.
- Deterministic change insight: at least 20 events in each period, net change of at least 5 and percentage change of at least 10%.
- Resource review: 180 days.

ZIP and term suppression occurs in PostgreSQL. Suppressed ZIP counts and individual low-volume terms are not returned to the browser or CSV.

## Map

The map represents aggregated `search_submitted` events with a voluntarily selected ZIP. It does not represent people, addresses, GPS, resource locations, service completion or exact community demand.

The map uses `public/maps/austin-travis-zip-codes.geojson` without external tiles. The current file contains Census ZCTA polygons that intersect Travis County. Its metadata records provenance and limitations. See `docs/insights-map-methodology.md`.

## Export

CSV export contains aggregate overview, the time series, categories, visible ZIP areas, threshold-qualified no-result terms, resource performance and directory quality. It excludes session IDs, event rows, personal data, suppressed ZIP counts and low-volume terms.

## Responsive and accessibility

The existing admin shell is retained. Panels stack on narrow screens; complex resource data becomes scroll-contained or card-like. Charts include labels and a semantic table alternative. The map has a textual summary and table, does not trap focus and does not depend on color alone.

## Adding an event

1. Add the name and property contract to `src/analytics/events.js`.
2. Add the database `event_name` constraint in a new migration.
3. Document its source and metric.
4. Instrument it only through `trackPuenteEvent()`.
5. Add validation, privacy and aggregation tests.
6. Never add free-form or personal fields.

## Local testing

1. Apply migrations `006_insights_mvp.sql` and `007_insights_time_series.sql` to the intended Supabase project.
2. Configure the variables below.
3. Run `vercel dev` when testing the server endpoint locally; plain Vite does not execute `/api`.
4. Generate public actions.
5. Verify Development events remain separate from Production.
6. Sign in with an admin profile and open `/admin/insights`.
7. Confirm anon REST requests cannot read or write `analytics_events`.

## Environment variables

Browser-safe:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key must exist only in Vercel Functions and local server configuration. Never prefix it with `VITE_`.

## Deployment

1. Review and apply `006_insights_mvp.sql` and then `007_insights_time_series.sql`.
2. Add the server-only values to Vercel Production, Preview and Development as appropriate.
3. Keep existing Vercel Analytics and Speed Insights integrations enabled.
4. Build and deploy a Preview.
5. Verify tracking, RLS, role protection, filters and privacy thresholds.
6. Deploy Production only after review.

## Limitations and pending decisions

- Anonymous sessions end with the browser tab/session and do not represent exact unique people.
- Tracking failure never blocks a public action.
- The map covers only voluntarily selected allowed areas.
- No causality or service outcome can be inferred.
- Privacy-policy language describing Puente ATX aggregate product events requires editorial/legal review before launch.
- Retention and scheduled deletion for analytics events require an operational policy.
