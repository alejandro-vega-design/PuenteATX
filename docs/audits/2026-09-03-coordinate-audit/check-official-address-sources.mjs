import fs from 'node:fs';

const [resourcesPath, auditCsvPath, outputPath] = process.argv.slice(2);
if (!resourcesPath || !auditCsvPath || !outputPath) {
  throw new Error('Usage: check-official-address-sources.mjs <resources.json> <coordinate-audit.csv> <output.json>');
}

const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
const clean = value => String(value ?? '').trim();
const fold = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

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
  const [headers, ...values] = rows.filter(item => item.some(clean));
  return values.map(item => Object.fromEntries(headers.map((header, index) => [header, item[index] ?? ''])));
}

const audit = parseCsv(fs.readFileSync(auditCsvPath, 'utf8'));
const byId = new Map(resources.map(resource => [resource.id, resource]));
const targets = audit.filter(row => row.classification !== 'exact'
  && !/variable_or_non_specific_location|insufficient_address_components/.test(row.reasons));

const preferredUrl = resource => {
  const source = clean(resource.source_url);
  const website = clean(resource.website_url);
  if (source && !/\bpuenteatx\.org\b/i.test(source)) return source;
  return website || source;
};
const decode = value => value
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;|&#34;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

async function inspect(row) {
  const resource = byId.get(row.resource_id);
  if (!resource) return { resource_id: row.resource_id, error: 'resource_missing' };
  const url = preferredUrl(resource);
  const base = {
    resource_id: resource.id,
    status: resource.status,
    organization_name: resource.organization_name,
    title_en: resource.title_en,
    stored_address: [resource.address_line_1, resource.address_line_2, resource.city, resource.state, resource.postal_code].map(clean).filter(Boolean).join(', '),
    census_status: row.census_status,
    census_match_type: row.match_type,
    census_address: row.matched_address,
    census_latitude: row.latitude,
    census_longitude: row.longitude,
    first_pass_reasons: row.reasons,
    verification_url: url,
    checked_at: '2026-09-03'
  };
  if (!url) return { ...base, fetch_status: 'missing_url' };
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'PuenteATX-Resource-Audit/1.0' }
    });
    const contentType = response.headers.get('content-type') || '';
    const raw = await response.text();
    const text = /html|text|json/i.test(contentType) ? decode(raw) : '';
    const folded = fold(text);
    const number = clean(resource.address_line_1).match(/\b\d+[A-Za-z]?\b/)?.[0] || '';
    const city = fold(resource.city);
    const zip = clean(resource.postal_code).match(/\d{5}/)?.[0] || '';
    const numberIndex = number ? folded.indexOf(fold(number)) : -1;
    const snippet = numberIndex >= 0 ? folded.slice(Math.max(0, numberIndex - 100), numberIndex + 260) : '';
    return {
      ...base,
      fetch_status: response.ok ? 'ok' : `http_${response.status}`,
      final_url: response.url,
      content_type: contentType,
      source_contains_street_number: numberIndex >= 0,
      source_contains_city: Boolean(city && folded.includes(city)),
      source_contains_zip: Boolean(zip && folded.includes(zip)),
      evidence_snippet: snippet
    };
  } catch (error) {
    return { ...base, fetch_status: 'fetch_error', error: error.message };
  }
}

const results = [];
for (let index = 0; index < targets.length; index += 6) {
  results.push(...await Promise.all(targets.slice(index, index + 6).map(inspect)));
}
fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify({
  targets: results.length,
  fetched: results.filter(result => result.fetch_status === 'ok').length,
  strong_page_evidence: results.filter(result => result.source_contains_street_number && result.source_contains_city && result.source_contains_zip).length,
  partial_page_evidence: results.filter(result => result.fetch_status === 'ok' && !(result.source_contains_street_number && result.source_contains_city && result.source_contains_zip)).length,
  unavailable: results.filter(result => result.fetch_status !== 'ok').length
}, null, 2));
