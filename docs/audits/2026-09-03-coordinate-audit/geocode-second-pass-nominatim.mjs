import fs from 'node:fs';

const [evidencePath, candidatesPath, outputPath] = process.argv.slice(2);
if (!evidencePath || !candidatesPath || !outputPath) {
  throw new Error('Usage: geocode-second-pass-nominatim.mjs <official-evidence.json> <candidates.json> <output.json>');
}

const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
const byResourceId = new Map(candidates.map(candidate => [candidate.resource_id, candidate]));
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const results = [];
for (let index = 0; index < evidence.length; index += 1) {
  const item = evidence[index];
  const candidate = byResourceId.get(item.resource_id);
  if (!candidate) throw new Error(`Candidate missing: ${item.resource_id}`);
  const parameters = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    namedetails: '1',
    limit: '3',
    countrycodes: 'us',
    street: candidate.query.street,
    state: candidate.query.state || 'TX'
  });
  if (candidate.query.city) parameters.set('city', candidate.query.city);
  if (candidate.query.postal_code) parameters.set('postalcode', candidate.query.postal_code);
  const requestUrl = `https://nominatim.openstreetmap.org/search?${parameters}`;
  let responseRecord;
  try {
    const response = await fetch(requestUrl, {
      signal: AbortSignal.timeout(25000),
      headers: {
        'User-Agent': 'PuenteATXResourceAudit/1.0 (https://puenteatx.org)',
        Referer: 'https://puenteatx.org/'
      }
    });
    const body = await response.json();
    responseRecord = {
      resource_id: item.resource_id,
      provider: 'OpenStreetMap Nominatim',
      checked_at: '2026-09-03',
      attribution: 'Data © OpenStreetMap contributors, ODbL 1.0',
      query: candidate.query,
      http_status: response.status,
      candidates: Array.isArray(body) ? body : [],
      error: Array.isArray(body) ? '' : JSON.stringify(body)
    };
  } catch (error) {
    responseRecord = {
      resource_id: item.resource_id,
      provider: 'OpenStreetMap Nominatim',
      checked_at: '2026-09-03',
      attribution: 'Data © OpenStreetMap contributors, ODbL 1.0',
      query: candidate.query,
      http_status: null,
      candidates: [],
      error: error.message
    };
  }
  results.push(responseRecord);
  fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
  if (index < evidence.length - 1) await sleep(1100);
}

console.log(JSON.stringify({
  queried: results.length,
  with_candidates: results.filter(result => result.candidates.length).length,
  unique_candidate: results.filter(result => result.candidates.length === 1).length,
  multiple_candidates: results.filter(result => result.candidates.length > 1).length,
  no_candidate: results.filter(result => !result.candidates.length).length,
  request_errors: results.filter(result => result.error).length
}, null, 2));
