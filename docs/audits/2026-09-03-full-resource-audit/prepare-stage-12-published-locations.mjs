#!/usr/bin/env node

import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-12-published-locations.mjs <resources.json> <operations.json>');
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

const variableTargets = new Map([
  ['7c98a4a6-92bf-4ba7-99a0-3f1f9217008b', resource => ({
    title_es: 'Orientación, grupos y actividades para personas autistas', title_en: 'Navigation, groups, and activities for autistic people',
    summary_es: 'Ofrece orientación sobre autismo, grupos de apoyo para personas autistas y cuidadores, actividades sociales y eventos educativos presenciales y virtuales.',
    summary_en: 'Offers autism navigation, support groups for autistic people and caregivers, social activities, and in-person and virtual educational events.',
    description_es: 'Navigating Autism conecta a familias con información y recursos. Los grupos y actividades se ofrecen en línea y en distintas sedes de Texas; la ubicación depende del grupo o evento.',
    description_en: 'Navigating Autism connects families with information and resources. Groups and activities are offered online and at different Texas locations; the location depends on the group or event.',
    website_url: 'https://www.texasautismsociety.org/', source_url: 'https://www.texasautismsociety.org/support/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['17d7d8cf-38ce-4b5f-952c-5426e84a723f', resource => ({
    title_es: 'Necesidades básicas y oportunidades para jóvenes en cuidado temporal', title_en: 'Basic needs and opportunities for youth in foster care',
    summary_es: 'Atiende solicitudes de artículos esenciales, educación, transporte y otras necesidades de menores y jóvenes en cuidado temporal del centro de Texas.',
    summary_en: 'Fulfills requests for essential items, education, transportation, and other needs of children and young adults in Central Texas foster care.',
    description_es: 'Las solicitudes son presentadas por trabajadores de CPS, CASA, agencias, familias de cuidado temporal y otros profesionales. La entrega o recogida se coordina según la solicitud y no ocurre en una sola sede pública.',
    description_en: 'Requests are submitted by CPS workers, CASA, agencies, foster families, and other professionals. Delivery or pickup is coordinated for each request and does not occur at one public service location.',
    service_methods: ['in_person', 'online', 'phone'], website_url: 'https://www.fosterangelsctx.org/', source_url: 'https://www.fosterangelsctx.org/every-child-every-day', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['d8a4c908-3fc6-4462-8f83-6b47945f1185', resource => ({
    title_es: 'Clubes de acondicionamiento físico y campamentos juveniles', title_en: 'Youth fitness clubs and camps',
    summary_es: 'Ofrece clubes extraescolares de carrera, ciclismo y yoga, además de campamentos de vacaciones y verano para niñas y niños.',
    summary_en: 'Offers after-school running, biking, and yoga clubs, plus school-break and summer camps for children.',
    description_es: 'Los clubes se realizan en escuelas y parques participantes. Los campamentos y recorridos usan distintos parques y destinos; la sede se indica al inscribirse. Hay becas disponibles.',
    description_en: 'Clubs meet at participating schools and parks. Camps and outings use different parks and destinations; the location is provided during registration. Scholarships are available.',
    website_url: 'https://www.austinyouthfitness.com/', source_url: 'https://www.austinyouthfitness.com/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['eb2b6233-ade9-4cc5-885a-785ef5d682db', resource => ({
    title_es: 'Programa extraescolar de salud y liderazgo', title_en: 'After-school health and leadership program',
    summary_es: 'Ayuda a estudiantes de secundaria a fortalecer su salud física y mental mediante ejercicio, nutrición, gratitud, trabajo en equipo y servicio comunitario.',
    summary_en: 'Helps high school students strengthen physical and mental health through fitness, nutrition, gratitude, teamwork, and community service.',
    description_es: 'El programa gratuito se ofrece después de clases en escuelas secundarias participantes, incluida Akins High School en Austin. La sede depende de la escuela donde está inscrito el estudiante.',
    description_en: 'The free after-school program operates at participating high schools, including Akins High School in Austin. The location depends on the student’s participating school.',
    website_url: 'https://jklivinfoundation.org/', source_url: 'https://jklivinfoundation.org/wp-content/uploads/2024/06/JKL-AnnualReport.pdf', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['0de5cb4c-9a5d-4a8a-a7a8-3e2f5a885947', resource => ({
    title_es: 'Educación ambiental y proyectos de limpieza', title_en: 'Environmental education and cleanup projects',
    summary_es: 'Ofrece educación ambiental gratuita, excursiones y proyectos de servicio sobre reciclaje, agua, hábitat y cuidado de espacios públicos.',
    summary_en: 'Offers free environmental education, field trips, and service projects about recycling, water, habitat, and care for public spaces.',
    description_es: 'Los programas atienden escuelas, grupos juveniles y campamentos; las actividades ocurren en planteles, arroyos, parques y otros espacios comunitarios según el proyecto.',
    description_en: 'Programs serve schools, youth groups, and camps; activities take place at campuses, creeks, parks, and other community spaces depending on the project.',
    website_url: 'https://keepaustinbeautiful.org/', source_url: 'https://keepaustinbeautiful.org/educate/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['1eb2779a-7fd2-4524-a9d4-2f66924afa2b', resource => ({
    title_es: 'Centros escolares de recursos para familias', title_en: 'School-based family resource centers',
    summary_es: 'Conecta a familias con alimentos, vivienda, atención médica, empleo, educación y otros apoyos mediante centros de recursos ubicados en escuelas.',
    summary_en: 'Connects families with food, housing, health care, employment, education, and other support through resource centers located at schools.',
    description_es: 'Los Family Resource Centers coordinan ayuda y actividades comunitarias desde varias escuelas del área de Austin. La sede depende del centro que atiende a la familia.',
    description_en: 'Family Resource Centers coordinate assistance and community activities from multiple Austin-area schools. The location depends on the center serving the family.',
    website_url: 'https://www.austinvoices.org/', source_url: 'https://www.austinvoices.org/wp-content/uploads/2024/02/Campaign-for-the-Future-Strategic-Plan-Final-Edit-Rev-2-21-23-Comp.pdf', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['2ddc9f82-7c49-4781-9c1e-b81cbef39535', resource => ({
    title_es: 'Observación de aves y educación ambiental para jóvenes', title_en: 'Youth birding and environmental education',
    summary_es: 'Ofrece caminatas guiadas, actividades educativas y experiencias de observación de aves para jóvenes y familias.',
    summary_en: 'Offers guided walks, educational activities, and birding experiences for youth and families.',
    description_es: 'Las actividades incluyen excursiones del Young Birders Club, eventos en reservas naturales y programación especial. La ubicación cambia según el evento publicado.',
    description_en: 'Activities include Young Birders Club field trips, events at nature preserves, and special programming. The location varies by posted event.',
    website_url: 'https://travisaudubon.org/', source_url: 'https://travisaudubon.org/events', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['3a9cfb2b-3c64-46fb-981d-cb0cc1a101ba', resource => ({
    title_es: 'Educación sobre vida silvestre y conservación', title_en: 'Wildlife and conservation education',
    summary_es: 'Ofrece recursos educativos gratuitos sobre la vida silvestre, el agua y la conservación de Texas para estudiantes y educadores.',
    summary_en: 'Offers free educational resources about Texas wildlife, water, and conservation for students and educators.',
    description_es: 'Los recursos incluyen la revista Critter Connections, lecciones a distancia y programas educativos que pueden realizarse en línea, en aulas o en sedes programadas.',
    description_en: 'Resources include Critter Connections magazine, distance learning, and educational programs delivered online, in classrooms, or at scheduled locations.',
    website_url: 'https://www.texas-wildlife.org/', source_url: 'https://www.texas-wildlife.org/program-areas/youth-education/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['6c0c4768-3cad-4e52-b3cd-67f0bcb006ce', resource => ({
    title_es: 'Monitoreo de ríos y educación ambiental extraescolar', title_en: 'After-school river monitoring and environmental education',
    summary_es: 'Ofrece a estudiantes de secundaria educación ambiental práctica, monitoreo de la calidad del agua, servicio comunitario y actividades al aire libre.',
    summary_en: 'Provides high school students with hands-on environmental education, water-quality monitoring, community service, and outdoor activities.',
    description_es: 'El programa recoge a estudiantes en escuelas participantes y realiza actividades semanales en distintos arroyos y espacios naturales. Incluye transporte, alimentos y un estipendio de participación.',
    description_en: 'The program picks up students at participating schools and holds weekly activities at different creeks and natural areas. Transportation, food, and a participation stipend are included.',
    website_url: 'https://riverwatchers.org/', source_url: 'https://riverwatchers.org/after-school-program/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })]
]);

const directTargets = new Map([
  ['2cf67bff-cb89-4145-bcaa-06eea395e39a', resource => ({
    title_es: 'Cobertura médica STAR y CHIP para familias', title_en: 'STAR and CHIP health coverage for families',
    summary_es: 'Administra beneficios médicos STAR Medicaid y CHIP y ayuda a sus miembros a encontrar proveedores de atención médica y salud conductual dentro de la red.',
    summary_en: 'Manages STAR Medicaid and CHIP health benefits and helps members find in-network medical and behavioral health providers.',
    description_es: 'Las familias elegibles reciben cobertura y beneficios adicionales mediante una red local de médicos y clínicas. Servicios para Miembros ayuda por teléfono y el sitio ofrece un buscador de proveedores; la atención presencial ocurre con el proveedor seleccionado, no en una sede única del plan.',
    description_en: 'Eligible families receive coverage and extra benefits through a local network of doctors and clinics. Member Services provides phone assistance and the website offers a provider directory; in-person care occurs with the selected provider, not at one health-plan location.',
    service_methods: ['phone', 'online'], phone: '855-921-6284', email: '', website_url: 'https://dellchildrenshealthplan.com/', source_url: 'https://dellchildrenshealthplan.com/for-members/how-your-plan-works/', last_verified_at: verified,
    verification_notes: String(resource.verification_notes || '').replace(/Convertido de “Complete Family Resource Guide List\.xlsx”[^.]*\.\s*/giu, '').replace(/Revisar datos y fuente oficial antes de publicar\.?\s*/giu, '').replace(/\[location-review:\s*variable\]/giu, '').trim()
  })]
]);

const operations = [];
for (const [id, factory] of variableTargets) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published' || String(resource.address_line_1 || '').trim()) throw new Error(`Invalid variable target: ${id}`);
  const patch = factory(resource);
  if (!patch.verification_notes.includes(variableMarker)) throw new Error(`Missing variable marker: ${id}`);
  if (!matchesPatch(resource, patch)) operations.push({ canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published', patch, archive_ids: [] });
}
for (const [id, factory] of directTargets) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published' || String(resource.address_line_1 || '').trim()) throw new Error(`Invalid direct target: ${id}`);
  const patch = factory(resource);
  if (patch.service_methods.includes('in_person')) throw new Error(`Direct target retains unsupported in_person: ${id}`);
  if (!matchesPatch(resource, patch)) operations.push({ canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published', patch, archive_ids: [] });
}

const targetCount = variableTargets.size + directTargets.size;
if (operations.length !== 0 && operations.length !== targetCount) throw new Error(`Expected ${targetCount} initial operations or 0 after completion; found ${operations.length}.`);
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, variableLocations: variableTargets.size, correctedMethods: directTargets.size }, null, 2));
