#!/usr/bin/env node
import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-15-published-locations.mjs <resources.json> <operations.json>');

const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const byId = new Map(resources.map(resource => [resource.id, resource]));
const verified = '2026-09-03';
const variableMarker = '[location-review: variable]';
const confidentialMarker = '[location-review: confidential]';
const same = (resource, patch) => Object.entries(patch).every(([key, value]) => JSON.stringify(resource[key] ?? null) === JSON.stringify(value));
const cleanNotes = resource => String(resource.verification_notes || '')
  .replace(/Convertido de “Complete Family Resource Guide List\.xlsx”[^.]*\.\s*/giu, '')
  .replace(/Revisar datos y fuente oficial antes de publicar\.?\s*/giu, '')
  .replace(/La fuente recomienda verificar nuevamente por teléfono antes de publicar; información web menos actualizada\.?\s*/giu, '')
  .replace(/\[location-review:\s*(?:variable|confidential)\]/giu, '')
  .trim();
const withMarker = (resource, marker) => [cleanNotes(resource), marker].filter(Boolean).join(' ');

const address = new Map([
  ['6aaaceb5-440b-463b-b09b-81c9752bc509', {
    summary_es: 'Ofrece alfabetización básica, clases de inglés como segundo idioma y preparación para el GED para personas adultas en el condado de Williamson.',
    summary_en: 'Offers basic literacy, English as a second language, and GED preparation for adults in Williamson County.',
    description_es: 'Ayuda a personas adultas a mejorar lectura, escritura e inglés y a prepararse para obtener la equivalencia de high school. Comuníquese para confirmar el calendario, los costos y la disponibilidad actuales.',
    description_en: 'Helps adults improve reading, writing, and English skills and prepare for a high school equivalency credential. Contact the program to confirm its current schedule, fees, and availability.',
    phone: '512-869-0497',
    email: 'info@literacycouncilwilco.org',
    website_url: 'https://www.literacycouncilwilco.org/',
    address_line_1: '805 West University Avenue', address_line_2: '', city: 'Georgetown', state: 'TX', postal_code: '78626', county: 'Williamson',
    latitude: null, longitude: null, geocoded_at: null,
    source_url: 'https://www.sctexas.org/Files/Library/27970/WilcoSunNov262025.pdf',
    last_verified_at: verified,
    verification_notes: 'Dirección, teléfono y servicios confirmados en el directorio comunitario de Williamson County publicado en noviembre de 2025.'
  }],
  ['180d2b16-e6f5-47b5-92fa-44df43637545', {
    title_es: 'Lacrosse gratuito para jóvenes', title_en: 'Free youth lacrosse',
    summary_es: 'Ofrece programación gratuita de lacrosse y desarrollo juvenil para estudiantes de kínder a octavo grado, con equipo incluido.',
    summary_en: 'Offers free lacrosse and youth-development programming for students in kindergarten through eighth grade, with equipment provided.',
    description_es: 'Los programas de Austin reciben a principiantes y jugadores con experiencia. La programación de primavera se realiza en Montopolis Recreation Center; confirme la sesión vigente antes de asistir.',
    description_en: 'Austin programs welcome beginners and experienced players. Spring programming is held at Montopolis Recreation Center; confirm the current session before attending.',
    service_methods: ['in_person', 'online'], cost_type: 'free',
    website_url: 'https://bridgelacrosse.org/austin-spring',
    address_line_1: '1200 Montopolis Drive', address_line_2: '', city: 'Austin', state: 'TX', postal_code: '78741', county: 'Travis',
    latitude: null, longitude: null, geocoded_at: null,
    source_url: 'https://bridgelacrosse.org/austin-spring', last_verified_at: verified, verification_notes: ''
  }],
  ['f114ecc1-49ca-4a76-ac67-cf07dc060373', {
    title_es: 'Compra de vivienda asequible y orientación', title_en: 'Affordable homeownership and housing counseling',
    summary_es: 'Ayuda a hogares elegibles a comprar una vivienda asequible y ofrece orientación para compradores y propietarios.',
    summary_en: 'Helps eligible households purchase an affordable home and provides counseling for homebuyers and homeowners.',
    description_es: 'Los servicios incluyen orientación financiera y de vivienda, preparación para comprar casa y programas de propiedad de vivienda. La oficina de Ben White recibe clientes para orientación con cita.',
    description_en: 'Services include financial and housing counseling, homebuyer preparation, and homeownership programs. The Ben White office meets with counseling clients by appointment.',
    service_methods: ['in_person', 'online', 'phone'],
    website_url: 'https://austinhabitat.org/programs/',
    address_line_1: '500 W Ben White Boulevard', address_line_2: '', city: 'Austin', state: 'TX', postal_code: '78704', county: 'Travis',
    latitude: null, longitude: null, geocoded_at: null,
    source_url: 'https://austinhabitat.org/programs/housingcounseling/', last_verified_at: verified, verification_notes: ''
  }]
]);

const variable = new Map([
  ['8f77124b-79e0-406e-b2bd-ceb422004b23', resource => ({
    title_es: 'Clases extraescolares de música', title_en: 'After-school music classes',
    summary_es: 'Ofrece educación musical extraescolar gratuita a jóvenes mediante clases impartidas por músicos locales en escuelas y sedes asociadas.',
    summary_en: 'Provides free after-school music education for youth through classes taught by local musicians at schools and partner sites.',
    description_es: 'Las clases desarrollan creatividad, confianza y habilidades para la vida. La escuela o sede depende del programa y se confirma al inscribirse.',
    description_en: 'Classes build creativity, confidence, and life skills. The school or partner location depends on the program and is confirmed during enrollment.',
    website_url: 'https://beat4beat.org/', source_url: 'https://beat4beat.org/', last_verified_at: verified,
    verification_notes: withMarker(resource, variableMarker)
  })],
  ['e2b49b45-73e8-4905-b97e-01ab1e099a9d', resource => ({
    title_es: 'Distribución de alimentos, ropa y artículos básicos', title_en: 'Food, clothing, and basic-item distributions',
    summary_es: 'Distribuye alimentos, ropa, zapatos y otros artículos básicos a personas sin hogar y comunidades con pocos recursos.',
    summary_en: 'Distributes food, clothing, shoes, and other essential items to people experiencing homelessness and underserved communities.',
    description_es: 'La ayuda se entrega mediante eventos y distribuciones en sedes anunciadas. Consulte la organización para conocer la próxima fecha y ubicación.',
    description_en: 'Help is provided through events and distributions at announced locations. Check with the organization for the next date and location.',
    phone: '832-535-4140', email: 'kkd.upliftaustin@gmail.com', website_url: 'https://www.uplifttexas.org/', source_url: 'https://www.uplifttexas.org/our-vision', last_verified_at: verified,
    verification_notes: withMarker(resource, variableMarker)
  })],
  ['52ab99cc-b7b3-4426-a7c9-74df09a8defa', resource => ({
    title_es: 'Campamento tecnológico para jóvenes LGBT+', title_en: 'Technology camp for LGBT+ youth',
    summary_es: 'Ofrece campamentos gratuitos de tecnología para jóvenes LGBT+ de 14 a 19 años, con programación, diseño de videojuegos y medios digitales.',
    summary_en: 'Offers free technology camps for LGBT+ youth ages 14–19 featuring coding, game design, and digital media.',
    description_es: 'Hay opciones presenciales en el área de Austin y un campamento nacional en línea. Las sedes y fechas dependen de la sesión publicada; no se requiere experiencia previa.',
    description_en: 'Options include in-person sessions in the Austin area and a national online camp. Locations and dates depend on the posted session, and no prior experience is required.',
    eligibility_es: 'Jóvenes LGBT+ de 14 a 19 años; consulte cada sesión para confirmar requisitos.',
    eligibility_en: 'LGBT+ youth ages 14–19; check each session for current requirements.',
    service_methods: ['in_person', 'online'], website_url: 'https://www.mavenyouth.org/summer-camps', source_url: 'https://www.mavenyouth.org/summer-camps', last_verified_at: verified,
    verification_notes: withMarker(resource, variableMarker)
  })],
  ['0582465d-96a1-4806-a237-22ee6bed50d3', resource => ({
    title_es: 'Aventuras al aire libre para mujeres y menores negros y morenos', title_en: 'Outdoor adventures for Black and Brown women and children',
    summary_es: 'Organiza experiencias recreativas y aventuras que conectan con la naturaleza a mujeres y menores negros y morenos.',
    summary_en: 'Organizes recreation and adventure experiences that connect Black and Brown women and children with nature.',
    description_es: 'Las actividades buscan fortalecer la comunidad, la confianza y el acceso a espacios al aire libre. La sede cambia según la actividad anunciada.',
    description_en: 'Activities are designed to build community, confidence, and access to outdoor spaces. Locations vary by announced activity.',
    website_url: 'https://www.blackwomenwho.com/', source_url: 'https://www.blackwomenwho.com/', last_verified_at: verified,
    verification_notes: withMarker(resource, variableMarker)
  })],
  ['11faa1df-af1b-4123-a1d5-bbe2e14dd076', resource => ({
    title_es: 'GenYW: bienestar y desarrollo socioemocional para jóvenes', title_en: 'GenYW youth wellness and social-emotional learning',
    summary_es: 'Ofrece grupos educativos gratuitos que fortalecen la resiliencia, el aprendizaje socioemocional, la autorregulación y el bienestar de jóvenes.',
    summary_en: 'Offers free educational groups that build youth resilience, social-emotional learning, self-regulation, and well-being.',
    description_es: 'GenYW trabaja con estudiantes mediante grupos en escuelas y actividades comunitarias que pueden incorporar movimiento, arte y STEAM. La sede depende de la escuela, el programa o el evento.',
    description_en: 'GenYW works with students through school-based groups and community activities that may include movement, art, and STEAM. The location depends on the school, program, or event.',
    phone: '512-326-1222', service_methods: ['in_person', 'online'], website_url: 'https://www.ywcaaustin.org/genyw/', source_url: 'https://www.ywcaaustin.org/genyw/', last_verified_at: verified,
    verification_notes: withMarker(resource, variableMarker)
  })]
]);

const confidential = new Map([
  ['7ae4b2a1-43b3-49ef-8c4a-f639bb574817', resource => ({
    title_es: 'Terapia bilingüe para ansiedad, trauma y bienestar emocional', title_en: 'Bilingual therapy for anxiety, trauma, and emotional wellness',
    source_url: 'https://www.mananacounseling.com/', last_verified_at: verified,
    verification_notes: withMarker(resource, confidentialMarker)
  })]
]);

const operations = [];
for (const [id, patch] of address) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published') throw new Error(`Invalid address target: ${id}`);
  if (resource.address_line_1 && !same(resource, patch)) throw new Error(`Address target changed: ${id}`);
  if (!same(resource, patch)) operations.push({ canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published', patch, archive_ids: [] });
}
for (const [id, factory] of variable) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published' || resource.address_line_1) throw new Error(`Invalid variable target: ${id}`);
  const patch = factory(resource);
  if (!patch.verification_notes.includes(variableMarker)) throw new Error(`Missing variable marker: ${id}`);
  if (!same(resource, patch)) operations.push({ canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published', patch, archive_ids: [] });
}
for (const [id, factory] of confidential) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published' || resource.address_line_1) throw new Error(`Invalid confidential target: ${id}`);
  const patch = factory(resource);
  if (!patch.verification_notes.includes(confidentialMarker)) throw new Error(`Missing confidential marker: ${id}`);
  if (!same(resource, patch)) operations.push({ canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published', patch, archive_ids: [] });
}

const total = address.size + variable.size + confidential.size;
if (operations.length !== 0 && operations.length !== total) throw new Error(`Expected ${total} operations or 0; found ${operations.length}`);
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, addressLocations: address.size, variableLocations: variable.size, confidentialLocations: confidential.size }, null, 2));
