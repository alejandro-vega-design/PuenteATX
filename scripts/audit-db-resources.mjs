#!/usr/bin/env node
/**
 * Full audit of a Puente ATX resources export (the live DB, 700+ rows).
 *
 * Accepts a JSON array (Supabase "Export as JSON" or `select * from resources`)
 * or a CSV (Supabase "Export as CSV" / admin panel export). Normalizes both to
 * the live CSV_IMPORT_HEADERS shape, then reports:
 *   - duplicate / triplicate clusters (slug, org+title, phone, website, address)
 *   - organization-name variants that split one entity into many records
 *   - field-format inconsistencies vs the skill quality rules
 *   - publish-requirement gaps and invalid enum values
 *
 * Usage:
 *   node scripts/audit-db-resources.mjs --project . --input <export.json|csv> \
 *     --out-dir docs/imports/2026-09-02-db-audit
 *
 * Read-only. Never connects to production.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const val = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const project = val('--project') || '.';
const input = val('--input');
const outDir = val('--out-dir') || 'db-audit';
if (!input) { console.error('Usage: audit-db-resources.mjs --project <root> --input <export.json|csv> [--out-dir <dir>]'); process.exit(2); }

const importer = await import(pathToFileURL(path.resolve(project, 'src/data/csvImport.js')).href);
const { parseCsv, CSV_IMPORT_HEADERS } = importer;
const { resourceCategories } = await import(pathToFileURL(path.resolve(project, 'src/data/categories.js')).href);
const categoryById = new Map(resourceCategories.map(c => [c.id, c.slug]));

const norm = v => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const digits = v => String(v ?? '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
const list = v => Array.isArray(v) ? v : String(v ?? '').split(/[|;,]/).map(s => s.trim()).filter(Boolean);
const webKey = v => norm(String(v ?? '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[?#]/)[0].replace(/\/$/, '')).replace(/ /g, '');
const nonEmpty = v => Array.isArray(v) ? v.length > 0 : String(v ?? '').trim().length > 0;

// ---------- load ----------
const raw = fs.readFileSync(input, 'utf8');
let records;
if (input.endsWith('.json') || raw.trimStart().startsWith('[')) {
  const arr = JSON.parse(raw);
  records = arr.map(r => ({
    ...r,
    primary_category: r.primary_category || categoryById.get(r.primary_category_id) || r.primary_category_id || '',
    additional_categories: (r.additional_category_ids || r.additional_categories || []),
  }));
} else {
  const parsed = parseCsv(raw);
  records = parsed.records.map(rec => rec.values);
}
console.log(`Loaded ${records.length} resources from ${path.basename(input)}`);
fs.mkdirSync(outDir, { recursive: true });

const id = r => r.slug || r.id || `${norm(r.organization_name)}/${norm(r.title_en || r.title_es)}`;

// ---------- duplicates ----------
const cluster = (keyFn, label) => {
  const m = new Map();
  for (const r of records) for (const k of [].concat(keyFn(r)).filter(Boolean)) {
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return [...m.entries()]
    .map(([k, rs]) => ({ key: k, count: rs.length, ids: rs.map(id), slugs: rs.map(r => r.slug), orgs: [...new Set(rs.map(r => r.organization_name))], titles: [...new Set(rs.map(r => r.title_es || r.title_en))] }))
    .filter(g => g.count > 1)
    .sort((a, b) => b.count - a.count);
};

const dupExactSlug = cluster(r => r.slug && `slug:${r.slug}`, 'slug');
const dupOrgTitle = cluster(r => {
  const o = norm(r.organization_name);
  return [norm(r.title_es) && `${o}|${norm(r.title_es)}`, norm(r.title_en) && `${o}|${norm(r.title_en)}`];
}).filter(g => g.slugs.filter(Boolean).length !== 1 || new Set(g.slugs).size > 1);
const dupPhone = cluster(r => { const p = digits(r.phone); return p.length === 10 && `ph:${p}`; })
  .filter(g => new Set(g.ids).size > 1 && g.titles.length > 1);
const dupWebsite = cluster(r => { const w = webKey(r.website_url); return w.length >= 6 && `web:${w}`; })
  .filter(g => new Set(g.ids).size > 1 && g.titles.length > 1);
const dupAddress = cluster(r => {
  const a = norm(r.address_line_1); const c = norm(r.city);
  return a.length > 4 && c && `addr:${a}|${c}`;
}).filter(g => g.titles.length > 1);

// org-name variants (same normalized website or phone, different org string)
const entityGroups = new Map();
for (const r of records) {
  const anchor = webKey(r.website_url) || digits(r.phone);
  if (!anchor || anchor.length < 6) continue;
  if (!entityGroups.has(anchor)) entityGroups.set(anchor, new Set());
  if (r.organization_name) entityGroups.get(anchor).add(r.organization_name.trim());
}
const orgVariants = [...entityGroups.values()].filter(s => s.size > 1).map(s => [...s]).sort((a, b) => b.length - a.length);

// ---------- field-format audit ----------
const SERVICE_METHODS = new Set(['in_person', 'phone', 'online', 'home_visit']);
const COST = new Set(['free', 'sliding_scale', 'paid', 'unknown']);
const CONTACT_RE = {
  url: /(?:https?:\/\/|www\.|\b(?:[a-z0-9-]+\.)+(?:com|org|net|gov|edu|us|io)\b)/i,
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  phone: /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
};
const issues = [];
const add = (r, code, detail = '') => issues.push({ id: id(r), slug: r.slug || '', status: r.status || '', org: r.organization_name || '', code, detail });

for (const r of records) {
  const methods = list(r.service_methods).map(String);
  const langs = list(r.languages).map(String);
  const published = (r.status || '') === 'published';

  if (!nonEmpty(r.title_es) || !nonEmpty(r.title_en)) add(r, 'missing_bilingual_title');
  if (!nonEmpty(r.summary_es) || !nonEmpty(r.summary_en)) add(r, 'missing_bilingual_summary');
  if (nonEmpty(r.description_es) !== nonEmpty(r.description_en)) add(r, 'description_one_language_only');
  if (nonEmpty(r.hours_es) !== nonEmpty(r.hours_en)) add(r, 'hours_one_language_only');
  else if (nonEmpty(r.hours_es) && String(r.hours_es).trim() === String(r.hours_en).trim() && /[a-zà-ÿ]{4}/i.test(String(r.hours_es))) add(r, 'hours_identical_prose', String(r.hours_es).slice(0, 60));
  if (nonEmpty(r.eligibility_es) !== nonEmpty(r.eligibility_en)) add(r, 'eligibility_one_language_only');

  for (const f of ['summary_es', 'summary_en']) {
    const s = String(r[f] ?? '');
    for (const [k, re] of Object.entries(CONTACT_RE)) if (re.test(s)) add(r, `summary_has_${k}`, `${f}`);
  }

  const catSlug = r.primary_category || categoryById.get(r.primary_category_id) || '';
  if (!resourceCategories.some(c => c.slug === catSlug)) add(r, 'invalid_or_missing_primary_category', String(catSlug));
  for (const m of methods) if (!SERVICE_METHODS.has(m)) add(r, 'invalid_service_method', m);
  if (r.cost_type && !COST.has(String(r.cost_type))) add(r, 'invalid_cost_type', String(r.cost_type));
  for (const l of langs) if (!['es', 'en'].includes(l)) add(r, 'invalid_language', l);

  if (methods.includes('in_person') && !nonEmpty(r.address_line_1)) add(r, 'in_person_without_address');
  if ((nonEmpty(r.address_line_1) || nonEmpty(r.latitude)) && !methods.includes('in_person')) add(r, 'address_without_in_person');
  if ((nonEmpty(r.latitude) || nonEmpty(r.longitude)) && !nonEmpty(r.address_line_1)) add(r, 'coords_without_address');
  if (nonEmpty(r.postal_code) && !/^\d{5}$/.test(String(r.postal_code).trim())) add(r, 'bad_postal_code', String(r.postal_code));
  if (nonEmpty(r.last_verified_at) && !/^\d{4}-\d{2}-\d{2}/.test(String(r.last_verified_at))) add(r, 'bad_last_verified_at', String(r.last_verified_at));

  for (const f of ['website_url', 'source_url']) if (/[?&](utm_|fbclid|gclid|mc_cid|mc_eid|ref=|si=)/i.test(String(r[f] ?? ''))) add(r, 'tracking_params_in_url', f);
  for (const f of ['website_url', 'source_url']) if (/(google|bing)\.[a-z.]+\/search|duckduckgo\.com\/\?/i.test(String(r[f] ?? ''))) add(r, 'search_engine_url', f);
  if (nonEmpty(r.phone) && !/^\d{3}-\d{3}-\d{4}$/.test(String(r.phone).trim()) && digits(r.phone).length >= 10) add(r, 'phone_not_dashed', String(r.phone));

  const sa = `${r.service_area_es ?? ''} ${r.service_area_en ?? ''}`;
  if (/\b(austin|round rock|pflugerville|georgetown|leander|cedar park|kyle|buda|elgin|manor|taylor|hutto|del valle|bastrop city)\b/i.test(sa)) add(r, 'service_area_names_city');

  const hasContact = [r.phone, r.sms_phone, r.whatsapp_phone, r.email, r.website_url].some(nonEmpty);
  if (!hasContact) add(r, 'no_contact_method');

  // publish-requirement gaps (mirrors the DB check constraint)
  if (published) {
    const missing = [];
    if (!nonEmpty(r.organization_name)) missing.push('organization_name');
    if (!nonEmpty(r.title_es) && !nonEmpty(r.title_en)) missing.push('title');
    if (!nonEmpty(r.summary_es) && !nonEmpty(r.summary_en)) missing.push('summary');
    if (!nonEmpty(r.description_es) && !nonEmpty(r.description_en)) missing.push('description');
    if (!nonEmpty(catSlug)) missing.push('primary_category');
    if (!nonEmpty(r.phone) && !nonEmpty(r.email) && !nonEmpty(r.website_url)) missing.push('contact');
    if (!nonEmpty(r.source_url)) missing.push('source_url');
    if (!nonEmpty(r.last_verified_at)) missing.push('last_verified_at');
    if (missing.length) add(r, 'published_missing_required', missing.join('|'));
  } else {
    if (!nonEmpty(r.source_url)) add(r, 'draft_missing_source_url');
    if (!nonEmpty(r.last_verified_at)) add(r, 'draft_missing_last_verified_at');
  }
}

// ---------- write outputs ----------
const byCode = issues.reduce((m, i) => (m[i.code] = (m[i.code] || 0) + 1, m), {});
const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
fs.writeFileSync(path.join(outDir, 'field-issues.csv'),
  `﻿slug,status,organization,code,detail\n${issues.map(i => [i.slug, i.status, i.org, i.code, i.detail].map(csvCell).join(',')).join('\n')}\n`);
fs.writeFileSync(path.join(outDir, 'duplicates.json'), JSON.stringify({
  exactSlug: dupExactSlug, orgPlusTitle: dupOrgTitle, sharedPhone: dupPhone, sharedWebsite: dupWebsite, sharedAddress: dupAddress, organizationNameVariants: orgVariants,
}, null, 2));

const statusCounts = records.reduce((m, r) => (m[r.status || 'unknown'] = (m[r.status || 'unknown'] || 0) + 1, m), {});
const summary = {
  total: records.length,
  byStatus: statusCounts,
  duplicateClusters: {
    exactSlug: dupExactSlug.length,
    orgPlusTitle: dupOrgTitle.length,
    sharedPhoneDifferentRecord: dupPhone.length,
    sharedWebsiteDifferentRecord: dupWebsite.length,
    sharedAddressDifferentRecord: dupAddress.length,
    organizationNameVariants: orgVariants.length,
    tripleOrMore: [...dupOrgTitle, ...dupPhone, ...dupWebsite].filter(g => g.count >= 3).length,
  },
  fieldIssuesByCode: Object.fromEntries(Object.entries(byCode).sort((a, b) => b[1] - a[1])),
  fieldIssuesTotal: issues.length,
};
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log(`\nWrote: ${outDir}/summary.json, duplicates.json, field-issues.csv`);
