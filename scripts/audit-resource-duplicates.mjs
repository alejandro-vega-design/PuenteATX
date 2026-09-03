#!/usr/bin/env node

import fs from 'node:fs';

const [inputFile, outputFile] = process.argv.slice(2);
if (!inputFile || !outputFile) {
  console.error('Usage: node scripts/audit-resource-duplicates.mjs <resources.json> <candidates.csv>');
  process.exit(2);
}

const resources = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
if (!Array.isArray(resources)) throw new Error('Expected a JSON array of resources');

const normalize = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/\bthe\b/g, '')
  .replace(/\band\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const digits = value => String(value || '').replace(/\D/g, '');
const host = value => {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return ''; }
};
const stopwords = new Set('the a an and or de del la el los las y para por con en of for to in is are service services servicio servicios resource resources recurso recursos community comunidad support apoyo central texas county condado program programa'.split(' '));
const tokens = value => new Set(normalize(value).split(' ').filter(token => token.length > 2 && !stopwords.has(token)));
const similarity = (left, right) => {
  const a = tokens(left); const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter(token => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
};
const csv = value => `"${String(value ?? '').replaceAll('"', '""')}"`;

const candidates = [];
for (let leftIndex = 0; leftIndex < resources.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < resources.length; rightIndex += 1) {
    const left = resources[leftIndex]; const right = resources[rightIndex];
    const sameOrganization = normalize(left.organization_name) === normalize(right.organization_name);
    const sameTitleEs = Boolean(normalize(left.title_es)) && normalize(left.title_es) === normalize(right.title_es);
    const sameTitleEn = Boolean(normalize(left.title_en)) && normalize(left.title_en) === normalize(right.title_en);
    const samePhone = digits(left.phone).length >= 10 && digits(left.phone) === digits(right.phone);
    const sameEmail = Boolean(normalize(left.email)) && normalize(left.email) === normalize(right.email);
    const sameWebsite = Boolean(host(left.website_url)) && host(left.website_url) === host(right.website_url);
    const sameAddress = Boolean(normalize(left.address_line_1))
      && normalize(left.address_line_1) === normalize(right.address_line_1)
      && String(left.postal_code || '') === String(right.postal_code || '');
    const titleSimilarity = Math.max(similarity(left.title_es, right.title_es), similarity(left.title_en, right.title_en));
    const bodySimilarity = Math.max(
      similarity(`${left.summary_es} ${left.description_es}`, `${right.summary_es} ${right.description_es}`),
      similarity(`${left.summary_en} ${left.description_en}`, `${right.summary_en} ${right.description_en}`)
    );
    const contactSignals = [samePhone, sameEmail, sameWebsite, sameAddress].filter(Boolean).length;
    let confidence = '';
    if (sameOrganization && (sameTitleEs || sameTitleEn) && (contactSignals || bodySimilarity >= 0.55)) confidence = 'high';
    else if (sameOrganization && contactSignals >= 2 && (titleSimilarity >= 0.2 || bodySimilarity >= 0.3)) confidence = 'high';
    else if (sameOrganization && ((contactSignals >= 2) || ((sameTitleEs || sameTitleEn) && contactSignals === 0))) confidence = 'review';
    else if (!sameOrganization && contactSignals >= 3 && (titleSimilarity >= 0.2 || bodySimilarity >= 0.3)) confidence = 'review';
    if (!confidence) continue;
    const reasons = [sameOrganization && 'organization', sameTitleEs && 'title_es', sameTitleEn && 'title_en', samePhone && 'phone', sameEmail && 'email', sameWebsite && 'website', sameAddress && 'address'].filter(Boolean);
    candidates.push({ confidence, reasons: reasons.join('|'), titleSimilarity, bodySimilarity, left, right });
  }
}

candidates.sort((left, right) => {
  const rank = { high: 0, review: 1 };
  return rank[left.confidence] - rank[right.confidence]
    || left.left.organization_name.localeCompare(right.left.organization_name)
    || right.bodySimilarity - left.bodySimilarity;
});

const headers = ['confidence', 'signals', 'title_similarity', 'content_similarity', 'left_id', 'left_status', 'left_organization', 'left_title', 'left_slug', 'left_created_at', 'right_id', 'right_status', 'right_organization', 'right_title', 'right_slug', 'right_created_at', 'recommended_action', 'review_notes'];
const rows = candidates.map(item => [
  item.confidence, item.reasons, item.titleSimilarity.toFixed(3), item.bodySimilarity.toFixed(3),
  item.left.id, item.left.status, item.left.organization_name, item.left.title_es || item.left.title_en, item.left.slug, item.left.created_at,
  item.right.id, item.right.status, item.right.organization_name, item.right.title_es || item.right.title_en, item.right.slug, item.right.created_at,
  '', ''
]);
fs.writeFileSync(outputFile, `${[headers, ...rows].map(row => row.map(csv).join(',')).join('\n')}\n`);
console.log(`Audited ${resources.length} resources; wrote ${candidates.length} candidate pairs (${candidates.filter(item => item.confidence === 'high').length} high confidence) to ${outputFile}.`);
