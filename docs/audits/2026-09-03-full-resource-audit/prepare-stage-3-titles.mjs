#!/usr/bin/env node

import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-3-titles.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const fixes = new Map([
  ['c2e8d27a-38f3-4a7e-a82c-33cdf7e11f97', ['Vivienda accesible para personas con discapacidades', 'Accessible housing for people with disabilities']],
  ['0a97f4ee-26c3-4a07-a118-c3cf024c20d5', ['Asistencia con renta y servicios públicos', 'Rent and utility assistance']],
  ['d8a0d9f5-ca03-4a94-bf7a-a0d4f5d37669', ['Comidas calientes y duchas', 'Hot meals and showers']],
  ['bf5c41af-a94a-4b0f-be55-3a8c0bded946', ['Atención de salud sexual y bienestar', 'Sexual health and wellness care']],
  ['b082a770-59a2-46cf-aa1c-03293fe26012', ['Refrigeradores y despensas comunitarias', 'Community refrigerators and food pantries']],
  ['5c580c96-5e59-465f-9223-c223a9a1e1b1', ['Programa de compra de vivienda asequible', 'Affordable homeownership program']],
  ['cfba8357-d505-4dfe-acdd-0f97af507dfb', ['Orientación para inquilinos y vivienda justa', 'Tenant counseling and fair housing support']],
  ['a40fba36-1d16-4abf-b8f8-0ff41173d148', ['Vivienda residencial para madres solteras y sus hijos', 'Residential housing for single mothers and children']],
  ['972f44f8-ae7a-43db-8433-a87ce7293d51', ['Organización y defensa colectiva de inquilinos', 'Tenant organizing and collective advocacy']],
  ['9fb125d7-eee4-41ed-bb48-adfcf413ff6b', ['Alimentos y apoyo para necesidades básicas', 'Food and basic-needs assistance']],
  ['c567ffe0-7dc7-401d-9070-e41641d6e452', ['Acceso a alimentos y ayuda con solicitudes de SNAP', 'Food access and SNAP application assistance']],
  ['289575a2-533f-40c9-80ba-2493c04e34b5', ['Servicio de referencia de abogados', 'Lawyer referral service']],
  ['30a2ed4d-a999-4c72-bf55-373715e765cb', ['Vivienda asequible en Clarksville', 'Affordable housing in Clarksville']],
  ['e80c7223-8a58-48b3-a796-556333001f2d', ['Asistencia con renta atrasada y servicios públicos', 'Past-due rent and utility assistance']],
  ['1617f63a-5e6d-4d72-ae3c-24cef6ca65f4', ['Transporte voluntario para adultos mayores', 'Volunteer transportation for older adults']],
  ['54f421f8-ef5c-464e-b432-0d7070caff95', ['Evaluación coordinada para asistencia de vivienda', 'Coordinated assessment for housing assistance']],
  ['90b3d0f4-6385-4e67-aff8-28777cba01dc', ['Información sobre desalojos y apoyo para inquilinos', 'Eviction information and tenant support']],
  ['1a14a367-0b90-4bf9-a205-a4937b57db90', ['Vivienda pública y vales de Sección 8', 'Public housing and Section 8 vouchers']],
  ['9da35367-d065-47e8-83f2-862a7e66e89f', ['Despensa de alimentos', 'Food pantry']],
  ['a13989cb-a3d6-42da-bf51-264ecc328b84', ['Alquiler y compra de vivienda asequible', 'Affordable rental and homeownership options']],
  ['01bd9281-55d8-4e86-93f8-9723e134aeca', ['Ayuda con copagos, primas y costos médicos', 'Help with copays, premiums, and medical costs']],
  ['af22c751-b355-4999-923d-cc77bc27bc8f', ['Vivienda pública y listas de asistencia de renta', 'Public housing and rental-assistance waitlists']],
  ['8aa8a027-bd36-44a7-ae4b-2d1338547725', ['Vales de vivienda y vivienda asequible', 'Housing vouchers and affordable housing']],
  ['4fcd375f-c87d-4f8d-98a5-b6e7d9486ed5', ['Despensa y asistencia de emergencia', 'Food pantry and emergency assistance']],
  ['986bbf8f-0c0a-4b57-a0d1-ab8d9fb7fe9f', ['Plan de ahorro para atención dental', 'Dental care savings plan']],
  ['f4540f06-84ce-419b-89a5-050cde1f0a0b', ['Centro de recursos para jóvenes sin vivienda', 'Resource center for youth experiencing homelessness']],
  ['6aaaceb5-440b-463b-b09b-81c9752bc509', ['Alfabetización, inglés y preparación para GED', 'Literacy, English, and GED preparation']],
  ['1f38b864-ea55-418e-89e3-91cec44a92d6', ['Comidas para veteranos y sus familias', 'Meals for veterans and their families']],
  ['babaf4b3-a506-4cef-8dbc-bccc0e05d71e', ['Comidas a domicilio y apoyo para adultos mayores', 'Home-delivered meals and support for older adults']],
  ['c95962a4-2670-4382-809b-433c69bd0c27', ['Compra y alquiler de viviendas asequibles en Mueller', 'Affordable homeownership and rentals in Mueller']],
  ['bb79ba13-9206-42de-8815-bdabc9089bb3', ['Alimentos, pañales y asistencia con servicios públicos', 'Food, diapers, and utility assistance']],
  ['ef198568-885e-40d2-816b-520a9e26b137', ['Anteojos recetados gratuitos', 'Free prescription eyeglasses']],
  ['61f9b09f-3d53-42b5-9852-24eaa0007d4b', ['Tratamiento ambulatorio de salud mental y uso de sustancias', 'Outpatient mental health and substance-use treatment']],
  ['5f5f2227-d772-4fbb-82fd-e81b283f3750', ['Alimentos, ropa y asistencia financiera', 'Food, clothing, and financial assistance']],
  ['f238120b-962a-4a16-9b5d-cd985c720925', ['Vivienda pública y asistencia de renta', 'Public housing and rental assistance']],
  ['aba8c2dc-e950-4c8f-88cb-fac97c7d2768', ['Asistencia con renta y servicios públicos en varias ubicaciones', 'Multi-location rent and utility assistance']],
  ['c65384a6-0859-4ba8-8c8b-aba0aff5fc07', ['Asistencia con renta y servicios públicos', 'Rent and utility assistance']],
  ['c3fa79c2-8092-4bd6-9e5b-dff2f71ca79c', ['Vivienda asequible para adultos mayores y personas con discapacidades', 'Affordable housing for older adults and people with disabilities']],
  ['d77a2e01-6c7d-41bd-aaca-886b552cc7ec', ['Asistencia con servicios públicos para familias monoparentales', 'Utility assistance for single-parent families']],
  ['2c99f837-d066-4da3-888b-3103fae05249', ['Centro de día y navegación para personas sin vivienda', 'Day center and navigation for people experiencing homelessness']],
  ['ce5651d2-ee8b-4a6c-9611-9481118421d0', ['Vivienda pública y vales de Sección 8', 'Public housing and Section 8 vouchers']],
  ['45d1f506-6093-411c-93f6-3e766cd8c226', ['Servicios legales civiles en todo Texas', 'Statewide civil legal services']],
  ['5f2c362a-438a-4f1a-9a7e-f5d76a092c3b', ['Educación técnica y capacitación profesional', 'Technical education and career training']],
  ['ab4f146b-6be9-4bde-93ea-072903bfeb76', ['Asistencia con servicios públicos', 'Utility assistance']],
  ['e0d9758c-a1a5-40d4-8cef-a4fe70121dec', ['Centro de día para personas sin vivienda', 'Day center for people experiencing homelessness']],
  ['cb14b8fd-d05f-4d23-bfdb-30ebbe0abaa6', ['Asistencia con servicios públicos y necesidades básicas', 'Utility and basic-needs assistance']],
  ['636abf06-f27e-465f-a084-db2dec7f7fc5', ['Consejería de salud mental con asistencia Ryan White', 'Mental health counseling with Ryan White assistance']],
  ['c8dbfac7-9f96-46ce-9968-5f58ebec7f72', ['Empleo, capacitación y desarrollo laboral', 'Employment, training, and workforce development']],
  ['e6f92c60-4b28-411d-9ec3-2a7d6beb32fd', ['Reuniones de recuperación y apoyo familiar', 'Recovery meetings and family support']],
  ['5e7c1ec1-b2e5-4807-9b3c-248719aefd2b', ['Orientación y reclamos de beneficios para veteranos', 'Veterans benefits counseling and claims assistance']],
  ['b4ec4cc4-7148-4215-9e96-bf243cb77dd1', ["Servicios para Veteranos St. Michael's", "St. Michael's Veteran Services"]],
  ['d4ed0a29-53f4-4a2d-b599-a0658288b06e', ['Tratamiento del trastorno por consumo de opioides — Cedar Park', 'Opioid use disorder treatment — Cedar Park']],
  ['1f9d9076-ebd8-444e-9c6e-5a3964b6e7e1', ['Orientación y reclamos de beneficios para veteranos', 'Veterans benefits counseling and claims assistance']],
  ['5161245e-540b-4198-bbfb-51c2763f0ed3', ['Centro de recursos para veteranos y sus familias', 'Resource center for veterans and their families']],
  ['b3e2deec-ec82-4a93-8c2b-fa160cc216ff', ['Atención de salud conductual — Round Rock', 'Behavioral health care — Round Rock']],
  ['efc5c4c7-6673-4c20-923a-6105141637a0', ['Atención de salud conductual — Georgetown', 'Behavioral health care — Georgetown']],
  ['baf26283-8c39-4a4b-99dc-41126636b87d', ['Servicios comunitarios y manejo de casos', 'Community services and case management']],
  ['381ceae3-e148-49af-84be-d9a66b5fc351', ['Transporte voluntario para adultos mayores', 'Volunteer transportation for older adults']],
  ['b2d9fdb2-61f0-4eac-b3c6-9b0631cbb96d', ['Consejería y apoyo familiar para jóvenes de 6 a 17 años', 'Counseling and family support for youth ages 6–17']],
  ['701f1343-57dc-4616-9bf6-c6582bd42593', ['Ayuda legal civil gratuita en Williamson County', 'Free civil legal help in Williamson County']],
  ['36baf425-4bb9-47ad-bc13-101fdfd4fb78', ['NEST Empowerment Center', 'NEST Empowerment Center']],
  ['717c0149-204c-4a6e-8300-b1a1213eabe0', ['Orientación y reclamos de beneficios para veteranos', 'Veterans benefits counseling and claims assistance']],
  ['c81ada7a-35f9-4f2c-8282-303c82c3b30c', ['Tribunal de Recuperación Familiar', 'Family Recovery Court']],
  ['800cef72-58f3-4bd0-bb1a-294961db7486', ['Orientación y reclamos de beneficios para veteranos', 'Veterans benefits counseling and claims assistance']],
  ['96e32345-c31a-4260-a816-efb412582e88', ['Salud mental y apoyo familiar para jóvenes en justicia juvenil', 'Mental health and family support for justice-involved youth']],
  ['9ce822a1-a937-412a-ac7b-651db9f9f27f', ['Apoyo para sobrevivientes de violencia doméstica y agresión sexual', 'Support for survivors of domestic violence and sexual assault']],
  ['f76f85ba-51fe-426f-b57a-dffe1defe6bb', ['Vivienda de emergencia, prevención de desalojo y centro de día', 'Emergency housing, eviction prevention, and day shelter']],
  ['73e14c4e-af91-43fe-83bb-094977880a82', ['Orientación y apoyo para cuidadores familiares', 'Navigation and support for family caregivers']],
  ['506da0f9-5a4a-4d22-95de-5765ecc825dd', ['Apoyo y relevo para cuidadores de personas con demencia', 'Support and respite for dementia caregivers']],
  ['16d516fc-28ce-45c2-b035-a5d9ee23d813', ['Reparación de vivienda para propietarios de bajos ingresos — Bastrop', 'Home repair for low-income homeowners — Bastrop']],
  ['3471b448-666e-449a-917d-7b56298439f9', ['Servicio al cliente y asistencia con facturas de agua', 'Customer service and water-bill assistance']],
  ['96f1bed9-7531-411e-99b6-f15a7e030f85', ['Asistencia de emergencia con renta y servicios públicos', 'Emergency rent and utility assistance']],
  ['a43b6184-e8d0-4794-bebe-82bd37dd0fa2', ['Salud conductual, discapacidades y apoyo en crisis — Bastrop', 'Behavioral health, disability, and crisis support — Bastrop']],
  ['4380d5fd-6cfa-41d7-8380-3b8f185ba163', ['Orientación y solicitudes de beneficios para veteranos', 'Veterans benefits counseling and applications']],
  ['acbc17f1-ec65-47fc-93f7-00e68e3c0c0a', ['Transporte público rural y médico no urgente', 'Rural public and non-emergency medical transportation']],
  ['ec30a4a3-60cf-4a17-bdbe-b2098131d48a', ['Despensa de alimentos de Cedar Creek', 'Cedar Creek food pantry']],
  ['04566642-11ce-41c5-b1c2-b3cec69dbbdd', ['Programas de alimentos para adultos mayores (CSFP y HOPE)', 'Senior food programs (CSFP and HOPE)']],
  ['5089e913-cd51-483c-b322-666165033d0f', ['Despensa móvil de Cedar Creek', 'Cedar Creek mobile pantry']],
  ['1d5c0fd4-3e2a-4d75-a2a2-d2fcd2fffb61', ['Despensa móvil de Elgin', 'Elgin mobile pantry']],
  ['f307f0ea-7f7a-4737-a487-e9c3c5cd2f41', ['Despensa comunitaria de Elgin', 'Elgin community food pantry']],
  ['3c5faf40-fa41-450b-894c-299c71202980', ['Despensa de alimentos de Elgin', 'Elgin food pantry']],
  ['8f45635a-6179-4946-9761-8d2104e43bc6', ['Comidas a domicilio y apoyo para adultos mayores', 'Home-delivered meals and support for older adults']],
  ['e094e039-07de-436e-8942-3abbe5becd34', ['Despensa de alimentos y clóset de ropa — Bastrop', 'Food pantry and clothing closet — Bastrop']],
  ['c4e54dbb-6cae-42b4-8ce4-c5138271bfed', ['Alimentos y asistencia con renta y servicios públicos — Elgin', 'Food, rent, and utility assistance — Elgin']],
  ['801a5986-85a8-48fc-920c-0b4ca1142c6a', ['Servicio de Referencia e Información de Abogados (LRIS)', 'Lawyer Referral & Information Service (LRIS)']],
  ['b53bac7b-daaf-4336-b67b-a19c290e87ec', ['Línea legal para adultos mayores y beneficiarios de Medicare', 'Legal hotline for older adults and Medicare beneficiaries']],
  ['c74b8afc-53cb-47fb-a880-a21ccf91a0c8', ['Representantes para reclamos y apelaciones de beneficios de VA', 'Representatives for VA benefit claims and appeals']],
  ['bb315bb3-7fb2-4348-b299-449331255bd4', ['División de Registros', 'Recording Division']],
  ['b70cbbba-4659-4657-b50e-7d2db25a1388', ['División de Sucesiones', 'Probate Division']],
  ['2820cec6-9291-4585-9a6a-a7ce0dd533c4', ['División de Delitos Menores', 'Misdemeanor Division']],
  ['a8dc3b93-1f99-408c-a283-b421244d111d', ['División Civil', 'Civil Division']],
  ['192ff2bb-47d5-4e66-8ce0-707963cedb01', ['Servicios de jurado y pasaportes', 'Jury and passport services']],
  ['4115c792-beac-4c6d-8a48-741741cc1a67', ['Presentación y procesamiento de divorcios', 'Divorce filing and processing']],
  ['bb95d5c7-253a-4a94-be18-40a11ee4bba4', ['Guía de servicios para adultos mayores', 'Senior services guide']],
  ['ffc5a197-bdbc-49f6-a8b0-e2fc6d20e3f2', ['Empleo y capacitación laboral — Oficina de Bastrop', 'Employment and job training — Bastrop office']]
]);

if (fixes.size !== 95) throw new Error(`Expected 95 unique title fixes; found ${fixes.size}.`);
const byId = new Map(resources.map(resource => [resource.id, resource]));
const operations = [];
for (const [id, [title_es, title_en]] of fixes) {
  const resource = byId.get(id);
  if (!resource || !['published', 'draft'].includes(resource.status)) throw new Error(`Missing active resource ${id}.`);
  if (!title_es.trim() || !title_en.trim()) throw new Error(`Blank title for ${id}.`);
  operations.push({
    canonical_id: id,
    expected_canonical_status: resource.status,
    expected_archive_status: 'draft',
    patch: { title_es, title_en },
    archive_ids: []
  });
}

fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, published: operations.filter(x => x.expected_canonical_status === 'published').length, draft: operations.filter(x => x.expected_canonical_status === 'draft').length }, null, 2));
