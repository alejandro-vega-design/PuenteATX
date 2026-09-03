#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const valueFor = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};

const project = valueFor('--project');
const csvPath = valueFor('--csv');
const existingPath = valueFor('--existing');

if (!project || !csvPath) {
  console.error('Usage: validate-puente-csv.mjs --project <project-root> --csv <file.csv> [--existing <resources.json>]');
  process.exit(2);
}

const importerPath = path.resolve(project, 'src/data/csvImport.js');
if (!fs.existsSync(importerPath)) {
  console.error(`Puente ATX importer not found: ${importerPath}`);
  process.exit(2);
}
if (!fs.existsSync(csvPath)) {
  console.error(`CSV not found: ${csvPath}`);
  process.exit(2);
}

let existingResources = [];
if (existingPath) {
  try {
    existingResources = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
    if (!Array.isArray(existingResources)) throw new Error('expected an array');
  } catch (error) {
    console.error(`Could not read existing resources JSON: ${error.message}`);
    process.exit(2);
  }
}

const { CSV_IMPORT_HEADERS, parseCsv, prepareCsvResources } = await import(`${pathToFileURL(importerPath).href}?validation=${Date.now()}`);
let parsed;
try {
  parsed = parseCsv(fs.readFileSync(csvPath, 'utf8'));
} catch (error) {
  console.error(`CSV parse failed: ${error.message}`);
  process.exit(1);
}

const prepared = prepareCsvResources(parsed, existingResources, 'empty');
const schemaMatches = parsed.headers.length === CSV_IMPORT_HEADERS.length
  && CSV_IMPORT_HEADERS.every((header, index) => parsed.headers[index] === header);
const qualityWarnings = [];
const normalizeText = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();
const repeatedServiceLead = value => {
  const leads = String(value || '')
    .split(/[.!?]+\s+/)
    .map(sentence => normalizeText(sentence).split(' ')[0])
    .filter(lead => ['ofrece', 'provides', 'brinda', 'offers', 'ayuda', 'helps', 'incluye', 'includes'].includes(lead));
  return new Set(leads).size < leads.length;
};
for (const row of prepared.rows) {
  const resource = row.resource;
  const missingBilingual = ['title_es', 'title_en', 'summary_es', 'summary_en'].filter(field => !String(resource[field] || '').trim());
  if (missingBilingual.length) qualityWarnings.push({ row: row.rowNumber, issue: `missing bilingual fields: ${missingBilingual.join(', ')}` });
  const organization = normalizeText(resource.organization_name);
  for (const field of ['title_es', 'title_en']) {
    const title = normalizeText(resource[field]);
    if (!organization || !title) continue;
    if (title === organization) qualityWarnings.push({ row: row.rowNumber, issue: `${field} duplicates organization_name` });
    else if (organization.length >= 4 && title.includes(organization)) qualityWarnings.push({ row: row.rowNumber, issue: `${field} redundantly contains organization_name` });
  }
  for (const field of ['title_es', 'title_en']) {
    const title = normalizeText(resource[field]);
    if (/\b(sobreviviente|sobrevivientes|survivor|survivors)\b/.test(title)
      && !/\b(violencia|violence|abuso|abuse|agresion|assault|sexual|domestica|domestic|familiar|family|trata|trafficking)\b/.test(title)) {
      qualityWarnings.push({ row: row.rowNumber, issue: `${field} is ambiguous: identify what survivors experienced when supported by the source` });
    }
  }
  for (const field of ['summary_es', 'summary_en', 'description_es', 'description_en']) {
    if (repeatedServiceLead(resource[field])) {
      qualityWarnings.push({ row: row.rowNumber, issue: `${field} appears mechanically concatenated; synthesize repeated sentences into coherent prose` });
    }
  }
  const hoursEs = String(resource.hours_es || '').trim();
  const hoursEn = String(resource.hours_en || '').trim();
  if (Boolean(hoursEs) !== Boolean(hoursEn)) {
    qualityWarnings.push({ row: row.rowNumber, issue: `schedule must populate both hours_es and hours_en (missing ${hoursEs ? 'hours_en' : 'hours_es'})` });
  } else if (hoursEs && hoursEs === hoursEn && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(hoursEs)) {
    qualityWarnings.push({ row: row.rowNumber, issue: 'hours_es and hours_en contain identical prose; confirm the schedule was translated' });
  }
  const hasContact = [resource.phone, resource.sms_phone, resource.whatsapp_phone, resource.email, resource.website_url].some(value => String(value || '').trim());
  if (!hasContact) qualityWarnings.push({ row: row.rowNumber, issue: 'missing contact method or website' });
  if (!String(resource.source_url || '').trim()) qualityWarnings.push({ row: row.rowNumber, issue: 'missing source_url' });
  if (!String(resource.last_verified_at || '').trim()) qualityWarnings.push({ row: row.rowNumber, issue: 'missing last_verified_at' });
  if (resource.service_methods?.includes('in_person') && !String(resource.address_line_1 || '').trim()) {
    qualityWarnings.push({ row: row.rowNumber, issue: 'in-person service has no confirmed street address' });
  }
}

const sharedTitleGroups = new Map();
for (const row of prepared.rows) {
  const resource = row.resource;
  const key = `${normalizeText(resource.title_es)}|${normalizeText(resource.title_en)}`;
  if (key === '|') continue;
  if (!sharedTitleGroups.has(key)) sharedTitleGroups.set(key, []);
  sharedTitleGroups.get(key).push(row);
}
for (const rows of sharedTitleGroups.values()) {
  if (rows.length < 2) continue;
  const example = rows[0].resource.title_es || rows[0].resource.title_en;
  qualityWarnings.push({
    row: rows[0].rowNumber,
    issue: `shared bilingual title used by ${rows.length} rows (${example}); review as legitimate repetition, title/content mismatch, or true duplicate`
  });
}

const invalid = prepared.rows.filter(row => row.errors.length);
const importerWarnings = prepared.rows.filter(row => row.warnings.length);
const actions = prepared.rows.reduce((counts, row) => {
  counts[row.action] = (counts[row.action] || 0) + 1;
  return counts;
}, {});

console.log(`CSV: ${path.resolve(csvPath)}`);
console.log(`Rows: ${prepared.rows.length}`);
console.log(`Headers: ${parsed.headers.length}/${CSV_IMPORT_HEADERS.length}`);
console.log(`Actions: create=${actions.create || 0}, update=${actions.update || 0}, unchanged=${actions.unchanged || 0}`);
console.log(`Importer errors: ${invalid.length}`);
console.log(`Importer warnings: ${importerWarnings.length}`);
console.log(`Quality warnings: ${qualityWarnings.length}`);

if (prepared.missingHeaders.length) console.error(`Missing required headers: ${prepared.missingHeaders.join(', ')}`);
if (!schemaMatches) console.error('ERROR: headers do not exactly match the live Puente ATX template and order');
for (const row of invalid) console.error(`ERROR row ${row.rowNumber}: ${row.errors.join(', ')}`);
for (const row of importerWarnings) console.warn(`WARNING row ${row.rowNumber}: ${row.warnings.join(', ')}`);
for (const warning of qualityWarnings.slice(0, 100)) console.warn(`REVIEW row ${warning.row}: ${warning.issue}`);
if (qualityWarnings.length > 100) console.warn(`REVIEW: ${qualityWarnings.length - 100} additional quality warnings omitted from terminal output`);

if (prepared.truncated) console.error('ERROR: input exceeds the current importer row limit');
if (!schemaMatches || prepared.missingHeaders.length || invalid.length || prepared.truncated) process.exit(1);
console.log('Importer validation passed. Review quality warnings before import.');
