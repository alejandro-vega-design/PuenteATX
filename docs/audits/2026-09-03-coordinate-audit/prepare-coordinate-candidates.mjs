import fs from 'node:fs';

const [inputPath, candidatePath, batchPath, preflightPath] = process.argv.slice(2);
if (!inputPath || !candidatePath || !batchPath || !preflightPath) {
  throw new Error('Usage: prepare-coordinate-candidates.mjs <resources.json> <candidates.json> <census-batch.csv> <preflight.csv>');
}

const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(resources)) throw new Error('Expected a resource array.');

const clean = value => String(value ?? '').trim();
const csv = value => `"${clean(value).replaceAll('"', '""')}"`;
const validCoordinates = resource => {
  const latitude = Number(resource.latitude);
  const longitude = Number(resource.longitude);
  return clean(resource.latitude) && clean(resource.longitude)
    && Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= 25 && latitude <= 37 && longitude >= -107 && longitude <= -93;
};
const variableLocation = value => /^(?:no hay oficina unica|sede en\b|\d+\s+centros?\b|operates clinics?\b)/i
  .test(clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
const queryCities = [
  'New Braunfels', 'Round Mountain', 'Round Rock', 'Cedar Park', 'Cedar Creek',
  'Marble Falls', 'San Marcos', 'Del Valle', 'Jonestown', 'Pflugerville',
  'Schulenburg', 'Georgetown', 'Smithville', 'Red Rock', 'La Grange', 'LaGrange',
  'Lockhart', 'Creedmoor', 'Lago Vista', 'Manchaca', 'Lakeway', 'Taylor',
  'Gonzales', 'Giddings', 'Killeen', 'Edinburg', 'Leander', 'Bastrop',
  'Elgin', 'Manor', 'Burnet', 'Austin', 'Paige'
].sort((left, right) => right.length - left.length);
const citySuffixPattern = new RegExp(`^(.*?)\\s+(${queryCities.map(city => city.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')})[,]?\\s+(TX)\\s*(\\d{5})?$`, 'i');

const targets = resources.filter(resource => ['published', 'draft'].includes(resource.status)
  && clean(resource.address_line_1) && !validCoordinates(resource));

const candidates = targets.map((resource, index) => {
  let street = clean(resource.address_line_1);
  let city = clean(resource.city);
  let state = clean(resource.state) || 'TX';
  let postalCode = clean(resource.postal_code).match(/^\d{5}/)?.[0] || '';

  // Normalize only the geocoder query. Preserve the stored/display address.
  street = street.replace(/\s*\((?:enter|use|door|entrance|building|inside|at)\b[^)]*\)\s*$/i, '').trim();
  const embedded = street.match(citySuffixPattern);
  if (embedded && (!city || !postalCode)) {
    street = embedded[1].trim().replace(/,$/, '');
    if (!city) city = embedded[2].trim();
    state = embedded[3].toUpperCase();
    if (!postalCode && embedded[4]) postalCode = embedded[4];
  }

  const methods = Array.isArray(resource.service_methods) ? resource.service_methods : [];
  let preflight = 'ready';
  let reason = '';
  if (!methods.includes('in_person')) {
    preflight = 'needs_review';
    reason = 'address_without_in_person';
  } else if (/\bP\.?\s*O\.?\s* Box\b|\bPMB\b/i.test(street)) {
    preflight = 'unresolved';
    reason = 'postal_address_not_service_marker';
  } else if (variableLocation(resource.address_line_1)) {
    preflight = 'unresolved';
    reason = 'variable_or_non_specific_location';
  } else if (!street || !state || (!city && !postalCode)) {
    preflight = 'needs_review';
    reason = 'insufficient_address_components';
  }

  return {
    lookup_id: String(index + 1),
    resource_id: resource.id,
    slug: resource.slug,
    status: resource.status,
    organization_name: resource.organization_name,
    title_es: resource.title_es,
    title_en: resource.title_en,
    original_address: [resource.address_line_1, resource.address_line_2, resource.city, resource.state, resource.postal_code].map(clean).filter(Boolean).join(', '),
    query: { street, city, state, postal_code: postalCode },
    preflight,
    preflight_reason: reason,
    current_geocode_status: resource.geocode_status,
    current_latitude: resource.latitude,
    current_longitude: resource.longitude
  };
});

const ready = candidates.filter(candidate => candidate.preflight === 'ready');
fs.writeFileSync(candidatePath, `${JSON.stringify(candidates, null, 2)}\n`);
fs.writeFileSync(batchPath, `${ready.map(candidate => [candidate.lookup_id, candidate.query.street, candidate.query.city, candidate.query.state, candidate.query.postal_code].map(csv).join(',')).join('\n')}\n`);
const headings = ['lookup_id', 'resource_id', 'status', 'organization_name', 'title_en', 'original_address', 'query_street', 'query_city', 'query_state', 'query_zip', 'preflight', 'reason'];
const rows = candidates.map(candidate => [candidate.lookup_id, candidate.resource_id, candidate.status, candidate.organization_name, candidate.title_en, candidate.original_address, candidate.query.street, candidate.query.city, candidate.query.state, candidate.query.postal_code, candidate.preflight, candidate.preflight_reason]);
fs.writeFileSync(preflightPath, `${[headings, ...rows].map(row => row.map(csv).join(',')).join('\n')}\n`);

console.log(JSON.stringify({
  resources: resources.length,
  candidates: candidates.length,
  ready: ready.length,
  needs_review: candidates.filter(candidate => candidate.preflight === 'needs_review').length,
  unresolved: candidates.filter(candidate => candidate.preflight === 'unresolved').length,
  published: candidates.filter(candidate => candidate.status === 'published').length,
  draft: candidates.filter(candidate => candidate.status === 'draft').length
}, null, 2));
