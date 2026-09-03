#!/usr/bin/env node

import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-6-public-contact.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const approvedHosts = new Set([
  'www.centraltexasfoodbank.org',
  'safoodbank.org',
  'www.goodwillcentraltexas.org',
  'salvationarmyaustin.org'
]);
const present = value => Boolean(String(value ?? '').trim());
const operations = resources.filter(resource => {
  if (resource.status !== 'draft' || !present(resource.source_url)) return false;
  if ([resource.phone, resource.sms_phone, resource.whatsapp_phone, resource.email, resource.website_url].some(present)) return false;
  try { return approvedHosts.has(new URL(resource.source_url).hostname); } catch { return false; }
}).map(resource => ({
  canonical_id: resource.id,
  expected_canonical_status: 'draft',
  expected_archive_status: 'draft',
  patch: { website_url: resource.source_url },
  archive_ids: []
}));

if (operations.length !== 30) throw new Error(`Expected 30 safe public contact paths; found ${operations.length}.`);
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, fields: operations.length }, null, 2));
