#!/usr/bin/env node
import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-20-contact-format-integrity.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const byId = new Map(resources.map(resource => [resource.id, resource]));
const verified = '2026-09-03';
const same = (resource, patch) => Object.entries(patch).every(([key, value]) => JSON.stringify(resource[key] ?? null) === JSON.stringify(value));
const targets = new Map([
  ['a922e19a-6fa5-4e4d-8621-48a7d7623ab7', {
    phone: '512-836-2150',
    application_steps_es: 'Llame al 512-836-2150, extensión 176, o escriba a maveryzellner@settlementhome.org para consultar elegibilidad y solicitar los servicios posteriores a la adopción.',
    application_steps_en: 'Call 512-836-2150, extension 176, or email maveryzellner@settlementhome.org to ask about eligibility and request post-adoption services.',
    last_verified_at: verified,
    verification_notes: 'El número principal se normalizó en el campo de teléfono y la extensión se preservó en las instrucciones de acceso. La ubicación y el carácter presencial del programa se verificaron anteriormente en la página oficial.'
  }],
  ['0de5cb4c-9a5d-4a8a-a7a8-3e2f5a885947', {
    phone: '512-391-0617',
    application_steps_es: 'Llame al 512-391-0617, extensión 713, o escriba a carinne@keepaustinbeautiful.org para consultar programas educativos, disponibilidad y sedes.',
    application_steps_en: 'Call 512-391-0617, extension 713, or email carinne@keepaustinbeautiful.org to ask about education programs, availability, and locations.',
    last_verified_at: verified,
    verification_notes: 'El número principal se normalizó y la extensión se conservó en las instrucciones. Los programas usan escuelas, parques, arroyos y otras sedes variables. [location-review: variable]'
  }],
  ['084b197a-594d-4614-bbd9-600775df37d6', {
    phone: '512-808-4044',
    application_steps_es: 'Llame al 512-808-4044, extensión 805, o consulte el sitio web para confirmar el programa, las fechas, el costo y la sede correspondiente.',
    application_steps_en: 'Call 512-808-4044, extension 805, or check the website to confirm the relevant program, dates, cost, and location.',
    last_verified_at: verified,
    verification_notes: 'El número principal se normalizó y la extensión se preservó en las instrucciones. Las sedes varían según el programa, campamento o evento. [location-review: variable]'
  }],
  ['db30ec56-b7c1-4bed-b0f5-807a68f44478', {
    phone: '512-478-2866',
    application_steps_es: 'Llame al 512-478-2866, extensión 128, para Asuntos Culturales, Económicos y Comunidades, o consulte el sitio del Consulado para el departamento correspondiente.',
    application_steps_en: 'Call 512-478-2866, extension 128, for Cultural, Economic, and Community Affairs, or use the Consulate website to identify the appropriate department.',
    website_url: 'https://consulmex.sre.gob.mx/austin/index.php/contacto',
    source_url: 'https://consulmex.sre.gob.mx/austin/index.php/contacto',
    last_verified_at: verified,
    verification_notes: 'El directorio oficial vigente identifica la extensión 128 para Asuntos Culturales, Económicos y Comunidades. El teléfono base se normalizó y la extensión se trasladó a las instrucciones de acceso.'
  }],
  ['cb14b8fd-d05f-4d23-bfdb-30ebbe0abaa6', {
    phone: '512-476-5321',
    application_steps_es: 'Envíe por correo electrónico un teléfono, un horario para participar en una llamada de tres vías con Austin Energy, la factura vigente y una identificación con fotografía. Para preguntas, llame al 512-476-5321, extensión 114.',
    application_steps_en: 'Email a phone number, a time for a three-way call with Austin Energy, the current bill, and photo identification. For questions, call 512-476-5321, extension 114.',
    last_verified_at: verified,
    verification_notes: 'El número principal se normalizó y la extensión se preservó en las instrucciones de acceso. La solicitud se gestiona por correo electrónico y teléfono; no se presenta la iglesia como lugar de entrega del servicio.'
  }]
]);

const operations = [];
for (const [id, patch] of targets) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published') throw new Error(`Invalid target ${id}`);
  if (!same(resource, patch)) operations.push({
    canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published',
    patch, archive_ids: []
  });
}
if (operations.length !== 0 && operations.length !== targets.size) throw new Error(`Expected ${targets.size} operations or 0; found ${operations.length}`);
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, normalizedPhones: targets.size }, null, 2));
