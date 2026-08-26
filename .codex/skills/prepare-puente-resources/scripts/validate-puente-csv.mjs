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
for (const row of prepared.rows) {
  const resource = row.resource;
  const missingBilingual = ['title_es', 'title_en', 'summary_es', 'summary_en'].filter(field => !String(resource[field] || '').trim());
  if (missingBilingual.length) qualityWarnings.push({ row: row.rowNumber, issue: `missing bilingual fields: ${missingBilingual.join(', ')}` });
  const hasContact = [resource.phone, resource.sms_phone, resource.whatsapp_phone, resource.email, resource.website_url].some(value => String(value || '').trim());
  if (!hasContact) qualityWarnings.push({ row: row.rowNumber, issue: 'missing contact method or website' });
  if (!String(resource.source_url || '').trim()) qualityWarnings.push({ row: row.rowNumber, issue: 'missing source_url' });
  if (!String(resource.last_verified_at || '').trim()) qualityWarnings.push({ row: row.rowNumber, issue: 'missing last_verified_at' });
  if (resource.service_methods?.includes('in_person') && !String(resource.address_line_1 || '').trim()) {
    qualityWarnings.push({ row: row.rowNumber, issue: 'in-person service has no confirmed street address' });
  }
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
