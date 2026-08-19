# Counseling Resources — import review

Prepared: 2026-08-11

## Result

- Source entries: 6
- CSV rows: 6
- Importer errors: 0
- Importer warnings: 0
- Quality warnings: 0
- Bilingual titles and summaries: complete
- Primary category: `salud`

## Existing records intentionally updated by slug

- Capital Area Counseling — `capital-area-counseling-affordable-counseling-services`
- Samaritan Center — `samaritan-center-mental-health-and-wellness-services`
- Austin Child Guidance Center — `austin-child-guidance-center-child-and-family-therapy`

The remaining rows are intended as new resources. YWCA Greater Austin already has a different youth-program record; the counseling service is intentionally separate.

## Material source corrections

- Austin Bilingual Therapy: the source document listed `512-357-7414`; the current official page lists `512-264-5558`, which is used in the CSV.
- OutYouth: the source document described an older counseling model and a `$0–10` fee. The CSV uses current official language about support groups, family guidance, counseling availability, and language access instead.
- YWCA Greater Austin: no counseling address was included because current official pages conflict about the physical service location. The record is conservatively marked as phone/online.
- Exact fees and appointment availability can change. Users should confirm them directly with each provider.

## Duplicate note

Supabase currently also contains another Austin Child Guidance Center record and another Samaritan Center record with related services. This CSV targets the closest canonical records and does not delete or merge the additional records.

## Import recommendation

Use the normal admin CSV import preview and confirm that the three supplied slugs appear as updates before completing the import. New or updated resources should still be reviewed before publication.
