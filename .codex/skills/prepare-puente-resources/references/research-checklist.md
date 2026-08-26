# Puente ATX resource research checklist

Use this checklist when enriching incomplete resources. It is an intermediate research format, not a replacement CSV schema. Always read the live `CSV_IMPORT_HEADERS` first and map the findings to existing columns.

## Workflow

1. Identify the existing record by `slug` whenever possible.
2. Mark every destination column as populated, missing, conflicting, or not applicable.
3. Research missing fields only. Prefer official program pages, official organization pages, and government sources.
4. Record factual conflicts for human review; do not silently overwrite reviewed values.
5. Separate confirmed facts from editorial translations or reasonable classification.
6. Strip tracking parameters such as `utm_source` from saved URLs.
7. Convert the research result to the exact live CSV header order.
8. Validate as an update against the existing-resource export.

## Nineteen-point checklist and CSV mapping

| # | Research item | Existing CSV destination |
|---|---|---|
| 1 | Título del recurso — Español | `title_es` |
| 2 | Resource title — English | `title_en` |
| 3 | Organización | `organization_name` |
| 4 | Resumen — Español | `summary_es` |
| 5 | Summary — English | `summary_en` |
| 6 | Categoría y servicios | `primary_category`, `additional_categories`; express supported service detail in the appropriate existing description or access fields rather than inventing a column |
| 7 | Palabras clave | `keywords_es`, `keywords_en` |
| 8 | Teléfono(s) | `phone`, `sms_phone`, `whatsapp_phone` according to the confirmed function of each number; do not place extra numbers in summaries |
| 9 | Website | `website_url`; use the official public program page and remove tracking parameters |
| 10 | Dirección | `address_line_1`, `address_line_2`, `city`, `state`, `postal_code`, `county`; include only an operationally useful service location |
| 11 | Disponibilidad / horario | `hours_es`, `hours_en` |
| 12 | Idiomas | `languages`; include Spanish only when service availability is supported, not merely because Puente ATX translated the listing |
| 13 | Método de servicio / cómo acceder | `service_methods`, `application_steps_es`, `application_steps_en` |
| 14 | Descripción — Español | `description_es` |
| 15 | Description — English | `description_en` |
| 16 | Área donde sirven / county | `service_area_es`, `service_area_en`, and `county` when appropriate; use normalized county names, not mixed city/county lists |
| 17 | Elegibilidad | `eligibility_es`, `eligibility_en` |
| 18 | Costo | `cost_type`; preserve additional supported nuance in an existing relevant narrative field only when useful |
| 19 | Notas adicionales | Map only useful public facts to existing fields such as `accessibility_notes_es`, `accessibility_notes_en`, `required_documents_es`, `required_documents_en`, `application_steps_es`, `application_steps_en`, or `verification_notes`; do not create a catch-all CSV column |

Also populate when supported:

- `email`
- `source_url`
- `last_verified_at`
- `verification_notes`
- `is_emergency`
- `is_featured` only when explicitly directed by the user
- `latitude` and `longitude` only from an approved, documented geocoding result

## Source and verification rules

- Use `website_url` for the page the public should visit.
- Use `source_url` for the strongest page supporting the record. If multiple sources are necessary, identify them in the review report rather than putting citation markup inside public fields.
- Set `last_verified_at` to the date the information was actually checked.
- Do not copy citation markers such as `[1]`, Markdown links, footnotes, or `utm_source=chatgpt.com` into CSV values.
- Do not infer in-person access from a headquarters address.
- Do not infer countywide service from office location.
- Do not claim that a phone call will be answered, an application will be approved, or a service is available without current support.

## Human-review triggers

Require review when:

- official sources conflict;
- the service/program identity does not match the existing slug;
- a supplied value differs materially from a populated database value;
- multiple phone numbers have unclear purposes;
- service location differs from the organization headquarters;
- eligibility, cost, schedule, language, or availability is unclear;
- the source lists many programs that may need separate resource records;
- a translation changes scope or meaning;
- a field remains empty after reasonable research.
