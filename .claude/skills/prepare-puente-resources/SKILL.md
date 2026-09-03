---
name: prepare-puente-resources
description: Convert community-resource documents or incomplete resource exports into a consolidated, researched, bilingual, import-ready Puente ATX CSV. Use when a user asks to prepare, translate, clean, audit, enrich, complete missing fields, deduplicate, consolidate, or validate resource lists from CSV, JSON, XLSX, DOCX, PDF, or paired English/Spanish documents for the Puente ATX admin importer.
---

# Prepare Puente Resources

Create a bilingual CSV that passes the current Puente ATX importer. Preserve provenance, avoid invented facts, and leave production unchanged.

## Workflow

1. Locate the Puente ATX project. Prefer the current workspace; otherwise find a project containing `src/data/csvImport.js` and `package.json` with the Puente ATX application.
2. Read these live project files completely before transforming data:
   - `src/data/csvImport.js`
   - `src/data/categories.js`
   - `src/data/serviceAreaNormalization.js`
   - `src/data/resourceValidation.js`
   - `src/config/serviceAreas.js`
3. Treat the live `CSV_IMPORT_HEADERS`, category definitions, normalization rules, and validation logic as authoritative. Never rely solely on a copied template or remembered schema.
4. Extract the source document without changing it. Support CSV, XLSX, DOCX, PDF, and paired bilingual documents. If text extraction is unreliable or OCR would materially affect accuracy, stop and identify the affected pages or rows.
5. Create one candidate row per distinct service/program, not automatically one row per organization or paragraph.
6. Consolidate paired English and Spanish sources before translating. Prefer supplied translations when they accurately describe the same program. Translate missing content faithfully and concisely without claiming that the organization authored the translation.
7. Check current official sources when facts are missing, ambiguous, or possibly outdated. Prefer the organization’s official site, then government or authoritative program pages. Record the supporting URL in `source_url`. Never invent an organization, program, phone, address, schedule, eligibility rule, language, cost, or contact method.
8. When completing existing resources, read [references/research-checklist.md](references/research-checklist.md) and audit the export before researching. Complete only missing or explicitly requested fields. Preserve reviewed values and report conflicts instead of silently replacing them.
9. Deduplicate within the input and against an existing-resource export when available. Match in this order:
   - exact existing slug;
   - normalized organization plus localized title;
   - strong combinations of official website, phone, physical address, and program name.
   Flag uncertain matches instead of merging them.
10. Normalize every row using [references/quality-rules.md](references/quality-rules.md). Read that file before producing the CSV.
11. Generate UTF-8 CSV with the exact live header order. Quote fields correctly, preserve accents, and use `|` for list values unless the live importer specifies otherwise.
12. Run `scripts/validate-puente-csv.mjs` against the project and output. Fix all importer errors and review every quality warning.
13. Deliver:
   - `<source-name>-puenteatx-import.csv`;
   - `<source-name>-puenteatx-review.md` only when unresolved issues, assumptions, duplicate candidates, or missing fields exist.

## Existing-resource enrichment

When the user supplies a JSON export of existing resources:

1. Run the gap audit before web research:

```bash
node <skill-dir>/scripts/audit-resource-gaps.mjs \
  --project <puente-project-root> \
  --existing <resources.json> \
  --out <gap-report.csv>
```

2. Use the report to research only empty fields. Do not rewrite populated fields unless the user explicitly requests correction or an authoritative source reveals a material conflict.
3. Preserve each existing `slug`; use it as the update identity.
4. Populate the normal Puente ATX CSV columns. The research checklist is an intermediate quality-control format, not a second import schema.
5. Validate with `--existing` and confirm rows resolve to `update` or `unchanged`, not unintended `create` actions.
6. Recommend the importer mode **Completar solo campos vacíos**. Use **Actualizar campos incluidos** only when the user intentionally approved replacing existing populated values.
7. Provide a review report for conflicts, unverified facts, ambiguous locations, unsupported Spanish availability, and fields that remain empty.

## Required command

Run the validator from any directory:

```bash
node <skill-dir>/scripts/validate-puente-csv.mjs \
  --project <puente-project-root> \
  --csv <output.csv>
```

When a JSON export of existing resources is available:

```bash
node <skill-dir>/scripts/validate-puente-csv.mjs \
  --project <puente-project-root> \
  --csv <output.csv> \
  --existing <resources.json>
```

The JSON file must be an array of resource objects. Do not connect to production or import records merely to validate a file.

## Output standards

- Produce drafts ready for admin review; never publish or import automatically.
- Populate both Spanish and English titles and summaries.
- When schedule or availability information exists, populate and naturally translate both `hours_es` and `hours_en`. Preserve days, times, time zones, appointment requirements, seasonal limits, and exceptions exactly; never translate only the field label or copy prose unchanged between languages.
- Keep summaries short, user-facing, and free of phone numbers, emails, URLs, or raw contact lists.
- Map all researched content to existing CSV columns; never add a new CSV field merely because the source template uses a different label.
- Treat the 19-point research checklist as a completeness guide. Skip research for populated fields unless validation or correction is requested.
- Use the most specific existing primary category and optional existing additional categories. Never create new category slugs.
- Include a physical address only when the service is actually provided there or the address is operationally useful.
- For phone/online-only resources, leave location fields blank rather than adding a headquarters address as a service location.
- Do not guess latitude or longitude. Leave them blank unless coordinates come from an approved, documented geocoding result.
- Leave uncertain optional fields blank and explain them in the review report.
- Set `last_verified_at` only to the date the information was actually checked. Do not treat document conversion as verification by itself.
- Preserve an existing slug for updates. Let the importer generate a slug for genuinely new resources unless a deliberate stable slug is required.
- Never include private participant data or document metadata unrelated to the public resource.

## Final report

State:

- output path;
- number of candidate resources;
- number ready to import;
- number of likely updates;
- duplicate candidates;
- unresolved records;
- validation command and result;
- fields needing human review.

Do not claim the CSV is ready when validation reports errors.
