#!/usr/bin/env node

import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-safe-fixes.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const active = resources.filter(resource => ['published', 'draft'].includes(resource.status));
const patches = new Map();
const patch = (resource, values) => patches.set(resource.id, { ...(patches.get(resource.id) || {}), ...values });

const stripTracking = value => {
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref$|si$)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
};
const formatPhone = value => {
  const extension = String(value).match(/(?:ext\.?|x)\s*(\d+)\s*$/i)?.[1] || '';
  let number = String(value).replace(/(?:ext\.?|x)\s*\d+\s*$/i, '').replace(/\D/g, '');
  if (number.length === 11 && number.startsWith('1')) number = number.slice(1);
  if (number.length !== 10) return value;
  const formatted = `${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
  return extension ? `${formatted} ext. ${extension}` : formatted;
};

for (const resource of active) {
  if (/^Puente\s?ATX$/i.test(String(resource.source_url || '').trim())) {
    const signature = 'Verificado directamente por Puente ATX.';
    const notes = String(resource.verification_notes || '').trim();
    patch(resource, {
      source_url: 'https://puenteatx.org',
      verification_notes: /verificado directamente por puente atx/i.test(notes) ? notes : `${notes}${notes ? '\n' : ''}${signature}`
    });
  }
  for (const field of ['website_url', 'source_url']) {
    const value = String(resource[field] || '').trim();
    if (!value || !/[?&](utm_|fbclid|gclid|mc_cid|mc_eid|ref=|si=)/i.test(value)) continue;
    patch(resource, { [field]: stripTracking(value) });
  }
  if (resource.phone) {
    const formatted = formatPhone(resource.phone);
    if (formatted !== resource.phone) patch(resource, { phone: formatted });
  }
}

const futureDate = active.find(resource => resource.id === '50591043-0e94-47bb-8e30-7a9dd272465a');
if (!futureDate || futureDate.last_verified_at !== '2026-09-28') throw new Error('Future-date precondition failed.');
patch(futureDate, { last_verified_at: '2026-09-03' });

const hoursEn = new Map([
  ['8909eca7-2057-4a5d-88af-35f40f0cb002', 'Hours are not published; advance registration through “Request for Counseling” is required.'],
  ['6fb636e3-f6b5-4faa-99f8-a284f3054576', 'Delivery Monday–Friday.'],
  ['c7d5e8eb-2fe9-4426-b76f-df160b7294db', 'Online 24/7 through YourTexasBenefits.com; HHSC offices have their own hours.'],
  ['acbc17f1-ec65-47fc-93f7-00e68e3c0c0a', 'Country Bus: Monday–Friday, 8 a.m.–4 p.m.; San Marcos paratransit: 7 a.m.–6 p.m.; advance reservations are required.'],
  ['ad05bbf6-8ec8-41b1-9c3f-df476c3acc9d', 'Varies by center.'],
  ['1d5c0fd4-3e2a-4d75-a2a2-d2fcd2fffb61', 'Dates and hours vary; check the online “Find Food Now” tool.'],
  ['c5402ac3-c220-4995-937d-3b1673a613a9', 'Waiting lists are reported as “very long.”'],
  ['d9b16bbc-d6e2-48e6-a5ab-9e9d5ab3f5a0', 'Monday–Thursday, 8 a.m.–5 p.m.; Friday, 8 a.m.–3 p.m.'],
  ['31c1c110-4cbf-4a00-9d0e-3892893a2cf5', 'Schedule at least 2 business days ahead for in-county appointments and 5 business days ahead for out-of-county appointments; urgent exceptions may be available with less than 48 hours’ notice.'],
  ['3a9d1256-af01-4769-bb61-8cf9b7d3e945', 'Day and evening classes vary by location.'],
  ['fd2760f6-81c5-4dd7-8729-ebd0de85a85b', 'School office hours.'],
  ['6b6206fb-08ba-4230-9456-88d4359a1da6', 'Second and fourth weeks of each month, Monday–Thursday, 9 a.m.–5 p.m. (Austin).'],
  ['dc30539b-1f5e-4176-ae79-2d9aa4d53b74', 'Monday–Friday, 8 a.m.–4 p.m.; Spanish is available Monday–Friday, 8 a.m.–3 p.m. through a bilingual representative.'],
  ['7b215691-6eb6-4155-8e57-c96b1a28348e', 'Monthly meetings from March through November; annual banquet in November.'],
  ['4075ac63-2b76-4020-8dfe-ea07a761d25d', 'Varies by program.'],
  ['179b818c-3ff0-4748-87d7-42d78891b0de', 'Extended care until 6 p.m.; summer camp, 7 a.m.–6 p.m.']
]);
for (const [id, translation] of hoursEn) {
  const resource = active.find(item => item.id === id);
  if (!resource || !resource.hours_es || resource.hours_en) throw new Error(`Hours precondition failed for ${id}.`);
  patch(resource, { hours_en: translation });
}

const identicalHours = active.find(resource => resource.id === 'b6ddcd4a-db8d-4c8e-aa55-c3e4d34d9f4b');
if (!identicalHours || identicalHours.hours_es !== identicalHours.hours_en) throw new Error('Identical-hours precondition failed.');
patch(identicalHours, {
  hours_es: 'Despensa de alimentos: primer, segundo y tercer sábado, 9:30 a.m.–12:30 p.m.\nConfirma el horario vigente antes de visitar.\nOficina principal: 512-478-7578'
});

const operations = [...patches].map(([id, values]) => {
  const resource = active.find(item => item.id === id);
  return {
    canonical_id: id,
    expected_canonical_status: resource.status,
    expected_archive_status: 'draft',
    patch: values,
    archive_ids: []
  };
});
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, fields: operations.reduce((count, item) => count + Object.keys(item.patch).length, 0) }, null, 2));
