#!/usr/bin/env node
import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-18-duplicate-integrity.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const byId = new Map(resources.map(resource => [resource.id, resource]));
const verified = '2026-09-03';
const education = '10000000-0000-4000-8000-000000000006';
const same = (resource, patch) => Object.entries(patch).every(([key, value]) => JSON.stringify(resource[key] ?? null) === JSON.stringify(value));

const targets = [
  {
    canonicalId: '906ee53a-a139-4b2b-9a78-7b01e8624f85', canonicalStatus: 'published',
    archiveId: '35bf79ce-5e71-4b10-97d1-a8937cef2d43', archiveStatus: 'published', additional: [],
    patch: {
      organization_name: 'United Way for Greater Austin',
      title_es: 'Navegación de recursos ConnectATX', title_en: 'ConnectATX resource navigation',
      summary_es: 'Conecta a personas de Texas Central con recursos de alimentación, vivienda, salud, transporte, cuidado infantil, empleo y otras necesidades.',
      summary_en: 'Connects Central Texans with resources for food, housing, health care, transportation, child care, employment, and other needs.',
      description_es: 'ConnectATX ofrece una evaluación integral y ayuda para encontrar servicios comunitarios en línea o con apoyo de especialistas. La línea 2-1-1 es gratuita, confidencial, multilingüe y está disponible las 24 horas.',
      description_en: 'ConnectATX provides a holistic assessment and help finding community services online or with support from navigation specialists. The 2-1-1 line is free, confidential, multilingual, and available 24 hours a day.',
      keywords_es: ['ConnectATX', '2-1-1', 'navegación de recursos', 'necesidades básicas', 'servicios comunitarios'],
      keywords_en: ['ConnectATX', '2-1-1', 'resource navigation', 'basic needs', 'community services'],
      languages: ['es', 'en'], service_methods: ['phone', 'online'], cost_type: 'free',
      application_steps_es: 'Visite ConnectATX en línea o marque 2-1-1 para hablar con un especialista de navegación.',
      application_steps_en: 'Visit ConnectATX online or dial 2-1-1 to speak with a navigation specialist.',
      hours_es: 'Línea 2-1-1 disponible las 24 horas, todos los días.', hours_en: '2-1-1 phone line available 24 hours a day, every day.',
      service_area_es: 'Texas Central', service_area_en: 'Central Texas', phone: '211',
      website_url: 'https://unitedwayaustin.org/navigation-center/', source_url: 'https://unitedwayaustin.org/navigation-center/',
      last_verified_at: verified, verification_notes: 'Registro consolidado con el duplicado de ConnectATX. El servicio, los canales y el horario se confirmaron en la página oficial de United Way for Greater Austin. [location-review: variable]'
    }
  },
  {
    canonicalId: 'ff8d025b-295a-4b1f-9a09-26ca5ea8f787', canonicalStatus: 'draft',
    archiveId: '8181be7b-00f9-498e-8ca2-9041bd8847b5', archiveStatus: 'draft', additional: [],
    patch: {
      organization_name: 'Community Action, Inc. of Central Texas',
      application_steps_es: 'Complete la solicitud de CEAP en línea o imprímala y entréguela por correo, fax o en persona. Para la oficina de Caldwell en Lockhart, llame al 512-398-4420.',
      application_steps_en: 'Complete the CEAP application online or print it and submit it by mail, fax, or in person. For the Caldwell office in Lockhart, call 512-398-4420.',
      hours_es: 'Oficina de San Marcos: lunes a viernes, 8:00 a.m.–12:00 p.m. y 1:00–5:00 p.m. Hay puntos de atención adicionales en Lockhart y Luling.',
      hours_en: 'San Marcos office: Monday–Friday, 8:00 a.m.–12:00 p.m. and 1:00–5:00 p.m. Additional service locations are available in Lockhart and Luling.',
      website_url: 'https://www.communityaction.com/utilityassistance', source_url: 'https://www.communityaction.com/utilityassistance',
      last_verified_at: verified, verification_notes: 'Registro consolidado con el borrador separado de Caldwell. La página oficial confirma que CEAP atiende Hays, Caldwell y Blanco y publica puntos de atención en San Marcos, Lockhart y Luling.'
    }
  },
  {
    canonicalId: '85303f47-6ce4-425d-bbd7-103377ee3183', canonicalStatus: 'published', archiveId: null, archiveStatus: 'published', additional: [education],
    patch: {
      title_es: 'Programas educativos y de apoyo para jóvenes y familias', title_en: 'Education and support programs for youth and families',
      summary_es: 'Reúne programas de apoyo familiar, aprendizaje temprano, necesidades básicas, capacitación para la vida y empleo juvenil en Georgetown.',
      summary_en: 'Offers family support, early learning, basic-needs assistance, life-skills training, and youth employment programs in Georgetown.',
      description_es: 'Este registro general reúne varios programas de The Georgetown Project, incluidos Bridges to Growth, NEST Empowerment Center, Youth Leadership & Service y Summer Youth Employment. Cada programa tiene actividades, requisitos y sedes propias.',
      description_en: 'This organization-wide listing covers several Georgetown Project programs, including Bridges to Growth, NEST Empowerment Center, Youth Leadership & Service, and Summer Youth Employment. Each program has its own activities, eligibility, and locations.',
      keywords_es: ['apoyo familiar', 'aprendizaje temprano', 'apoyo juvenil', 'necesidades básicas', 'empleo juvenil'],
      keywords_en: ['family support', 'early learning', 'youth support', 'basic needs', 'youth employment'],
      service_methods: ['in_person', 'phone', 'online'],
      application_steps_es: 'Consulte el programa correspondiente en el sitio web o llame a la oficina administrativa para confirmar actividades, requisitos y sede.',
      application_steps_en: 'Review the relevant program online or call the administrative office to confirm activities, eligibility, and location.',
      source_url: 'https://www.georgetownproject.org/', last_verified_at: verified,
      verification_notes: 'Registro general de múltiples programas y sedes; no duplica el recurso específico de NEST Empowerment Center. [location-review: variable]'
    }
  }
];

const operations = [];
for (const target of targets) {
  const canonical = byId.get(target.canonicalId);
  if (!canonical) throw new Error(`Missing canonical ${target.canonicalId}`);
  const duplicate = target.archiveId ? byId.get(target.archiveId) : null;
  const archiveIds = duplicate?.status === target.archiveStatus ? [target.archiveId] : [];
  if (duplicate && ![target.archiveStatus, 'archived'].includes(duplicate.status)) throw new Error(`Invalid duplicate status ${target.archiveId}: ${duplicate.status}`);
  const currentAdditional = (canonical.resource_categories || []).map(item => item.category_id).sort();
  const expectedAdditional = [...target.additional].sort();
  const needsPatch = !same(canonical, target.patch) || JSON.stringify(currentAdditional) !== JSON.stringify(expectedAdditional);
  if (canonical.status !== target.canonicalStatus && !(canonical.status === 'archived' && !needsPatch && archiveIds.length === 0)) throw new Error(`Invalid canonical status ${target.canonicalId}: ${canonical.status}`);
  if (needsPatch || archiveIds.length) operations.push({
    canonical_id: target.canonicalId,
    expected_canonical_status: target.canonicalStatus,
    expected_archive_status: target.archiveStatus,
    patch: needsPatch ? target.patch : {},
    archive_ids: archiveIds,
    additional_category_ids: needsPatch ? target.additional : undefined
  });
}
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, duplicatesToArchive: operations.flatMap(item => item.archive_ids).length }, null, 2));
