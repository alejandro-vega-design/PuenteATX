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
const list = v => {
  if (Array.isArray(v)) return v.map(String);
  const s = String(v ?? '').trim();
  if (!s) return [];
  if (s.startsWith('[') || s.startsWith('{')) {
    try { const p = JSON.parse(s.startsWith('{') ? `[${s.slice(1, -1)}]` : s); if (Array.isArray(p)) return p.map(String); } catch { /* fall through */ }
    // Postgres array literal {a,b,c}
    if (s.startsWith('{')) return s.slice(1, -1).split(',').map(x => x.replace(/^"|"$/g, '').trim()).filter(Boolean);
  }
  return s.split(/[|;,]/).map(x => x.trim()).filter(Boolean);
};
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
  for (const r of records) for (const k of new Set([].concat(keyFn(r)).filter(Boolean))) {
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return [...m.entries()]
    .map(([k, rs]) => {
      const uniq = [...new Map(rs.map(r => [id(r), r])).values()];
      return { key: k, count: uniq.length, ids: uniq.map(id), slugs: uniq.map(r => r.slug), statuses: uniq.map(r => r.status), orgs: [...new Set(uniq.map(r => r.organization_name))], titles: [...new Set(uniq.map(r => r.title_es || r.title_en))] };
    })
    .filter(g => g.count > 1)
    .sort((a, b) => b.count - a.count);
};

const dupExactSlug = cluster(r => r.slug && `slug:${r.slug}`, 'slug');
const dupOrgTitle = cluster(r => {
  const o = norm(r.organization_name);
  return [norm(r.title_es) && `${o}|${norm(r.title_es)}`, norm(r.title_en) && `${o}|${norm(r.title_en)}`];
});
const dupPhone = cluster(r => { const p = digits(r.phone); return p.length === 10 && `ph:${p}`; })
  .filter(g => g.titles.length > 1 || g.orgs.length > 1);
const dupWebsite = cluster(r => { const w = webKey(r.website_url); return w.length >= 6 && `web:${w}`; })
  .filter(g => g.titles.length > 1);
const dupAddress = cluster(r => {
  const a = norm(r.address_line_1); const c = norm(r.city);
  return a.length > 4 && c && `addr:${a}|${c}`;
}).filter(g => g.titles.length > 1);

// ---------- high-confidence duplicate pairs ----------
// Among records that share a strong anchor (phone / website / address), flag pairs
// whose titles or summaries are near-identical — these are very likely the same service.
const bigrams = s => { const t = ` ${norm(s)} `; const g = new Set(); for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2)); return g; };
const dice = (a, b) => { if (!a && !b) return 1; if (!a || !b) return 0; const A = bigrams(a), B = bigrams(b); let inter = 0; for (const x of A) if (B.has(x)) inter++; return (2 * inter) / (A.size + B.size); };
const anchorsOf = r => new Set([
  digits(r.phone).length === 10 && `ph:${digits(r.phone)}`,
  webKey(r.website_url).length >= 6 && `web:${webKey(r.website_url)}`,
  norm(r.address_line_1).length > 4 && norm(r.city) && `addr:${norm(r.address_line_1)}|${norm(r.city)}`,
].filter(Boolean));
const anchorIndex = new Map();
records.forEach((r, i) => { for (const a of anchorsOf(r)) { if (!anchorIndex.has(a)) anchorIndex.set(a, []); anchorIndex.get(a).push(i); } });
const seenPair = new Set();
const highConfidencePairs = [];
for (const idxs of anchorIndex.values()) {
  for (let x = 0; x < idxs.length; x++) for (let y = x + 1; y < idxs.length; y++) {
    const pk = idxs[x] < idxs[y] ? `${idxs[x]}-${idxs[y]}` : `${idxs[y]}-${idxs[x]}`;
    if (seenPair.has(pk)) continue; seenPair.add(pk);
    const a = records[idxs[x]], b = records[idxs[y]];
    const titleSim = Math.max(dice(a.title_es, b.title_es), dice(a.title_en, b.title_en));
    const sumSim = Math.max(dice(a.summary_es, b.summary_es), dice(a.summary_en, b.summary_en));
    const orgSim = dice(a.organization_name, b.organization_name);
    const sharedAnchors = [...anchorsOf(a)].filter(z => anchorsOf(b).has(z));
    if (titleSim >= 0.82 || sumSim >= 0.86 || (orgSim >= 0.6 && titleSim >= 0.55 && sharedAnchors.length >= 2)) {
      highConfidencePairs.push({
        score: Number(Math.max(titleSim, sumSim).toFixed(2)),
        titleSim: Number(titleSim.toFixed(2)), summarySim: Number(sumSim.toFixed(2)),
        sharedAnchors,
        a: { slug: a.slug, status: a.status, org: a.organization_name, title: a.title_es || a.title_en },
        b: { slug: b.slug, status: b.status, org: b.organization_name, title: b.title_es || b.title_en },
      });
    }
  }
}
highConfidencePairs.sort((p, q) => q.score - p.score);

// connected components of the high-confidence pair graph = duplicate clusters
const adj = new Map();
const pairMeta = new Map();
for (const p of highConfidencePairs) for (const [x, y] of [[p.a, p.b], [p.b, p.a]]) {
  pairMeta.set(x.slug, x);
  if (!adj.has(x.slug)) adj.set(x.slug, new Set());
  adj.get(x.slug).add(y.slug);
}
const seenNode = new Set();
const duplicateClusters = [];
for (const start of adj.keys()) {
  if (seenNode.has(start)) continue;
  const stack = [start]; const members = []; seenNode.add(start);
  while (stack.length) { const c = stack.pop(); members.push(c); for (const n of adj.get(c) || []) if (!seenNode.has(n)) { seenNode.add(n); stack.push(n); } }
  if (members.length > 1) duplicateClusters.push(members.map(s => pairMeta.get(s)));
}
duplicateClusters.sort((a, b) => b.length - a.length);

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
  else if (!nonEmpty(r.description_es) && !nonEmpty(r.description_en)) add(r, 'no_description_either_language');
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

  const locationReviewed = /\[location-review:\s*(?:variable|confidential)\]/i.test(String(r.verification_notes ?? ''));
  if (methods.includes('in_person') && !nonEmpty(r.address_line_1) && !locationReviewed) add(r, 'in_person_without_address');
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
    // description is NOT a publish requirement since migration 005
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
  duplicateClusters, highConfidencePairs, exactSlug: dupExactSlug, orgPlusTitle: dupOrgTitle, sharedPhone: dupPhone, sharedWebsite: dupWebsite, sharedAddress: dupAddress, organizationNameVariants: orgVariants,
}, null, 2));
fs.writeFileSync(path.join(outDir, 'duplicate-clusters.txt'),
  duplicateClusters.map((g, i) => `${i + 1}. [${g.length}] ${g[0].org}\n${g.map(m => `     ${(m.status || '').padEnd(9)} ${m.slug}  ·  "${(m.title || '').replace(/\s+/g, ' ').slice(0, 70)}"`).join('\n')}`).join('\n\n') + '\n');
fs.writeFileSync(path.join(outDir, 'likely-duplicate-pairs.csv'),
  `﻿score,titleSim,summarySim,shared,a_slug,a_status,a_org,a_title,b_slug,b_status,b_org,b_title\n${highConfidencePairs.map(p => [p.score, p.titleSim, p.summarySim, p.sharedAnchors.join(' '), p.a.slug, p.a.status, p.a.org, p.a.title, p.b.slug, p.b.status, p.b.org, p.b.title].map(csvCell).join(',')).join('\n')}\n`);

const statusCounts = records.reduce((m, r) => (m[r.status || 'unknown'] = (m[r.status || 'unknown'] || 0) + 1, m), {});
const summary = {
  total: records.length,
  byStatus: statusCounts,
  duplicates: {
    clusters: duplicateClusters.length,
    recordsInClusters: duplicateClusters.reduce((n, g) => n + g.length, 0),
    highConfidencePairs: highConfidencePairs.length,
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
