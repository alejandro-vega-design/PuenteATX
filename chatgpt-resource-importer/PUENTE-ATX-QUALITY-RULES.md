# Puente ATX resource quality rules

## Identity and duplicates

- Represent a distinct public service or program as a resource.
- Keep the official organization in `organization_name` and the service/program name in localized titles.
- Never prepend or append the organization merely to distinguish a title; Puente ATX displays it separately.
- Make titles specific and self-contained. Include the essential service subject or population when a generic label would be ambiguous, such as the verified violence or assault context for survivor services.
- Do not append an organization, county, or arbitrary wording solely to make an accurate shared service label look unique.
- Preserve a known existing slug. Do not create a second slug for an update.
- Flag ambiguous organization/title matches and repeated records in the same document.
- Audit normalized bilingual title groups across the complete batch and, when available, across existing resources in the same status.
- Classify every shared title before changing it:
  - **Legitimate repetition:** equivalent service types at different organizations or distinct service locations. Keep the accurate shared title.
  - **Title/content mismatch:** the title conflicts with verified evidence. Retitle it and repair any contaminated summary.
  - **Ambiguous title:** the title omits essential context supplied by verified evidence. Add the missing subject or population without adding the organization.
  - **True duplicate:** contact details, program identity, description, and coverage establish that two rows represent one service. Preserve the strongest canonical record and stable slug, merge only verified complementary fields, and archive the duplicate rather than permanently deleting it.
- Treat spelling variants, county-split imports, and organization/program names used inconsistently as duplicate signals, not proof.
- Rerun the audit after correction and document why every remaining shared-title group is legitimate.

## Classification integrity

- Classify from immutable source text and current official program evidence. Never treat a title, summary, category, or translation generated during an earlier enrichment pass as new evidence.
- Make repeatable transformations idempotent: a second pass over the corrected data should produce no additional changes.
- Do not choose the first matching keyword blindly. Review all plausible matches and select the service that represents the row's actual purpose.
- Give domain-specific evidence priority over incidental language: veterinary care over human dental care for animal clinics; legal help over housing for legal programs; Lifeline over generic family support for phone-benefit providers; adult education over employment for education programs; and survivor support over housing when shelter is part of a violence-response service.
- Keep one row per distinct program when an organization offers several services. Distinguish them with the real program or service title, not the organization name.

## Bilingual content

- Supply natural `title_es`, `title_en`, `summary_es`, and `summary_en`.
- Translate meaning, not word order. Keep program and organization proper names unless an official localized name exists.
- Do not expand eligibility, guarantees, availability, or outcomes during translation.
- Use descriptions for additional public detail only when the source supports it.

## Summaries

- Explain what help is offered and, when relevant, who it is for.
- Prefer one or two concise sentences.
- Synthesize overlapping source fragments into coherent prose. Do not mechanically concatenate sentences with repeated leads such as `Ofrece` or `Provides`.
- Do not put phone numbers, emails, URLs, addresses, or unedited service lists in summaries.
- Put contact data only in its dedicated columns.

## Categories and lists

- Use only category slugs listed in the schema.
- Choose one primary category; use additional categories only when the service materially spans them.
- Encode languages, service methods, keywords, and additional categories using `|`.
- Do not claim Spanish availability merely because Puente ATX translated the listing.

## Service methods and locations

- Use `in_person` when a participant can receive the described service at a physical location.
- Use `phone`, `online`, or `home_visit` only when supported by the source.
- For an in-person service, find and include its confirmed service location whenever reasonably available.
- `in_person` can be valid without one street address when the service is mobile, transportation-based, delivered across multiple schools/clinics/sites, or uses a confidential location. Classify and document that exception explicitly; do not invent one representative address merely to silence an audit warning.
- Do not use an administrative headquarters as a service address unless the source indicates participants can go there.
- When no physical service location exists, leave address, city, ZIP, latitude, and longitude blank.
- Do not infer exact coordinates.

## Area and county

- Public service-area text should name counties, not mixed city/county lists.
- Convert a known city or supported ZIP to its county when reliable.
- Use bilingual formats such as `Condado de Williamson` and `Williamson County`.
- Preserve statewide coverage as `Todos los condados de Texas` / `All Texas counties`.
- Do not claim countywide coverage solely because an office is located in that county.

## Contact and sources

- Prefer the program’s official phone and website.
- Format US phone numbers as `###-###-####` when possible.
- Put the public program page in `website_url`; put the page used to verify facts in `source_url`.
- A publishable resource needs at least one supported contact method or official website, a source, and a real verification date.
- Do not use search-result URLs, tracking URLs, or fabricated email addresses.

## Cost, eligibility, and availability

- Use only accepted cost values.
- Do not mark a service free unless the source says it is free or no-cost.
- Keep unknown cost as `unknown` rather than guessing.
- Preserve qualification language and uncertainty in eligibility, documents, application steps, and schedules.
- When a schedule exists, populate both `hours_es` and `hours_en` with natural translations. Preserve days, times, time zones, appointment requirements, seasonal limits, closures, and exceptions.
- Do not copy prose unchanged between the two schedule fields. Identical values are acceptable only when the content is language-neutral.
- Do not imply that a service is currently available merely because a page exists.

## Review report triggers

Add an item to the review report when:

- the source is not official;
- a translation is materially ambiguous;
- a likely duplicate cannot be resolved;
- service location and headquarters may differ;
- Spanish availability is unknown;
- contact information conflicts across sources;
- an important publish requirement remains empty;
- a record was excluded and needs an explanation.
- a shared-title group remains and needs its legitimate rationale recorded.

## Import update mode

- Recommend **Completar campos vacíos** only when populated existing values must remain untouched.
- Recommend **Actualizar campos incluidos** when the reviewed CSV intentionally corrects populated titles, categories, translations, summaries, or other included fields.
- Before importing, confirm in preview that existing rows resolve to `update` and that only the intended fields appear in the change list.
