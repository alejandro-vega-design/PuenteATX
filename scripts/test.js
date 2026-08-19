import assert from 'assert';
import fs from 'fs';

const store = new Map();
globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
globalThis.window = { addEventListener() {}, removeEventListener() {} };

async function run() {
const saved = await import('../src/services/savedResources.js');
const { demoResources } = await import('../src/data/demoResources.js');
const { createResourceSlug, createUniqueResourceSlug, filterAndSortResources } = await import('../src/data/resourceUtils.js');
const { applyImportVerificationDate, csvTemplate, parseCsv, prepareCsvResources } = await import('../src/data/csvImport.js');
const { getPublishRequirementKeys } = await import('../src/data/resourceValidation.js');
const { parseResourceFilters, serializeResourceFilters } = await import('../src/services/resourceUrl.js');
const { default: conversationHandler } = await import('../api/conversation.js');
const { ANALYTICS_EVENT_NAMES, sanitizeSearchTerm, validateEventPayload } = await import('../src/analytics/events.js');
const { parseInsightFilters, serializeInsightFilters } = await import('../src/analytics/filters.js');
const { MAP_MIN_EVENTS, MAP_MIN_SESSIONS, NO_RESULTS_TERM_MIN_COUNT, metricTrend } = await import('../src/analytics/metrics.js');
const { default: analyticsHandler } = await import('../api/analytics/events.js');
const { distanceMiles, distanceRingsGeojson, hasCoordinates, sortResourcesByDistance } = await import('../src/utils/geo.js');
const { getServiceArea, serviceAreas, supportedCounties } = await import('../src/config/serviceAreas.js');
const { normalizeServiceArea } = await import('../src/data/serviceAreaNormalization.js');

saved.clearSavedResources();
assert.deepStrictEqual(saved.getSavedResources(), [], 'clears saved resources');
saved.saveResource('demo-despensa-puente'); saved.saveResource('demo-despensa-puente');
assert.deepStrictEqual(saved.getSavedResources(), ['demo-despensa-puente'], 'prevents duplicates');
saved.toggleResource('demo-apoyo-renta'); assert.strictEqual(saved.isResourceSaved('demo-apoyo-renta'), true, 'toggles on');
saved.removeResource('demo-despensa-puente'); assert.strictEqual(saved.isResourceSaved('demo-despensa-puente'), false, 'removes resource');
saved.importSharedList(['demo-apoyo-renta', 'demo-clinica-familiar', 'bad slug']); assert.deepStrictEqual(saved.exportSharedList(), ['demo-apoyo-renta', 'demo-clinica-familiar'], 'imports, validates and merges');
store.set('puente-atx:saved-resources:v1', '{bad'); assert.deepStrictEqual(saved.getSavedResources(), ['demo-apoyo-renta', 'demo-clinica-familiar'], 'handles corrupt storage with memory fallback');
assert.deepStrictEqual(saved.parseSharedList('a,a,b,bad slug'), ['a','b'], 'parses and deduplicates shared slugs');

const food = filterAndSortResources(demoResources, { q: 'despensa', categories: [], languages: [], methods: [], costs: [], area: '', recent: false, sort: 'relevance' }, 'es');
assert.strictEqual(food.length, 5, 'searches localized resource text across demo variants');
const online = filterAndSortResources(demoResources, { q: '', categories: [], languages: ['es'], methods: ['online'], costs: ['free'], area: '', recent: false, sort: 'az' }, 'es');
assert.ok(online.length > 0 && online.every(item => item.languages.includes('es') && item.service_methods.includes('online') && item.cost_type === 'free'), 'combines filters');
assert.deepStrictEqual([...online].map(item => item.title_es), [...online].map(item => item.title_es).sort((a,b) => a.localeCompare(b)), 'sorts A-Z');
const countyResources = filterAndSortResources([
  { ...demoResources[0], id: 'travis', county: 'Travis County' },
  { ...demoResources[0], id: 'williamson', county: 'Williamson' }
], { q: '', categories: [], languages: [], methods: [], costs: [], area: 'Williamson', recent: false, sort: 'updated' }, 'es');
assert.deepStrictEqual(countyResources.map(item => item.id), ['williamson'], 'filters resources by a normalized county value');

const filterState = { q: 'salud', categories: ['salud'], languages: ['es'], methods: [], costs: ['free'], area: 'Austin', recent: true, sort: 'az', page: 2 };
assert.deepStrictEqual(parseResourceFilters(`?${serializeResourceFilters(filterState)}`), filterState, 'round-trips URL filters');
assert.strictEqual(new URLSearchParams(serializeResourceFilters({ ...filterState, area: 'Hays' })).get('condado'), 'Hays', 'stores the county filter in a readable URL parameter');
assert.strictEqual(createResourceSlug('Despensa Familiar', 'Centro José'), 'despensa-familiar-centro-jose', 'creates readable slugs without accents');
assert.strictEqual(createUniqueResourceSlug('despensa-familiar', [{ id: '1', slug: 'despensa-familiar' }, { id: '2', slug: 'despensa-familiar-2' }]), 'despensa-familiar-3', 'adds the next available suffix');
assert.strictEqual(createUniqueResourceSlug('despensa-familiar', [{ id: '1', slug: 'despensa-familiar' }], '1'), 'despensa-familiar', 'keeps the current resource slug stable');

const parsedCsv = parseCsv(`organization_name,title_es,title_en,primary_category,summary_es,languages,service_methods
"Centro, Puente",Despensa,,comida,"Primera línea
Segunda línea",es|en,in_person|phone
`);
assert.strictEqual(parsedCsv.records[0].values.organization_name, 'Centro, Puente', 'parses quoted CSV commas');
assert.strictEqual(parsedCsv.records[0].values.summary_es, 'Primera línea\nSegunda línea', 'preserves line breaks inside quoted CSV cells');
const preparedCsv = prepareCsvResources(parsedCsv, [{ slug: 'despensa-centro-puente' }]);
assert.strictEqual(preparedCsv.rows[0].errors.length, 0, 'accepts a valid CSV resource');
assert.strictEqual(preparedCsv.rows[0].resource.status, 'draft', 'imports CSV resources as drafts');
assert.strictEqual(preparedCsv.rows[0].action, 'create', 'classifies an unmatched CSV row as a new resource');
assert.deepStrictEqual(preparedCsv.rows[0].resource.languages, ['es', 'en'], 'parses CSV list values');
assert.notStrictEqual(preparedCsv.rows[0].resource.slug, 'despensa-centro-puente', 'creates a unique CSV resource slug');
const existingCsvResource = {
  id: 'resource-1',
  slug: 'angel-house',
  organization_name: 'Austin Baptist Chapel',
  title_es: 'Comidas calientes y duchas en Angel House',
  title_en: 'Hot Meals and Showers at Angel House',
  primary_category_id: '10000000-0000-4000-8000-000000000001',
  phone: '512-643-2327',
  address_line_1: '',
  city: 'Austin'
};
const updateCsv = prepareCsvResources(parseCsv(`organization_name,title_es,title_en,slug,primary_category,phone,address_line_1,city,state,postal_code
Austin Baptist Chapel,Comidas calientes y duchas en Angel House,Hot Meals and Showers at Angel House,angel-house,comida,512-000-0000,908 E Cesar Chavez St,Austin,TX,78702
`), [existingCsvResource]);
assert.strictEqual(updateCsv.rows[0].action, 'update', 'matches an existing CSV resource by slug');
assert.strictEqual(updateCsv.rows[0].resource.slug, 'angel-house', 'preserves the existing slug');
assert.deepStrictEqual(updateCsv.rows[0].patch, { address_line_1: '908 E Cesar Chavez St', state: 'TX', postal_code: '78702' }, 'fills only empty fields and preserves existing values');
const unchangedCsv = prepareCsvResources(parseCsv(`organization_name,title_es,title_en,slug,primary_category,phone
Austin Baptist Chapel,Comidas calientes y duchas en Angel House,Hot Meals and Showers at Angel House,angel-house,comida,512-000-0000
`), [existingCsvResource]);
assert.strictEqual(unchangedCsv.rows[0].action, 'unchanged', 'does not overwrite a populated field');
const replaceCsv = prepareCsvResources(parseCsv(`organization_name,title_es,title_en,slug,primary_category,summary_es,phone
Austin Baptist Chapel,Comidas calientes y duchas en Angel House,Hot Meals and Showers at Angel House,angel-house,comida,Comidas y duchas gratuitas.,512-000-0000
`), [{ ...existingCsvResource, summary_es: 'Teléfono: 512-643-2327' }], 'included');
assert.deepStrictEqual(replaceCsv.rows[0].patch, { summary_es: 'Comidas y duchas gratuitas.', phone: '512-000-0000' }, 'updates only included non-empty fields when replacement mode is explicit');
const warningCsv = prepareCsvResources(parseCsv(`organization_name,title_es,title_en,slug,primary_category,summary_es
Austin Baptist Chapel,Comidas calientes y duchas en Angel House,Hot Meals and Showers at Angel House,angel-house,comida,Visita https://example.org o llama al 512-643-2327
`), [existingCsvResource], 'included');
assert.ok(warningCsv.rows[0].warnings.includes('summary_url:summary_es') && warningCsv.rows[0].warnings.includes('summary_phone:summary_es'), 'warns when a summary contains contact information');
const invalidCsv = prepareCsvResources(parseCsv('organization_name,title_es,title_en,primary_category\nCentro,Recurso,,categoria-inexistente\n'));
assert.ok(invalidCsv.rows[0].errors.includes('primary_category'), 'rejects unknown CSV category slugs');
assert.ok(csvTemplate().includes('organization_name,title_es,title_en'), 'provides the expected CSV template columns');
assert.strictEqual(parseCsv(csvTemplate()).records.length, 0, 'ignores the instructional row in the downloadable CSV template');
const friendlyCsv = prepareCsvResources(parseCsv(`organization_name,title_es,title_en,primary_category,additional_categories,languages,service_methods,cost_type
Centro de Salud,Apoyo familiar,Family support,Health,Mental Health; Family Support,English; Spanish / interpretation,In-person; Telehealth,Free / low-cost depending on eligibility
`), []);
assert.strictEqual(friendlyCsv.rows[0].errors.length, 0, 'accepts common human-readable CSV labels and semicolon-separated lists');
assert.strictEqual(friendlyCsv.rows[0].resource.primary_category_id, '10000000-0000-4000-8000-000000000003', 'normalizes an English primary-category label');
assert.deepStrictEqual(friendlyCsv.rows[0].resource.additional_category_ids, ['10000000-0000-4000-8000-000000000008'], 'normalizes and deduplicates additional category labels');
assert.deepStrictEqual(friendlyCsv.rows[0].resource.languages, ['es', 'en'], 'normalizes descriptive bilingual availability');
assert.deepStrictEqual(friendlyCsv.rows[0].resource.service_methods, ['in_person', 'online'], 'normalizes descriptive service methods');
assert.strictEqual(friendlyCsv.rows[0].resource.cost_type, 'free', 'normalizes descriptive free-cost values');
const unconfirmedSpanishCsv = prepareCsvResources(parseCsv(`organization_name,title_es,title_en,primary_category,languages,service_methods,cost_type
Centro,Recurso,Resource,Salud,English; Spanish availability should be confirmed,Contact provider,Low-cost
`), []);
assert.deepStrictEqual(unconfirmedSpanishCsv.rows[0].resource.languages, ['en'], 'does not claim Spanish availability when the CSV says it is unconfirmed');
assert.deepStrictEqual(unconfirmedSpanishCsv.rows[0].resource.service_methods, ['phone'], 'normalizes contact-provider service instructions conservatively');
assert.strictEqual(unconfirmedSpanishCsv.rows[0].resource.cost_type, 'paid', 'normalizes explicit low-cost services without marking them free');
assert.deepStrictEqual(normalizeServiceArea({ serviceAreaEs: 'Austin, Georgetown, Condado de Hays', serviceAreaEn: '', city: '', county: '', postalCode: '' }), { es: 'Condado de Travis, Condado de Williamson, Condado de Hays', en: 'Travis County, Williamson County, Hays County', counties: ['Travis', 'Williamson', 'Hays'] }, 'normalizes mixed city and county service areas to county names only');
assert.deepStrictEqual(normalizeServiceArea({ serviceAreaEs: 'Georgetown', serviceAreaEn: 'Georgetown', city: '', county: '', postalCode: '' }).counties, ['Williamson'], 'infers the county from a service-area city');
assert.deepStrictEqual(normalizeServiceArea({ serviceAreaEs: '', serviceAreaEn: '', city: '', county: '', postalCode: '78701' }).counties, ['Travis'], 'uses an approved ZIP as the final county fallback');
assert.deepStrictEqual(normalizeServiceArea({ serviceAreaEs: 'Todo Texas', serviceAreaEn: 'Statewide', city: '', county: '', postalCode: '' }), { es: 'Todos los condados de Texas', en: 'All Texas counties', counties: ['statewide'] }, 'preserves statewide service coverage without listing cities');
assert.equal(applyImportVerificationDate({ last_verified_at: null }, true, '2026-07-27').last_verified_at, '2026-07-27', 'uses the import date when verification is enabled and the CSV date is empty');
assert.equal(applyImportVerificationDate({ last_verified_at: '2026-06-12' }, true, '2026-07-27').last_verified_at, '2026-06-12', 'preserves a verification date supplied by the CSV');
const williamsonCsv = prepareCsvResources(parseCsv(fs.readFileSync(new URL('../docs/williamson-county-resources.csv', import.meta.url), 'utf8')), []);
assert.strictEqual(williamsonCsv.rows.length, 35, 'provides the curated Williamson County bulk-import dataset');
assert.ok(williamsonCsv.rows.every(row => row.errors.length === 0), 'keeps every Williamson County CSV row compatible with the admin importer');
assert.equal(applyImportVerificationDate({ last_verified_at: null }, false, '2026-07-27').last_verified_at, null, 'leaves verification empty when the option is disabled');
const publishable = preparedCsv.rows[0].resource;
assert.deepStrictEqual(getPublishRequirementKeys({ ...publishable, summary_es: 'Resumen', description_es: 'Descripción', phone: '512-555-1212', source_url: 'https://example.org', last_verified_at: '2026-07-27' }), [], 'accepts a complete resource for bulk publishing');
assert.deepStrictEqual(getPublishRequirementKeys(publishable), ['contact', 'source', 'verifiedDate'], 'reports fields missing from an imported draft');

const apiResponse = () => {
  const state = { statusCode: 200, body: null, headers: {} };
  return {
    state,
    setHeader: (key, value) => { state.headers[key] = value; },
    status: code => ({ json: body => { state.statusCode = code; state.body = body; return state; } })
  };
};
process.env.RESEND_API_KEY = 'test-key';
process.env.CONVERSATION_TO_EMAIL = 'private-test@example.com';
const invalidConversation = apiResponse();
await conversationHandler({ method: 'POST', body: { phone: '123' } }, invalidConversation);
assert.strictEqual(invalidConversation.state.statusCode, 400, 'rejects incomplete conversation requests');
const originalFetch = globalThis.fetch;
let emailRequest;
globalThis.fetch = async (url, options) => { emailRequest = { url, options }; return { ok: true }; };
const validConversation = apiResponse();
await conversationHandler({ method: 'POST', body: {
  lang: 'es', name: 'Prueba', contact: 'call', phone: '512-555-1212', day: 'monday', time: 'morning', zip: '78701',
  help: ['10000000-0000-4000-8000-000000000001'], details: 'Mensaje de prueba', consent: true
} }, validConversation);
globalThis.fetch = originalFetch;
assert.strictEqual(validConversation.state.statusCode, 200, 'accepts valid conversation requests');
assert.strictEqual(emailRequest.url, 'https://api.resend.com/emails', 'sends conversation requests through the server email provider');
assert.strictEqual(JSON.parse(emailRequest.options.body).to[0], 'private-test@example.com', 'keeps the recipient in a server-only environment value');
assert.ok(JSON.parse(emailRequest.options.body).text.includes('Código postal: 78701'), 'includes ZIP code in the private conversation email');

const sessionId = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';
const validAnalyticsPayload = {
  event_name: 'search_submitted',
  anonymous_session_id: sessionId,
  language: 'es',
  device_type: 'mobile',
  environment: 'production',
  page_path: '/recursos?private=ignored',
  search_term_normalized: '  Ayuda   Legal ',
  search_result_count: 4,
  area_code: '78701',
  unknown_private_field: 'must be stripped'
};
assert.ok(ANALYTICS_EVENT_NAMES.includes('conversation_requested') && !ANALYTICS_EVENT_NAMES.includes('arbitrary_event'), 'uses a central analytics event allowlist');
const validAnalytics = validateEventPayload(validAnalyticsPayload);
assert.strictEqual(validAnalytics.ok, true, 'accepts a valid analytics event');
assert.strictEqual(validAnalytics.value.search_term_normalized, 'ayuda legal', 'normalizes safe search terms');
assert.strictEqual(validAnalytics.value.page_path, '/recursos', 'removes query parameters from analytics page paths');
assert.strictEqual(validAnalytics.value.unknown_private_field, undefined, 'strips unknown analytics properties');
assert.strictEqual(validateEventPayload({ ...validAnalyticsPayload, event_name: 'arbitrary_event' }).ok, false, 'rejects unlisted analytics events');
assert.strictEqual(validateEventPayload({ ...validAnalyticsPayload, area_code: '99999' }).ok, false, 'rejects unsupported ZIP codes');
assert.strictEqual(sanitizeSearchTerm('person@example.com'), null, 'does not store email search terms');
assert.strictEqual(sanitizeSearchTerm('512-555-1212'), null, 'does not store telephone search terms');
assert.strictEqual(sanitizeSearchTerm('1200 Victory Dr'), null, 'does not store address search terms');
assert.strictEqual(sanitizeSearchTerm('https://example.com/help'), null, 'does not store URL search terms');
assert.strictEqual(sanitizeSearchTerm('á'.repeat(100)).length, 80, 'limits stored search terms to 80 characters');
const insightFilters = { period: '90d', language: 'en', device: 'tablet', environment: 'preview' };
assert.deepStrictEqual(parseInsightFilters(`?${serializeInsightFilters(insightFilters)}`), insightFilters, 'round-trips Insight filters in the URL');
assert.strictEqual(metricTrend(22, 19), null, 'hides trends with a net change below the threshold');
assert.deepStrictEqual(metricTrend(30, 20), { net: 10, percent: 50, direction: 'up', sentiment: 'neutral' }, 'shows material trends with sufficient volume');
assert.deepStrictEqual([MAP_MIN_EVENTS, MAP_MIN_SESSIONS, NO_RESULTS_TERM_MIN_COUNT], [20, 10, 5], 'centralizes privacy thresholds');
assert.ok(serviceAreas.length >= 100 && supportedCounties.includes('Williamson') && supportedCounties.includes('Bastrop') && supportedCounties.includes('Hays') && supportedCounties.includes('Caldwell'), 'supports ZIP centroids across the five-county launch region');
assert.deepStrictEqual(getServiceArea('78626') && [getServiceArea('78626').county, getServiceArea('78626').shortName], ['Williamson', '78626'], 'locates an approved Williamson County ZIP');
const regionalZipMap = JSON.parse(fs.readFileSync(new URL('../public/maps/central-texas-zip-codes.geojson', import.meta.url), 'utf8'));
const regionalMapZipCodes = regionalZipMap.features.map(feature => feature.properties?.zip_code);
assert.strictEqual(regionalZipMap.features.length, serviceAreas.length, 'provides one regional map polygon for every configured service-area ZIP');
assert.deepStrictEqual([...new Set(regionalMapZipCodes)].sort(), serviceAreas.map(area => area.code).sort(), 'keeps regional map polygons synchronized with the approved ZIP configuration');
assert.ok(regionalZipMap.features.every(feature => feature.geometry && ['Polygon', 'MultiPolygon'].includes(feature.geometry.type) && feature.properties?.county), 'provides valid regional polygon features with county metadata');
assert.strictEqual(hasCoordinates({ latitude: null, longitude: null }), false, 'does not interpret null coordinates as zero coordinates');
assert.strictEqual(hasCoordinates({ latitude: 30.2672, longitude: -97.7431 }), true, 'accepts valid resource coordinates');
assert.ok(distanceMiles({ latitude: 30.2672, longitude: -97.7431 }, { latitude: 30.3072, longitude: -97.755 }) > 2, 'calculates Haversine distance in miles');
assert.deepStrictEqual(sortResourcesByDistance([{ id: 'far', latitude: 30.4, longitude: -97.8 }, { id: 'missing', latitude: null, longitude: null }, { id: 'near', latitude: 30.27, longitude: -97.74 }], { latitude: 30.2672, longitude: -97.7431 }).map(item => item.id), ['near', 'far'], 'omits unmapped resources and sorts mapped resources by distance');
const distanceRings = distanceRingsGeojson({ latitude: 30.2672, longitude: -97.7431 });
assert.deepStrictEqual(distanceRings.features.filter(feature => feature.properties.featureType === 'ring').map(feature => feature.geometry.type), ['LineString', 'LineString', 'LineString'], 'builds three explicit map line rings');
assert.deepStrictEqual(distanceRings.features.filter(feature => feature.properties.featureType === 'label').map(feature => feature.properties.label), ['10 mi', '20 mi', '30 mi'], 'builds a visible label for each distance ring');

process.env.SUPABASE_URL = 'https://project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-only-test-key';
process.env.VERCEL_ENV = 'preview';
const invalidAnalyticsResponse = apiResponse();
await analyticsHandler({ method: 'POST', body: { ...validAnalyticsPayload, event_name: 'unknown' } }, invalidAnalyticsResponse);
assert.strictEqual(invalidAnalyticsResponse.state.statusCode, 400, 'analytics endpoint rejects invalid events');
const oversizedAnalyticsResponse = apiResponse();
await analyticsHandler({ method: 'POST', body: { ...validAnalyticsPayload, ignored: 'x'.repeat(9000) } }, oversizedAnalyticsResponse);
assert.strictEqual(oversizedAnalyticsResponse.state.statusCode, 413, 'analytics endpoint rejects oversized payloads');
let analyticsInsert;
globalThis.fetch = async (url, options = {}) => {
  if (url.includes('/resources?')) return { ok: true, json: async () => [{ id: sessionId }] };
  analyticsInsert = { url, options };
  return { ok: true, json: async () => [] };
};
const analyticsResponse = apiResponse();
await analyticsHandler({ method: 'POST', body: validAnalyticsPayload }, analyticsResponse);
globalThis.fetch = originalFetch;
assert.strictEqual(analyticsResponse.state.statusCode, 202, 'analytics endpoint accepts validated product events');
const insertedAnalytics = JSON.parse(analyticsInsert.options.body);
assert.strictEqual(insertedAnalytics.environment, 'preview', 'analytics endpoint determines the environment server-side');
assert.strictEqual(insertedAnalytics.search_term_normalized, 'ayuda legal', 'analytics endpoint stores only sanitized search text');
assert.strictEqual(insertedAnalytics.unknown_private_field, undefined, 'analytics endpoint does not store unknown fields');

const migration = fs.readFileSync(new URL('../supabase/migrations/001_resource_system.sql', import.meta.url), 'utf8');
const hardening = fs.readFileSync(new URL('../supabase/migrations/003_security_hardening.sql', import.meta.url), 'utf8');
const mvpPublishing = fs.readFileSync(new URL('../supabase/migrations/005_mvp_summary_publish_requirement.sql', import.meta.url), 'utf8');
const insightsMigration = fs.readFileSync(new URL('../supabase/migrations/006_insights_mvp.sql', import.meta.url), 'utf8');
const geocodingMigration = fs.readFileSync(new URL('../supabase/migrations/009_resource_geocoding_status.sql', import.meta.url), 'utf8');
const coordinateSeed = fs.readFileSync(new URL('../supabase/migrations/010_seed_reviewed_resource_coordinates.sql', import.meta.url), 'utf8');
const passportSchema = fs.readFileSync(new URL('../supabase/migrations/011_community_passport_schema.sql', import.meta.url), 'utf8');
const passportAccess = fs.readFileSync(new URL('../supabase/migrations/012_community_passport_access.sql', import.meta.url), 'utf8');
const passportWorkflows = fs.readFileSync(new URL('../supabase/migrations/013_community_passport_workflows.sql', import.meta.url), 'utf8');
const passportReadModels = fs.readFileSync(new URL('../supabase/migrations/014_community_passport_read_models.sql', import.meta.url), 'utf8');
const passportPilotOrganizations = fs.readFileSync(new URL('../supabase/migrations/015_community_passport_pilot_organizations.sql', import.meta.url), 'utf8');
const permanentResourceDeletion = fs.readFileSync(new URL('../supabase/migrations/017_admin_permanent_resource_deletion.sql', import.meta.url), 'utf8');
assert.ok(migration.includes('enable row level security'), 'enables RLS');
assert.ok(migration.includes("status = 'published'"), 'limits anonymous resource reads to published');
assert.ok(!migration.includes('for insert to anon') && !migration.includes('for update to anon'), 'does not grant anonymous writes');
assert.ok(hardening.includes('revoke select on public.resources from anon'), 'removes broad anonymous resource reads');
assert.ok(!hardening.match(/grant select[\s\S]*verification_notes[\s\S]*to anon/), 'does not expose internal verification notes');
assert.ok(mvpPublishing.includes("btrim(summary_es) <> '' or btrim(summary_en) <> ''"), 'keeps a localized summary required for MVP publishing');
assert.ok(!mvpPublishing.includes('btrim(description_es)'), 'does not require a long description for MVP publishing');
assert.ok(insightsMigration.includes('alter table public.analytics_events force row level security'), 'forces RLS on analytics events');
assert.ok(insightsMigration.includes('revoke all on public.analytics_events from public, anon, authenticated'), 'prevents direct public analytics access and writes');
assert.ok(insightsMigration.includes('if not public.can_view_insights()'), 'checks admin Insights permission inside the aggregate RPC');
assert.ok(insightsMigration.includes('event_count >= 20 and session_count >= 10'), 'suppresses low-volume ZIP counts server-side');
assert.ok(insightsMigration.includes('where occurrences >= 5'), 'suppresses low-volume no-result terms server-side');
assert.ok(!insightsMigration.includes('grant select on public.analytics_events to anon'), 'does not grant anonymous event reads');
assert.ok(geocodingMigration.includes('geocoded_at timestamptz') && geocodingMigration.includes('geocode_status text'), 'adds one-time resource geocoding workflow fields');
assert.ok(geocodingMigration.includes("'needs_review'") && geocodingMigration.includes("'not_applicable'"), 'distinguishes missing physical locations from remote-only resources');
assert.ok(coordinateSeed.includes('U.S. Census Bureau Geocoder') && coordinateSeed.includes("geocode_status = 'success'"), 'seeds only documented, reviewed one-time resource coordinates');
assert.ok(passportSchema.includes('create table public.organizations') && passportSchema.includes('create table public.organization_users'), 'adds organization-scoped Community Passport membership');
assert.ok(passportSchema.includes('create table public.people') && passportSchema.includes('owning_organization_id'), 'assigns every participant to an owning organization');
assert.ok(passportSchema.includes('create table public.passports') && passportSchema.includes('create table public.referrals'), 'adds Passport and closed-loop referral records');
assert.ok(passportSchema.includes('force row level security') && passportSchema.includes('revoke all on public.organizations'), 'forces RLS and starts Community Passport tables without public privileges');
assert.ok(permanentResourceDeletion.includes('security definer') && permanentResourceDeletion.includes("current_admin_role() is distinct from 'admin'"), 'limits permanent resource deletion to administrators');
assert.ok(permanentResourceDeletion.includes('revoke all on function public.delete_resource_permanently(uuid) from public, anon'), 'prevents anonymous permanent resource deletion');
assert.ok(permanentResourceDeletion.includes('delete from public.resources where id = p_resource_id'), 'permanently deletes the selected resource through the protected database function');
assert.ok(passportSchema.includes("allowed_fields <@ array[") && passportSchema.includes("'need_summary'"), 'constrains consent fields to a database allowlist');
assert.ok(!passportSchema.match(/^\s*(ssn|diagnosis|medical_history|immigration_status|insurance_information)\s+/im), 'does not add prohibited sensitive fields');
assert.ok(passportAccess.includes("auth.jwt() ->> 'aal' = 'aal2'"), 'requires an MFA-authenticated JWT for Community Passport data');
assert.ok(passportAccess.includes('origin members read people') && !passportAccess.includes('destination members read people'), 'does not grant destination organizations direct participant-row access');
assert.ok(passportAccess.includes('Sensitive workflow tables have no direct INSERT/UPDATE/DELETE grants'), 'routes sensitive writes through validated transactional functions');
assert.ok(passportWorkflows.includes('get_passport_referral_detail') && passportWorkflows.includes("'phone' = any(v_consent.allowed_fields)"), 'projects destination participant fields from active consent');
assert.ok(passportWorkflows.includes('invalid_status_transition') && passportWorkflows.includes('for update'), 'locks referrals and rejects invalid status transitions');
assert.ok(passportWorkflows.includes('write_community_audit') && passportWorkflows.includes('referral_completed'), 'writes audit events as part of closed-loop workflows');
assert.ok(passportWorkflows.includes('revoke_passport_consent') && passportWorkflows.includes("set status = 'revoked'"), 'supports consent revocation');
assert.ok(passportReadModels.includes('perform public.require_community_mfa()'), 'requires MFA inside Community Passport read models');
assert.ok(passportReadModels.includes("'preferred_name' = any(c.allowed_fields)") && passportReadModels.includes("'first_name' = any(c.allowed_fields)"), 'applies consent fields to recipient referral labels');
assert.ok(!passportReadModels.includes('select * from public.people'), 'does not expose unfiltered participant rows from read models');
assert.ok(passportPilotOrganizations.includes("('Puente ATX', 'puente-atx'") && passportPilotOrganizations.includes("('ALAS Texas', 'alas-texas'") && passportPilotOrganizations.includes("('A2 Toques Foundation', 'a2-toques-foundation'"), 'seeds only the three approved pilot organizations');
const vercel = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
assert.strictEqual(vercel.cleanUrls, true, 'enables clean prerendered URLs');
assert.deepStrictEqual(vercel.rewrites, [{ source: '/(.*)', destination: '/' }], 'rewrites direct History API route loads to the clean SPA entry point');
const sourceRoot = new URL('../src/', import.meta.url);
const sourceFiles = [];
const walk = (directory, prefix = '') => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => entry.isDirectory() ? walk(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`) : /\.(js|jsx)$/.test(entry.name) && sourceFiles.push(`${prefix}${entry.name}`));
walk(sourceRoot);
for (const name of sourceFiles) assert.ok(!fs.readFileSync(new URL(name, sourceRoot), 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'), `service role absent from ${name}`);

console.log('✓ saved-resource, analytics, privacy, URL and security tests passed');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
