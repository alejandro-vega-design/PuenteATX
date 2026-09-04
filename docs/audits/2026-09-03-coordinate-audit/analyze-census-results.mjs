import fs from 'node:fs';

const [candidatePath, censusPath, reportPath, operationsPath, summaryPath] = process.argv.slice(2);
if (!candidatePath || !censusPath || !reportPath || !operationsPath || !summaryPath) {
  throw new Error('Usage: analyze-census-results.mjs <candidates.json> <census.csv> <report.csv> <operations.json> <summary.json>');
}

const candidates = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
const clean = value => String(value ?? '').trim();
const csv = value => `"${clean(value).replaceAll('"', '""')}"`;
const fold = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const streetNumber = value => clean(value).match(/^\s*(\d+[A-Za-z]?)/)?.[1]?.toUpperCase() || '';
const inFinderBounds = (latitude, longitude) => latitude >= 29 && latitude <= 31.2 && longitude >= -98.55 && longitude <= -96.38;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows.filter(rowValues => rowValues.some(clean));
}

const censusRows = parseCsv(fs.readFileSync(censusPath, 'utf8'));
const censusById = new Map(censusRows.map(row => [clean(row[0]), row]));
if (censusById.size !== censusRows.length) throw new Error('Duplicate Census lookup IDs.');

const auditedAt = '2026-09-03T00:00:00-05:00';
const findings = candidates.map(candidate => {
  const row = censusById.get(candidate.lookup_id);
  const censusStatus = clean(row?.[2]);
  const matchType = clean(row?.[3]);
  const matchedAddress = clean(row?.[4]);
  const [longitudeText = '', latitudeText = ''] = clean(row?.[5]).split(',');
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  const returnedLocation = matchedAddress.match(/,\s*([^,]+),\s*([A-Z]{2}),\s*(\d{5})(?:-\d{4})?$/i);
  const returnedCity = clean(returnedLocation?.[1]);
  const returnedState = clean(returnedLocation?.[2]);
  const returnedZip = clean(returnedLocation?.[3]);
  const returnedStreet = returnedLocation ? matchedAddress.slice(0, returnedLocation.index).trim() : matchedAddress;
  const reasons = [];
  let classification = candidate.preflight;

  if (candidate.preflight === 'ready') {
    if (!row) { classification = 'unresolved'; reasons.push('missing_geocoder_response'); }
    else if (censusStatus === 'Tie') { classification = 'needs_review'; reasons.push('multiple_geocoder_candidates'); }
    else if (censusStatus !== 'Match') { classification = 'unresolved'; reasons.push('no_geocoder_match'); }
    else if (matchType !== 'Exact') { classification = 'needs_review'; reasons.push('non_exact_match'); }
    else {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) reasons.push('invalid_returned_coordinates');
      if (!inFinderBounds(latitude, longitude)) reasons.push('outside_resource_finder_bounds');
      const queryNumber = streetNumber(candidate.query.street);
      const returnedNumber = streetNumber(returnedStreet);
      if (!queryNumber || queryNumber !== returnedNumber) reasons.push('street_number_mismatch');
      if (candidate.query.city && fold(candidate.query.city) !== fold(returnedCity)) reasons.push('city_mismatch');
      if (candidate.query.state && fold(candidate.query.state) !== fold(returnedState)) reasons.push('state_mismatch');
      if (candidate.query.postal_code && candidate.query.postal_code !== returnedZip) reasons.push('zip_mismatch');
      classification = reasons.length ? 'needs_review' : 'exact';
    }
  } else reasons.push(candidate.preflight_reason);

  return {
    ...candidate,
    provider: 'U.S. Census Bureau Geocoder',
    lookup_date: '2026-09-03',
    census_status: censusStatus,
    match_type: matchType,
    matched_address: matchedAddress,
    returned_city: returnedCity,
    returned_state: returnedState,
    returned_zip: returnedZip,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    classification,
    reasons
  };
});

const exact = findings.filter(finding => finding.classification === 'exact');
const operations = exact.map(finding => ({
  canonical_id: finding.resource_id,
  expected_canonical_status: finding.status,
  expected_archive_status: finding.status,
  patch: {
    latitude: finding.latitude,
    longitude: finding.longitude,
    geocoded_at: auditedAt,
    geocode_status: 'success'
  },
  archive_ids: []
}));

const headings = [
  'lookup_id', 'resource_id', 'slug', 'status', 'organization_name', 'title_en',
  'original_address', 'query_street', 'query_city', 'query_state', 'query_zip',
  'provider', 'lookup_date', 'census_status', 'match_type', 'matched_address',
  'latitude', 'longitude', 'classification', 'reasons'
];
const rows = findings.map(finding => [
  finding.lookup_id, finding.resource_id, finding.slug, finding.status,
  finding.organization_name, finding.title_en, finding.original_address,
  finding.query.street, finding.query.city, finding.query.state,
  finding.query.postal_code, finding.provider, finding.lookup_date,
  finding.census_status, finding.match_type, finding.matched_address,
  finding.latitude ?? '', finding.longitude ?? '', finding.classification,
  finding.reasons.join('|')
]);
fs.writeFileSync(reportPath, `${[headings, ...rows].map(row => row.map(csv).join(',')).join('\n')}\n`);
fs.writeFileSync(operationsPath, `${JSON.stringify(operations, null, 2)}\n`);

const byStatus = status => ({
  published: findings.filter(finding => finding.classification === status && finding.status === 'published').length,
  draft: findings.filter(finding => finding.classification === status && finding.status === 'draft').length
});
const summary = {
  audit_date: '2026-09-03',
  provider: 'U.S. Census Bureau Geocoder',
  total_resources_reviewed: candidates.length,
  exact: { total: exact.length, ...byStatus('exact') },
  needs_review: { total: findings.filter(finding => finding.classification === 'needs_review').length, ...byStatus('needs_review') },
  unresolved: { total: findings.filter(finding => finding.classification === 'unresolved').length, ...byStatus('unresolved') },
  proposed_operations: operations.length,
  production_modified: false
};
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
