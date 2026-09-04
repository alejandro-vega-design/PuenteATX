#!/usr/bin/env node
import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-16-geography-and-integrity.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const byId = new Map(resources.map(resource => [resource.id, resource]));
const verified = '2026-09-03';
const ids = {
  tlsc: '701f1343-57dc-4616-9bf6-c6582bd42593',
  tlscDuplicate: '45d1f506-6093-411c-93f6-3e766cd8c226',
  communityAction: 'ff8d025b-295a-4b1f-9a09-26ca5ea8f787',
  combinedAction: 'd9b16bbc-d6e2-48e6-a5ab-9e9d5ab3f5a0',
  halcyon: 'e30fd355-274e-4f5f-9a73-427037fca0e3',
  sacredHeart: 'ada9dadc-4ec8-4907-a707-d4007f35690f'
};
const same = (resource, patch) => Object.entries(patch).every(([key, value]) => JSON.stringify(resource[key] ?? null) === JSON.stringify(value));
const operation = (id, expectedStatus, patch, archiveIds = [], additionalCategoryIds) => ({
  canonical_id: id,
  expected_canonical_status: expectedStatus,
  expected_archive_status: 'published',
  patch,
  archive_ids: archiveIds,
  ...(additionalCategoryIds ? { additional_category_ids: additionalCategoryIds } : {})
});

const patches = new Map([
  [ids.tlsc, {
    title_es: 'Servicios legales civiles gratuitos',
    title_en: 'Free civil legal services',
    summary_es: 'Ofrece información, asesoría y representación legal civil gratuita a personas elegibles en Texas.',
    summary_en: 'Provides free civil legal information, advice, and representation to eligible people across Texas.',
    description_es: 'Ayuda con vivienda, violencia y seguridad, beneficios públicos, asuntos familiares, empleo, planificación para personas mayores y otros problemas legales civiles. El acceso se coordina por teléfono o internet; la dirección publicada por la organización es postal.',
    description_en: 'Helps with housing, violence and safety, public benefits, family matters, employment, planning for older adults, and other civil legal issues. Access is coordinated by phone or online; the organization identifies its listed address as a mailing address.',
    service_methods: ['phone', 'online'],
    hours_es: 'Chat legal en línea: lunes a jueves, 10:00 a.m.–3:00 p.m.',
    hours_en: 'Online legal chat: Monday–Thursday, 10:00 a.m.–3:00 p.m.',
    service_area_es: 'Todos los condados de Texas', service_area_en: 'All Texas counties',
    address_line_1: '', address_line_2: '', city: '', state: 'TX', postal_code: '', county: '',
    latitude: null, longitude: null, geocoded_at: null,
    website_url: 'https://www.tlsc.org/help', source_url: 'https://www.tlsc.org/help', last_verified_at: verified,
    verification_notes: 'Registro estatal consolidado. La ficha específica de Williamson County representaba el mismo servicio general y conservaba una dirección postal como si fuera un punto de atención.'
  }],
  [ids.communityAction, {
    title_es: 'Asistencia para pagar servicios públicos', title_en: 'Utility payment assistance',
    summary_es: 'Ayuda a hogares de bajos ingresos de los condados de Hays, Caldwell y Blanco a pagar electricidad, gas natural o propano.',
    summary_en: 'Helps low-income households in Hays, Caldwell, and Blanco counties pay electric, natural gas, or propane bills.',
    address_line_1: '215 S. Reimer Avenue', address_line_2: 'Suite 130', city: 'San Marcos', state: 'TX', postal_code: '78666', county: 'Hays',
    latitude: null, longitude: null, geocoded_at: null,
    website_url: 'https://www.communityaction.com/utility', source_url: 'https://www.communityaction.com/utility', last_verified_at: verified,
    verification_notes: 'La dirección física usa ZIP 78666; 78667-0748 corresponde al apartado postal publicado por la organización. También existen puntos de entrega en Caldwell County.'
  }],
  [ids.combinedAction, {
    title_es: 'Climatización del hogar y asistencia energética', title_en: 'Home weatherization and energy assistance',
    summary_es: 'Ayuda a hogares elegibles a reducir el consumo de energía mediante mejoras de climatización y ofrece asistencia con facturas de servicios públicos según disponibilidad.',
    summary_en: 'Helps eligible households reduce energy use through weatherization improvements and offers utility-bill assistance when funding is available.',
    description_es: 'La climatización puede incluir aislamiento, sellado de fugas de aire y otras mejoras basadas en una evaluación de la vivienda. La asistencia energética atiende a hogares de bajos ingresos y prioriza situaciones vulnerables según las reglas y fondos vigentes.',
    description_en: 'Weatherization may include insulation, air-leak sealing, and other improvements based on a home assessment. Energy assistance serves low-income households and prioritizes vulnerable situations under current rules and available funding.',
    primary_category_id: '10000000-0000-4000-8000-000000000005',
    service_area_es: 'Condados de Austin, Bastrop, Blanco, Caldwell, Colorado, Fayette, Fort Bend, Hays y Lee',
    service_area_en: 'Austin, Bastrop, Blanco, Caldwell, Colorado, Fayette, Fort Bend, Hays, and Lee counties',
    address_line_1: '165 W Austin Street', address_line_2: '', city: 'Giddings', state: 'TX', postal_code: '78942', county: 'Lee',
    latitude: null, longitude: null, geocoded_at: null,
    website_url: 'https://www.ccaction.com/weatherization', source_url: 'https://www.ccaction.com/weatherization', last_verified_at: verified,
    verification_notes: 'La oficina central de Giddings acepta solicitudes y entregas locales. La cobertura de climatización de nueve condados fue confirmada en la página oficial vigente.'
  }],
  [ids.halcyon, {
    title_es: 'Atención médica, cuidados y hospicio en el hogar', title_en: 'In-home health, personal care, and hospice',
    summary_es: 'Ofrece atención médica en el hogar, ayuda personal no clínica, cuidados paliativos y hospicio para personas que necesitan apoyo en su residencia.',
    summary_en: 'Provides home health care, nonmedical personal assistance, palliative care, and hospice for people who need support where they live.',
    description_es: 'Los servicios incluyen enfermería y terapias ordenadas por un médico, ayuda con actividades diarias, cuidados paliativos y apoyo de hospicio. El plan, la elegibilidad y la cobertura dependen del servicio y las necesidades de cada persona.',
    description_en: 'Services include physician-ordered nursing and therapy, help with daily activities, palliative care, and hospice support. The care plan, eligibility, and coverage depend on the service and each person’s needs.',
    primary_category_id: '10000000-0000-4000-8000-000000000003',
    keywords_es: ['atención médica en el hogar', 'cuidador', 'asistencia personal', 'cuidados paliativos', 'hospicio', 'personas mayores'],
    keywords_en: ['home health', 'caregiver', 'personal assistance', 'palliative care', 'hospice', 'older adults'],
    languages: ['en'], service_methods: ['home_visit', 'phone', 'online'], cost_type: 'paid',
    eligibility_es: 'La atención médica en el hogar requiere orden médica; otros servicios dependen de una evaluación individual. Consulte cobertura y disponibilidad.',
    eligibility_en: 'Home health care requires a physician’s order; other services depend on an individual assessment. Confirm coverage and availability.',
    application_steps_es: 'Llame o envíe una consulta en línea para conversar sobre las necesidades, la cobertura y el plan de atención.',
    application_steps_en: 'Call or submit an online inquiry to discuss needs, coverage, and a care plan.',
    hours_es: 'Apoyo disponible las 24 horas, todos los días.', hours_en: 'Care and support available 24 hours a day, 7 days a week.',
    service_area_es: 'Condado de Travis, Condado de Hays', service_area_en: 'Travis County, Hays County',
    address_line_1: '', address_line_2: '', city: '', state: 'TX', postal_code: '', county: '',
    latitude: null, longitude: null, geocoded_at: null,
    website_url: 'https://halcyonhome.com/home-care-services-austin/', source_url: 'https://halcyonhome.com/services/', last_verified_at: verified,
    verification_notes: 'Piloto de Bluebonnet Project HOPE. La descripción anterior de ayuda de renta y servicios públicos no correspondía a Halcyon Home y fue reemplazada usando las páginas oficiales de servicios.'
  }],
  [ids.sacredHeart, {
    title_es: 'Despensa y ayuda para necesidades básicas', title_en: 'Food pantry and basic-needs assistance',
    summary_es: 'Ayuda a personas y familias del área de Elgin con alimentos y otras necesidades esenciales según la situación y los recursos disponibles.',
    summary_en: 'Helps individuals and families in the Elgin area with food and other essential needs depending on circumstances and available resources.',
    eligibility_es: 'Personas y familias del área de Elgin que necesitan apoyo. Confirme por teléfono los requisitos y la ayuda disponible.',
    eligibility_en: 'Individuals and families in the Elgin area who need support. Call to confirm requirements and available assistance.',
    keywords_es: ['despensa de alimentos', 'asistencia alimentaria', 'necesidades básicas', 'ayuda de emergencia', 'renta', 'servicios públicos', 'Elgin'],
    keywords_en: ['food pantry', 'food assistance', 'basic needs', 'emergency help', 'rent', 'utilities', 'Elgin'],
    service_area_es: 'Condado de Bastrop', service_area_en: 'Bastrop County',
    address_line_1: '302 West 11th Street', address_line_2: '', city: 'Elgin', state: 'TX', postal_code: '78621', county: 'Bastrop',
    latitude: null, longitude: null, geocoded_at: null,
    source_url: 'https://sacredheartofelgin.org/st-vincent-de-paul-society', last_verified_at: verified,
    verification_notes: 'El programa y el contacto fueron confirmados en la página oficial de St. Vincent de Paul; la dirección parroquial vigente es 302 West 11th Street.'
  }]
]);

const operations = [];
for (const [id, patch] of patches) {
  const resource = byId.get(id);
  if (!resource) throw new Error(`Missing target: ${id}`);
  const expectedStatus = [ids.communityAction, ids.combinedAction, ids.halcyon].includes(id) ? 'draft' : 'published';
  if (resource.status !== expectedStatus) throw new Error(`Unexpected status for ${id}: ${resource.status}`);
  const duplicateStatus = byId.get(ids.tlscDuplicate)?.status;
  if (id === ids.tlsc && !['published', 'archived'].includes(duplicateStatus)) throw new Error('TLSC duplicate has an unexpected status.');
  const archiveIds = id === ids.tlsc && duplicateStatus === 'published' ? [ids.tlscDuplicate] : [];
  const categories = id === ids.combinedAction
    ? ['10000000-0000-4000-8000-000000000002']
    : id === ids.halcyon
      ? []
      : undefined;
  const categoriesSame = categories === undefined || JSON.stringify((resource.resource_categories || []).map(item => item.category_id).sort()) === JSON.stringify([...categories].sort());
  if (!same(resource, patch) || !categoriesSame || archiveIds.length) operations.push(operation(id, expectedStatus, patch, archiveIds, categories));
}

if (operations.length !== 0 && operations.length !== patches.size) throw new Error(`Expected ${patches.size} operations or 0; found ${operations.length}`);
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, updated: patches.size, archivedDuplicates: operations.flatMap(item => item.archive_ids).length }, null, 2));
