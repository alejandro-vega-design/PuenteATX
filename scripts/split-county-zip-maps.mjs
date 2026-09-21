// Writes one ZIP-boundary GeoJSON per county for the Insights "needs by ZIP"
// map, in the same shape as public/maps/austin-travis-zip-codes.geojson
// (feature.properties.zip_code). Source: the canonical
// public/maps/central-texas-zip-codes.geojson. Travis keeps its own, more
// detailed file, so it is skipped here.
import fs from 'node:fs';

const source = JSON.parse(fs.readFileSync('public/maps/central-texas-zip-codes.geojson', 'utf8'));
const outDir = 'public/maps/insights-counties';
fs.mkdirSync(outDir, { recursive: true });

const byCounty = new Map();
for (const feature of source.features) {
  const county = feature.properties.county;
  if (!county || county === 'Travis') continue;
  if (!byCounty.has(county)) byCounty.set(county, []);
  byCounty.get(county).push({ type: 'Feature', properties: { zip_code: feature.properties.zip_code }, geometry: feature.geometry });
}
for (const [county, features] of byCounty) {
  const file = `${outDir}/${county.toLowerCase()}.geojson`;
  fs.writeFileSync(file, JSON.stringify({ type: 'FeatureCollection', features }));
  console.log(county.padEnd(11), String(features.length).padStart(2), 'ZIPs', Math.round(fs.statSync(file).size / 1024) + ' KB');
}
