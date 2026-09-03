import fs from 'node:fs';
import { parseCsv } from '../src/data/csvImport.js';

const [inputFile, outputFile = inputFile] = process.argv.slice(2);
if (!inputFile) {
  console.error('Usage: node scripts/enrich-bluebonnet-import.mjs <input.csv> [output.csv]');
  process.exit(1);
}
const parsed = parseCsv(fs.readFileSync(inputFile, 'utf8'));
const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const unique = values => [...new Set(values.filter(Boolean))];
const pantryDirectory = 'https://www.centraltexasfoodbank.org/find-food-now';
const sanAntonioDirectory = 'https://safoodbank.org/help/';
const today = '2026-09-02';

const serviceFacts = [
  [/food pantry|grocer|food donation|pantry food/i, 'Despensa de alimentos', 'Food pantry', 'Ofrece alimentos o comestibles para personas y familias.', 'Provides food or groceries for individuals and families.', 'comida'],
  [/hot meals|nutritious meals|dine-in|breakfast|lunch|dinner|soup kitchen/i, 'Comidas preparadas', 'Prepared meals', 'Ofrece comidas preparadas.', 'Provides prepared meals.', 'comida'],
  [/utility|electric|gas bill|water and wastewater|energy assistance/i, 'Asistencia con servicios públicos', 'Utility assistance', 'Ofrece apoyo con facturas de electricidad, gas, agua u otros servicios públicos, sujeto a disponibilidad.', 'Offers help with electric, gas, water, or other utility bills, subject to availability.', 'recursos-financieros'],
  [/credit card debt|debt relief|creditor|bankruptcy/i, 'Orientación sobre deudas', 'Debt counseling', 'Ofrece orientación sobre alternativas para manejar deudas o bancarrota; confirme costos y condiciones antes de contratar servicios.', 'Offers guidance about options for managing debt or bankruptcy; confirm fees and terms before enrolling in services.', 'recursos-financieros'],
  [/rent|mortgage|foreclosure|housing costs|housing support/i, 'Asistencia de vivienda', 'Housing assistance', 'Ofrece orientación o asistencia relacionada con renta, hipoteca o estabilidad de vivienda.', 'Offers guidance or assistance related to rent, mortgage, or housing stability.', 'vivienda'],
  [/emergency shelter|overnight shelter|transitional housing|family shelter|shelter for/i, 'Refugio y vivienda temporal', 'Shelter and temporary housing', 'Ofrece refugio de emergencia o apoyo de vivienda temporal.', 'Provides emergency shelter or temporary housing support.', 'vivienda'],
  [/senior care|senior center|assisted living|independent living|nursing home|respite care/i, 'Apoyo para adultos mayores', 'Senior support', 'Ofrece apoyo, actividades o navegación de servicios para adultos mayores, según el programa.', 'Provides support, activities, or service navigation for older adults, depending on the program.', 'salud'],
  [/^salvation army\b/i, 'Refugio y apoyo de emergencia', 'Shelter and emergency support', 'Ofrece refugio y servicios de apoyo de emergencia a través de los programas locales de The Salvation Army.', 'Provides shelter and emergency support services through local Salvation Army programs.', 'vivienda'],
  [/memory|alzheimer/i, 'Cuidado de memoria', 'Memory care', 'Ofrece o coordina cuidado para personas con necesidades de memoria o Alzheimer.', 'Provides or coordinates care for people with memory-related needs or Alzheimer’s.', 'salud'],
  [/home health|in-home|home care|skilled nursing|home health aide/i, 'Atención médica en el hogar', 'Home health care', 'Ofrece atención o apoyo de salud en el hogar.', 'Provides health care or support in the home.', 'salud'],
  [/hospice/i, 'Cuidados de hospicio', 'Hospice care', 'Ofrece cuidados de hospicio y apoyo para pacientes y sus familias.', 'Provides hospice care and support for patients and families.', 'salud'],
  [/medical supplies|incontinence|ostomy|urological|wound|diabetes/i, 'Suministros médicos', 'Medical supplies', 'Proporciona o vende suministros médicos y productos de cuidado personal.', 'Provides or sells medical supplies and personal-care products.', 'salud'],
  [/primary care|family medicine|pediatrics|women.s health|laboratory|x-rays|telehealth/i, 'Atención médica', 'Health care', 'Ofrece servicios de atención primaria y otras especialidades de salud.', 'Provides primary care and other health specialties.', 'salud'],
  [/dental|dentistry|teeth/i, 'Atención dental', 'Dental care', 'Ofrece atención dental o ayuda para acceder a servicios dentales.', 'Provides dental care or help accessing dental services.', 'salud'],
  [/mental health|counseling|psychiatric|therapy/i, 'Salud mental y consejería', 'Mental health and counseling', 'Ofrece servicios de salud mental, consejería o apoyo emocional.', 'Provides mental health care, counseling, or emotional support.', 'salud'],
  [/substance use|detox|addiction|recovery|sober living|medication assisted|\bOSAR\b/i, 'Tratamiento y recuperación', 'Treatment and recovery', 'Ofrece evaluación, tratamiento, recuperación o referencias relacionadas con el consumo de sustancias.', 'Provides assessment, treatment, recovery support, or referrals related to substance use.', 'salud'],
  [/job search|workforce|employment|paid training|career training/i, 'Empleo y capacitación laboral', 'Employment and job training', 'Ofrece búsqueda de empleo, capacitación o apoyo para incorporarse a la fuerza laboral.', 'Provides job-search, training, or workforce-entry support.', 'otros-recursos'],
  [/adult education|ged|english for speakers|digital literacy|college preparation/i, 'Educación para adultos', 'Adult education', 'Ofrece educación para adultos, preparación académica o desarrollo de habilidades.', 'Provides adult education, academic preparation, or skills development.', 'educacion'],
  [/transportation|ride request|bus passes|travel reimbursement/i, 'Apoyo de transporte', 'Transportation support', 'Ofrece transporte, coordinación de viajes o asistencia con gastos de traslado.', 'Provides transportation, ride coordination, or travel-expense assistance.', 'transporte'],
  [/childcare|child care|head start|children from birth/i, 'Apoyo para niños y familias', 'Child and family support', 'Ofrece cuidado infantil, educación temprana o apoyo para niños y sus familias.', 'Provides child care, early education, or support for children and families.', 'otros-recursos'],
  [/domestic violence|sexual assault|sex trafficking|safety planning|survivor/i, 'Apoyo para sobrevivientes de violencia y agresión sexual', 'Support for survivors of violence and sexual assault', 'Ofrece apoyo confidencial, planificación de seguridad y recursos para sobrevivientes de violencia o agresión sexual.', 'Provides confidential support, safety planning, and resources for survivors of violence or sexual assault.', 'ayuda-legal'],
  [/seeking safety|causing harm|rape, abuse|\bRAINN\b/i, 'Apoyo ante violencia sexual o familiar', 'Sexual or family violence support', 'Ofrece información, apoyo o planificación de seguridad ante violencia sexual o familiar.', 'Provides information, support, or safety planning related to sexual or family violence.', 'ayuda-legal'],
  [/civil legal|legal assistance|legal advocacy|immigration benefits|legal hotline/i, 'Asistencia legal', 'Legal assistance', 'Ofrece información, orientación o representación legal según el programa.', 'Provides legal information, guidance, or representation depending on the program.', 'ayuda-legal'],
  [/lifeline|free phone|wireless/i, 'Servicio telefónico Lifeline', 'Lifeline phone service', 'Ofrece servicio telefónico mediante el beneficio federal Lifeline para personas que califican.', 'Provides phone service through the federal Lifeline benefit for eligible applicants.', 'otros-recursos'],
  [/pet food/i, 'Alimentos para mascotas', 'Pet food assistance', 'Ofrece alimentos y, según disponibilidad, suministros para mascotas.', 'Provides pet food and, when available, pet supplies.', 'otros-recursos'],
  [/spay|neuter|vaccin|microchip|heartworm|veterinary|flea|tick/i, 'Atención veterinaria', 'Veterinary care', 'Ofrece servicios veterinarios preventivos o de tratamiento para mascotas.', 'Provides preventive or treatment-oriented veterinary services for pets.', 'salud'],
  [/rehom|adopt|foster care.*pet|shelter surrender/i, 'Reubicación de mascotas', 'Pet rehoming', 'Ayuda a encontrar un nuevo hogar o cuidado temporal para mascotas.', 'Helps find a new home or temporary care for pets.', 'otros-recursos'],
  [/social security card|ssi|ssdi|survivor benefits|medicare benefits/i, 'Beneficios del Seguro Social', 'Social Security benefits', 'Ayuda con tarjetas del Seguro Social y beneficios como SSI, SSDI, sobrevivientes o Medicare.', 'Helps with Social Security cards and benefits such as SSI, SSDI, survivor benefits, or Medicare.', 'recursos-financieros'],
  [/prescription|medication shipped/i, 'Asistencia con medicamentos', 'Prescription assistance', 'Ofrece acceso, descuentos o ayuda económica para medicamentos recetados.', 'Provides access, discounts, or financial help for prescription medication.', 'salud'],
  [/HIV|intersex|gender-affirming|\bSTI\b/i, 'Salud sexual y atención inclusiva', 'Sexual health and inclusive care', 'Ofrece servicios de salud sexual o atención inclusiva, según el programa.', 'Provides sexual-health services or inclusive care, depending on the program.', 'salud'],
  [/pet deposits|medical bills.*pet|urgent medical care/i, 'Asistencia económica para mascotas', 'Pet financial assistance', 'Ofrece subvenciones o ayuda económica limitada para necesidades de mascotas, sujeta a elegibilidad y fondos disponibles.', 'Offers limited grants or financial help for pet needs, subject to eligibility and available funds.', 'recursos-financieros'],
  [/animal shelter|unwanted or abandoned|\bTNR\b|trappers|colony managers|cat and dog fosters/i, 'Refugio y apoyo para animales', 'Animal shelter and support', 'Ofrece refugio, rehabilitación o apoyo comunitario para animales, según el programa.', 'Provides shelter, rehabilitation, or community support for animals, depending on the program.', 'otros-recursos'],
  [/eligibility, enrollment|eligiblity, enrollment|preferred VA facility/i, 'Inscripción en beneficios de salud', 'Health-benefit enrollment', 'Ayuda con elegibilidad, inscripción o cambios relacionados con beneficios de atención médica.', 'Helps with eligibility, enrollment, or changes related to health-care benefits.', 'salud'],
  [/veterans financial assistance/i, 'Asistencia económica para veteranos', 'Veteran financial assistance', 'Ofrece asistencia económica o navegación de beneficios para veteranos que cumplen los requisitos del programa.', 'Offers financial assistance or benefit navigation for Veterans who meet program requirements.', 'recursos-financieros'],
  [/community resources|resource guide|referrals|case management/i, 'Navegación de recursos', 'Resource navigation', 'Ayuda a localizar servicios comunitarios y coordinar referencias.', 'Helps locate community services and coordinate referrals.', 'otros-recursos']
];

const officialSources = new Map(Object.entries({
  'department of health and human services':'https://www.hhs.gov/about/contact-us/index.html',
  'cedar park va clinic':'https://www.va.gov/central-texas-health-care/locations/cedar-park-va-clinic/',
  'austin va clinic':'https://www.va.gov/central-texas-health-care/locations/austin-va-clinic/',
  'lagrange va clinic':'https://marketplace.va.gov/facilities/lagrange',
  'bluebonnet trails osar outreach screening assessment and referral':'https://bbtrails.org/substance-use-services/',
  'osar':'https://bbtrails.org/substance-use-services/',
  'goodwill industries of ct round rock job center':'https://www.goodwillcentraltexas.org/programs-and-services/find-a-job/how-to-enroll/',
  'goodwill industries of ct georgetown job center':'https://www.goodwillcentraltexas.org/programs-and-services/find-a-job/how-to-enroll/',
  'goodwill industries bastrop job help center':'https://www.goodwillcentraltexas.org/locations/',
  'travis county family support services palm square office':'https://www.traviscountytx.gov/health-human-services/divisions/family-support-services',
  'safe alliance':'https://www.safeaustin.org/our-services/shelter-housing/',
  'salvation army':'https://salvationarmyaustin.org/texas-austin/our-shelters/'
}));
const currentSourceOrganizations = new Set(officialSources.keys());

const rows = parsed.records.map((record, index) => enrich(record.values, index < 111));
fs.writeFileSync(outputFile, encode([parsed.headers, ...rows.map(row => parsed.headers.map(header => row[header] || ''))]));
console.log(`Enriched ${rows.length} rows and wrote ${outputFile}.`);

function enrich(source, pantry) {
  const row = { ...source };
  const organization = row.organization_name.replace(/\s+/g, ' ').trim();
  const key = norm(organization);
  // Summaries are generated by this script, so they must not feed the next run and
  // gradually change a resource's classification. Descriptions and source hours
  // remain the stable evidence for repeatable enrichment.
  const evidence = `${organization} ${row.description_en} ${row.hours_en}`;
  const facts = pantry ? [serviceFacts[0]] : serviceFacts.filter(([pattern]) => pattern.test(evidence));
  const orderedFacts = prioritizeFacts(facts, evidence, key);
  const selectedFacts = orderedFacts.length ? orderedFacts : [[null, 'Apoyo comunitario', 'Community support', 'Ofrece el servicio comunitario descrito por la organización.', 'Provides the community service described by the organization.', row.primary_category]];
  row.organization_name = organization;
  if (pantry) {
    row.title_es = 'Despensa de alimentos';
    row.title_en = 'Food pantry';
  } else {
    row.title_es = selectedFacts[0][1];
    row.title_en = selectedFacts[0][2];
  }
  row.summary_es = selectedFacts.slice(0, 2).map(fact => fact[3]).join(' ');
  row.summary_en = selectedFacts.slice(0, 2).map(fact => fact[4]).join(' ');
  row.description_es = selectedFacts.map(fact => fact[3]).join(' ');
  row.description_en = cleanEnglish(row.description_en || selectedFacts.map(fact => fact[4]).join(' '));
  if (key === 'safe alliance') {
    row.title_es = 'Apoyo para sobrevivientes de violencia y agresión sexual';
    row.title_en = 'Support for survivors of violence and sexual assault';
    row.summary_es = 'Ofrece apoyo confidencial, planificación de seguridad, recursos y opciones de refugio para sobrevivientes de violencia o agresión sexual.';
    row.summary_en = 'Provides confidential support, safety planning, resources, and shelter options for survivors of violence or sexual assault.';
    row.description_es = row.summary_es;
  }
  const categories = unique(selectedFacts.map(fact => fact[5]));
  if (categories.length) {
    row.primary_category = categories[0];
    row.additional_categories = categories.slice(1).join('|');
  }
  row.keywords_es = unique(selectedFacts.flatMap(fact => fact[1].toLowerCase().split(/\s+y\s+|\s+/)).filter(word => word.length > 3)).join('|');
  row.keywords_en = unique(selectedFacts.flatMap(fact => fact[2].toLowerCase().split(/\s+and\s+|\s+/)).filter(word => word.length > 3)).join('|');
  row.languages = inferLanguages(evidence);
  row.service_methods = inferMethods(row, evidence);
  row.cost_type = inferCost(evidence);
  [row.eligibility_es, row.eligibility_en] = inferEligibility(evidence, key);
  [row.required_documents_es, row.required_documents_en] = inferDocuments(evidence);
  [row.application_steps_es, row.application_steps_en] = inferApplication(evidence, row);
  const hours = inferHours(key, evidence, row.hours_es, row.hours_en);
  row.hours_es = hours.es; row.hours_en = hours.en;
  row.phone = formatPhone(row.phone);
  row.website_url = stripTracking(row.website_url);
  row.source_url = stripTracking(row.source_url);
  if (!row.source_url && pantry) row.source_url = /Gonzales|Guadalupe/.test(row.service_area_en) ? sanAntonioDirectory : pantryDirectory;
  const official = officialSources.get(key);
  if (official) row.source_url = row.website_url || official;
  if (currentSourceOrganizations.has(key)) row.last_verified_at = today;
  const priorNotes = String(row.verification_notes || '')
    .replace(/(?:Piloto de Bluebonnet Project HOPE\.\s*)+/gi, '')
    .replace(new RegExp(`(?:Fuente oficial consultada el ${today.replaceAll('-', '\\-')}\\.\\s*)+`, 'gi'), '')
    .trim();
  row.verification_notes = `Piloto de Bluebonnet Project HOPE. ${row.last_verified_at === today ? `Fuente oficial consultada el ${today}. ` : ''}${priorNotes}`.replace(/\s+/g, ' ').trim();
  row.is_emergency = /emergency shelter|domestic violence hotline|sexual assault|crisis line|immediate danger/i.test(evidence) ? 'true' : row.is_emergency;
  return row;
}

function prioritizeFacts(facts, evidence, key) {
  const preferredTitle =
    (/Emancipet|Texas Humane Heroes|Dr\. Tarlton|Pop-Up Pet Vax|Feline Rescue|spay|neuter|vaccin|microchip|heartworm|veterinary|flea|tick/i.test(evidence) && 'Veterinary care')
    || (/APA.s P\.A\.S\.S|Home to Home|Rehome by Adopt a Pet/i.test(evidence) && 'Pet rehoming')
    || (/Airtalk Wireless|Assurance Wireless|\bLifeline\b/i.test(evidence) && 'Lifeline phone service')
    || (/childcare|child care|Head Start/i.test(evidence) && 'Child and family support')
    || (/Adult Education|GED|English for Speakers|digital literacy/i.test(evidence) && 'Adult education')
    || (/Social Security Administration|Social Security card|SSI\/SSDI/i.test(evidence) && 'Social Security benefits')
    || (/Texas Rio Grande Legal Aid|Immigration Legal Services|civil legal|legal assistance/i.test(evidence) && 'Legal assistance')
    || (/SAFE Alliance|domestic violence|sexual assault|sex trafficking|survivors?|family violence/i.test(evidence) && 'Support for survivors of violence and sexual assault')
    || (/\bOSAR\b|substance use|detoxification|addiction|sober living/i.test(evidence) && 'Treatment and recovery')
    || (/Central Health Medical Access Program|Lone Star Circle of Care/i.test(evidence) && 'Health care')
    || (/GoodWill Industries|Work Force Solutions|Workforce Solutions/i.test(evidence) && 'Employment and job training')
    || (/Veterans Financial Assistance/i.test(evidence) && 'Veteran financial assistance');
  if (!preferredTitle) return facts;
  const preferred = serviceFacts.find(fact => fact[2] === preferredTitle);
  return preferred ? [preferred, ...facts.filter(fact => fact !== preferred)] : facts;
}

function inferLanguages(text) {
  if (/english and spanish|english.*spanish|spanish.*english|español/i.test(text)) return 'en|es';
  if (/in english|english only/i.test(text)) return 'en';
  return '';
}
function inferMethods(row, text) {
  const methods = new Set(String(row.service_methods || '').split(/[|,;]/).map(value => value.trim()).filter(Boolean));
  if (row.address_line_1) methods.add('in_person');
  if (row.phone || /call|hotline|phone/i.test(text)) methods.add('phone');
  if (row.website_url && /online|virtual|website|live chat|submit|book online|platform|account/i.test(text)) methods.add('online');
  if (/in-home|home health|home visit|delivered to the home|medication shipped/i.test(text)) methods.add('home_visit');
  return [...methods].join('|');
}
function inferCost(text) {
  if (/sliding fee|sliding scale/i.test(text)) return 'sliding_scale';
  if (/\$\d+|hourly rates|listing fee|purchased online/i.test(text)) return 'paid';
  if (/\bfree\b|no cost/i.test(text)) return 'free';
  return 'unknown';
}
function inferEligibility(text, key) {
  const es=[], en=[];
  const add=(a,b)=>{es.push(a);en.push(b);};
  if (/low.?income|income.*poverty|poverty guidelines/i.test(text)) add('Se aplican límites de ingreso del programa.','Program income limits apply.');
  if (/55\+|55 and older|age 55/i.test(text)) add('Personas de 55 años o más.','People age 55 or older.');
  if (/60yrs\+|60 years|elderly|older adults/i.test(text)) add('Dirigido a adultos mayores; confirme la edad mínima con el programa.','Intended for older adults; confirm the minimum age with the program.');
  if (/veteran|military families/i.test(text)) add('Dirigido a veteranos, cuidadores o familias militares según el programa.','For Veterans, caregivers, or military families as defined by the program.');
  if (/uninsured|underinsured/i.test(text)) add('Puede estar dirigido a personas sin seguro o con seguro insuficiente.','May be intended for people who are uninsured or underinsured.');
  if (/homebound status/i.test(text)) add('Medicare o Medicaid y condición de confinamiento en el hogar, además de necesidad de servicios especializados.','Medicare or Medicaid, homebound status, and a need for skilled services.');
  if (/no residency requirements/i.test(text)) add('No hay requisito de residencia; debe poder acudir a la despensa.','No residency requirement; the client must be able to reach the pantry.');
  if (/must be 18 years or older/i.test(text)) add('Debe tener 18 años o más y estar libre de drogas y alcohol.','Must be age 18 or older and drug- and alcohol-free.');
  if (/children from birth to age five/i.test(text)) add('Niños desde el nacimiento hasta los cinco años que cumplan los criterios de ingresos, falta de vivienda, asistencia pública o cuidado temporal descritos por Head Start.','Children from birth through age five who meet Head Start income, homelessness, public-assistance, or foster-care criteria.');
  if (/lifeline|135% or less|medicaid.*snap/i.test(text)) add('Debe cumplir los límites de ingreso de Lifeline o participar en un programa federal elegible.','Must meet Lifeline income limits or participate in an eligible federal assistance program.');
  if (key.includes('central health medical access')) add('Personas sin seguro que viven en el condado de Travis y cumplen los criterios del programa MAP.','Uninsured Travis County residents who meet MAP program requirements.');
  return [unique(es).join(' '), unique(en).join(' ')];
}
function inferDocuments(text) {
  const es=[],en=[]; const add=(a,b)=>{es.push(a);en.push(b);};
  if (/\bID\b|identification/i.test(text)) add('Identificación','Identification');
  if (/social security card/i.test(text)) add('Tarjeta del Seguro Social','Social Security card');
  if (/current bill|printed copy of bill|bill that is past due/i.test(text)) add('Factura actual o vencida correspondiente','Current or past-due bill');
  if (/rent notice|late rent/i.test(text)) add('Aviso de renta atrasada','Late-rent notice');
  if (/written proof.*insurance/i.test(text)) add('Comprobante escrito de que el seguro no cubre el tratamiento, si solicita evaluación financiera','Written proof that insurance does not cover treatment, when requesting financial eligibility review');
  return [es.join('; '),en.join('; ')];
}
function inferApplication(text,row) {
  if (/submit a request online.*day before pickup/i.test(text)) return ['Envíe la solicitud en línea el día anterior a recoger los alimentos para mascotas. Si no tiene acceso confiable a tecnología, pida a un proveedor de servicios que coordine una adaptación.','Submit the online request the day before pet-food pickup. If reliable technology is unavailable, ask a service provider to coordinate an accommodation.'];
  if (/must complete application online|complete application online|apply online/i.test(text)) return ['Complete la solicitud en línea y espere la confirmación del programa antes de acudir.','Complete the online application and wait for program confirmation before visiting.'];
  if (/by appointment only|call for appointment|applications by phone only/i.test(text)) return ['Llame para confirmar elegibilidad y solicitar una cita.','Call to confirm eligibility and request an appointment.'];
  if (/walk-in|walk ins welcomed/i.test(text)) return ['Confirme el horario vigente; se aceptan visitas sin cita según disponibilidad.','Confirm current hours; walk-ins are accepted subject to availability.'];
  if (/call|contact via phone|hotline/i.test(text) && row.phone) return ['Llame al programa para confirmar elegibilidad, disponibilidad y próximos pasos.','Call the program to confirm eligibility, availability, and next steps.'];
  if (row.website_url && /online|website|platform|account/i.test(text)) return ['Consulte el sitio oficial y siga el proceso de solicitud indicado.','Visit the official website and follow its application process.'];
  if (row.address_line_1) return ['Confirme el horario, la disponibilidad y los requisitos antes de acudir.','Confirm hours, availability, and requirements before visiting.'];
  return ['Comuníquese directamente con la organización para confirmar el proceso de acceso.','Contact the organization directly to confirm how to access the service.'];
}
function inferHours(key,text,currentEs,currentEn) {
  if (currentEs && currentEn) return {es:cleanSpanishHours(currentEs),en:currentEn};
  const overrides = {
    'goodwill industries of ct round rock job center':['Lunes a jueves, 9:00 a.m.–4:00 p.m.; viernes solo con cita.','Monday–Thursday, 9:00 a.m.–4:00 p.m.; Friday by appointment only.'],
    'goodwill industries of ct georgetown job center':['Lunes a jueves, 9:00 a.m.–4:00 p.m.; viernes solo con cita.','Monday–Thursday, 9:00 a.m.–4:00 p.m.; Friday by appointment only.'],
    'goodwill industries bastrop job help center':['Confirme el horario vigente con Goodwill Central Texas.','Confirm current hours with Goodwill Central Texas.'],
    'capital area rutal transportation systems carts':['Centro de reservaciones: lunes a viernes, 7:00 a.m.–4:30 p.m.','Reservation center: Monday–Friday, 7:00 a.m.–4:30 p.m.'],
    'in the streets hands up high':['Servicios generales: lunes a viernes, 8:30 a.m.–3:00 p.m. Desayuno: 9:00–10:30 a.m.; almuerzo: 12:00–2:00 p.m.; cena: segundo y tercer viernes, 6:00–7:30 p.m.; despensa: jueves, 10:30–11:30 a.m.','General services: Monday–Friday, 8:30 a.m.–3:00 p.m. Breakfast: 9:00–10:30 a.m.; lunch: 12:00–2:00 p.m.; dinner: second and third Friday, 6:00–7:30 p.m.; pantry: Thursday, 10:30–11:30 a.m.'],
    'christian women s job corp of highland lakes cwjchl':['Sesiones de 12 semanas en febrero y septiembre; clases martes a jueves, 9:00 a.m.–2:30 p.m.','Twelve-week sessions beginning in February and September; classes Tuesday–Thursday, 9:00 a.m.–2:30 p.m.'],
    'st vincent de paul church':['Llamadas: martes y jueves, 9:30–10:30 a.m.','Calls: Tuesday and Thursday, 9:30–10:30 a.m.'],
    'st austin catholic parish newman hall':['Jueves a las 9:00 a.m.; cupo limitado.','Thursday at 9:00 a.m.; limited capacity.'],
    'all saints episcopal church':['Inscripción los martes a las 8:15 a.m.; atención por orden de llegada y cupo limitado.','Sign-up Tuesday at 8:15 a.m.; first come, first served with limited capacity.'],
    'baptist community center':['Citas: lunes a viernes, 8:30 a.m.–12:00 p.m. y 1:00–5:00 p.m.','Appointments: Monday–Friday, 8:30 a.m.–12:00 p.m. and 1:00–5:00 p.m.'],
    'travis county family support services palm square office':['Lunes a viernes, 8:00 a.m.–5:00 p.m.','Monday–Friday, 8:00 a.m.–5:00 p.m.'],
    'uplift at university presbyterian church':['Martes, 9:30–10:30 a.m.; los nombres dejan de aceptarse a las 10:30 a.m.','Tuesday, 9:30–10:30 a.m.; names stop being accepted at 10:30 a.m.'],
    'greater mt zion church community assistance and referral center':['Martes y jueves, 10:30 a.m.–1:30 p.m.','Tuesday and Thursday, 10:30 a.m.–1:30 p.m.'],
    'catholic charities of central texas':['Lunes a viernes, 8:30 a.m.–12:00 p.m. y 1:00–5:00 p.m.','Monday–Friday, 8:30 a.m.–12:00 p.m. and 1:00–5:00 p.m.'],
    'cedar park va clinic':['Lunes a viernes, 8:00 a.m.–4:30 p.m.; cerrado sábados, domingos y feriados federales. Los horarios de servicios específicos pueden variar.','Monday–Friday, 8:00 a.m.–4:30 p.m.; closed Saturday, Sunday, and federal holidays. Individual service hours may vary.'],
    'austin va clinic':['Lunes a viernes, 8:00 a.m.–4:30 p.m.; cerrado sábados y domingos. Los horarios de servicios específicos pueden variar.','Monday–Friday, 8:00 a.m.–4:30 p.m.; closed Saturday and Sunday. Individual service hours may vary.']
  };
  const value=overrides[key]; return value?{es:value[0],en:value[1]}:{es:'',en:''};
}
function cleanSpanishHours(value) {
  return String(value || '')
    .replace(/CERRADO ON juevesS/gi, 'Cerrado los jueves')
    .replace(/CERRADO ON domingoS/gi, 'Cerrado los domingos')
    .replace(/Every first martes/gi, 'Primer martes de cada mes')
    .replace(/1st and 3rd sábado of every month/gi, 'Primer y tercer sábado de cada mes')
    .replace(/Every first miércoles of the month/gi, 'Primer miércoles de cada mes')
    .replace(/martes+s and jueves+s/gi, 'Martes y jueves')
    .replace(/CERRADO on the fifth week of the month/gi, 'Cerrado la quinta semana del mes')
    .replace(/martes+s:/gi, 'Martes:')
    .replace(/-noon\b/gi, '–12:00 p.m.')
    .replace(/Horario:\s*INQUIRE ABOUT HOURS/gi, 'Confirme el horario con la organización')
    .replace(/\bMon-Fri\b/gi, 'Lunes a viernes')
    .replace(/\b1st\b/gi, 'primer')
    .replace(/\b2nd\b/gi, 'segundo')
    .replace(/\b3rd\b/gi, 'tercer')
    .replace(/\b4th\b/gi, 'cuarto')
    .replace(/\blast\b/gi, 'último')
    .replace(/\bThurs\b/gi, 'jueves')
    .replace(/\bWed\b/gi, 'miércoles')
    .replace(/\bSat\b/gi, 'sábado')
    .replace(/\band\b/gi, 'y')
    .replace(/\bOpen daily\b/gi, 'Abierto todos los días')
    .replace(/\bBreakfast\b/gi, 'Desayuno')
    .replace(/\bLunch\b/gi, 'Almuerzo')
    .replace(/\bDinner\b/gi, 'Cena')
    .replace(/\bThanksgiving\b/gi, 'Día de Acción de Gracias')
    .replace(/\bChristmas\b/gi, 'Navidad')
    .replace(/\bCERRADO daily from\b/gi, 'Cerrado todos los días de')
    .replace(/\bneed to confirm\b/gi, 'se debe confirmar')
    .replace(/\bSecond\b/gi, 'Segundo')
    .replace(/\bClient-choice Pantry\b/gi, 'Despensa con selección de alimentos')
    .replace(/\bDrive thru food distribution\b/gi, 'Distribución de alimentos desde el vehículo')
    .replace(/\bof the month\b/gi, 'del mes')
    .replace(/\bof each month\b/gi, 'de cada mes')
    .replace(/\bexclusively for the HOPE Distribution for Seniors\b/gi, 'exclusivamente para la distribución HOPE para adultos mayores')
    .replace(/\bPantry foods\b/gi, 'Despensa de alimentos')
    .replace(/\bONLY\b/gi, 'solamente')
    .replace(/\bFIRDAYS\b/gi, 'viernes')
    .replace(/\bdomingoS\b/gi, 'domingos')
    .replace(/\b(lunes|martes|miércoles|jueves|viernes)s\b/gi, '$1');
}
function cleanEnglish(value) { return String(value || '').replace(/\s+/g, ' ').replace(/\bWebiste\b/g, 'Website').replace(/\btherpay\b/g, 'therapy').trim(); }
function stripTracking(value) { try { if(!value)return ''; const url=new URL(value); for(const key of [...url.searchParams.keys()]) if(/^utm_|^(gclid|gbraid|gad_source|gad_campaignid|device|placement|match)$/i.test(key)) url.searchParams.delete(key); return url.toString(); } catch { return value; } }
function formatPhone(value) { const digits=String(value||'').replace(/\D/g,'').replace(/^1(?=\d{10}$)/,''); return digits.length===10?`${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`:value; }
function encode(rows) { return `${rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"','""')}"`).join(',')).join('\n')}\n`; }
