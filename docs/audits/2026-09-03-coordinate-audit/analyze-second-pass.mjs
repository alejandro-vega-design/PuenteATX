import fs from 'node:fs';

const [resourcesPath, evidencePath, nominatimPath, reportPath, operationsPath, summaryPath] = process.argv.slice(2);
if (!resourcesPath || !evidencePath || !nominatimPath || !reportPath || !operationsPath || !summaryPath) {
  throw new Error('Usage: analyze-second-pass.mjs <resources.json> <official-evidence.json> <nominatim.json> <report.csv> <operations.json> <summary.json>');
}

const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const nominatim = JSON.parse(fs.readFileSync(nominatimPath, 'utf8'));
const resourceById = new Map(resources.map(resource => [resource.id, resource]));
const nominatimById = new Map(nominatim.map(result => [result.resource_id, result]));
const clean = value => String(value ?? '').trim();
const fold = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const digits = value => clean(value).match(/\b\d+[A-Za-z]?\b/)?.[0].replace(/\D/g, '') || '';
const csv = value => `"${clean(value).replaceAll('"', '""')}"`;
const bounds = (lat, lon) => lat >= 29 && lat <= 31.2 && lon >= -98.55 && lon <= -96.38;
const cityFrom = address => clean(address.city || address.town || address.village || address.municipality || address.hamlet);
const directions = value => new Set(fold(value).split(' ').filter(token => ['N', 'S', 'E', 'W'].includes(token)));
const differentDirection = (left, right) => {
  const a = directions(left); const b = directions(right);
  return a.size && b.size && [...a].some(direction => !b.has(direction));
};

const findings = evidence.map(item => {
  const resource = resourceById.get(item.resource_id);
  const osm = nominatimById.get(item.resource_id);
  if (!resource || !osm) throw new Error(`Missing second-pass input for ${item.resource_id}`);
  const officialStrong = item.source_contains_street_number && item.source_contains_city && item.source_contains_zip;
  const storedNumber = digits(resource.address_line_1);
  const compatible = osm.candidates.filter(candidate => {
    const address = candidate.address || {};
    const latitude = Number(candidate.lat); const longitude = Number(candidate.lon);
    const houseNumber = digits(address.house_number || candidate.display_name);
    const cityMatches = !clean(resource.city) || fold(cityFrom(address)) === fold(resource.city);
    const zipMatches = !clean(resource.postal_code) || clean(address.postcode).slice(0, 5) === clean(resource.postal_code).slice(0, 5);
    return storedNumber && houseNumber === storedNumber && cityMatches && zipMatches && bounds(latitude, longitude)
      && !['road', 'city', 'county', 'state', 'postcode'].includes(clean(candidate.addresstype));
  });
  const uniqueOsm = compatible.length === 1 ? compatible[0] : null;

  const censusCoordinates = { latitude: Number(item.census_latitude), longitude: Number(item.census_longitude) };
  const censusLocation = clean(item.census_address).match(/^(.*),\s*([^,]+),\s*TX,\s*(\d{5})$/i);
  const censusStreet = clean(censusLocation?.[1]);
  const censusCity = clean(censusLocation?.[2]);
  const censusZip = clean(censusLocation?.[3]);
  const safeCensusNonExact = item.census_status === 'Match' && item.census_match_type === 'Non_Exact'
    && storedNumber && digits(censusStreet) === storedNumber
    && fold(censusCity) === fold(resource.city)
    && (!clean(resource.postal_code) || censusZip === clean(resource.postal_code).slice(0, 5))
    && !differentDirection(resource.address_line_1, censusStreet)
    && bounds(censusCoordinates.latitude, censusCoordinates.longitude);

  let classification = 'manual_review';
  let selected = null;
  let provider = '';
  let rationale = '';
  if (!officialStrong) rationale = 'official_page_did_not_expose_complete_address';
  else if (safeCensusNonExact) {
    classification = 'approved_non_exact'; selected = censusCoordinates;
    provider = 'U.S. Census Bureau Geocoder'; rationale = 'official_address_confirmed_and_census_difference_is_harmless_standardization';
  } else if (uniqueOsm) {
    classification = 'approved_secondary'; selected = { latitude: Number(uniqueOsm.lat), longitude: Number(uniqueOsm.lon) };
    provider = 'OpenStreetMap Nominatim'; rationale = 'official_address_confirmed_and_one_compatible_number_city_zip_candidate';
  } else if (compatible.length > 1) rationale = 'multiple_compatible_secondary_candidates';
  else if (item.census_status === 'Tie') rationale = 'census_tie_without_unique_verified_secondary_candidate';
  else if (item.census_status === 'No_Match') rationale = 'no_geocoder_candidate_confirmed';
  else rationale = 'material_census_discrepancy_or_no_compatible_secondary_candidate';

  return {
    ...item,
    stored_city: resource.city,
    stored_zip: resource.postal_code,
    official_evidence: officialStrong ? 'complete' : item.fetch_status === 'ok' ? 'partial' : 'unavailable',
    nominatim_candidates: osm.candidates.length,
    compatible_nominatim_candidates: compatible.length,
    classification,
    selected_provider: provider,
    selected_latitude: selected?.latitude ?? '',
    selected_longitude: selected?.longitude ?? '',
    rationale
  };
});

const approved = findings.filter(finding => finding.classification.startsWith('approved_'));
const timestamp = '2026-09-03T00:00:00-05:00';
const operations = approved.map(finding => ({
  canonical_id: finding.resource_id,
  expected_canonical_status: finding.status,
  expected_archive_status: finding.status,
  patch: {
    latitude: finding.selected_latitude,
    longitude: finding.selected_longitude,
    geocoded_at: timestamp,
    geocode_status: 'success'
  },
  archive_ids: []
}));

const headings = ['resource_id', 'status', 'organization_name', 'title_en', 'stored_address', 'verification_url', 'official_evidence', 'census_status', 'census_match_type', 'census_address', 'nominatim_candidates', 'compatible_nominatim_candidates', 'classification', 'selected_provider', 'selected_latitude', 'selected_longitude', 'rationale'];
const rows = findings.map(finding => headings.map(key => finding[key] ?? ''));
fs.writeFileSync(reportPath, `${[headings, ...rows].map(row => row.map(csv).join(',')).join('\n')}\n`);
fs.writeFileSync(operationsPath, `${JSON.stringify(operations, null, 2)}\n`);
const summary = {
  reviewed: findings.length,
  official_complete: findings.filter(finding => finding.official_evidence === 'complete').length,
  approved_non_exact: findings.filter(finding => finding.classification === 'approved_non_exact').length,
  approved_secondary: findings.filter(finding => finding.classification === 'approved_secondary').length,
  proposed_operations: operations.length,
  remaining_manual_review: findings.filter(finding => finding.classification === 'manual_review').length,
  production_modified_in_second_pass: false
};
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
