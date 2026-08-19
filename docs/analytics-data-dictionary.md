# Puente ATX analytics data dictionary

Created: July 28, 2026  
Owner: Puente ATX directory administrators

| Metric | English name | Definition and formula | Source | Filters | Thresholds | Limitations |
|---|---|---|---|---|---|---|
| Sesiones con actividad | Sessions with activity | Distinct `anonymous_session_id` with at least one valid event | `analytics_events` | Period, language, device, environment | None | Session IDs are tab/session scoped and are not exact people |
| Búsquedas realizadas | Searches performed | Count of `search_submitted` | `analytics_events` | Global filters | None | Measures submitted searches, not need fulfilled |
| Recursos vistos | Resources viewed | Count of `resource_viewed` | `analytics_events` | Global filters | Deduplicated per mounted detail view | Detail opens, not reading completion |
| Recursos guardados | Resources saved | Count of `resource_saved` | `analytics_events` | Global filters | None | Save action may later be removed |
| Acciones de contacto | Contact actions | Sum of `call_clicked`, `whatsapp_clicked`, `website_clicked`, `directions_clicked` | `analytics_events` | Global filters | None | An initiated action does not confirm contact or assistance |
| Búsquedas sin resultados | Searches without results | Count of `search_no_results` | `analytics_events` | Global filters | None | Depends on current directory content and filters |
| Tasa sin resultados | No-results rate | `search_no_results / search_submitted × 100`; 0 when denominator is 0 | `analytics_events` | Global filters | None | Does not explain why a search failed |
| Actividad en el tiempo | Activity over time | Selected aggregate metric grouped by day, week or month according to the visible range | `analytics_events` through `get_insights_time_series` | Global filters | Daily ≤31 days; weekly ≤100 days; monthly otherwise | Per-bucket sessions are distinct within each interval and must not be added to estimate exact people |
| Listas compartidas | Lists shared | Count of `list_shared` | `analytics_events` | Global filters | None | Does not confirm receipt or opening |
| Listas impresas | Lists printed | Count of `list_printed` | `analytics_events` | Global filters | None | Print dialog opening does not confirm physical printing |
| Demanda por categoría | Category search activity | `search_submitted` events with `category_slug` | `analytics_events` | Global filters | None | Category selections alone are not added to avoid double counting |
| Necesidades por área | Needs by area | `search_submitted` grouped by voluntarily supplied ZIP | `analytics_events` | Global filters | 20 events and 10 sessions per ZIP | Aggregated search activity, not people or exact demand |
| Términos sin resultados | No-result terms | Sanitized terms grouped from `search_no_results` | `analytics_events` | Global filters | 5 occurrences | Low-volume terms are hidden |
| Tasa de acción | Action rate | Contact actions divided by resource views × 100 | Events joined to `resources` | Global filters | “—” when views are 0 | Not a success rate |
| Necesita revisión | Needs review | `last_verified_at` older than 180 days | `resources` | Current directory | 180 days | Does not mean information is incorrect |
| Traducción incompleta | Incomplete translation | Missing `title_en`, `summary_en` or `description_en` | `resources` | Current directory | None | Based on current secondary-language policy |

All metrics begin accumulating only after migration and instrumentation are deployed. Historical Vercel traffic is not backfilled.
