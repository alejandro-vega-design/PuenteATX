#!/usr/bin/env node

import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-8-variable-locations.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const byId = new Map(resources.map(resource => [resource.id, resource]));
const marker = '[location-review: variable]';
const confidentialMarker = '[location-review: confidential]';

const variableIds = [
  '2428ce80-12ca-41f2-b8c4-2e7f97ccc0b2', 'ef4c29a6-c365-45bd-9522-4372e0bcd2f0',
  '61bdd76d-f81b-493a-ab05-584d643c593c', '10825944-0e36-452d-94a3-148363d1ee10',
  'eb50ec57-9f9f-413b-a695-5d9d14744273', '381ceae3-e148-49af-84be-d9a66b5fc351',
  '640c90ee-1db6-40f5-9523-3a873742e909', '58886f56-a383-4fab-9de3-69091c2bb92f',
  '6a4e5f6f-82a4-466d-83ab-c7e908f7081f', 'c336fcb3-3fc8-4767-9bbc-e73dd7f5d974',
  '52e14780-187c-4da0-aa22-8723a2dc8334', 'f2839ead-ac8c-4fc8-a137-5294ba153283',
  '7c12b2f6-3825-479d-932b-e64bf14a6006', '7c09f9be-c599-4f1f-a803-9e13f309540d',
  '2f3dd17c-8a9b-47c0-95fd-499b693273c3', '11d31d56-84c0-4f93-b048-ca140c5d554a',
  '464ffcb3-0fc6-46e9-8613-e581d1f31fa9', '29a68c85-b3d6-431c-be10-9217ef6ea7b3',
  '9705f473-749a-45d8-aa10-c1c7e7b35537', 'd7cdfca1-dd48-419e-9b40-bc26888e1ede',
  '5b5e715c-1154-4c6a-84d5-856bb491db4f', '265e6ee1-0afb-4146-9f65-ace9c5f0fd94',
  '7579a51f-b20b-48d1-803d-565fae885ee7', '84bc6c87-6a0e-4e45-8677-6c6aa9c9242b',
  'c8dbfac7-9f96-46ce-9968-5f58ebec7f72', 'cc1e8755-504a-4bb2-8af6-0b86dd9d9fa3',
  '84e753f7-023c-4527-9a6b-1e8e6871f1dc', '1592590b-5cd6-47c3-931b-fae1ab5710bc',
  '179b818c-3ff0-4748-87d7-42d78891b0de', '61c2eb0e-15e4-4ab3-850d-b0523906648c',
  '7fa18f46-b399-464b-aad2-a7a363e16d3d', '000603d6-1748-4b96-8b53-6199e5631544',
  'a2c84b8d-dea7-4e87-b8bc-8b7b252b3d19', 'c7d5e8eb-2fe9-4426-b76f-df160b7294db',
  'e463ca6b-f0a8-465a-8852-3116fb039d43'
];
const confidentialIds = ['8c649e92-d0c9-48b6-bbbd-020dfc153811'];

const makeOperation = (id, reviewMarker) => {
  const resource = byId.get(id);
  if (!resource || resource.status === 'archived') throw new Error(`Missing active resource: ${id}`);
  if (!(resource.service_methods || []).includes('in_person') || String(resource.address_line_1 || '').trim()) throw new Error(`Resource is not an unresolved in-person/no-address case: ${id}`);
  const current = String(resource.verification_notes || '').trim();
  if (current.includes(reviewMarker)) return null;
  const verification_notes = [current, reviewMarker].filter(Boolean).join(' ');
  return {
    canonical_id: id,
    expected_canonical_status: resource.status,
    expected_archive_status: resource.status,
    patch: { verification_notes },
    archive_ids: []
  };
};

const operations = [
  ...variableIds.map(id => makeOperation(id, marker)),
  ...confidentialIds.map(id => makeOperation(id, confidentialMarker))
].filter(Boolean);
const targetIds = [...variableIds, ...confidentialIds];
if (targetIds.length !== 36 || new Set(targetIds).size !== 36) throw new Error('Expected 36 unique reviewed targets.');
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, variable: variableIds.length, confidential: confidentialIds.length }, null, 2));
