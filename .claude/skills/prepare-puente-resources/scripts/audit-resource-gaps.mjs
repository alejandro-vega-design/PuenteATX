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
const existingPath = valueFor('--existing');
const outputPath = valueFor('--out');

if (!project || !existingPath || !outputPath) {
  console.error('Usage: audit-resource-gaps.mjs --project <project-root> --existing <resources.json> --out <gap-report.csv>');
  process.exit(2);
}

const importerPath = path.resolve(project, 'src/data/csvImport.js');
if (!fs.existsSync(importerPath)) {
  console.error(`Puente ATX importer not found: ${importerPath}`);
  process.exit(2);
}

let resources;
try {
  resources = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  if (!Array.isArray(resources)) throw new Error('expected an array');
} catch (error) {
  console.error(`Could not read existing resources JSON: ${error.message}`);
  process.exit(2);
}

const { CSV_IMPORT_HEADERS } = await import(`${pathToFileURL(importerPath).href}?audit=${Date.now()}`);
const auditableFields = CSV_IMPORT_HEADERS.filter(field => ![
  'is_featured', 'is_emergency', 'latitude', 'longitude'
].includes(field));
const resourceFieldFor = field => ({
  primary_category: 'primary_category_id',
  additional_categories: 'additional_category_ids'
}[field] || field);
const empty = value => value == null
  || (typeof value === 'string' && !value.trim())
  || (Array.isArray(value) && value.length === 0);
const cell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

const rows = resources.map(resource => {
  const missing = auditableFields.filter(field => empty(resource[resourceFieldFor(field)]));
  const completed = auditableFields.length - missing.length;
  return {
    id: resource.id || '',
    slug: resource.slug || '',
    organization_name: resource.organization_name || '',
    title_es: resource.title_es || '',
    title_en: resource.title_en || '',
    status: resource.status || '',
    completed_fields: completed,
    total_fields: auditableFields.length,
    completion_percent: Math.round((completed / auditableFields.length) * 100),
    missing_count: missing.length,
    missing_fields: missing.join('|')
  };
});

rows.sort((left, right) => right.missing_count - left.missing_count
  || left.organization_name.localeCompare(right.organization_name));

const headers = [
  'id', 'slug', 'organization_name', 'title_es', 'title_en', 'status',
  'completed_fields', 'total_fields', 'completion_percent', 'missing_count', 'missing_fields'
];
const csv = `\ufeff${headers.join(',')}\n${rows.map(row => headers.map(header => cell(row[header])).join(',')).join('\n')}\n`;
fs.writeFileSync(outputPath, csv, 'utf8');

const incomplete = rows.filter(row => row.missing_count > 0);
console.log(`Resources audited: ${rows.length}`);
console.log(`Resources with missing fields: ${incomplete.length}`);
console.log(`Complete resources: ${rows.length - incomplete.length}`);
console.log(`Gap report: ${path.resolve(outputPath)}`);
