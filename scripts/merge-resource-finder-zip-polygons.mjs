import fs from 'node:fs';
import regionalZipData from '../src/config/centralTexasZipCentroids.js';

const [existingFile = 'public/maps/central-texas-zip-codes.geojson', additionsFile, outputFile = existingFile] = process.argv.slice(2);
if (!additionsFile) {
  console.error('Usage: node scripts/merge-resource-finder-zip-polygons.mjs <existing.geojson> <additions.geojson> [output.geojson]');
  process.exit(1);
}
const existing = JSON.parse(fs.readFileSync(existingFile, 'utf8'));
const additions = JSON.parse(fs.readFileSync(additionsFile, 'utf8'));
const countyByZip = new Map(regionalZipData.zipCodes.map(item => [item.zipCode, item.county]));
const featuresByZip = new Map();
for (const feature of [...existing.features, ...additions.features]) {
  const zipCode = String(feature.properties?.zip_code || feature.properties?.ZCTA5 || '').padStart(5, '0');
  const county = countyByZip.get(zipCode);
  if (!county || !feature.geometry) continue;
  featuresByZip.set(zipCode, { ...feature, properties: { zip_code: zipCode, county } });
}
const missing = regionalZipData.zipCodes.map(item => item.zipCode).filter(zipCode => !featuresByZip.has(zipCode));
if (missing.length) throw new Error(`Missing polygons for configured ZIPs: ${missing.join(', ')}`);
const output = {
  type: 'FeatureCollection',
  metadata: {
    source: 'U.S. Census Bureau TIGERweb, ACS 2025, 2020 Census ZIP Code Tabulation Areas',
    source_url: 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/4',
    retrieved: '2026-09-02',
    note: 'ZCTAs are Census approximations of USPS ZIP Code service areas.'
  },
  features: [...featuresByZip.values()].sort((left, right) => left.properties.zip_code.localeCompare(right.properties.zip_code))
};
fs.writeFileSync(outputFile, `${JSON.stringify(output)}\n`);
console.log(`Wrote ${output.features.length} ZIP polygons to ${outputFile}.`);
