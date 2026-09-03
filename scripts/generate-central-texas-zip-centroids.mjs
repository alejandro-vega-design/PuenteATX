import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [gazetteerZip, relationshipFile, outputFile = 'src/config/centralTexasZipCentroids.js'] = process.argv.slice(2);
if (!gazetteerZip || !relationshipFile) {
  console.error('Usage: node scripts/generate-central-texas-zip-centroids.mjs <2024-gazetteer.zip> <2020-zcta-county.txt> [output.js]');
  process.exit(1);
}

const counties = new Map([
  ['48021', 'Bastrop'],
  ['48053', 'Burnet'],
  ['48055', 'Caldwell'],
  ['48149', 'Fayette'],
  ['48177', 'Gonzales'],
  ['48187', 'Guadalupe'],
  ['48209', 'Hays'],
  ['48287', 'Lee'],
  ['48453', 'Travis'],
  ['48491', 'Williamson']
]);
const countyOrder = ['Travis', 'Williamson', 'Bastrop', 'Hays', 'Caldwell', 'Burnet', 'Lee', 'Fayette', 'Gonzales', 'Guadalupe'];

const relationshipText = fs.readFileSync(relationshipFile, 'utf8').replace(/^\ufeff/, '');
const relationshipRows = relationshipText.trim().split(/\r?\n/).map(line => line.split('|'));
const relationshipHeaders = relationshipRows.shift();
const relIndex = Object.fromEntries(relationshipHeaders.map((header, index) => [header, index]));
const dominantCountyByZip = new Map();
for (const row of relationshipRows) {
  const zipCode = row[relIndex.GEOID_ZCTA5_20];
  const countyFips = row[relIndex.GEOID_COUNTY_20];
  if (!zipCode || !counties.has(countyFips)) continue;
  const landArea = Number(row[relIndex.AREALAND_PART]) || 0;
  const current = dominantCountyByZip.get(zipCode);
  if (!current || landArea > current.landArea) dominantCountyByZip.set(zipCode, { countyFips, landArea });
}

const gazetteerText = execFileSync('unzip', ['-p', gazetteerZip], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const gazetteerRows = gazetteerText.trim().split(/\r?\n/).map(line => line.trim().split(/\t/));
const gazetteerHeaders = gazetteerRows.shift().map(value => value.trim());
const gazIndex = Object.fromEntries(gazetteerHeaders.map((header, index) => [header, index]));
const zipCodes = [];
for (const row of gazetteerRows) {
  const zipCode = row[gazIndex.GEOID];
  const match = dominantCountyByZip.get(zipCode);
  const county = counties.get(match?.countyFips);
  if (!county) continue;
  zipCodes.push({
    zipCode,
    county,
    countyFips: match.countyFips,
    latitude: Number(row[gazIndex.INTPTLAT]),
    longitude: Number(row[gazIndex.INTPTLONG]),
    active: true
  });
}
zipCodes.sort((left, right) => left.zipCode.localeCompare(right.zipCode));

const data = {
  schemaVersion: 1,
  source: {
    name: 'U.S. Census Bureau 2024 Gazetteer and 2020 ZCTA-to-County Relationship File',
    gazetteerYear: 2024,
    relationshipYear: 2020
  },
  counties: countyOrder,
  zipCodes
};
fs.writeFileSync(outputFile, `export default ${JSON.stringify(data, null, 2)};\n`);
console.log(`Wrote ${zipCodes.length} ZIP centroids to ${path.resolve(outputFile)}.`);
