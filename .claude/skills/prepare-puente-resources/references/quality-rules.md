# Puente ATX resource quality rules

Read the live importer first. These rules supplement it and resolve recurring data-quality issues.

## Identity and duplicates

- Represent a distinct public service or program as a resource.
- Keep the official organization in `organization_name` and the service/program name in localized titles.
- Keep titles concise and independent from the organization name. Do not produce `Servicio — Organización`, `Organización — Servicio`, or a title equal to the organization when the interface already renders `organization_name` beneath it.
- Use the actual official program name when one exists; otherwise use a short, user-facing service label such as `Asistencia legal`, `Atención veterinaria`, or `Despensa de alimentos`.
- Make titles understandable without reading the summary. Include the essential service subject or population whenever a generic label could refer to materially different needs. For violence-response resources, specify the supported context: use `Apoyo para sobrevivientes de violencia y agresión sexual` / `Support for survivors of violence and sexual assault`, not the ambiguous `Apoyo para sobrevivientes` / `Survivor support`.
- Preserve a known existing slug. Do not create a second slug for an update.
- Flag ambiguous organization/title matches and repeated records in the same document.
- Audit exact normalized title groups across the complete batch and, when available, across existing resources in the same status. Do not review rows in isolation.
- Classify shared titles before changing them:
  - **Legitimate repetition:** equivalent service types from different organizations or distinct locations, such as food pantries or home-health providers. Keep the accurate shared label.
  - **Title/content mismatch:** the title conflicts with the service evidence, such as pet food labeled as groceries for people or senior-care navigation labeled as adult education. Retitle and repair contaminated summaries.
  - **Ambiguous title:** the title omits essential context supplied by verified evidence. Add the missing subject or population without adding the organization.
  - **True duplicate:** contact details, official identity, program description, and coverage show that two rows represent one service. Consolidate verified complementary fields into a canonical record and archive the duplicate; do not fabricate distinct titles.
- Treat spelling variants, county-split imports, and an organization/program name appearing once as the organization and once as the title as duplicate signals, not proof. Preserve separate programs and separate physical locations when they deliver distinct services.
- After correction, rerun the audit and document every remaining shared-title group with its legitimate rationale.

## Classification integrity

- Classify from immutable source text and verified official program information. Never use a title, summary, category, or translation generated during a previous enrichment pass as new classification evidence.
- Make transformation scripts idempotent. Run them twice during validation and confirm that the second run produces no changes.
- Do not choose the first matching keyword blindly. Review all plausible matches and select the service that best represents the row's actual purpose.
- Give domain-specific evidence priority over incidental language: veterinary over human dental for animal clinics; legal help over housing for legal programs; Lifeline over generic family support for phone-benefit providers; adult education over employment for education programs; survivor support over housing when shelter is part of a violence-response service.
- When one organization has distinct programs, keep one row per program and use the service/program title—not the organization name—to distinguish them.

## Bilingual content

- Supply natural `title_es`, `title_en`, `summary_es`, and `summary_en`.
- Translate meaning, not word order. Keep program and organization proper names unless an official localized name exists.
- Do not expand eligibility, guarantees, availability, or outcomes during translation.
- Use descriptions for additional public detail only when the source supports it.

## Summaries

- Explain what help is offered and, when relevant, who it is for.
- Prefer one or two concise sentences.
- After merging duplicates or overlapping services, rewrite the result as one coherent summary. Do not concatenate source or generated summaries sentence by sentence.
- Remove repeated openings, duplicated claims, and abrupt topic changes. A pattern such as `Ofrece... Ofrece...` or `Provides... Provides...` is a review failure, not a finished summary.
- Retain only facts supported by the immutable input or a current authoritative source. Do not let a duplicate contribute an unverified service claim to the canonical record.
- Do not put phone numbers, emails, URLs, addresses, or unedited service lists in summaries.
- Put contact data only in its dedicated columns.

## Categories and lists

- Use only category slugs present in the live `categories.js`.
- Choose one primary category; use existing additional categories only when the service materially spans them.
- Encode `languages`, `service_methods`, keywords, and additional categories using the delimiter accepted by the live importer.
- Do not claim Spanish availability merely because Puente ATX translated the listing.

## Service methods and locations

- Use `in_person` when a participant can receive the described service at a physical location.
- Use `phone`, `online`, or `home_visit` only when supported by the source.
- For an in-person service, find and include its confirmed service location whenever reasonably available.
- `in_person` can be valid without one street address when the service is mobile, transportation-based, delivered across multiple schools/clinics/sites, or uses a confidential location. Classify and document that exception explicitly; do not invent one representative address merely to silence an audit warning.
- Do not use an administrative headquarters as a service address unless the source indicates participants can go there.
- When no physical service location exists, leave address, city, ZIP, latitude, and longitude blank.
- Do not infer exact coordinates. Document approved geocoding separately.

## Area and county

- Public service-area text should name counties, not mixed city/county lists.
- Convert a known city or supported ZIP to its county using the project’s live normalizer.
- Use bilingual formats such as `Condado de Williamson` and `Williamson County`.
- Preserve statewide coverage as the project’s normalized statewide value.
- Do not claim countywide coverage solely because an office is located in that county.

## Contact and sources

- Prefer the program’s official phone and website.
- Format US phone numbers as `###-###-####` when possible.
- Put the public program page in `website_url`; put the page used to verify facts in `source_url`.
- A publishable resource needs at least one supported contact method or official website, a source, and a real verification date.
- Do not use search-result URLs, tracking URLs, or fabricated email addresses.

## Cost, eligibility, and availability

- Use only cost values accepted by the live importer.
- Do not mark a service free unless the source says it is free or no-cost.
- Keep unknown cost as `unknown` rather than guessing.
- Preserve qualification language and uncertainty in eligibility, documents, application steps, and schedules.
- When a schedule is available, write a natural Spanish version in `hours_es` and an English version in `hours_en`. Preserve all days, times, time zones, appointment requirements, seasonal limits, closures, and exceptions.
- Do not leave only one schedule language populated. Do not copy identical prose into both schedule fields; identical values are acceptable only when the content is language-neutral, such as digits or universally understood abbreviations.
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
