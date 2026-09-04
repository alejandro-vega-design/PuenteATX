#!/usr/bin/env node
import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: prepare-stage-21-published-descriptions.mjs <resources.json> <operations.json>');
const resources = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const byId = new Map(resources.map(resource => [resource.id, resource]));
const verified = '2026-09-03';
const same = (resource, patch) => Object.entries(patch).every(([key, value]) => JSON.stringify(resource[key] ?? null) === JSON.stringify(value));
const targets = new Map([
  ['7c12b2f6-3825-479d-932b-e64bf14a6006', {
    description_es: 'La herramienta muestra despensas, distribuciones móviles y programas para menores, familias y personas mayores dentro del área de 21 condados del banco de alimentos. Los horarios y la disponibilidad varían según cada organización y punto de distribución.',
    description_en: 'The tool lists food pantries, mobile distributions, and programs for children, families, and older adults across the food bank’s 21-county service area. Hours and availability vary by organization and distribution site.',
    application_steps_es: 'Ingrese su código postal en Find Food Now y comuníquese con el programa seleccionado para confirmar horario y disponibilidad.',
    application_steps_en: 'Enter your ZIP code in Find Food Now and contact the selected program to confirm hours and availability.',
    website_url: 'https://www.centraltexasfoodbank.org/find-food-now', last_verified_at: verified,
    verification_notes: 'La descripción y el proceso de búsqueda se confirmaron en la herramienta oficial Find Food Now. [location-review: variable]'
  }],
  ['3a39dba9-260b-464a-a8c0-e447b9f471b6', {
    description_es: 'Angel House distribuye un desayuno para llevar con café y un almuerzo para llevar con sopa. También ofrece duchas durante el horario de comidas y ropa según las donaciones disponibles, por orden de llegada.',
    description_en: 'Angel House distributes a sack breakfast with coffee and a sack lunch with soup. It also offers showers during meal service and donated clothing as available, on a first-come basis.',
    hours_es: 'Todos los días excepto Acción de Gracias y Navidad: desayuno, 9:30–10:00 a.m.; almuerzo y duchas, 11:00 a.m.–12:30 p.m.',
    hours_en: 'Daily except Thanksgiving and Christmas: breakfast, 9:30–10:00 a.m.; lunch and showers, 11:00 a.m.–12:30 p.m.',
    source_url: 'https://www.austinbaptistchapel.com/update.html', last_verified_at: verified,
    verification_notes: 'Los servicios y horarios se confirmaron en la actualización oficial de Angel House.'
  }],
  ['79800ed7-dff2-4433-bfee-5bb3a2ba2709', {
    description_es: 'AHOST es un mapa y listado de viviendas de alquiler con ingresos restringidos en la ciudad de Austin. Permite comparar propiedades según ingresos y tamaño del hogar e incluye contacto, niveles de asequibilidad, amenidades, comunidades atendidas y criterios de aceptación.',
    description_en: 'AHOST is a searchable map and listing of income-restricted rental housing in the City of Austin. It matches properties to household income and size and includes contact details, affordability levels, amenities, communities served, and acceptance criteria.',
    eligibility_es: 'Los límites dependen de la propiedad; las viviendas incluidas requieren ingresos familiares inferiores al 80 % del ingreso familiar medio del área y algunas tienen límites más bajos.',
    eligibility_en: 'Limits vary by property; listed housing requires household income below 80% of the area median family income, and some properties have lower limits.',
    application_steps_es: 'Ingrese los ingresos anuales y el tamaño del hogar, revise las propiedades y comuníquese directamente con la propiedad para confirmar disponibilidad y solicitar vivienda.',
    application_steps_en: 'Enter annual household income and household size, review matching properties, and contact the property directly to confirm availability and apply.',
    last_verified_at: verified, verification_notes: 'La descripción, elegibilidad general y limitación de disponibilidad se confirmaron en la página oficial de AHOST.'
  }],
  ['232d336e-1abc-4a3e-847b-754215a63c9b', {
    description_es: 'HACA administra listas de espera separadas para vales de elección de vivienda y propiedades de asistencia de alquiler basada en proyectos, crédito fiscal y vivienda pública. Cada programa o propiedad tiene requisitos y disponibilidad propios.',
    description_en: 'HACA administers separate waiting lists for Housing Choice Vouchers and for project-based rental assistance, tax-credit, and public-housing properties. Each program or property has its own eligibility and availability.',
    application_steps_es: 'Revise las listas de espera abiertas y presente una pre-solicitud para el programa o la propiedad correspondiente; estar en una lista no garantiza una unidad inmediata.',
    application_steps_en: 'Review open waiting lists and submit a pre-application for the relevant program or property; placement on a list does not guarantee an immediate unit.',
    source_url: 'https://www.hacanet.org/residents/welcome/', last_verified_at: verified,
    verification_notes: 'Los tipos de listas de espera y el proceso de pre-solicitud se confirmaron mediante HACA y la página oficial de recursos para inquilinos de la Ciudad de Austin.'
  }],
  ['63cb781e-c2bb-4465-8759-83ff36c83246', {
    description_es: 'Esta sede de Lone Star Circle of Care ofrece medicina familiar y salud conductual, además de visitas virtuales. Las suites 100 y 200 comparten la ubicación de Ben White y las citas se coordinan mediante el sistema central de la clínica.',
    description_en: 'This Lone Star Circle of Care location offers family medicine and behavioral health, along with virtual visits. Suites 100 and 200 share the Ben White location, and appointments are coordinated through the clinic’s central system.',
    hours_es: 'Lunes a jueves, 8:00 a.m.–7:00 p.m.; viernes, 8:00 a.m.–5:00 p.m.',
    hours_en: 'Monday–Thursday, 8:00 a.m.–7:00 p.m.; Friday, 8:00 a.m.–5:00 p.m.',
    website_url: 'https://lonestarcares.org/location/ben-white-health-clinic-family-medicine/', last_verified_at: verified,
    verification_notes: 'Los servicios, la dirección, el teléfono y el horario se confirmaron en la página oficial de la sede Ben White.'
  }],
  ['7a07902d-c42f-4879-9bc5-4b2ca9d81000', {
    description_es: 'Equifare reduce las tarifas para personas con ingresos familiares inferiores al 200 % del nivel federal de pobreza o inscritas en determinados programas sociales. El descuento se vincula a una tarjeta recargable de CapMetro o a la aplicación Umo y permanece activo por 24 meses.',
    description_en: 'Equifare reduces fares for riders whose household income is below 200% of the federal poverty level or who participate in qualifying social-service programs. The discount is linked to a CapMetro Reloadable Fare Card or the Umo app and remains active for 24 months.',
    eligibility_es: 'Ingresos del hogar inferiores al 200 % del nivel federal de pobreza o inscripción en uno o más programas de servicios sociales elegibles.',
    eligibility_en: 'Household income below 200% of the federal poverty level or enrollment in one or more qualifying social-service programs.',
    required_documents_es: 'Comprobante de elegibilidad, como EBT, carta de beneficios del Seguro Social, talón de pago o declaración de impuestos; también existe un proceso de auto-certificación sujeto a auditoría.',
    required_documents_en: 'Proof of eligibility, such as EBT, a Social Security award letter, pay stub, or tax return; a self-certification process subject to audit is also available.',
    application_steps_es: 'Complete la solicitud en línea. Después de la aprobación, asocie el descuento a la tarjeta recargable de CapMetro o a la cuenta de Umo.',
    application_steps_en: 'Complete the online application. After approval, associate the discount with a CapMetro Reloadable Fare Card or Umo account.',
    website_url: 'https://www.capmetro.org/fare/general-fares-overview/equifare', last_verified_at: verified,
    verification_notes: 'La elegibilidad, los documentos, el proceso y la vigencia del descuento se confirmaron en la página oficial vigente de Equifare.'
  }],
  ['2428ce80-12ca-41f2-b8c4-2e7f97ccc0b2', {
    description_es: 'Country Bus ofrece transporte de acera a acera en las zonas rurales del Condado de Travis. Los viajes pueden reservarse para el mismo día o con hasta dos semanas de anticipación mediante la aplicación, por teléfono o en línea; las tarifas dependen de las zonas recorridas.',
    description_en: 'Country Bus provides curb-to-curb transportation in rural Travis County. Trips may be booked for the same day or up to two weeks ahead through the app, by phone, or online; fares depend on the zones traveled.',
    service_methods: ['phone', 'online', 'in_person'],
    application_steps_es: 'Confirme que la dirección esté dentro de la zona de servicio y reserve mediante la aplicación CARTS, el formulario web o el 512-478-7433.',
    application_steps_en: 'Confirm that the address is within the service zone and book through the CARTS app, website request form, or 512-478-7433.',
    hours_es: 'Lunes a viernes, 8:30 a.m.–3:00 p.m.', hours_en: 'Monday–Friday, 8:30 a.m.–3:00 p.m.',
    accessibility_notes_es: 'Los autobuses y las camionetas de CARTS son accesibles para personas con discapacidad.',
    accessibility_notes_en: 'CARTS buses and vans are accessible to people with disabilities.',
    website_url: 'https://www.ridecarts.com/route/carts-country-bus-travis/', last_verified_at: verified,
    verification_notes: 'El modelo de acera a acera, zona, reservas, horario, tarifas y accesibilidad se confirmaron en la página oficial de CARTS. [location-review: variable]'
  }],
  ['ef4c29a6-c365-45bd-9522-4372e0bcd2f0', {
    organization_name: 'Drive a Senior Network',
    title_es: 'Transporte voluntario para adultos mayores', title_en: 'Volunteer transportation for older adults',
    summary_es: 'Ofrece transporte gratuito de puerta a puerta para personas mayores, incluidos viajes a citas médicas, supermercados y farmacias.',
    summary_en: 'Provides free door-to-door transportation for older adults, including rides to medical appointments, grocery stores, and pharmacies.',
    description_es: 'Conductores voluntarios y personal del programa ofrecen viajes individuales y grupales, además de apoyo para mantener la independencia y la conexión social. El servicio cubre Bastrop, el norte de Hays, Travis y Williamson.',
    description_en: 'Volunteer drivers and program staff provide individual and group rides, along with support that helps older adults remain independent and socially connected. Service covers Bastrop, northern Hays, Travis, and Williamson.',
    keywords_es: ['transporte para adultos mayores', 'viajes gratuitos', 'citas médicas', 'supermercado', 'transporte de puerta a puerta'],
    keywords_en: ['senior transportation', 'free rides', 'medical appointments', 'grocery trips', 'door-to-door transportation'],
    service_area_es: 'Condado de Travis, Condado de Williamson, Condado de Bastrop, norte del Condado de Hays',
    service_area_en: 'Travis County, Williamson County, Bastrop County, and northern Hays County',
    last_verified_at: verified,
    verification_notes: 'Registro canónico consolidado con la copia regional de Drive a Senior Network; conserva la lista guardada del recurso original. El servicio opera mediante viajes y ubicaciones acordadas. [location-review: variable]'
  }]
]);
const duplicateId = '1617f63a-5e6d-4d72-ae3c-24cef6ca65f4';
const operations = [];
for (const [id, patch] of targets) {
  const resource = byId.get(id);
  if (!resource || resource.status !== 'published') throw new Error(`Invalid target ${id}`);
  const archiveIds = id === 'ef4c29a6-c365-45bd-9522-4372e0bcd2f0' && byId.get(duplicateId)?.status === 'published' ? [duplicateId] : [];
  if (!same(resource, patch) || archiveIds.length) operations.push({ canonical_id: id, expected_canonical_status: 'published', expected_archive_status: 'published', patch: same(resource, patch) ? {} : patch, archive_ids: archiveIds });
}
if (operations.length !== 0 && operations.length !== targets.size) throw new Error(`Expected ${targets.size} operations or 0; found ${operations.length}`);
fs.writeFileSync(outputPath, `${JSON.stringify(operations, null, 2)}\n`);
console.log(JSON.stringify({ operations: operations.length, descriptionsAdded: targets.size, duplicatesToArchive: operations.flatMap(item => item.archive_ids).length }, null, 2));
