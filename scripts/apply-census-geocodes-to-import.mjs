import fs from 'node:fs';
import { parseCsv } from '../src/data/csvImport.js';

const [csvFile, censusResultsFile, outputFile = csvFile, auditFile] = process.argv.slice(2);
if (!csvFile || !censusResultsFile) {
  console.error('Usage: node scripts/apply-census-geocodes-to-import.mjs <import.csv> <census-results.csv> [output.csv] [audit.csv]');
  process.exit(1);
}
const source = parseCsv(fs.readFileSync(csvFile, 'utf8'));
const results = parseRows(fs.readFileSync(censusResultsFile, 'utf8'));
const byRow = new Map(results.map(row => [Number(row[0]), row]));
let matched = 0;
const rows = source.records.map(record => {
  const values = { ...record.values };
  const result = byRow.get(record.rowNumber);
  if (result?.[2] === 'Match' && /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(result[5] || '')) {
    const [longitude, latitude] = result[5].split(',');
    values.latitude = latitude;
    values.longitude = longitude;
    values.verification_notes = `${values.verification_notes} Geocodificación Census Bureau: ${result[3] || 'Match'}; dirección normalizada: ${result[4]}.`.trim();
    matched += 1;
  }
  return source.headers.map(header => values[header] || '');
});
fs.writeFileSync(outputFile, encode([source.headers, ...rows]));
if (auditFile) {
  const auditRows = [['csv_row', 'status', 'match_type', 'matched_address', 'coordinates'], ...results.map(row => [row[0] || '', row[2] || '', row[3] || '', row[4] || '', row[5] || ''])];
  fs.writeFileSync(auditFile, encode(auditRows));
}
console.log(`Applied ${matched} unique Census matches; ${results.length - matched} rows remain unmapped.`);

function parseRows(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(row => row.length > 1);
}
function encode(rows) { return `${rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')}\n`; }
