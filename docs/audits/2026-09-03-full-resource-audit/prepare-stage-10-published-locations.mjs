#!/usr/bin/env node

import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-10-published-locations.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const byId = new Map(resources.map(resource => [resource.id, resource]));
const verified = '2026-09-03';
const variableMarker = '[location-review: variable]';
const matchesPatch = (resource, patch) => Object.entries(patch).every(([key, value]) => JSON.stringify(resource[key] ?? null) === JSON.stringify(value));
const reviewedNotes = resource => {
  const notes = String(resource.verification_notes || '')
    .replace(/Convertido de “Complete Family Resource Guide List\.xlsx”[^.]*\.\s*/giu, '')
    .replace(/Revisar datos y fuente oficial antes de publicar\.?\s*/giu, '')
    .replace(/\[location-review:\s*variable\]/giu, '')
    .trim();
  return [notes, variableMarker].filter(Boolean).join(' ');
};

const targets = new Map([
  ['c81ada7a-35f9-4f2c-8282-303c82c3b30c', {
    address_line_1: '405 Martin Luther King Street', address_line_2: '', city: 'Georgetown', state: 'TX', postal_code: '78626', county: 'Williamson',
    phone: '512-943-3541', source_url: 'https://www.wilcotx.gov/502/Family-Recovery-Court', last_verified_at: verified,
    latitude: null, longitude: null, geocoded_at: null
  }],
  ['37bd8b8e-1c14-47a0-b5e2-b812761ab0c4', resource => ({
    title_es: 'Solicitud de abogado designado por el tribunal', title_en: 'Court-appointed attorney request', phone: '512-943-1959',
    source_url: 'https://www.wilcotx.gov/1807/Indigent-Defense-Request', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['684e5303-f318-4851-ac58-b2c899680469', resource => ({
    title_es: 'Preparación universitaria para jóvenes latinas', title_en: 'College readiness for Latina students',
    summary_es: 'Apoya a estudiantes latinas desde la escuela intermedia hasta la universidad mediante preparación académica, bienestar socioemocional, liderazgo y participación de madres o tutoras.',
    summary_en: 'Supports Latina students from middle school through college with academic preparation, social-emotional development, leadership, and mother or guardian engagement.',
    description_es: 'Con Mi MADRE ofrece sesiones en escuelas, apoyo para la preparación universitaria y profesional, actividades de liderazgo y acompañamiento para estudiantes latinas y sus madres o tutoras.',
    description_en: 'Con Mi MADRE provides school-based sessions, college and career preparation, leadership activities, and ongoing support for Latina students and their mothers or guardians.',
    source_url: 'https://www.conmimadre.org/programming', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['f695bd6c-bf3c-4476-b78c-2262aa8befb8', resource => ({
    title_es: 'Prevención de violencia y consejería escolar', title_en: 'School-based violence prevention and counseling',
    summary_es: 'Ofrece en escuelas capacitación en habilidades para la vida y manejo de la ira, consejería individual y grupal y actividades para estudiantes en mayor riesgo.',
    summary_en: 'Provides school-based life-skills and anger-management training, individual and group counseling, and activities for students at highest risk.',
    description_es: 'El programa escolar de CARY utiliza un currículo de prevención de violencia basado en evidencia con consejería y actividades para fortalecer la confianza y reducir la participación en el sistema de justicia juvenil.',
    description_en: 'CARY delivers an evidence-based, school-based youth violence prevention curriculum with counseling and confidence-building activities intended to reduce juvenile-justice involvement.',
    website_url: 'https://cary4kids.org/', source_url: 'https://cary4kids.org/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['b005b675-a70d-44fb-9af3-cfd2252c65d9', resource => ({
    title_es: 'Chalecos salvavidas y capacitación de seguridad acuática', title_en: 'Life jackets and water-safety training',
    summary_es: 'Proporciona chalecos salvavidas gratuitos a campamentos de verano de Texas y capacitación de seguridad acuática para su personal.',
    summary_en: 'Provides free life jackets to Texas summer camps and water-safety training for camp staff.',
    description_es: 'Los campamentos elegibles pueden solicitar chalecos salvavidas para participantes. El personal debe completar la capacitación de seguridad acuática requerida antes de recibirlos.',
    description_en: 'Eligible camps may apply for life jackets for participants. Staff must complete the required water-safety training before receiving them.',
    website_url: 'https://livelikecati.org/', source_url: 'https://livelikecati.org/application-for-life-jackets/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['2c4a2020-6a11-443c-be76-22b87d68cc87', resource => ({
    summary_es: 'Ofrece artículos esenciales sin costo, apoyo terapéutico y conexiones comunitarias para familias de crianza, parentesco y adopción mediante centros en North Austin y Dripping Springs.',
    summary_en: 'Provides free essential items, therapeutic support, and community connections for foster, kinship, and adoptive families through centers in North Austin and Dripping Springs.',
    description_es: 'Foster Village apoya a cuidadores y menores con artículos para nuevas colocaciones y transiciones, orientación terapéutica y reuniones comunitarias. Los servicios se coordinan mediante dos centros de recursos.',
    description_en: 'Foster Village supports caregivers and children with items for new placements and transitions, therapeutic coaching, and community gatherings. Services are coordinated through two resource centers.',
    website_url: 'https://www.fostervillageaustin.org/', source_url: 'https://www.fostervillageaustin.org/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['0c902098-64b3-4727-80f1-f1c92c9f7f75', resource => ({
    source_url: 'https://egov.uscis.gov/office-locator', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['cf420eae-5eb6-4315-a972-980ff4f43f65', resource => ({
    website_url: 'https://www.trla.org/gethelplassa', source_url: 'https://www.trla.org/gethelplassa', last_verified_at: verified,
    service_methods: [...new Set([...(resource.service_methods || []), 'phone'])], verification_notes: reviewedNotes(resource)
  })],
  ['e6ea2283-56c6-4012-979b-70edad0567b1', resource => ({
    title_es: 'Educación sobre naturaleza y vida silvestre', title_en: 'Nature and wildlife education',
    summary_es: 'Ofrece talleres, campamentos y recursos educativos sobre naturaleza, conservación y vida silvestre en distintos lugares de Texas.',
    summary_en: 'Offers workshops, camps, and educational resources about nature, conservation, and wildlife at locations across Texas.',
    description_es: 'Los programas educativos de Texas Parks and Wildlife incluyen talleres para educadores y experiencias de naturaleza para jóvenes y familias. Las fechas y sedes varían según el programa.',
    description_en: 'Texas Parks and Wildlife education programs include educator workshops and nature experiences for youth and families. Dates and locations vary by program.',
    website_url: 'https://tpwd.texas.gov/education/', source_url: 'https://tpwd.texas.gov/calendar/project-wild-growing-up-wild-workshops', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['01742e09-a7bc-4597-9697-7682b1623521', resource => ({
    title_es: 'Programas y campamentos de Girl Scouts', title_en: 'Girl Scout programs and camps',
    summary_es: 'Ofrece actividades de liderazgo, STEM, servicio comunitario y campamentos para niñas mediante sedes y propiedades en el centro de Texas.',
    summary_en: 'Offers leadership, STEM, community-service, and camp activities for girls through sites and properties across Central Texas.',
    description_es: 'Girl Scouts of Central Texas brinda programas mediante tropas, casas, centros de servicio y campamentos. La ubicación depende de la actividad y la inscripción.',
    description_en: 'Girl Scouts of Central Texas provides programs through troops, houses, service centers, and camps. Location depends on the activity and registration.',
    website_url: 'https://www.gsctx.org/', source_url: 'https://www.gsctx.org/en/discover/our-council/rental-properties.html', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['7d9f192e-046d-4def-8c1b-ef30bbdbbf5a', resource => ({
    title_es: 'Preparación universitaria y apoyo académico', title_en: 'College readiness and academic support',
    summary_es: 'Ofrece apoyo académico gratuito y preparación universitaria de largo plazo para estudiantes que aspiran a ser los primeros de su familia en graduarse de la universidad.',
    summary_en: 'Provides free long-term academic and college-readiness support for students seeking to become the first in their families to graduate from college.',
    description_es: 'Breakthrough Central Texas acompaña a estudiantes mediante programas de verano, apoyo durante el año escolar y orientación para la universidad en varias escuelas y sedes de Austin, Manor y Del Valle.',
    description_en: 'Breakthrough Central Texas supports students through summer programs, school-year advising, and college guidance at multiple schools and sites in Austin, Manor, and Del Valle.',
    website_url: 'https://breakthroughctx.org/', source_url: 'https://breakthroughctx.org/12year/apply/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })]
]);

const operations = [];
for (const [id, patchOrFactory] of targets) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published') throw new Error(`Invalid stage-10 target: ${id}`);
  const patch = typeof patchOrFactory === 'function' ? patchOrFactory(resource) : patchOrFactory;
  if (id !== 'c81ada7a-35f9-4f2c-8282-303c82c3b30c' && !patch.verification_notes.includes(variableMarker)) throw new Error(`Missing variable marker: ${id}`);
  if (matchesPatch(resource, patch)) continue;
  if (id === 'c81ada7a-35f9-4f2c-8282-303c82c3b30c' && String(resource.address_line_1 || '').trim()) throw new Error(`Address target changed unexpectedly: ${id}`);
  operations.push({ canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published', patch, archive_ids: [] });
}

if (operations.length !== 0 && operations.length !== targets.size) throw new Error(`Expected ${targets.size} initial operations or 0 after completion; found ${operations.length}.`);
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, addressLocations: 1, variableLocations: targets.size - 1 }, null, 2));
