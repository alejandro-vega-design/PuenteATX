#!/usr/bin/env node
/**
 * Splits public/maps/central-texas-zip-codes.geojson — the canonical, merged
 * source of all approved ZIP polygons (kept up to date via
 * merge-resource-finder-zip-polygons.mjs) — into one small GeoJSON file per ZIP
 * under public/maps/zip-boundaries/<zip>.geojson.
 *
 * Why: the resource map only ever draws the outline of the ONE ZIP a visitor
 * searched, but was fetching the entire combined file (all 140 ZIPs, ~150-185KB
 * compressed) on every visit regardless of which one was needed. Each split file
 * is ~1-2KB, so a visit now costs roughly 1% of that for this asset. Adding more
 * approved ZIPs in the future doesn't cost existing visitors anything extra: this
 * script regenerates the full set of small files each time, and every visitor
 * still only ever fetches their own.
 *
 * Runs automatically before `vite build` (see package.json) so the split files
 * can never drift from the source file on a real deploy; also committed to the
 * repo so `npm run dev` (which doesn't run this) has them too. Re-run manually
 * after editing the source file (e.g. via merge-resource-finder-zip-polygons.mjs)
 * to refresh the committed copies:
 *
 *   node scripts/split-zip-boundaries.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = path.join(projectRoot, 'public/maps/central-texas-zip-codes.geojson');
const outDir = path.join(projectRoot, 'public/maps/zip-boundaries');

const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
for (const existing of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, existing));

let count = 0;
for (const feature of source.features) {
  const zip = feature.properties?.zip_code;
  if (!zip) continue;
  const collection = { type: 'FeatureCollection', features: [feature] };
  fs.writeFileSync(path.join(outDir, `${zip}.geojson`), JSON.stringify(collection));
  count++;
}
console.log(`Wrote ${count} per-ZIP boundary files to ${path.relative(projectRoot, outDir)}/`);
