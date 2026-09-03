#!/usr/bin/env node

import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-7-address-methods.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const byId = new Map(resources.map(resource => [resource.id, resource]));

const addInPersonIds = [
  '36cce978-6612-4e04-8874-0a54503645eb',
  '622d9262-1590-46f0-a976-b75a1c13ec4d',
  'bb12f176-ea4d-4370-80de-21b47489272b',
  '78fd23b1-9406-49ad-b803-71e3e0c077ac',
  '7ad531f3-582b-45d5-b9c7-c4edf164e26b',
  '8e73d3df-4162-4125-b65e-ef03c3293585',
  'ff866166-7d9e-4d6e-ac4d-7386004157d5',
  'b3cfcb36-4f77-44d5-978c-d66c763d429a',
  'edc2a6d0-c693-4b83-9d1e-a1e4c1e4bc6a'
];

const removeNonServiceAddressIds = [
  'd28a7164-f6b8-4ded-a55a-07ab2e5751fd',
  '5d8f99e2-1f94-43ef-824d-6db420ef9742',
  '3471b448-666e-449a-917d-7b56298439f9',
  '2b71fb0b-d017-4a52-b188-67fe1b23a9cf',
  '1f38b864-ea55-418e-89e3-91cec44a92d6',
  '4f319f20-d10c-4127-b367-821adfe1b5c0',
  '16d516fc-28ce-45c2-b035-a5d9ee23d813',
  'f628a3d6-5aac-4b4a-8286-388271782c88',
  '21f73241-fcef-4258-ae30-48bece224ed4',
  '801a5986-85a8-48fc-920c-0b4ca1142c6a',
  '1f6272c7-a375-4adf-987e-b9f237db57bb',
  '969b11e0-252c-4c6c-bca7-769f4326288c',
  'ccd0d6b2-a99e-4203-96e8-41b68f1385a2',
  'ba71aa96-7a45-40ee-8f26-950d7180e7b9',
  'bd0bfec9-67eb-41bf-a349-f59e6e9e21f8',
  '67120353-9e41-4d94-987d-5b4731a05eea',
  '2529bbca-e9d7-41ed-aba0-24ba610650b4'
];

const operations = [];
for (const id of addInPersonIds) {
  const resource = byId.get(id);
  if (!resource || resource.status === 'archived' || !String(resource.address_line_1 || '').trim()) throw new Error(`Invalid in-person target: ${id}`);
  if ((resource.service_methods || []).includes('in_person')) throw new Error(`Already in person: ${id}`);
  operations.push({
    canonical_id: id,
    expected_canonical_status: resource.status,
    expected_archive_status: resource.status,
    patch: { service_methods: [...new Set([...(resource.service_methods || []), 'in_person'])] },
    archive_ids: []
  });
}

for (const id of removeNonServiceAddressIds) {
  const resource = byId.get(id);
  if (!resource || resource.status === 'archived' || !String(resource.address_line_1 || '').trim()) throw new Error(`Invalid address-removal target: ${id}`);
  operations.push({
    canonical_id: id,
    expected_canonical_status: resource.status,
    expected_archive_status: resource.status,
    patch: {
      address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', county: '',
      latitude: null, longitude: null, geocoded_at: null
    },
    archive_ids: []
  });
}

if (operations.length !== 26) throw new Error(`Expected 26 operations; found ${operations.length}.`);
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, addInPerson: addInPersonIds.length, removeNonServiceAddress: removeNonServiceAddressIds.length }, null, 2));
