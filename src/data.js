import { resourceCategories } from './data/categories';

export const categories = [
  ...resourceCategories.map(category => ({ id: category.id, slug: category.slug, label: { es: category.label_es, en: category.label_en }, icon: category.icon_path.split('/').pop().replace('.svg', ''), terms: `${category.label_es} ${category.label_en} ${category.description_es} ${category.description_en}` }))
];

export const faqs = [
  { q: { es: '¿Puedo pedir ayuda si no tengo estatus legal?', en: 'Can I ask for help if I do not have legal status?' }, a: { es: 'Sí. Este directorio es para todas las familias del Centro de Texas, sin importar tu estatus migratorio.', en: 'Yes. This directory is for every Central Texas family, regardless of immigration status.' } },
  { q: { es: '¿Necesito número de Seguro Social?', en: 'Do I need a Social Security number?' }, a: { es: 'No necesitas un número de Seguro Social para buscar recursos en este directorio.', en: 'You do not need a Social Security number to browse resources in this directory.' } },
  { q: { es: '¿Van a preguntar sobre mi estatus migratorio?', en: 'Will they ask about my immigration status?' }, a: { es: 'Puedes revisar los requisitos de cada organización antes de comunicarte con ella.', en: 'You can review each organization’s requirements before contacting them.' } },
  { q: { es: '¿Es realmente gratis?', en: 'Is it really free?' }, a: { es: 'Usar Puente ATX es gratis. Cada recurso indica claramente si alguno de sus servicios tiene costo.', en: 'Puente ATX is free to use. Each resource clearly notes whether any service has a cost.' } },
  { q: { es: '¿Comparten mi información con el gobierno?', en: 'Do you share my information with the government?' }, a: { es: 'No compartimos tu búsqueda ni tu lista de recursos con el gobierno.', en: 'We do not share your search or resource list with the government.' } },
  { q: { es: '¿Qué significa “última verificación” en la lista de recursos?', en: 'What does “last verified” mean in the resource list?' }, a: { es: 'Indica la fecha más reciente en que confirmamos la información directamente con la organización.', en: 'It is the most recent date we confirmed the information directly with the organization.' } }
];

export const copy = {
  es: { saved: 'Mi lista de recursos', language: 'Español', hero: '¿Qué necesitas hoy?', subhero: 'Es gratis. Es confidencial. No importa tu estatus legal.', placeholder: 'Comida, salud, ayuda legal, vivienda...', search: 'Buscar', categories: 'Buscar por categoría', viewAllResources: 'Ver todos los recursos', aboutEyebrow: 'RECURSOS CERCA DE TI', aboutTitle: '¿Qué es Puente ATX?', aboutIntro: 'Puente ATX es un directorio gratuito de recursos comunitarios para familias de Austin y comunidades cercanas.', aboutPoints: [{ title: 'Encuentra ayuda', text: 'Explora recursos de comida, vivienda, salud, educación, transporte y más.' }, { title: 'Guarda y comparte', text: 'Crea tu propia lista sin abrir una cuenta y compártela con quien quieras.' }, { title: 'Consulta con confianza', text: 'Revisa cuándo confirmamos por última vez la información de cada recurso.' }], aboutLink: 'Conoce más sobre nosotros', aboutUs: 'Quiénes somos', footerLinksLabel: 'Información sobre Puente ATX', aboutPage: { title: 'Quiénes somos', intro: 'Puente ATX conecta a familias de Austin y comunidades cercanas con información clara sobre recursos comunitarios.', sections: [{ title: 'Nuestro propósito', paragraphs: ['Queremos que encontrar ayuda sea más sencillo. Reunimos en un mismo directorio información pública sobre comida, vivienda, salud, transporte, educación, apoyo financiero, ayuda legal y otros servicios comunitarios.'] }, { title: 'Cómo funciona el directorio', paragraphs: ['Puedes buscar, guardar, imprimir y compartir recursos sin crear una cuenta. Cada organización establece sus propios servicios, horarios y requisitos.', 'Indicamos la fecha más reciente en que revisamos la información. Antes de visitar un lugar o presentar documentos, recomendamos confirmar los detalles directamente con la organización.'] }, { title: 'A quién servimos', paragraphs: ['Puente ATX está pensado principalmente para familias de Austin, el condado de Travis y comunidades cercanas del Centro de Texas. Puedes usarlo gratis sin importar tu estatus migratorio.'] }, { title: 'Nuestra responsabilidad', paragraphs: ['Puente ATX ofrece información general y no reemplaza asesoría legal, médica o financiera. No somos un servicio de emergencias y la inclusión de una organización no garantiza disponibilidad ni elegibilidad.'] } ] }, confidential: 'GRATIS Y CONFIDENCIAL', supportTitle: '¿Necesitas orientación o simplemente conversar?', supportBody: 'A veces lo más difícil no es encontrar la ayuda, es saber cuál pedir primero. Conversamos contigo, sin costo y sin compromiso. No es asesoría legal ni un trámite oficial.', reserve: 'Reservar una conversación gratis', faqTitle: 'Preguntas frecuentes', faqIntro: 'Aquí respondemos las dudas que más nos comparten las familias.', legalTitle: 'Aviso importante', legal: 'Esta información es general y no constituye asesoría legal. Si tienes preguntas sobre tu caso, un abogado de inmigración con licencia puede ayudarte. Varias organizaciones de este directorio ofrecen consultas legales gratuitas.', privacyPolicy: 'Política de privacidad', termsOfUse: 'Términos de uso', legalLinksLabel: 'Información legal', legalPending: 'El contenido definitivo está pendiente de revisión legal antes del lanzamiento.', copyright: year => `© ${year} Puente ATX — un directorio gratis, hecho a mano, para familias como la tuya.`, emptyTitle: 'Tu lista está vacía', emptyBody: 'Guarda recursos para encontrarlos fácilmente después.', close: 'Cerrar', modalTitle: 'Conversemos', modalBody: 'Esta es una demostración. Tu solicitud de conversación está lista para continuar.', confirm: 'Entendido', results: 'Categorías relacionadas' },
  en: { saved: 'My resource list', language: 'English', hero: 'What do you need today?', subhero: 'It’s free. It’s confidential. Your legal status does not matter.', placeholder: 'Food, health, legal help, housing...', search: 'Search', categories: 'Browse by category', viewAllResources: 'View all resources', aboutEyebrow: 'RESOURCES NEAR YOU', aboutTitle: 'What is Puente ATX?', aboutIntro: 'Puente ATX is a free community resource directory for families in Austin and nearby communities.', aboutPoints: [{ title: 'Find help', text: 'Explore resources for food, housing, health, education, transportation, and more.' }, { title: 'Save and share', text: 'Build your own list without creating an account and share it with anyone you choose.' }, { title: 'Browse with confidence', text: 'See when we most recently confirmed the information for each resource.' }], aboutLink: 'Learn more about us', aboutUs: 'About us', footerLinksLabel: 'Information about Puente ATX', aboutPage: { title: 'About us', intro: 'Puente ATX connects families in Austin and nearby communities with clear information about community resources.', sections: [{ title: 'Our purpose', paragraphs: ['We want finding help to be simpler. We bring together public information about food, housing, health, transportation, education, financial support, legal help, and other community services in one directory.'] }, { title: 'How the directory works', paragraphs: ['You can search, save, print, and share resources without creating an account. Each organization sets its own services, schedules, and eligibility requirements.', 'We show the most recent date when we reviewed the information. Before visiting a location or submitting documents, we recommend confirming the details directly with the organization.'] }, { title: 'Who we serve', paragraphs: ['Puente ATX is designed primarily for families in Austin, Travis County, and nearby Central Texas communities. It is free to use regardless of immigration status.'] }, { title: 'Our responsibility', paragraphs: ['Puente ATX provides general information and does not replace legal, medical, or financial advice. We are not an emergency service, and listing an organization does not guarantee availability or eligibility.'] } ] }, confidential: 'FREE AND CONFIDENTIAL', supportTitle: 'Need guidance or simply want to talk?', supportBody: 'Sometimes the hardest part is not finding help, but knowing what to ask for first. We’ll talk with you, free and with no obligation. This is not legal advice or an official process.', reserve: 'Schedule a free conversation', faqTitle: 'Frequently asked questions', faqIntro: 'Here we answer the questions families share with us most often.', legalTitle: 'Important notice', legal: 'This information is general and does not constitute legal advice. If you have questions about your situation, a licensed immigration attorney can help you. Several organizations in this directory offer free legal consultations.', privacyPolicy: 'Privacy policy', termsOfUse: 'Terms of use', legalLinksLabel: 'Legal information', legalPending: 'The final content is pending legal review before launch.', copyright: year => `© ${year} Puente ATX — a free, handmade directory for families like yours.`, emptyTitle: 'Your list is empty', emptyBody: 'Save resources to find them easily later.', close: 'Close', modalTitle: 'Let’s talk', modalBody: 'This is a demonstration. Your conversation request is ready to continue.', confirm: 'Got it', results: 'Related categories' }
};

export const conversationCopy = {
  es: {
    back: 'Volver', title: 'Hablemos', intro: 'Cuéntanos cómo podemos ayudarte. Una persona de nuestro equipo se comunicará contigo.', trust: 'Es gratis y confidencial. No importa tu estatus migratorio.',
    nameLegend: 'Nombre', nameLabel: '¿Cómo quieres que te llamemos?', optional: 'Opcional', namePlaceholder: 'Nombre o apodo',
    contactLegend: '¿Cómo prefieres que te contactemos?', call: 'Llamada', text: 'Mensaje de texto', whatsapp: 'WhatsApp',
    phoneLabel: '¿Cuál es tu número de teléfono?', phoneHint: 'Puedes escribirlo con o sin guiones.', phonePlaceholder: 'Número de teléfono',
    dayLegend: '¿Qué día prefieres que te contactemos?', monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes',
    timeLegend: '¿Cuándo es mejor contactarte?', morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche', anytime: 'Cualquier hora',
    zipLabel: '¿Cuál es tu código postal?', zipHint: 'Usaremos los 5 números para buscar recursos cerca de ti.', zipPlaceholder: 'Código postal',
    helpLegend: '¿Con qué necesitas ayuda?', multiple: 'Puedes elegir más de una.',
    detailsLabel: '¿Hay algo más que quieras contarnos?', detailsPlaceholder: 'Escribe solo lo que quieras compartir.',
    consent: 'Autorizo a Puente ATX a contactarme en el número que proporcioné, por el método que elegí, para responder a esta solicitud.', privacy: 'Usaremos tu número únicamente para responder a esta solicitud. No lo usaremos para publicidad. Puedes retirar tu autorización en cualquier momento. No te pediremos información sobre tu estatus migratorio.',
    submit: 'Solicitar conversación', submitting: 'Enviando…', errorSummary: 'Revisa los campos indicados para continuar.', sendError: 'No pudimos enviar tu solicitud. Intenta nuevamente.',
    errors: { contact: 'Elige cómo prefieres que te contactemos.', phone: 'Escribe un número donde podamos contactarte.', day: 'Elige un día de lunes a viernes.', time: 'Elige cuándo es mejor contactarte.', zip: 'Escribe un código postal de 5 números.', help: 'Selecciona al menos un tipo de ayuda.', consent: 'Necesitamos tu autorización para contactarte.' },
    confirmationTitle: 'Recibimos tu solicitud', confirmationText: 'Una persona de nuestro equipo se comunicará contigo.', method: 'Método', phoneEnding: 'Teléfono terminado en', preferredDay: 'Día preferido', preferredTime: 'Mejor momento', zipCode: 'Código postal', resources: 'Volver a los recursos', viewSaved: 'Ver mi lista'
  },
  en: {
    back: 'Back', title: 'Let’s talk', intro: 'Tell us how we can help. A member of our team will contact you.', trust: 'It’s free and confidential. Your immigration status does not matter.',
    nameLegend: 'Name', nameLabel: 'What would you like us to call you?', optional: 'Optional', namePlaceholder: 'Name or nickname',
    contactLegend: 'How would you like us to contact you?', call: 'Call', text: 'Text message', whatsapp: 'WhatsApp',
    phoneLabel: 'What is your phone number?', phoneHint: 'You can enter it with or without dashes.', phonePlaceholder: 'Phone number',
    dayLegend: 'Which day would you prefer us to contact you?', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday',
    timeLegend: 'When is the best time to contact you?', morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', anytime: 'Any time',
    zipLabel: 'What is your ZIP code?', zipHint: 'We will use the 5 digits to find resources near you.', zipPlaceholder: 'ZIP code',
    helpLegend: 'What do you need help with?', multiple: 'You can choose more than one.',
    detailsLabel: 'Is there anything else you would like to tell us?', detailsPlaceholder: 'Write only what you want to share.',
    consent: 'I authorize Puente ATX to contact me at the number I provided, using the method I selected, to respond to this request.', privacy: 'We will use your number only to respond to this request. We will not use it for advertising. You may withdraw your permission at any time. We will not ask about your immigration status.',
    submit: 'Request a conversation', submitting: 'Sending…', errorSummary: 'Review the marked fields to continue.', sendError: 'We could not send your request. Please try again.',
    errors: { contact: 'Choose how you would like us to contact you.', phone: 'Enter a number where we can contact you.', day: 'Choose a day from Monday through Friday.', time: 'Choose the best time to contact you.', zip: 'Enter a 5-digit ZIP code.', help: 'Select at least one type of help.', consent: 'We need your permission to contact you.' },
    confirmationTitle: 'We received your request', confirmationText: 'A member of our team will contact you.', method: 'Method', phoneEnding: 'Phone ending in', preferredDay: 'Preferred day', preferredTime: 'Best time', zipCode: 'ZIP code', resources: 'Back to resources', viewSaved: 'View my list'
  }
};

export const resourceCopy = {
  es: {
    resultsTitle: 'Recursos para ti', searchLabel: 'Buscar recursos', searchPlaceholder: 'Busca comida, salud, vivienda…', search: 'Buscar', filter: 'Filtrar', filters: 'Filtros', close: 'Cerrar', apply: 'Aplicar', clear: 'Quitar filtros', resultsFound: count => `${count} ${count === 1 ? 'recurso encontrado' : 'recursos encontrados'}`,
    sortLabel: 'Ordenar', relevance: 'Más relevantes', updated: 'Actualizados recientemente', az: 'A–Z', za: 'Z–A', activeFilters: 'Filtros activos', removeFilter: 'Quitar filtro',
    category: 'Categoría', availableLanguage: 'Idioma disponible', serviceMethod: 'Tipo de atención', cost: 'Costo', county: 'Condado', allCounties: 'Todos los condados', area: 'Área o código postal', areaHelp: 'Opcional. Nos ayuda a mostrar recursos cercanos.', allAreas: 'Toda el área', undisclosedArea: 'Prefiero no indicarlo', recent: 'Verificados recientemente', spanish: 'Español', english: 'Inglés', in_person: 'Presencial', phoneMethod: 'Teléfono', online: 'En línea', home_visit: 'Visita al hogar', free: 'Gratis', sliding_scale: 'Escala variable', paid: 'Pagado',
    save: 'Guardar recurso', savedState: 'Guardado', removeSaved: 'Quitar de Mi lista', details: 'Ver detalles', call: 'Llamar', openMap: 'Abrir dirección en Google Maps', website: 'Sitio oficial', source: 'Fuente', share: 'Compartir', shareThis: 'Compartir este recurso', printThis: 'Imprimir este recurso', resourceOptions: 'Más opciones para este recurso', copied: 'Enlace copiado', shareError: 'No pudimos copiar el enlace.', closeNotification: 'Cerrar notificación', showMore: 'Ver más', showLess: 'Ver menos', whatsapp: 'WhatsApp', print: 'Imprimir', printed: 'Impreso el', verified: 'Verificado', location: 'Área', loadMore: count => `Mostrar más recursos · ${count} ${count === 1 ? 'restante' : 'restantes'}`, noResults: 'No encontramos recursos con esos filtros.', noResultsHelp: 'Prueba quitar un filtro o buscar otra palabra.', loadError: 'No pudimos cargar los recursos. Intenta nuevamente.', retry: 'Intentar nuevamente', loading: 'Cargando recursos…', demo: 'Los recursos mostrados son datos ficticios del prototipo.'
  },
  en: {
    resultsTitle: 'Resources for you', searchLabel: 'Search resources', searchPlaceholder: 'Search food, health, housing…', search: 'Search', filter: 'Filter', filters: 'Filters', close: 'Close', apply: 'Apply', clear: 'Clear filters', resultsFound: count => `${count} ${count === 1 ? 'resource found' : 'resources found'}`,
    sortLabel: 'Sort', relevance: 'Most relevant', updated: 'Recently updated', az: 'A–Z', za: 'Z–A', activeFilters: 'Active filters', removeFilter: 'Remove filter',
    category: 'Category', availableLanguage: 'Available language', serviceMethod: 'Service method', cost: 'Cost', county: 'County', allCounties: 'All counties', area: 'Area or ZIP code', areaHelp: 'Optional. Helps us show nearby resources.', allAreas: 'All areas', undisclosedArea: 'Prefer not to say', recent: 'Recently verified', spanish: 'Spanish', english: 'English', in_person: 'In person', phoneMethod: 'Phone', online: 'Online', home_visit: 'Home visit', free: 'Free', sliding_scale: 'Sliding scale', paid: 'Paid',
    save: 'Save resource', savedState: 'Saved', removeSaved: 'Remove from My list', details: 'View details', call: 'Call', openMap: 'Open address in Google Maps', website: 'Official website', source: 'Source', share: 'Share', shareThis: 'Share this resource', printThis: 'Print this resource', resourceOptions: 'More options for this resource', copied: 'Link copied', shareError: 'We could not copy the link.', closeNotification: 'Close notification', showMore: 'See more', showLess: 'See less', whatsapp: 'WhatsApp', print: 'Print', printed: 'Printed on', verified: 'Verified', location: 'Area', loadMore: count => `Show more resources · ${count} remaining`, noResults: 'We did not find resources with those filters.', noResultsHelp: 'Try removing a filter or searching another word.', loadError: 'We could not load the resources. Try again.', retry: 'Try again', loading: 'Loading resources…', demo: 'The resources shown are fictional prototype data.'
  }
};

export const resourceFinderCopy = {
  es: {
    title: 'Buscador de Recursos', zipLabel: 'Código postal', zipPlaceholder: 'Código postal', search: 'Buscar recursos', searchButton: 'Buscar', searchThisArea: 'Buscar en esta área', filter: 'Filtrar', activeFilters: 'filtros activos', removeFilter: 'Quitar filtro', clearFilters: 'Limpiar', invalidZip: 'Escribe un código postal válido de nuestra área de servicio.', results: count => `${count} ${count === 1 ? 'recurso encontrado' : 'recursos encontrados'}`, nearbyResults: count => `${count} ${count === 1 ? 'recurso cercano' : 'recursos cercanos'}`, nearbyCount: count => `${count} cercanos`, nearbyZipCount: (count, zip) => `${count} cercanos a ${zip}`, distance: 'Distancia aproximada', details: 'Ver detalles', call: 'Llamar', address: 'Dirección', map: 'Mapa', list: 'Lista', showMap: 'Mostrar mapa', showList: 'Mostrar lista', mapLoading: 'Cargando mapa…', resourcesLoading: 'Buscando recursos cercanos…', loadError: 'No pudimos cargar los recursos. Intenta nuevamente.', mapError: 'No pudimos cargar el mapa. Puedes continuar usando la lista.', retry: 'Intentar nuevamente', empty: (category, zip) => `No encontramos ${category ? `recursos de ${category.toLocaleLowerCase()} ` : 'recursos '}cerca de ${zip}.`, noPhysical: zip => `No encontramos ubicaciones físicas cerca de ${zip}.`, unlocatedTitle: 'También encontramos recursos con una dirección disponible', unlocatedText: 'Estas ubicaciones coinciden con tu búsqueda. Su posición exacta todavía no aparece en el mapa.', remoteTitle: 'También encontramos ayuda disponible por teléfono o en línea', remoteText: 'Estos recursos coinciden con tu búsqueda y no requieren una ubicación física.', remoteOnlyText: 'Pero encontramos recursos que pueden ayudarte por teléfono o en línea.', phoneAvailable: 'Teléfono', onlineAvailable: 'En línea', emptyHelp: 'Puedes ampliar la distancia o seleccionar otra categoría.', expand: miles => `Ampliar a ${miles} millas`, allNearby: 'Ver todos los recursos cercanos', requestHelp: 'Solicitar ayuda de Puente ATX', selected: 'Recurso seleccionado', include: 'Incluir', included: 'Incluido', includeResource: 'Incluir este recurso en la lista', excludeResource: 'Quitar este recurso de la lista', distanceRings: 'Mostrar distancias de 5, 10 y 15 millas', moreActions: 'Más acciones', shareList: 'Compartir lista', printList: 'Imprimir lista', savePdf: 'Guardar como PDF', selectResourcesFirst: 'Selecciona al menos un recurso para usar estas acciones.', shareTitle: zip => `Recursos cerca de ${zip}`, shareText: count => `${count} ${count === 1 ? 'recurso seleccionado' : 'recursos seleccionados'} en Puente ATX.`, copied: 'Enlace copiado', shareError: 'No pudimos compartir la lista.', pdfHint: 'En las opciones de impresión, selecciona “Guardar como PDF”.', printDate: 'Fecha de generación', officialWebsite: 'Sitio oficial', zipMarker: zip => `Centro aproximado del código postal ${zip}`, startTitle: 'Busca recursos por ubicación', startText: 'Escribe tu código postal y selecciona los filtros que necesitas.'
  },
  en: {
    title: 'Resource Finder', zipLabel: 'ZIP code', zipPlaceholder: 'ZIP code', search: 'Search resources', searchButton: 'Search', searchThisArea: 'Search this area', filter: 'Filter', activeFilters: 'active filters', removeFilter: 'Remove filter', clearFilters: 'Clear', invalidZip: 'Enter a valid ZIP code in our service area.', results: count => `${count} ${count === 1 ? 'resource found' : 'resources found'}`, nearbyResults: count => `${count} nearby ${count === 1 ? 'resource' : 'resources'}`, nearbyCount: count => `${count} nearby`, nearbyZipCount: (count, zip) => `${count} near ${zip}`, distance: 'Approximate distance', details: 'View details', call: 'Call', address: 'Address', map: 'Map', list: 'List', showMap: 'Show map', showList: 'Show list', mapLoading: 'Loading map…', resourcesLoading: 'Finding nearby resources…', loadError: 'We could not load resources. Try again.', mapError: 'We could not load the map. You can continue using the list.', retry: 'Try again', empty: (category, zip) => `We did not find ${category ? `${category.toLocaleLowerCase()} ` : ''}resources near ${zip}.`, noPhysical: zip => `We did not find physical locations near ${zip}.`, unlocatedTitle: 'We also found resources with an available address', unlocatedText: 'These locations match your search. Their exact position is not yet shown on the map.', remoteTitle: 'We also found help available by phone or online', remoteText: 'These resources match your search and do not require a physical location.', remoteOnlyText: 'But we found resources that can help by phone or online.', phoneAvailable: 'Phone', onlineAvailable: 'Online', emptyHelp: 'You can expand the distance or select another category.', expand: miles => `Expand to ${miles} miles`, allNearby: 'View all nearby resources', requestHelp: 'Ask Puente ATX for help', selected: 'Selected resource', include: 'Include', included: 'Included', includeResource: 'Include this resource in the list', excludeResource: 'Remove this resource from the list', distanceRings: 'Show 5, 10 and 15 mile distances', moreActions: 'More actions', shareList: 'Share list', printList: 'Print list', savePdf: 'Save as PDF', selectResourcesFirst: 'Select at least one resource to use these actions.', shareTitle: zip => `Resources near ${zip}`, shareText: count => `${count} selected ${count === 1 ? 'resource' : 'resources'} from Puente ATX.`, copied: 'Link copied', shareError: 'We could not share the list.', pdfHint: 'In the print options, select “Save as PDF”.', printDate: 'Generated on', officialWebsite: 'Official website', zipMarker: zip => `Approximate center of ZIP code ${zip}`, startTitle: 'Search resources by location', startText: 'Enter your ZIP code and select the filters you need.'
  }
};

export const detailCopy = {
  es: { back: 'Volver a los resultados', save: 'Guardar', saved: 'Guardado', call: 'Llamar', website: 'Visitar sitio', directions: 'Cómo llegar', whatsapp: 'WhatsApp', print: 'Imprimir', printed: 'Fecha de impresión:', share: 'Compartir', organization: 'Organización', services: 'Servicios ofrecidos', eligibility: 'Requisitos', documents: 'Documentos requeridos', steps: 'Pasos para solicitar ayuda', hours: 'Horarios', languages: 'Idiomas', cost: 'Costo', area: 'Área de servicio', accessibility: 'Accesibilidad', contact: 'Contacto', location: 'Ubicación', source: 'Fuente', verified: 'Información verificada el', notFound: 'No encontramos este recurso.', notFoundHelp: 'Puede haber cambiado o ya no estar disponible.', browse: 'Buscar recursos', copied: 'Enlace copiado', shareError: 'No pudimos compartir. Copiamos el enlace.', spanish: 'Español', english: 'Inglés', free: 'Gratis', sliding_scale: 'Escala variable', paid: 'Pagado', unknown: 'Costo por confirmar', loading: 'Cargando recurso…' },
  en: { back: 'Back to results', save: 'Save', saved: 'Saved', call: 'Call', website: 'Visit website', directions: 'Directions', whatsapp: 'WhatsApp', print: 'Print', printed: 'Print date:', share: 'Share', organization: 'Organization', services: 'Services offered', eligibility: 'Eligibility', documents: 'Required documents', steps: 'Steps to request help', hours: 'Hours', languages: 'Languages', cost: 'Cost', area: 'Service area', accessibility: 'Accessibility', contact: 'Contact', location: 'Location', source: 'Source', verified: 'Information verified on', notFound: 'We could not find this resource.', notFoundHelp: 'It may have changed or no longer be available.', browse: 'Browse resources', copied: 'Link copied', shareError: 'We could not share. We copied the link.', spanish: 'Spanish', english: 'English', free: 'Free', sliding_scale: 'Sliding scale', paid: 'Paid', unknown: 'Cost to be confirmed', loading: 'Loading resource…' }
};

export const savedListCopy = {
  es: { title: 'Mi lista', intro: count => count === 1 ? 'Aquí está tu recurso guardado.' : `Aquí están tus ${count} recursos guardados.`, sharedCount: count => count === 1 ? 'Esta lista contiene 1 recurso.' : `Esta lista contiene ${count} recursos.`, emptyTitle: 'Todavía no has guardado recursos', emptyText: 'Cuando encuentres un recurso que te interese, toca “Guardar” para añadirlo aquí.', browse: 'Buscar recursos', storage: 'Tu lista se guarda en este navegador. También puedes compartirla para abrirla en otro teléfono.', whatsapp: 'Enviar por WhatsApp', share: 'Compartir mi lista', print: 'Imprimir mi lista', printed: 'Fecha de impresión:', clear: 'Borrar toda la lista', confirmClear: '¿Quieres borrar todos los recursos guardados?', cancel: 'Cancelar', confirm: 'Sí, borrar lista', sharedTitle: 'Te compartieron una lista de recursos', sharedText: 'Puedes verla sin cambiar tu lista guardada.', import: 'Guardar esta lista', viewOnly: 'Ver sin guardar', imported: 'La lista se guardó en este navegador.', copied: 'Enlace copiado', shareError: 'No pudimos copiar el enlace.', unavailable: 'Este recurso ya no está disponible.', remove: 'Quitar', closeNotification: 'Cerrar notificación' },
  en: { title: 'My list', intro: count => count === 1 ? 'Here is your saved resource.' : `Here are your ${count} saved resources.`, sharedCount: count => count === 1 ? 'This list contains 1 resource.' : `This list contains ${count} resources.`, emptyTitle: 'You have not saved resources yet', emptyText: 'When you find a resource you are interested in, tap “Save” to add it here.', browse: 'Browse resources', storage: 'Your list is saved in this browser. You can also share it to open on another phone.', whatsapp: 'Send by WhatsApp', share: 'Share my list', print: 'Print my list', printed: 'Print date:', clear: 'Clear the whole list', confirmClear: 'Do you want to remove all saved resources?', cancel: 'Cancel', confirm: 'Yes, clear list', sharedTitle: 'Someone shared a resource list with you', sharedText: 'You can view it without changing your saved list.', import: 'Save this list', viewOnly: 'View without saving', imported: 'The list was saved in this browser.', copied: 'Link copied', shareError: 'We could not copy the link.', unavailable: 'This resource is no longer available.', remove: 'Remove', closeNotification: 'Close notification' }
};

export const adminCopy = {
  es: { loginTitle: 'Acceso administrativo', email: 'Correo electrónico', password: 'Contraseña', showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña', signIn: 'Iniciar sesión', signingIn: 'Ingresando…', invalidLogin: 'No pudimos iniciar sesión. Revisa tus datos.', publicSite: 'Ver sitio público', logout: 'Cerrar sesión', dashboard: 'Panel principal', resources: 'Recursos', categories: 'Categorías', demoMode: 'Modo local: los cambios se reinician al recargar y no constituyen un backend de producción.', published: 'Recursos publicados', drafts: 'Borradores', archived: 'Archivados', needsReview: 'Pendientes de verificación', recentlyUpdated: 'Actualizados recientemente', addResource: 'Añadir recurso', viewAll: 'Ver todos los recursos', reviewOld: 'Revisar recursos desactualizados', manageCategories: 'Administrar categorías', search: 'Buscar', status: 'Estado', all: 'Todos', edit: 'Editar', duplicate: 'Duplicar', archive: 'Archivar', restore: 'Restaurar', preview: 'Vista previa', draft: 'Borrador', pagination: 'Paginación de recursos', previousPage: 'Página anterior', nextPage: 'Página siguiente', pageLabel: page => `Página ${page}`, formBasic: 'Información básica', formCategories: 'Categorías', formDescription: 'Descripción', formRequirements: 'Requisitos', formContact: 'Contacto', formLocation: 'Ubicación', formAvailability: 'Disponibilidad', formVerification: 'Verificación', formPublishing: 'Publicación', organization: 'Organización', titleEs: 'Título en español', titleEn: 'Título en inglés', summaryEs: 'Resumen en español', summaryEn: 'Resumen en inglés', slug: 'Slug', primaryCategory: 'Categoría principal', descriptionEs: 'Descripción en español', descriptionEn: 'Descripción en inglés', eligibilityEs: 'Elegibilidad en español', eligibilityEn: 'Elegibilidad en inglés', phone: 'Teléfono', website: 'Sitio oficial', city: 'Ciudad', source: 'Fuente', signVerification: 'Firmar', directVerificationNote: 'Verificado directamente por Puente ATX', verifiedDate: 'Fecha de verificación', saveDraft: 'Guardar borrador', publish: 'Publicar', save: 'Guardar cambios', requiredError: 'Completa los campos requeridos antes de publicar.', saved: 'Cambios guardados.', incompleteTranslation: 'Traducción incompleta', categoryLabels: 'Etiquetas de categorías', active: 'Activa', order: 'Orden' },
  en: { loginTitle: 'Administrative access', email: 'Email', password: 'Password', showPassword: 'Show password', hidePassword: 'Hide password', signIn: 'Sign in', signingIn: 'Signing in…', invalidLogin: 'We could not sign you in. Check your information.', publicSite: 'View public site', logout: 'Sign out', dashboard: 'Dashboard', resources: 'Resources', categories: 'Categories', demoMode: 'Local mode: changes reset on reload and are not a production backend.', published: 'Published resources', drafts: 'Drafts', archived: 'Archived', needsReview: 'Pending verification', recentlyUpdated: 'Recently updated', addResource: 'Add resource', viewAll: 'View all resources', reviewOld: 'Review outdated resources', manageCategories: 'Manage categories', search: 'Search', status: 'Status', all: 'All', edit: 'Edit', duplicate: 'Duplicate', archive: 'Archive', restore: 'Restore', preview: 'Preview', draft: 'Draft', pagination: 'Resource pagination', previousPage: 'Previous page', nextPage: 'Next page', pageLabel: page => `Page ${page}`, formBasic: 'Basic information', formCategories: 'Categories', formDescription: 'Description', formRequirements: 'Requirements', formContact: 'Contact', formLocation: 'Location', formAvailability: 'Availability', formVerification: 'Verification', formPublishing: 'Publishing', organization: 'Organization', titleEs: 'Spanish title', titleEn: 'English title', summaryEs: 'Spanish summary', summaryEn: 'English summary', slug: 'Slug', primaryCategory: 'Primary category', descriptionEs: 'Spanish description', descriptionEn: 'English description', eligibilityEs: 'Spanish eligibility', eligibilityEn: 'English eligibility', phone: 'Phone', website: 'Official website', city: 'City', source: 'Source', signVerification: 'Sign', directVerificationNote: 'Verified directly by Puente ATX', verifiedDate: 'Verification date', saveDraft: 'Save draft', publish: 'Publish', save: 'Save changes', requiredError: 'Complete the required fields before publishing.', saved: 'Changes saved.', incompleteTranslation: 'Incomplete translation', categoryLabels: 'Category labels', active: 'Active', order: 'Order' }
};

Object.assign(adminCopy.es, {
  missingFields: 'Falta completar',
  summaryRequiredGroup: 'Resumen',
  completeOneLanguage: 'Completa el resumen en al menos un idioma.',
  contactRequired: 'Al menos un teléfono, SMS, WhatsApp, correo o sitio oficial',
  addContactMethod: 'Añadir método de contacto',
  removeContactMethod: 'Quitar',
  saveError: 'No pudimos guardar el recurso. Revisa los campos e intenta nuevamente.',
  duplicateSlugError: 'Ese slug ya pertenece a otro recurso. Escribe uno diferente.',
  publishConstraintError: 'Supabase todavía detecta información obligatoria incompleta. Revisa contacto, fuente y fecha de verificación.',
  invalidFormatError: 'Uno de los campos tiene un formato no válido. Revisa especialmente latitud y longitud.',
  categoryReferenceError: 'La categoría seleccionada no coincide con una categoría disponible. Selecciónala nuevamente.',
  permissionError: 'Tu sesión no tiene permiso para guardar este recurso. Cierra sesión y vuelve a ingresar.',
  saving: 'Guardando…',
  currentStatus: 'Estado actual',
  publishResource: 'Publicar recurso',
  archiveResource: 'Archivar recurso',
  archiveResourceConfirm: '¿Quieres archivar este recurso? Dejará de aparecer en el sitio público.',
  resourceDuplicated: 'El recurso se duplicó como borrador.',
  resourceDuplicateError: 'No pudimos duplicar el recurso. Intenta nuevamente.',
  backToResources: 'Volver a Recursos',
  unsavedChangesConfirm: 'Tienes cambios sin guardar. ¿Quieres volver a Recursos y descartarlos?',
  unsavedResourceNavigationConfirm: 'Tienes cambios sin guardar. ¿Quieres descartarlos y abrir otro recurso?',
  previousResource: 'Recurso anterior',
  nextResource: 'Recurso siguiente',
  closeNotification: 'Cerrar notificación',
  draftSaved: 'Borrador guardado.',
  resourcePublished: 'Recurso publicado.',
  resourceArchived: 'Recurso archivado.',
  resourceRestored: 'Recurso restaurado como borrador.',
  deletePermanently: 'Eliminar',
  deleteResourceConfirm: title => `¿Eliminar “${title}”?`,
  deleteResourceDescription: 'Esta acción no se puede deshacer. El recurso desaparecerá del directorio y su slug quedará disponible nuevamente.',
  resourceDeletedPermanently: 'El recurso se eliminó.',
  resourceDeleteError: 'No pudimos eliminar el recurso. Confirma que tienes permisos de administrador e intenta nuevamente.',
  categoryUpdated: 'Categoría actualizada.',
  categoryIcon: 'Icono de categoría',
  resourceInsights: 'Resumen de recursos',
  resourceSummary: (total, published) => `${total} recursos · ${published} publicados`,
  totalResources: total => `${total} recursos`, publishedResources: published => `${published} publicados`, county: 'Condado', allCounties: 'Todos los condados', changeSort: (current, next) => `Orden actual: ${current}. Cambiar a ${next}`,
  resourceRange: (start, end, total) => `${start}–${end} de ${total}`,
  searchPlaceholder: 'Buscar recurso u organización', allStatuses: 'Todos los estados', allCategories: 'Todas las categorías', allVerification: 'Toda verificación', unverified: 'Sin verificar', modifiedRecent: 'Modificados recientemente', modified: 'Modificado', resource: 'Recurso', actions: 'Acciones', moreActions: 'Más acciones', statusPublished: 'Publicado', statusDraft: 'Borrador', statusArchived: 'Archivado',
  bulkActions: 'Acciones para recursos seleccionados', selectedCount: count => `${count} ${count === 1 ? 'seleccionado' : 'seleccionados'}`, changeCategory: 'Cambiar categoría', export: 'Exportar', selectPage: 'Seleccionar los recursos de esta página', selectPageLabel: 'Seleccionar esta página', selectResource: title => `Seleccionar ${title}`,
  bulkArchiveConfirm: count => `¿Quieres archivar ${count} ${count === 1 ? 'recurso' : 'recursos'}?`, bulkArchived: count => `${count} ${count === 1 ? 'recurso archivado' : 'recursos archivados'}.`, bulkCategoryChanged: count => `Se cambió la categoría de ${count} ${count === 1 ? 'recurso' : 'recursos'}.`, bulkExported: count => `Se exportaron ${count} ${count === 1 ? 'recurso' : 'recursos'}.`, bulkPartial: (success, failed) => `${success} completados; ${failed} no se pudieron actualizar.`,
  bulkPublishConfirm: count => `¿Quieres publicar ${count} ${count === 1 ? 'borrador seleccionado' : 'borradores seleccionados'}?`,
  bulkPublishTitle: 'Resultado de publicación',
  bulkPublishResult: (published, unresolved) => `${published} ${published === 1 ? 'recurso publicado' : 'recursos publicados'}${unresolved ? ` · ${unresolved} ${unresolved === 1 ? 'requiere' : 'requieren'} atención` : ''}.`,
  bulkPublishNeedsAttention: 'Revisa estos recursos',
  bulkRequirementLabel: key => ({ organization: 'Organización', slug: 'Slug', title: 'Título', summary: 'Resumen', primaryCategory: 'Categoría principal', contact: 'Información de contacto', source: 'Fuente', verifiedDate: 'Fecha de verificación', publishFailed: 'No se pudo publicar; intenta nuevamente' }[key] || key),
  bulkClose: 'Cerrar',
  changeCategoryHelp: count => `Selecciona la nueva categoría principal para ${count} ${count === 1 ? 'recurso' : 'recursos'}.`, chooseCategory: 'Selecciona una categoría', cancel: 'Cancelar', processing: 'Procesando…', applyChange: 'Aplicar cambio',
  importCsv: 'Importar CSV',
  importCsvTitle: 'Importar recursos',
  csvPrepareTitle: 'Prepara tu archivo CSV',
  csvPrepareText: 'Usa la plantilla para que las columnas coincidan con Puente ATX.',
  csvRuleDraft: 'Los recursos nuevos se crearán como borradores; los existentes conservarán su estado.',
  csvRuleUpdates: 'Si el slug o la combinación de organización y título ya existe, solo completaremos sus campos vacíos.',
  csvRuleLists: 'Separa valores múltiples con |, por ejemplo: es|en.',
  csvRuleCategories: 'Usa los slugs de categoría: comida, vivienda, salud, transporte, recursos-financieros, educacion, ayuda-legal u otros-recursos.',
  csvRuleNormalization: 'También aceptamos etiquetas comunes en español o inglés y listas separadas con | o ;. La vista previa mostrará cualquier valor que no podamos reconocer.',
  csvRuleLimit: 'Cada archivo puede contener hasta 500 recursos.',
  csvUpdateMode: 'Cómo actualizar recursos existentes', csvFillEmpty: 'Completar campos vacíos', csvFillEmptyHelp: 'Conserva los datos existentes y solo completa información que falta.', csvUpdateIncluded: 'Actualizar campos incluidos', csvUpdateIncludedHelp: 'Reemplaza únicamente valores no vacíos presentes en el CSV. Nunca borra información con una celda vacía.',
  csvVerifyToday: 'Marcar los recursos sin fecha como verificados hoy',
  csvVerifyTodayHelp: 'Si el CSV ya incluye una fecha de verificación, conservaremos esa fecha. Puedes modificarla después.',
  downloadCsvTemplate: 'Descargar plantilla CSV',
  chooseCsv: 'Seleccionar archivo CSV',
  csvFileTooLarge: 'El archivo supera el límite de 2 MB.',
  csvNoRows: 'El archivo no contiene recursos para importar.',
  csvMissingHeaders: headers => `Faltan estas columnas: ${headers.join(', ')}.`,
  csvLimitNotice: 'La vista previa muestra las primeras 500 filas.',
  csvReadError: 'No pudimos leer el archivo. Revisa que sea un CSV válido.',
  csvPreviewTitle: 'Vista previa',
  csvPreviewSummary: (created, updated, unchanged, invalid) => `${created} nuevos · ${updated} para actualizar · ${unchanged} sin cambios · ${invalid} con errores`,
  csvImporting: 'Importando',
  csvApplyChanges: count => `Aplicar ${count} ${count === 1 ? 'cambio' : 'cambios'}`,
  csvImportDrafts: count => `Importar ${count} ${count === 1 ? 'borrador' : 'borradores'}`,
  csvRow: 'Fila',
  csvValidation: 'Validación',
  csvReady: 'Listo',
  csvActionLabel: (action, patch, mode = 'empty') => action === 'create' ? 'Crear recurso nuevo' : action === 'update' ? `${mode === 'included' ? 'Actualizar' : 'Completar'} ${Object.keys(patch || {}).length} ${Object.keys(patch || {}).length === 1 ? 'campo' : 'campos'}` : 'Sin cambios',
  csvReplaceConfirm: count => `Se actualizarán únicamente los campos no vacíos incluidos en el CSV para ${count} ${count === 1 ? 'recurso' : 'recursos'}. Las celdas vacías no borrarán información. ¿Quieres continuar?`,
  csvReviewChanges: 'Revisar cambios',
  csvFieldLabel: key => ({ summary_es: 'Resumen en español', summary_en: 'Resumen en inglés', phone: 'Teléfono', website_url: 'Sitio web', primary_category_id: 'Categoría principal', additional_category_ids: 'Categorías adicionales' }[key] || key.replaceAll('_', ' ')),
  csvWarningLabel: key => ({ summary_url: 'El resumen contiene un sitio web', summary_email: 'El resumen contiene un correo', summary_phone: 'El resumen contiene un teléfono' }[key] || key),
  csvErrorLabel: (key, value) => `${({ organization: 'Falta la organización', title: 'Falta el título', primary_category: 'Categoría principal no reconocida', additional_categories: 'Categoría adicional no reconocida', languages: 'Idiomas no reconocidos', service_methods: 'Métodos de atención no reconocidos', cost_type: 'Costo no reconocido', postal_code: 'Código postal inválido', last_verified_at: 'Fecha inválida; usa AAAA-MM-DD', latitude: 'Latitud inválida', longitude: 'Longitud inválida', duplicate_match: 'Coincidencia duplicada; revisa el slug', duplicate_csv: 'Recurso repetido dentro del CSV' }[key] || key)}${value ? `: “${value}”` : ''}`,
  csvImportCompleted: (created, updated) => `${created} ${created === 1 ? 'recurso creado' : 'recursos creados'} · ${updated} ${updated === 1 ? 'recurso actualizado' : 'recursos actualizados'}.`,
  csvImported: count => `${count} ${count === 1 ? 'recurso importado' : 'recursos importados'} como ${count === 1 ? 'borrador' : 'borradores'}.`,
  csvPartialImport: (created, updated, rows) => `${created} creados y ${updated} actualizados. No pudimos procesar las filas ${rows.join(', ')}.`
});

Object.assign(adminCopy.en, {
  missingFields: 'Still required',
  summaryRequiredGroup: 'Summary',
  completeOneLanguage: 'Complete the summary in at least one language.',
  contactRequired: 'At least one phone, SMS, WhatsApp, email, or official website',
  addContactMethod: 'Add contact method',
  removeContactMethod: 'Remove',
  saveError: 'We could not save the resource. Check the fields and try again.',
  duplicateSlugError: 'That slug already belongs to another resource. Enter a different one.',
  publishConstraintError: 'Supabase still detects missing required information. Check contact, source, and verification date.',
  invalidFormatError: 'One field has an invalid format. Check latitude and longitude in particular.',
  categoryReferenceError: 'The selected category does not match an available category. Select it again.',
  permissionError: 'Your session does not have permission to save this resource. Sign out and sign in again.',
  saving: 'Saving…',
  currentStatus: 'Current status',
  publishResource: 'Publish resource',
  archiveResource: 'Archive resource',
  archiveResourceConfirm: 'Do you want to archive this resource? It will no longer appear on the public site.',
  resourceDuplicated: 'The resource was duplicated as a draft.',
  resourceDuplicateError: 'We could not duplicate the resource. Try again.',
  backToResources: 'Back to Resources',
  unsavedChangesConfirm: 'You have unsaved changes. Do you want to return to Resources and discard them?',
  unsavedResourceNavigationConfirm: 'You have unsaved changes. Do you want to discard them and open another resource?',
  previousResource: 'Previous resource',
  nextResource: 'Next resource',
  closeNotification: 'Close notification',
  draftSaved: 'Draft saved.',
  resourcePublished: 'Resource published.',
  resourceArchived: 'Resource archived.',
  resourceRestored: 'Resource restored as a draft.',
  deletePermanently: 'Delete',
  deleteResourceConfirm: title => `Delete “${title}”?`,
  deleteResourceDescription: 'This action cannot be undone. The resource will disappear from the directory and its slug will become available again.',
  resourceDeletedPermanently: 'The resource was deleted.',
  resourceDeleteError: 'We could not delete the resource. Confirm that you have administrator permission and try again.',
  categoryUpdated: 'Category updated.',
  categoryIcon: 'Category icon',
  resourceInsights: 'Resources overview',
  resourceSummary: (total, published) => `${total} resources · ${published} published`,
  totalResources: total => `${total} resources`, publishedResources: published => `${published} published`, county: 'County', allCounties: 'All counties', changeSort: (current, next) => `Current order: ${current}. Change to ${next}`,
  resourceRange: (start, end, total) => `${start}–${end} of ${total}`,
  searchPlaceholder: 'Search resource or organization', allStatuses: 'All statuses', allCategories: 'All categories', allVerification: 'All verification states', unverified: 'Unverified', modifiedRecent: 'Recently modified', modified: 'Modified', resource: 'Resource', actions: 'Actions', moreActions: 'More actions', statusPublished: 'Published', statusDraft: 'Draft', statusArchived: 'Archived',
  bulkActions: 'Actions for selected resources', selectedCount: count => `${count} selected`, changeCategory: 'Change category', export: 'Export', selectPage: 'Select resources on this page', selectPageLabel: 'Select this page', selectResource: title => `Select ${title}`,
  bulkArchiveConfirm: count => `Archive ${count} ${count === 1 ? 'resource' : 'resources'}?`, bulkArchived: count => `${count} ${count === 1 ? 'resource was' : 'resources were'} archived.`, bulkCategoryChanged: count => `Category changed for ${count} ${count === 1 ? 'resource' : 'resources'}.`, bulkExported: count => `${count} ${count === 1 ? 'resource was' : 'resources were'} exported.`, bulkPartial: (success, failed) => `${success} completed; ${failed} could not be updated.`,
  bulkPublishConfirm: count => `Publish ${count} selected ${count === 1 ? 'draft' : 'drafts'}?`,
  bulkPublishTitle: 'Publishing results',
  bulkPublishResult: (published, unresolved) => `${published} ${published === 1 ? 'resource was' : 'resources were'} published${unresolved ? ` · ${unresolved} ${unresolved === 1 ? 'needs' : 'need'} attention` : ''}.`,
  bulkPublishNeedsAttention: 'Review these resources',
  bulkRequirementLabel: key => ({ organization: 'Organization', slug: 'Slug', title: 'Title', summary: 'Summary', primaryCategory: 'Primary category', contact: 'Contact information', source: 'Source', verifiedDate: 'Verification date', publishFailed: 'Could not publish; try again' }[key] || key),
  bulkClose: 'Close',
  changeCategoryHelp: count => `Select the new primary category for ${count} ${count === 1 ? 'resource' : 'resources'}.`, chooseCategory: 'Choose a category', cancel: 'Cancel', processing: 'Processing…', applyChange: 'Apply change',
  importCsv: 'Import CSV',
  importCsvTitle: 'Import resources',
  csvPrepareTitle: 'Prepare your CSV file',
  csvPrepareText: 'Use the template so its columns match Puente ATX.',
  csvRuleDraft: 'New resources will be created as drafts; existing resources will keep their status.',
  csvRuleUpdates: 'If the slug or organization-and-title combination already exists, we will only fill its empty fields.',
  csvRuleLists: 'Separate multiple values with |, for example: es|en.',
  csvRuleCategories: 'Use category slugs: comida, vivienda, salud, transporte, recursos-financieros, educacion, ayuda-legal, or otros-recursos.',
  csvRuleNormalization: 'We also accept common Spanish or English labels and lists separated with | or ;. The preview will show any value we cannot recognize.',
  csvRuleLimit: 'Each file can contain up to 500 resources.',
  csvUpdateMode: 'How to update existing resources', csvFillEmpty: 'Fill empty fields', csvFillEmptyHelp: 'Keeps existing data and only completes missing information.', csvUpdateIncluded: 'Update included fields', csvUpdateIncludedHelp: 'Replaces only non-empty values included in the CSV. An empty cell never deletes information.',
  csvVerifyToday: 'Mark resources without a date as verified today',
  csvVerifyTodayHelp: 'If the CSV already includes a verification date, we will keep that date. You can change it later.',
  downloadCsvTemplate: 'Download CSV template',
  chooseCsv: 'Select CSV file',
  csvFileTooLarge: 'The file exceeds the 2 MB limit.',
  csvNoRows: 'The file does not contain resources to import.',
  csvMissingHeaders: headers => `These columns are missing: ${headers.join(', ')}.`,
  csvLimitNotice: 'The preview shows the first 500 rows.',
  csvReadError: 'We could not read the file. Check that it is a valid CSV.',
  csvPreviewTitle: 'Preview',
  csvPreviewSummary: (created, updated, unchanged, invalid) => `${created} new · ${updated} to update · ${unchanged} unchanged · ${invalid} with errors`,
  csvImporting: 'Importing',
  csvApplyChanges: count => `Apply ${count} ${count === 1 ? 'change' : 'changes'}`,
  csvImportDrafts: count => `Import ${count} ${count === 1 ? 'draft' : 'drafts'}`,
  csvRow: 'Row',
  csvValidation: 'Validation',
  csvReady: 'Ready',
  csvActionLabel: (action, patch, mode = 'empty') => action === 'create' ? 'Create new resource' : action === 'update' ? `${mode === 'included' ? 'Update' : 'Fill'} ${Object.keys(patch || {}).length} ${Object.keys(patch || {}).length === 1 ? 'field' : 'fields'}` : 'No changes',
  csvReplaceConfirm: count => `Only non-empty fields included in the CSV will be updated for ${count} ${count === 1 ? 'resource' : 'resources'}. Empty cells will not delete information. Do you want to continue?`,
  csvReviewChanges: 'Review changes',
  csvFieldLabel: key => ({ summary_es: 'Spanish summary', summary_en: 'English summary', phone: 'Phone', website_url: 'Website', primary_category_id: 'Primary category', additional_category_ids: 'Additional categories' }[key] || key.replaceAll('_', ' ')),
  csvWarningLabel: key => ({ summary_url: 'The summary contains a website', summary_email: 'The summary contains an email', summary_phone: 'The summary contains a phone number' }[key] || key),
  csvErrorLabel: (key, value) => `${({ organization: 'Organization is missing', title: 'Title is missing', primary_category: 'Unrecognized primary category', additional_categories: 'Unrecognized additional category', languages: 'Unrecognized languages', service_methods: 'Unrecognized service methods', cost_type: 'Unrecognized cost', postal_code: 'Invalid ZIP code', last_verified_at: 'Invalid date; use YYYY-MM-DD', latitude: 'Invalid latitude', longitude: 'Invalid longitude', duplicate_match: 'Duplicate match; review the slug', duplicate_csv: 'Resource repeated in the CSV' }[key] || key)}${value ? `: “${value}”` : ''}`,
  csvImportCompleted: (created, updated) => `${created} ${created === 1 ? 'resource created' : 'resources created'} · ${updated} ${updated === 1 ? 'resource updated' : 'resources updated'}.`,
  csvImported: count => `${count} ${count === 1 ? 'resource was' : 'resources were'} imported as ${count === 1 ? 'a draft' : 'drafts'}.`,
  csvPartialImport: (created, updated, rows) => `${created} created and ${updated} updated. We could not process rows ${rows.join(', ')}.`
});
