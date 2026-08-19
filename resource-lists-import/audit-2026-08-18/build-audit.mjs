import fs from 'node:fs';
import { CSV_IMPORT_HEADERS, parseCsv, prepareCsvResources } from '../../src/data/csvImport.js';

const baseDir = new URL('./', import.meta.url);
const source = parseCsv(fs.readFileSync(new URL('source.csv', baseDir), 'utf8'));
const recovered = JSON.parse(fs.readFileSync(new URL('recovered-records.json', baseDir), 'utf8'));

const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
const writeCsv = (file, headers, rows) => fs.writeFileSync(new URL(file, baseDir), `\ufeff${headers.join(',')}\n${rows.map(row => headers.map(header => csvCell(row[header])).join(',')).join('\n')}\n`);
const keyOf = row => `${normalize(row.organization_name ?? row['Organización'])}|${normalize(row.title_en ?? row['Título en inglés'])}`;
const recoveredByKey = new Map(recovered.map(row => [keyOf(row), row]));

const decisions = new Map(Object.entries({
  'Bastrop County Clerk': ['approve_rebuild', 'Servicio oficial verificable de registros, matrimonio, vitales, probate y misdemeanors; reconstruir con fuente oficial.'],
  "Travis County Sheriff's Office": ['exclude', 'Entrada institucional demasiado amplia; no identifica un servicio comunitario concreto y puede confundirse con emergencias o despacho policial.'],
  'Thurman-Blackwell Criminal Justice Center': ['exclude', 'Es un edificio judicial, no un servicio independiente. Las funciones útiles deben representarse mediante la división responsable.'],
  'Transportation & Natural Resources (TNR)': ['exclude', 'Departamento genérico; debe dividirse por programa o asistencia específica antes de publicarse.'],
  'Travis County Domestic Relations (Child Support)': ['approve_rebuild', 'Servicio oficial y accionable de child support, enforcement y visitation; reconstruir con contacto oficial.'],
  'Travis County District Clerk – Divorces': ['approve_rebuild', 'La división Civil/Family mantiene casos de divorcio; reconstruir con alcance y advertencia de que no brinda asesoría legal.'],
  'Travis County District Clerk – Jury and Passports': ['approve_rebuild', 'Oficina oficial con dirección y contacto propios; reconstruir como servicio de jurado y pasaportes.'],
  'Travis County District Clerk – Main': ['exclude', 'Duplica las entradas específicas y no comunica una ayuda concreta.'],
  'Travis County Law Library': ['approve_rebuild', 'Servicio público verificable con formularios y orientación para personas sin abogado.'],
  'Travis County Tax Office': ['approve_rebuild', 'Servicio público verificable para impuestos, pagos, recibos y planes; reconstruir con alcance explícito.'],
  "Travis County Clerk's Office – Civil Division": ['approve_rebuild', 'División oficial con funciones, contacto y ubicación propios.'],
  "Travis County Clerk's Office – Misdemeanor Division": ['approve_rebuild', 'División oficial con búsqueda y copias de registros de delitos menores.'],
  "Travis County Clerk's Office – Probate Division": ['approve_rebuild', 'División oficial de probate, guardianship y documentos relacionados.'],
  "Travis County Clerk's Office – Recording Division": ['approve_rebuild', 'División oficial para registros de propiedad, assumed names y marriage licenses.'],
  'Travis Central Appraisal District (TCAD)': ['approve_rebuild', 'La entrada genérica debe enfocarse en ayuda con homestead exemptions, un servicio accionable y gratuito.'],
  'City of Austin Vital Statistics': ['approve_rebuild', 'Servicio oficial verificable para certificados de nacimiento y defunción; tiene elegibilidad, documentos y tarifas.'],
  'Austin Water – Open Sewage Complaints': ['approve_rebuild', 'Servicio oficial accionable para reportar desbordamientos y emergencias de agua/alcantarillado.'],
  'Austin Water – Septic Tank Permits/Inspections & Service Requests': ['approve_rebuild', 'Servicio oficial de OSSF; reconstruir con contacto y jurisdicción correctos.'],
  'Austin Water – Water Protection, Industrial Waste Control & Water Wells': ['exclude', 'Combina tres programas regulatorios distintos, principalmente para negocios; debe separarse antes de considerarse.'],
  'Austin Water – Customer Service / TAPS': ['approve_rebuild', 'Puede publicarse como servicio al cliente de agua y aguas residuales con números separados para billing y emergencias.'],
  'Austin Water – Main / Waller Creek Center': ['exclude', 'Es una oficina/instalación genérica que duplica Customer Service.'],
  'One Texas Center': ['exclude', 'Es un edificio municipal, no un recurso o programa.'],
  'Austin Energy Facilities': ['exclude', 'Es una agrupación de instalaciones, no una ayuda concreta.'],
  'City of Austin': ['exclude', 'Entrada institucional demasiado amplia; usar Austin 3-1-1 u otro servicio específico.']
}));

const missingFor = row => {
  const missing = [];
  if (!row.summary_es || !row.summary_en) missing.push('summary');
  if (!row.source_url) missing.push('source_url');
  if (!row.last_verified_at) missing.push('last_verified_at');
  if (!row.phone && !row.email && !row.website_url && !row.address_line_1) missing.push('contact');
  if (String(row.service_methods).includes('in_person') && !row.address_line_1) missing.push('in_person_address');
  return missing;
};

const auditRows = source.records.map(record => {
  const original = record.values;
  const match = recoveredByKey.get(keyOf(original));
  const title = original['Título en inglés'];
  if (match) {
    const missing = missingFor(match);
    const concerns = [];
    if (/could not be accessed|no se pudo acceder|not confirmed|no confirmado/i.test(`${match.description_es} ${match.description_en} ${match.verification_notes}`)) concerns.push('contenido o cobertura no confirmados');
    if (match.cost_type === 'free' && /\$\d|fare|tarifa/i.test(`${match.summary_es} ${match.summary_en} ${match.description_es} ${match.description_en}`)) concerns.push('posible contradicción de costo');
    return {
      source_row: record.rowNumber,
      organization_name: original['Organización'],
      title_es: original['Título en español'],
      title_en: title,
      source_status: original['Estado'],
      category_label: original['Categorías'],
      recovery_status: 'recovered_from_prior_import',
      recommendation: missing.length || concerns.length ? 'manual_verification_required' : 'verify_official_source_before_import',
      missing_or_risk: [...missing, ...concerns].join(' | ') || 'la fuente no fue revalidada durante esta auditoría',
      official_source: match.source_url,
      importer_ready: 'no'
    };
  }
  const [recommendation = 'manual_research_required', reason = 'No se recuperó el registro detallado y el archivo fuente no contiene datos suficientes.'] = decisions.get(title) || [];
  return {
    source_row: record.rowNumber,
    organization_name: original['Organización'],
    title_es: original['Título en español'],
    title_en: title,
    source_status: original['Estado'],
    category_label: original['Categorías'],
    recovery_status: 'dashboard_inventory_only',
    recommendation,
    missing_or_risk: reason,
    official_source: '',
    importer_ready: recommendation === 'approve_rebuild' ? 'see approved-subset.csv' : 'no'
  };
});

const blank = Object.fromEntries(CSV_IMPORT_HEADERS.map(header => [header, '']));
const make = values => ({ ...blank, is_featured: 'false', is_emergency: 'false', last_verified_at: '2026-08-18', ...values });
const approved = [
  make({
    organization_name: 'Bastrop County Clerk', title_es: 'Bastrop County Clerk', title_en: 'Bastrop County Clerk',
    summary_es: 'Solicita registros vitales, licencias de matrimonio, registros de propiedad y documentos de probate o delitos menores en Bastrop County.',
    summary_en: 'Request vital records, marriage licenses, property records, and probate or misdemeanor documents in Bastrop County.',
    description_es: 'La oficina conserva registros oficiales del condado y actúa como clerk para probate, misdemeanors y Commissioners Court. Confirma requisitos y tarifas antes de solicitar copias.',
    description_en: 'The office maintains official county records and serves as clerk for probate, misdemeanor, and Commissioners Court matters. Confirm requirements and fees before requesting copies.',
    primary_category: 'ayuda-legal', additional_categories: 'otros-recursos', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'paid',
    service_area_es: 'Condado de Bastrop', service_area_en: 'Bastrop County', phone: '512-332-7234', website_url: 'https://www.bastropcounty.gov/page/co.county_clerk',
    address_line_1: '803 Pine Street', city: 'Bastrop', state: 'TX', postal_code: '78602', county: 'Bastrop', source_url: 'https://www.bastropcounty.gov/page/co.county_clerk',
    verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026. Las tarifas y documentos dependen del tipo de registro.'
  }),
  make({
    organization_name: 'Travis County Domestic Relations (Child Support)', title_es: 'Travis County Domestic Relations (Child Support)', title_en: 'Travis County Domestic Relations (Child Support)',
    summary_es: 'Ayuda con cobro, desembolso y cumplimiento de órdenes de manutención infantil, médica y visitas de Travis County.',
    summary_en: 'Help with collection, disbursement, and enforcement of Travis County child, medical support, and visitation orders.',
    description_es: 'La Domestic Relations Office mantiene cuentas y registros de pagos y puede ayudar a cumplir órdenes emitidas en Travis County. El sistema telefónico automatizado puede requerir PIN y número de Seguro Social.',
    description_en: 'The Domestic Relations Office maintains accounts and payment records and may assist with enforcement of Travis County orders. The automated phone system may require a PIN and Social Security number.',
    primary_category: 'ayuda-legal', languages: 'en', service_methods: 'in_person|phone', cost_type: 'unknown', eligibility_es: 'Personas con órdenes elegibles de Travis County.', eligibility_en: 'People with eligible Travis County orders.',
    service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-854-9696', website_url: 'https://www.traviscountytx.gov/dro',
    address_line_1: '1700 Guadalupe Street', address_line_2: '5th Floor', city: 'Austin', state: 'TX', postal_code: '78701', county: 'Travis', source_url: 'https://www.traviscountytx.gov/dro/contact-us',
    hours_es: 'Lunes a viernes, 8:00 a.m. a 5:00 p.m.', hours_en: 'Monday through Friday, 8:00 a.m. to 5:00 p.m.', verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026.'
  }),
  make({
    organization_name: 'Travis County District Clerk', title_es: 'Travis County District Clerk – Divorcios', title_en: 'Travis County District Clerk – Divorces',
    summary_es: 'Información, registros y trámites administrativos para casos de divorcio y familia en Travis County.', summary_en: 'Administrative filing information and records for divorce and family cases in Travis County.',
    description_es: 'La división Civil/Family mantiene expedientes y recibe documentos. El personal del clerk no brinda asesoría legal.', description_en: 'The Civil/Family division maintains case files and receives filings. Clerk staff do not provide legal advice.',
    primary_category: 'ayuda-legal', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'paid', service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-854-9457', website_url: 'https://www.traviscountytx.gov/district-clerk',
    address_line_1: '1700 Guadalupe Street', address_line_2: '3rd Floor', city: 'Austin', state: 'TX', postal_code: '78701', county: 'Travis', source_url: 'https://www.traviscountytx.gov/district-clerk/contact', hours_es: 'Lunes a viernes, 8:00 a.m. a 4:30 p.m.', hours_en: 'Monday through Friday, 8:00 a.m. to 4:30 p.m.', verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026; confirmar tarifas según trámite.'
  }),
  make({
    organization_name: 'Travis County District Clerk', title_es: 'Travis County District Clerk – Jurado y Pasaportes', title_en: 'Travis County District Clerk – Jury and Passports',
    summary_es: 'Información y atención para servicio de jurado y solicitudes de pasaporte en Travis County.', summary_en: 'Information and assistance for jury service and passport applications in Travis County.',
    description_es: 'La oficina de Jury/Passport atiende asuntos relacionados con jurado y pasaportes. Confirma cita, documentos y tarifas antes de ir.', description_en: 'The Jury/Passport office handles jury and passport matters. Confirm appointment, documents, and fees before visiting.',
    primary_category: 'ayuda-legal', additional_categories: 'otros-recursos', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'paid', service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-854-9669', website_url: 'https://www.traviscountytx.gov/district-clerk',
    address_line_1: '5325 Airport Boulevard', address_line_2: 'Suite 1100', city: 'Austin', state: 'TX', postal_code: '78751', county: 'Travis', source_url: 'https://www.traviscountytx.gov/district-clerk/contact', hours_es: 'Lunes a viernes, 8:00 a.m. a 4:30 p.m.', hours_en: 'Monday through Friday, 8:00 a.m. to 4:30 p.m.', verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026; confirmar requisitos y tarifas de pasaporte.'
  }),
  make({
    organization_name: 'Travis County Law Library', title_es: 'Travis County Law Library', title_en: 'Travis County Law Library',
    summary_es: 'Formularios, información legal y revisión gratuita de algunos casos familiares no disputados para personas sin abogado.', summary_en: 'Forms, legal information, and free review of some uncontested family cases for people without attorneys.',
    description_es: 'Ofrece recursos legales de autoayuda. Family Law Case Review está limitado a casos sencillos, no disputados, en Travis County y no crea una relación abogado-cliente.', description_en: 'Provides self-help legal resources. Family Law Case Review is limited to simple, uncontested Travis County cases and does not create an attorney-client relationship.',
    primary_category: 'ayuda-legal', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'free', eligibility_es: 'Para Case Review: caso familiar sencillo en Travis County, sin abogado y no disputado.', eligibility_en: 'For Case Review: a simple, uncontested Travis County family case with no attorney.',
    service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-854-8677', website_url: 'https://lawlibrary.traviscountytx.gov', address_line_1: '1700 Guadalupe Street', address_line_2: '2nd Floor', city: 'Austin', state: 'TX', postal_code: '78701', county: 'Travis', source_url: 'https://lawlibrary.traviscountytx.gov/family-law-case-review', hours_es: 'Lunes a viernes, 8:00 a.m. a 5:00 p.m.', hours_en: 'Monday through Friday, 8:00 a.m. to 5:00 p.m.', verification_notes: 'Fuentes oficiales revisadas el 18 de agosto de 2026.'
  }),
  make({
    organization_name: 'Travis County Tax Office', title_es: 'Travis County Tax Office', title_en: 'Travis County Tax Office',
    summary_es: 'Consulta facturas y recibos, realiza pagos y pregunta por opciones o planes para impuestos de propiedad de Travis County.', summary_en: 'Review bills and receipts, make payments, and ask about options or plans for Travis County property taxes.',
    description_es: 'La Tax Office cobra impuestos y ofrece servicios en línea, por teléfono y en persona. Las exenciones y protestas de valor corresponden a TCAD, no a esta oficina.', description_en: 'The Tax Office collects taxes and offers online, phone, and in-person services. Exemptions and value protests are handled by TCAD, not this office.',
    primary_category: 'recursos-financieros', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'unknown', service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-854-9473', email: 'taxoffice@traviscountytx.gov', website_url: 'https://tax-office.traviscountytx.gov', address_line_1: '2433 Ridgepoint Drive', city: 'Austin', state: 'TX', postal_code: '78754', county: 'Travis', source_url: 'https://tax-office.traviscountytx.gov/properties/taxes/payment-methods/in-person', hours_es: 'Lunes a viernes, 7:30 a.m. a 5:00 p.m.', hours_en: 'Monday through Friday, 7:30 a.m. to 5:00 p.m.', verification_notes: 'Fuentes oficiales revisadas el 18 de agosto de 2026.'
  }),
  ...[
    ["Travis County Clerk's Office – División Civil", "Travis County Clerk's Office – Civil Division", 'Registros y trámites administrativos de casos civiles en Travis County.', 'Administrative records and filing services for Travis County civil cases.', '1700 Guadalupe Street', 'Suite 4.300', '78701', '512-854-5959', 'civil'],
    ["Travis County Clerk's Office – División de Delitos Menores", "Travis County Clerk's Office – Misdemeanor Division", 'Búsqueda, copias y trámites de expedientes de delitos menores de Travis County.', 'Searches, copies, and filing services for Travis County misdemeanor records.', '1000 Guadalupe Street', 'Suite 222', '78701', '512-854-9188', 'misdemeanor'],
    ["Travis County Clerk's Office – División de Sucesiones", "Travis County Clerk's Office – Probate Division", 'Trámites y registros de probate, guardianship y documentos relacionados en Travis County.', 'Probate, guardianship, and related records and filing services in Travis County.', '200 West 8th Street', 'Suite 110', '78701', '512-854-5958', 'probate'],
    ["Travis County Clerk's Office – División de Registros", "Travis County Clerk's Office – Recording Division", 'Registros de propiedad, assumed names, marriage licenses y otros documentos oficiales.', 'Property records, assumed names, marriage licenses, and other official documents.', '5501 Airport Boulevard', '', '78751', '512-854-9188', 'recording']
  ].map(([titleEs, titleEn, summaryEs, summaryEn, address, address2, zip, phone, path]) => make({
    organization_name: "Travis County Clerk's Office", title_es: titleEs, title_en: titleEn, summary_es: summaryEs, summary_en: summaryEn,
    description_es: `${summaryEs} Confirma requisitos, disponibilidad de documentos y tarifas con la división antes de presentar una solicitud.`, description_en: `${summaryEn} Confirm requirements, document availability, and fees with the division before submitting a request.`,
    primary_category: 'ayuda-legal', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'paid', service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone, website_url: `https://countyclerk.traviscountytx.gov/departments/${path}/`, address_line_1: address, address_line_2: address2, city: 'Austin', state: 'TX', postal_code: zip, county: 'Travis', source_url: 'https://countyclerk.traviscountytx.gov/departments/', hours_es: 'Lunes a viernes, 8:00 a.m. a 5:00 p.m.', hours_en: 'Monday through Friday, 8:00 a.m. to 5:00 p.m.', verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026.'
  })),
  make({
    organization_name: 'Travis Central Appraisal District (TCAD)', title_es: 'Travis Central Appraisal District (TCAD)', title_en: 'Travis Central Appraisal District (TCAD)',
    summary_es: 'Solicita gratis la exención de vivienda principal y recibe ayuda con exenciones para mayores de 65 años, discapacidad y veteranos.', summary_en: 'Apply free for a homestead exemption and get help with exemptions for people 65+, people with disabilities, and veterans.',
    description_es: 'TCAD permite presentar la solicitud en línea, por correo o en la oficina. No pagues a terceros por presentar una exención.', description_en: 'TCAD accepts applications online, by mail, or at the office. Do not pay a third party to file an exemption.',
    primary_category: 'recursos-financieros', additional_categories: 'vivienda', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'free', eligibility_es: 'Propietarios que poseen y ocupan la vivienda como residencia principal; otras exenciones tienen requisitos adicionales.', eligibility_en: 'Owners who own and occupy the property as their principal residence; other exemptions have additional requirements.',
    required_documents_es: 'Solicitud y una identificación de Texas con dirección que coincida con la propiedad, según corresponda.', required_documents_en: 'Application and a Texas ID with an address matching the property, as applicable.',
    service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-873-1560', website_url: 'https://traviscad.org/homesteadexemptions', address_line_1: '850 East Anderson Lane', city: 'Austin', state: 'TX', postal_code: '78752', county: 'Travis', source_url: 'https://traviscad.org/homesteadexemptions', verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026.'
  }),
  make({
    organization_name: 'City of Austin Vital Statistics', title_es: 'City of Austin Vital Statistics', title_en: 'City of Austin Vital Statistics',
    summary_es: 'Solicita certificados de nacimiento de Texas y certificados de defunción para eventos registrados dentro de Austin.', summary_en: 'Request Texas birth certificates and death certificates for eligible events registered within Austin.',
    description_es: 'Se puede solicitar en persona, en línea, por teléfono o correo. La disponibilidad depende del tipo, lugar y fecha del evento.', description_en: 'Requests are available in person, online, by phone, or by mail. Availability depends on the type, location, and date of the event.',
    primary_category: 'otros-recursos', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'paid', eligibility_es: 'Persona nombrada, familiar inmediato, guardian o representante legal con documentación.', eligibility_en: 'Named person, immediate family member, guardian, or legal representative with documentation.',
    required_documents_es: 'Identificación vigente emitida por el gobierno y documentos adicionales según la relación y método de solicitud.', required_documents_en: 'Current government-issued ID and additional documents based on relationship and request method.',
    service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-972-4784', website_url: 'https://www.austintexas.gov/services/get-birth-or-death-certificate', address_line_1: '7201 Levander Loop', address_line_2: 'Building C', city: 'Austin', state: 'TX', postal_code: '78702', county: 'Travis', source_url: 'https://www.austintexas.gov/services/get-birth-or-death-certificate', hours_es: 'Lunes a viernes, 8:00 a.m. a 4:30 p.m.; solicitudes presenciales hasta 4:15 p.m.', hours_en: 'Monday through Friday, 8:00 a.m. to 4:30 p.m.; walk-in applications accepted until 4:15 p.m.', verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026. Tarifas publicadas: $23 por nacimiento; $21 por primera copia de defunción.'
  }),
  make({
    organization_name: 'Austin Water', title_es: 'Austin Water – Quejas por Descargas de Aguas Residuales', title_en: 'Austin Water – Open Sewage Complaints',
    summary_es: 'Reporta desbordamientos de aguas residuales, fugas de alcantarillado, roturas de tubería, cortes y problemas de presión.', summary_en: 'Report sewage overflows, sewer leaks, water main breaks, outages, and pressure problems.',
    description_es: 'La línea de despacho de Austin Water atiende emergencias de agua y aguas residuales las 24 horas. Para contaminación en arroyos o drenajes pluviales, llama al 3-1-1.', description_en: 'Austin Water dispatch handles water and wastewater emergencies 24 hours a day. For pollution in creeks or storm drains, call 3-1-1.',
    primary_category: 'vivienda', languages: 'en', service_methods: 'phone', cost_type: 'unknown', service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-972-1000', website_url: 'https://www.austintexas.gov/water/contact', county: 'Travis', source_url: 'https://www.austintexas.gov/water/contact', hours_es: 'Línea de emergencias disponible 24/7.', hours_en: 'Emergency line available 24/7.', verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026. No se muestra dirección porque el servicio principal es telefónico.'
  }),
  make({
    organization_name: 'Austin Water', title_es: 'Austin Water – Permisos e Inspecciones de Sistemas Sépticos', title_en: 'Austin Water – Septic Tank Permits/Inspections & Service Requests',
    summary_es: 'Información y trámites para permisos, inspecciones y mantenimiento de sistemas sépticos dentro de la jurisdicción aplicable de Austin.', summary_en: 'Information and processing for septic-system permits, inspections, and maintenance within applicable Austin jurisdiction.',
    description_es: 'El programa OSSF administra permisos para sistemas sépticos en la jurisdicción de Austin. Confirma que la propiedad esté dentro de su jurisdicción antes de solicitar.', description_en: 'The OSSF program administers septic-system permits in Austin jurisdiction. Confirm the property is within its jurisdiction before applying.',
    primary_category: 'vivienda', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'paid', service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-972-0050', email: 'OSSF@AustinTexas.gov', website_url: 'https://www.austintexas.gov/development-services/types-permits', address_line_1: '6310 Wilhelmina Delco Drive', city: 'Austin', state: 'TX', postal_code: '78752', county: 'Travis', source_url: 'https://www.austintexas.gov/development-services/types-permits', verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026; confirmar jurisdicción y tarifas antes de solicitar.'
  }),
  make({
    organization_name: 'Austin Water', title_es: 'Austin Water – Servicio al Cliente / TAPS', title_en: 'Austin Water – Customer Service / TAPS',
    summary_es: 'Obtén ayuda con servicio de agua o aguas residuales, facturación, pagos y emergencias de Austin Water.', summary_en: 'Get help with Austin Water service, wastewater service, billing, payments, and emergencies.',
    description_es: 'Llama al 512-972-1000 para servicio o emergencias de agua y aguas residuales. Para preguntas de facturación de City of Austin Utilities, llama al 512-494-9400.', description_en: 'Call 512-972-1000 for water or wastewater service and emergencies. For City of Austin Utilities billing questions, call 512-494-9400.',
    primary_category: 'vivienda', additional_categories: 'recursos-financieros', languages: 'en', service_methods: 'in_person|phone|online', cost_type: 'unknown', service_area_es: 'Condado de Travis', service_area_en: 'Travis County', phone: '512-972-1000', website_url: 'https://www.austintexas.gov/water/contact', address_line_1: '625 East 10th Street', city: 'Austin', state: 'TX', postal_code: '78701', county: 'Travis', source_url: 'https://www.austintexas.gov/water/contact', hours_es: 'Oficina: lunes a viernes, 8:00 a.m. a 5:00 p.m.; emergencias 24/7.', hours_en: 'Office: Monday through Friday, 8:00 a.m. to 5:00 p.m.; emergencies 24/7.', verification_notes: 'Fuente oficial revisada el 18 de agosto de 2026.'
  })
];

writeCsv('row-by-row-audit.csv', ['source_row','organization_name','title_es','title_en','source_status','category_label','recovery_status','recommendation','missing_or_risk','official_source','importer_ready'], auditRows);
writeCsv('approved-subset.csv', CSV_IMPORT_HEADERS, approved);

const parsedApproved = parseCsv(fs.readFileSync(new URL('approved-subset.csv', baseDir), 'utf8'));
const prepared = prepareCsvResources(parsedApproved);
const errors = prepared.rows.filter(row => row.errors.length).map(row => ({ row: row.rowNumber, errors: row.errors, values: row.errorValues }));
const categoryCounts = auditRows.reduce((counts, row) => ({ ...counts, [row.recommendation]: (counts[row.recommendation] || 0) + 1 }), {});
fs.writeFileSync(new URL('validation.json', baseDir), JSON.stringify({
  source: { rows: source.records.length, headers: source.headers, expectedHeaders: CSV_IMPORT_HEADERS.length },
  recovered: recovered.length,
  approvedSubset: approved.length,
  recommendations: categoryCounts,
  importerValidation: { missingHeaders: prepared.missingHeaders, rowErrors: errors }
}, null, 2));

console.log(JSON.stringify({ rowsAudited: auditRows.length, approved: approved.length, recommendations: categoryCounts, importerErrors: errors.length }, null, 2));
