#!/usr/bin/env node

import fs from 'node:fs';
import { resourceCategories } from '../src/data/categories.js';
import { getServiceArea } from '../src/config/serviceAreas.js';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/audit-resource-editorial.mjs <resources.json> <findings.csv>');
  process.exit(2);
}

const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(resources)) throw new Error('Expected a JSON array.');
const active = resources.filter(resource => ['published', 'draft'].includes(resource.status));
const categoryById = new Map(resourceCategories.map(category => [category.id, category.slug]));
const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const present = value => Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? '').trim());
const csv = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const findings = [];
const add = (resource, severity, confidence, code, detail, recommendation) => findings.push({ resource, severity, confidence, code, detail, recommendation });
const text = resource => fold([resource.title_es, resource.title_en, resource.summary_es, resource.summary_en, resource.description_es, resource.description_en].join(' '));

for (const resource of active) {
  const titleEs = fold(resource.title_es);
  const titleEn = fold(resource.title_en);
  const organization = fold(resource.organization_name);
  const body = text(resource);
  const category = categoryById.get(resource.primary_category_id) || resource.primary_category || '';

  if (!present(resource.title_es) || !present(resource.title_en)) add(resource, 'blocking', 'high', 'missing_bilingual_title', 'A localized title is empty.', 'Populate both titles from supported evidence.');
  if (!present(resource.summary_es) || !present(resource.summary_en)) add(resource, 'blocking', 'high', 'missing_bilingual_summary', 'A localized summary is empty.', 'Populate both concise summaries.');
  if (organization && (titleEs === organization || titleEn === organization)) add(resource, 'editorial', 'high', 'title_duplicates_organization', 'A title equals organization_name.', 'Use the actual program name or a concise service label.');
  else if (organization.length >= 4 && (titleEs.includes(organization) || titleEn.includes(organization))) add(resource, 'editorial', 'high', 'title_contains_organization', 'A title redundantly contains organization_name.', 'Remove the institution wording while preserving the service identity.');
  if (/\b(sobreviviente|sobrevivientes|survivor|survivors)\b/.test(`${titleEs} ${titleEn}`)
    && !/\b(violencia|violence|abuso|abuse|agresion|assault|sexual|domestica|domestic|familiar|family|trata|trafficking)\b/.test(`${titleEs} ${titleEn}`)) {
    add(resource, 'editorial', 'high', 'ambiguous_survivor_title', 'The title does not identify what survivors experienced.', 'Add the verified violence, abuse, assault, or trafficking context.');
  }
  if (String(resource.title_es || '').length > 85 || String(resource.title_en || '').length > 85) add(resource, 'editorial', 'medium', 'title_too_long', 'At least one title exceeds 85 characters.', 'Shorten it without removing essential service context.');

  for (const [left, right, label] of [
    ['summary_es', 'summary_en', 'summary'], ['description_es', 'description_en', 'description'],
    ['eligibility_es', 'eligibility_en', 'eligibility'], ['application_steps_es', 'application_steps_en', 'application_steps'],
    ['hours_es', 'hours_en', 'hours'], ['required_documents_es', 'required_documents_en', 'required_documents']
  ]) {
    const a = String(resource[left] || '').trim(); const b = String(resource[right] || '').trim();
    if (Boolean(a) !== Boolean(b)) add(resource, label === 'summary' ? 'blocking' : 'quality', 'high', `${label}_one_language_only`, `${a ? right : left} is empty.`, 'Supply the faithful missing translation.');
    else if (a && a === b && /[A-Za-zÀ-ÖØ-öø-ÿ]{4}/.test(a)) add(resource, 'quality', 'medium', `${label}_identical_prose`, 'Spanish and English fields contain identical prose.', 'Confirm proper translation; keep identical only when language-neutral.');
  }

  for (const field of ['summary_es', 'summary_en', 'description_es', 'description_en']) {
    const value = String(resource[field] || '');
    const leads = value.split(/[.!?]+\s+/).map(sentence => fold(sentence).split(' ')[0]).filter(item => ['ofrece', 'provides', 'brinda', 'offers', 'incluye', 'includes'].includes(item));
    if (leads.length > new Set(leads).size) add(resource, 'editorial', 'high', 'mechanically_concatenated_prose', `${field} repeats the same sentence opening.`, 'Synthesize overlapping claims into coherent prose.');
    if (/(?:https?:\/\/|www\.|\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b|\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4})/i.test(value) && field.startsWith('summary')) add(resource, 'quality', 'high', 'summary_contains_contact', `${field} contains contact information.`, 'Move contact data to its dedicated field.');
    if (/�|Ã.|Â.|â€|ðŸ/.test(value)) add(resource, 'data', 'high', 'encoding_corruption', `${field} contains likely mojibake.`, 'Restore the intended UTF-8 text.');
  }

  const expected = [];
  if (/\b(food pantry|despensa|hot meal|comida caliente|grocer|alimento)\b/.test(body)) expected.push('comida');
  if (/\b(legal|abogado|lawyer|attorney|court|tribunal|immigration|inmigracion)\b/.test(body)) expected.push('ayuda-legal');
  if (/\b(bus|transport|ride|transporte|traslado)\b/.test(body)) expected.push('transporte');
  if (/\b(school|education|educacion|literacy|alfabetizacion|ged|tutoring)\b/.test(body)) expected.push('educacion');
  if (/\b(veterinary|veterinari|pet clinic|animal clinic)\b/.test(body) && category !== 'salud') add(resource, 'classification', 'low', 'possible_veterinary_category_mismatch', `Veterinary language appears with primary category ${category}.`, 'Review immutable source evidence; the mention may be incidental.');
  if (expected.length === 1 && category && category !== expected[0]) add(resource, 'classification', 'low', 'possible_category_mismatch', `Text signals ${expected[0]} but primary category is ${category}.`, 'Review immutable source evidence before changing category; incidental mentions are common.');

  const methods = Array.isArray(resource.service_methods) ? resource.service_methods : [];
  const locationReviewed = /\[location-review:\s*(?:variable|confidential)\]/i.test(String(resource.verification_notes || ''));
  if (methods.includes('in_person') && !present(resource.address_line_1) && !locationReviewed) add(resource, 'access', 'medium', 'in_person_without_address', 'In-person method has no street address.', 'Confirm a real service location or remove in-person.');
  if (present(resource.address_line_1) && !methods.includes('in_person')) add(resource, 'access', 'medium', 'address_without_in_person', 'Address exists but in-person is not selected.', 'Confirm whether this is a service location or remove the address.');
  if (present(resource.latitude) !== present(resource.longitude)) add(resource, 'location', 'high', 'partial_coordinates', 'Only one coordinate is present.', 'Provide both approved coordinates or neither.');
  if (present(resource.latitude) && (Number(resource.latitude) < 25 || Number(resource.latitude) > 37 || Number(resource.longitude) < -107 || Number(resource.longitude) > -93)) add(resource, 'location', 'high', 'coordinates_outside_texas', 'Coordinates fall outside a broad Texas bounding box.', 'Verify or clear coordinates.');
  if (present(resource.postal_code)) {
    const area = getServiceArea(resource.postal_code);
    if (!area) add(resource, 'location', 'medium', 'unsupported_postal_code', resource.postal_code, 'Verify the ZIP; if correct, add it through the approved service-area dataset.');
    else if (present(resource.county) && fold(resource.county) !== fold(area.county)) add(resource, 'location', 'medium', 'zip_county_mismatch', `${resource.postal_code} currently maps to ${area.county}, not ${resource.county}.`, 'Review authoritative geography and whether county represents location or coverage before changing data.');
  }
  for (const field of ['website_url', 'source_url']) {
    const value = String(resource[field] || '').trim();
    if (value && !/^https?:\/\//i.test(value)) add(resource, 'source', 'high', 'invalid_url', `${field}: ${value}`, 'Use a complete HTTP(S) URL.');
    if (/[?&](utm_|fbclid|gclid|mc_cid|mc_eid|ref=|si=)/i.test(value)) add(resource, 'source', 'high', 'tracking_parameters', field, 'Remove tracking parameters.');
  }
  if (resource.last_verified_at && String(resource.last_verified_at).slice(0, 10) > '2026-09-03') add(resource, 'verification', 'high', 'future_verification_date', String(resource.last_verified_at), 'Correct the date; never record future verification.');
  if (resource.status === 'published' && ![resource.phone, resource.sms_phone, resource.whatsapp_phone, resource.email, resource.website_url].some(present)) add(resource, 'blocking', 'high', 'published_without_contact', 'No public contact method or website.', 'Add a verified contact path or unpublish pending review.');
}

const headers = ['severity', 'confidence', 'code', 'status', 'id', 'slug', 'organization_name', 'title_es', 'title_en', 'primary_category', 'detail', 'recommendation'];
const rows = findings.sort((a, b) => a.severity.localeCompare(b.severity) || a.code.localeCompare(b.code) || a.resource.organization_name.localeCompare(b.resource.organization_name)).map(item => [
  item.severity, item.confidence, item.code, item.resource.status, item.resource.id, item.resource.slug, item.resource.organization_name,
  item.resource.title_es, item.resource.title_en, categoryById.get(item.resource.primary_category_id) || '', item.detail, item.recommendation
]);
fs.writeFileSync(outputPath, `${[headers, ...rows].map(row => row.map(csv).join(',')).join('\n')}\n`);
const counts = findings.reduce((result, item) => {
  const key = `${item.resource.status}|${item.code}`;
  result[key] = (result[key] || 0) + 1;
  return result;
}, {});
console.log(JSON.stringify({ audited: active.length, findings: findings.length, counts }, null, 2));
