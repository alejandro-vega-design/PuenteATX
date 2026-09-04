#!/usr/bin/env node

import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-11-published-locations.mjs <resources.json> <operations.json>');
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

const addressTargets = new Map([
  ['9e02be2f-dabf-4e0d-87ae-4b8aacdba5b4', {
    title_es: 'Vivienda de transición y consejería', title_en: 'Transitional housing and counseling',
    summary_es: 'Ofrece vivienda de transición y servicios de apoyo para madres solteras con hijos y jóvenes que salen del cuidado temporal, además de consejería comunitaria.',
    summary_en: 'Provides transitional housing and support for single mothers with children and young adults leaving foster care, along with community counseling.',
    description_es: 'Los programas Family Care y Home Base brindan vivienda de transición, manejo de casos, capacitación y apoyo para avanzar hacia la estabilidad. Hope Counseling ofrece consejería profesional sin costo a participantes y miembros de la comunidad.',
    description_en: 'Family Care and Home Base provide transitional housing, case management, training, and support toward stability. Hope Counseling offers no-cost professional counseling to participants and community members.',
    address_line_1: '1101 N. Mays Street', address_line_2: '', city: 'Round Rock', state: 'TX', postal_code: '78664', county: 'Williamson',
    website_url: 'https://www.tbch.org/', source_url: 'https://www.tbch.org/Site/Service/Family-Care-Program/FCcontact.aspx', last_verified_at: verified,
    latitude: null, longitude: null, geocoded_at: null
  }],
  ['a922e19a-6fa5-4e4d-8621-48a7d7623ab7', {
    title_es: 'Servicios de apoyo después de la adopción', title_en: 'Post-adoption support services',
    summary_es: 'Ofrece terapia familiar, orientación para padres, capacitación y coordinación de recursos para familias después de una adopción.',
    summary_en: 'Provides family therapy, parent coaching, training, and resource coordination for families after adoption.',
    description_es: 'El programa acompaña a familias adoptivas con terapia, Parent-Child Interaction Therapy, orientación, capacitación, defensa y conexión con servicios comunitarios.',
    description_en: 'The program supports adoptive families through therapy, Parent-Child Interaction Therapy, coaching, training, advocacy, and connections to community services.',
    address_line_1: '1600 Payton Gin Road', address_line_2: '', city: 'Austin', state: 'TX', postal_code: '78758', county: 'Travis',
    website_url: 'https://www.settlementhome.org/post-adoption-services/', source_url: 'https://www.settlementhome.org/post-adoption-services/', last_verified_at: verified,
    latitude: null, longitude: null, geocoded_at: null
  }],
  ['e20bd28c-bbc1-4ff3-89f4-f6493b731344', {
    title_es: 'Cuidado temporal, adopción y apoyo de transición', title_en: 'Foster care, adoption, and transition support',
    summary_es: 'Apoya a familias de cuidado temporal y adopción y a jóvenes que salen del sistema mediante orientación, manejo de casos, mentoría y recursos para la vida independiente.',
    summary_en: 'Supports foster and adoptive families and young adults leaving care through guidance, case management, mentoring, and independent-living resources.',
    description_es: 'Foster In Texas ayuda a familias interesadas en cuidado temporal y adopción. BeREAL ofrece apoyo de transición, vivienda, educación y mentoría para jóvenes que salen del cuidado temporal.',
    description_en: 'Foster In Texas helps families interested in foster care and adoption. BeREAL provides transition, housing, education, and mentoring support for young adults leaving care.',
    address_line_1: '8305 Cross Park Drive', address_line_2: '', city: 'Austin', state: 'TX', postal_code: '78754', county: 'Travis',
    website_url: 'https://upbring.org/', source_url: 'https://upbring.org/contact-us', last_verified_at: verified,
    latitude: null, longitude: null, geocoded_at: null
  }]
]);

const variableTargets = new Map([
  ['10a27315-251e-44b7-8960-80f79a2a980b', resource => ({
    title_es: 'Apoyo para menores y familias vinculados con CPS', title_en: 'Support for children and families involved with CPS',
    summary_es: 'Proporciona artículos esenciales, mentoría, preparación laboral y apoyo de adopción para menores, jóvenes y familias vinculados con Child Protective Services.',
    summary_en: 'Provides essential items, mentoring, career preparation, and adoption support for children, youth, and families involved with Child Protective Services.',
    description_es: 'Sus programas incluyen Rainbow Room, mentoría individual y musical, Holiday Wishes, Heart Gallery y apoyo comunitario para familias relacionadas con el sistema de bienestar infantil.',
    description_en: 'Programs include the Rainbow Room, individual and music mentoring, Holiday Wishes, the Heart Gallery, and community support for families connected to the child-welfare system.',
    website_url: 'https://partnershipsforchildren.org/programs/', source_url: 'https://partnershipsforchildren.org/programs/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['85303f47-6ce4-425d-bbd7-103377ee3183', resource => ({
    title_es: 'Apoyo educativo y necesidades básicas para jóvenes', title_en: 'Education and basic-needs support for youth',
    summary_es: 'Ofrece apoyo académico, alimentos, artículos esenciales, capacitación para la vida y programas de empleo para jóvenes y familias de Georgetown.',
    summary_en: 'Provides academic support, food, essential items, life-skills training, and employment programs for Georgetown youth and families.',
    description_es: 'The Georgetown Project opera programas como NEST Empowerment Center, Bridges to Growth y Summer Youth Employment Program en varias sedes de Georgetown.',
    description_en: 'The Georgetown Project operates programs including the NEST Empowerment Center, Bridges to Growth, and the Summer Youth Employment Program at multiple Georgetown sites.',
    website_url: 'https://www.georgetownproject.org/', source_url: 'https://www.georgetownproject.org/nest-empowerment-center/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['6aaf57ab-6fc3-4e9d-83d8-917a1d53cab3', resource => ({
    title_es: 'Apoyo para menores con un padre gravemente enfermo', title_en: 'Support for children of seriously ill parents',
    summary_es: 'Brinda apoyo gratuito y apropiado para la edad a menores que tienen un padre o cuidador con una enfermedad grave.',
    summary_en: 'Provides free, age-appropriate support to children who have a parent or caregiver with a serious illness.',
    description_es: 'Especialistas en vida infantil ayudan a menores y familias a comprender la enfermedad, expresar emociones y desarrollar habilidades para afrontar cambios. Hay atención presencial y virtual mediante varias oficinas.',
    description_en: 'Child life specialists help children and families understand illness, express emotions, and build coping skills. In-person and virtual services are available through multiple offices.',
    website_url: 'https://wondersandworries.org/', source_url: 'https://wondersandworries.org/our-locations/central-texas/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['084b197a-594d-4614-bbd9-600775df37d6', resource => ({
    title_es: 'Programas de empoderamiento para niñas', title_en: 'Girls empowerment programs',
    summary_es: 'Ofrece programas, conferencias y campamentos que fortalecen la confianza, las habilidades para afrontar retos y la toma de decisiones de niñas y adolescentes.',
    summary_en: 'Offers programs, conferences, and camps that strengthen confidence, coping skills, and decision-making for girls and teens.',
    description_es: 'Los programas Radiant G se ofrecen en escuelas, campamentos y eventos con sedes que varían según la actividad y la inscripción.',
    description_en: 'Radiant G programs are offered through schools, camps, and events whose locations vary by activity and registration.',
    website_url: 'https://www.girlsempowermentnetwork.org/', source_url: 'https://www.girlsempowermentnetwork.org/events', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['53df8be8-d80b-47a7-bec4-47043ef9f377', resource => ({
    title_es: 'Mentoría para estudiantes con padres encarcelados', title_en: 'Mentoring for students with incarcerated parents',
    summary_es: 'Conecta a estudiantes que tienen un padre o cuidador encarcelado con mentores voluntarios para reuniones individuales semanales en su escuela.',
    summary_en: 'Matches students who have an incarcerated parent or caregiver with volunteer mentors for weekly one-to-one meetings at school.',
    description_es: 'Seedling coordina mentoría constante y apoyo académico en más de 120 escuelas del centro de Texas. La sede depende de la escuela participante del estudiante.',
    description_en: 'Seedling coordinates consistent mentoring and academic support across more than 120 Central Texas schools. The location depends on the student’s participating campus.',
    website_url: 'https://www.seedlingmentors.org/', source_url: 'https://www.seedlingmentors.org/adopt-a-seedling-school/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['50672310-7949-49fa-95b4-4e7aff7e4bf2', resource => ({
    title_es: 'Educación al aire libre y sobre alimentos', title_en: 'Outdoor and food education',
    summary_es: 'Ofrece aprendizaje práctico de ciencias, naturaleza, jardinería, cocina y nutrición en escuelas de Austin, además de campamentos y una granja comunitaria.',
    summary_en: 'Provides hands-on science, nature, gardening, cooking, and nutrition education at Austin schools, along with camps and a community farm.',
    description_es: 'Especialistas de PEAS enseñan en jardines, aulas al aire libre y cocinas temporales de escuelas asociadas. También ofrecen campamentos, actividades agrícolas y capacitación para educadores.',
    description_en: 'PEAS specialists teach in gardens, outdoor classrooms, and pop-up kitchens at partner schools. They also offer camps, farm activities, and educator training.',
    website_url: 'https://www.peascommunity.org/', source_url: 'https://www.peascommunity.org/programs-services.html', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })],
  ['1c36da4e-fca1-45c1-a90d-307af32eaeb7', resource => ({
    title_es: 'Orientación universitaria para estudiantes de bajos ingresos', title_en: 'College coaching for students from low-income backgrounds',
    summary_es: 'Ofrece orientación universitaria gratuita y de largo plazo a estudiantes de bajos ingresos mediante escuelas secundarias y universidades asociadas.',
    summary_en: 'Provides free, long-term college coaching to students from low-income backgrounds through partner high schools and colleges.',
    description_es: 'Los estudiantes elegibles reciben acompañamiento para solicitar ingreso, encontrar ayuda financiera, matricularse y avanzar hasta graduarse. La atención ocurre en instituciones asociadas y mediante orientación coordinada.',
    description_en: 'Eligible students receive coaching to apply, find financial aid, enroll, and progress through graduation. Services occur at partner institutions and through coordinated advising.',
    website_url: 'https://collegepossible.org/locations/texas/', source_url: 'https://collegepossible.org/locations/texas/', last_verified_at: verified, verification_notes: reviewedNotes(resource)
  })]
]);

const operations = [];
for (const [id, patch] of addressTargets) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published') throw new Error(`Invalid address target: ${id}`);
  if (matchesPatch(resource, patch)) continue;
  if (String(resource.address_line_1 || '').trim()) throw new Error(`Address target changed unexpectedly: ${id}`);
  operations.push({ canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published', patch, archive_ids: [] });
}
for (const [id, factory] of variableTargets) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published' || String(resource.address_line_1 || '').trim()) throw new Error(`Invalid variable target: ${id}`);
  const patch = factory(resource);
  if (!patch.verification_notes.includes(variableMarker)) throw new Error(`Missing variable marker: ${id}`);
  if (matchesPatch(resource, patch)) continue;
  operations.push({ canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published', patch, archive_ids: [] });
}

const targetCount = addressTargets.size + variableTargets.size;
if (operations.length !== 0 && operations.length !== targetCount) throw new Error(`Expected ${targetCount} initial operations or 0 after completion; found ${operations.length}.`);
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, addressLocations: addressTargets.size, variableLocations: variableTargets.size }, null, 2));
