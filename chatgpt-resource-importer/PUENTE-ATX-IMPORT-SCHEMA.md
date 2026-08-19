# Puente ATX CSV import schema

Snapshot: 18 de agosto de 2026.

## Exact header order

```text
organization_name,title_es,title_en,summary_es,summary_en,description_es,description_en,slug,primary_category,additional_categories,keywords_es,keywords_en,languages,service_methods,cost_type,eligibility_es,eligibility_en,required_documents_es,required_documents_en,application_steps_es,application_steps_en,hours_es,hours_en,accessibility_notes_es,accessibility_notes_en,service_area_es,service_area_en,phone,sms_phone,whatsapp_phone,email,website_url,address_line_1,address_line_2,city,state,postal_code,county,latitude,longitude,source_url,is_featured,is_emergency,last_verified_at,verification_notes
```

Do not rename, reorder, duplicate, or omit headers.

## Minimum structural requirements

- `organization_name`: required.
- At least one localized title is structurally required, but the preparation standard requires both `title_es` and `title_en`.
- `primary_category`: required and must use an accepted slug.
- CSV importer limit: 500 rows per file.
- `postal_code`: blank or exactly five digits.
- `last_verified_at`: blank or `YYYY-MM-DD`.
- `latitude` and `longitude`: blank or numeric.
- `is_featured` and `is_emergency`: use `true` or `false`.

## Categories

Use only:

- `comida` — Comida / Food
- `vivienda` — Vivienda / Housing
- `salud` — Salud / Health
- `transporte` — Transporte / Transportation
- `recursos-financieros` — Recursos financieros / Financial resources
- `educacion` — Educación / Education
- `ayuda-legal` — Ayuda legal / Legal help
- `otros-recursos` — Otros recursos / Other resources

Use `|` between additional categories.

## Accepted list values

### languages

- `es`
- `en`

Examples: `en`, `es|en`.

Do not add `es` merely because the listing was translated.

### service_methods

- `in_person`
- `phone`
- `online`
- `home_visit`

Use `|` for multiple methods.

### cost_type

- `free`
- `sliding_scale`
- `paid`
- `unknown`

## Publish requirements

A resource cannot be published without:

- organization;
- slug generated or preserved by the importer;
- at least one title;
- at least one summary;
- primary category;
- at least one supported contact method among phone, SMS phone, WhatsApp phone, email, or website;
- `source_url`;
- `last_verified_at`.

The preparation standard is stricter and expects bilingual titles and summaries.

## Update and duplicate behavior

The importer matches an existing resource by:

1. supplied slug;
2. normalized organization plus matching Spanish or English title.

For a known update, preserve the existing slug. For a genuinely new resource, leave slug blank unless a deliberate stable slug is required.

## Service area normalization

Prefer county-only bilingual values:

- `Condado de Travis` / `Travis County`
- `Condado de Williamson` / `Williamson County`
- `Condado de Bastrop` / `Bastrop County`
- `Condado de Hays` / `Hays County`
- `Condado de Caldwell` / `Caldwell County`
- `Condado de Blanco` / `Blanco County`
- `Condado de Burnet` / `Burnet County`
- `Condado de Bell` / `Bell County`

Statewide service:

- `Todos los condados de Texas`
- `All Texas counties`

Do not convert a physical office location into a claim of countywide service without supporting evidence.

## Summary validation

The importer warns when `summary_es` or `summary_en` contains:

- a URL;
- an email address;
- a US telephone number.

Move those values to their dedicated columns.
