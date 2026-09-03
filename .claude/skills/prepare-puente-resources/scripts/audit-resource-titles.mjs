#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const valueFor = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const existingPath = valueFor('--existing');
const outputPath = valueFor('--out');
const status = valueFor('--status') || 'draft';
if (!existingPath || !outputPath) {
  console.error('Usage: audit-resource-titles.mjs --existing <resources.json> --out <audit.csv> [--status draft|published|archived|all]');
  process.exit(2);
}

const resources = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
if (!Array.isArray(resources)) throw new Error('Existing resources JSON must be an array.');
const selected = status === 'all' ? resources : resources.filter(resource => resource.status === status);
const fold = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();
const digits = value => String(value || '').replace(/\D/g, '');
const normalizedUrl = value => {
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}${url.search}`;
  } catch { return ''; }
};
const csv = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const evidenceFor = resource => [resource.summary_es, resource.summary_en, resource.description_es, resource.description_en].filter(Boolean).join(' ');
const titleKey = resource => `${fold(resource.title_es)}|${fold(resource.title_en)}`;
const groups = new Map();
for (const resource of selected) {
  const key = titleKey(resource);
  if (key === '|') continue;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(resource);
}

const findings = [];
for (const resource of selected) {
  const organization = fold(resource.organization_name);
  const titleEs = fold(resource.title_es);
  const titleEn = fold(resource.title_en);
  if (organization && (titleEs === organization || titleEn === organization)) {
    findings.push({ issue: 'title_duplicates_organization', resource, group: [resource], signals: 'organization' });
  } else if (organization.length >= 4 && (titleEs.includes(organization) || titleEn.includes(organization))) {
    findings.push({ issue: 'title_contains_organization', resource, group: [resource], signals: 'organization' });
  }
  if (/\b(sobreviviente|sobrevivientes|survivor|survivors)\b/.test(`${titleEs} ${titleEn}`)
    && !/\b(violencia|violence|abuso|abuse|agresion|assault|sexual|domestica|domestic|familiar|family|trata|trafficking)\b/.test(`${titleEs} ${titleEn}`)) {
    findings.push({ issue: 'ambiguous_survivor_title', resource, group: [resource], signals: 'missing_context' });
  }
  const evidence = fold(evidenceFor(resource));
  const mismatch = (/(despensa de alimentos|food pantry)/.test(`${titleEs} ${titleEn}`) && /(pet food|alimentos para mascotas|soup kitchen|comedor|hot meal|comida caliente)/.test(evidence))
    || (/(educacion para adultos|adult education)/.test(`${titleEs} ${titleEn}`) && /(senior care|assisted living|memory care|cuidado de adultos mayores)/.test(evidence))
    || (/(beneficios del seguro social|social security benefits)/.test(`${titleEs} ${titleEn}`) && !/(social security|seguro social|\bssi\b|\bssdi\b|medicare)/.test(evidence));
  if (mismatch) findings.push({ issue: 'title_content_mismatch', resource, group: [resource], signals: 'title|content' });
}

for (const group of groups.values()) {
  if (group.length < 2) continue;
  for (const resource of group) {
    const peers = group.filter(peer => peer.id !== resource.id);
    const duplicateSignals = new Set();
    for (const peer of peers) {
      if (fold(peer.organization_name) === fold(resource.organization_name)) duplicateSignals.add('organization');
      if (digits(resource.phone).length >= 10 && digits(peer.phone) === digits(resource.phone)) duplicateSignals.add('phone');
      if (normalizedUrl(resource.website_url) && normalizedUrl(peer.website_url) === normalizedUrl(resource.website_url)) duplicateSignals.add('website');
      if (fold(resource.description_en) && fold(peer.description_en) === fold(resource.description_en)) duplicateSignals.add('description');
    }
    const likelyDuplicate = (duplicateSignals.has('organization') && duplicateSignals.size >= 2)
      || (duplicateSignals.has('phone') && duplicateSignals.has('website') && duplicateSignals.has('description'));
    findings.push({
      issue: likelyDuplicate ? 'shared_title_likely_duplicate' : 'shared_title_review',
      resource,
      group,
      signals: [...duplicateSignals].join('|')
    });
  }
}

const headers = ['issue', 'status', 'resource_id', 'organization_name', 'title_es', 'title_en', 'group_size', 'signals', 'slug', 'phone', 'website_url', 'source_url', 'recommended_action', 'review_notes'];
const recommendedAction = issue => ({
  title_duplicates_organization: 'Replace with a specific, self-contained service title.',
  title_contains_organization: 'Remove redundant organization wording while preserving the service identity.',
  ambiguous_survivor_title: 'Add the verified violence, abuse, assault, or trafficking context.',
  title_content_mismatch: 'Retitle from verified evidence and repair any contaminated summary.',
  shared_title_likely_duplicate: 'Compare records field by field; consolidate only if they are the same service.',
  shared_title_review: 'Classify as legitimate repetition, mismatch, ambiguity, or true duplicate.'
}[issue] || 'Review manually.');
const rows = findings
  .sort((left, right) => left.issue.localeCompare(right.issue) || left.resource.organization_name.localeCompare(right.resource.organization_name))
  .map(({ issue, resource, group, signals }) => [issue, resource.status, resource.id, resource.organization_name, resource.title_es, resource.title_en, group.length, signals, resource.slug, resource.phone, resource.website_url, resource.source_url, recommendedAction(issue), '']);
fs.writeFileSync(outputPath, `${[headers, ...rows].map(row => row.map(csv).join(',')).join('\n')}\n`);
const counts = findings.reduce((result, finding) => ({ ...result, [finding.issue]: (result[finding.issue] || 0) + 1 }), {});
console.log(`Audited ${selected.length} ${status} resources; wrote ${findings.length} findings to ${path.resolve(outputPath)}.`);
console.log(JSON.stringify(counts));
