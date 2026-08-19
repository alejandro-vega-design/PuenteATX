# Puente ATX resource quality rules

## Identity and duplicates

- Represent a distinct public service or program as a resource.
- Keep the official organization in `organization_name` and the service/program name in localized titles.
- Preserve a known existing slug. Do not create a second slug for an update.
- Flag ambiguous organization/title matches and repeated records in the same document.

## Bilingual content

- Supply natural `title_es`, `title_en`, `summary_es`, and `summary_en`.
- Translate meaning, not word order. Keep program and organization proper names unless an official localized name exists.
- Do not expand eligibility, guarantees, availability, or outcomes during translation.
- Use descriptions for additional public detail only when the source supports it.

## Summaries

- Explain what help is offered and, when relevant, who it is for.
- Prefer one or two concise sentences.
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
