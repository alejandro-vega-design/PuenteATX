import { resourceCategories } from './categories.js';
import { createResourceSlug, createUniqueResourceSlug } from './resourceUtils.js';
import { normalizeServiceArea } from './serviceAreaNormalization.js';

export const CSV_IMPORT_HEADERS = [
  'organization_name', 'title_es', 'title_en', 'summary_es', 'summary_en',
  'description_es', 'description_en', 'slug', 'primary_category',
  'additional_categories', 'keywords_es', 'keywords_en', 'languages',
  'service_methods', 'cost_type', 'eligibility_es', 'eligibility_en',
  'required_documents_es', 'required_documents_en', 'application_steps_es',
  'application_steps_en', 'hours_es', 'hours_en', 'accessibility_notes_es',
  'accessibility_notes_en', 'service_area_es', 'service_area_en', 'phone',
  'sms_phone', 'whatsapp_phone', 'email', 'website_url', 'address_line_1',
  'address_line_2', 'city', 'state', 'postal_code', 'county', 'latitude',
  'longitude', 'source_url', 'is_featured', 'is_emergency', 'last_verified_at',
  'verification_notes'
];

const REQUIRED_HEADERS = ['organization_name', 'title_es', 'title_en', 'primary_category'];
const SERVICE_METHODS = new Set(['in_person', 'phone', 'online', 'home_visit']);
const COST_TYPES = new Set(['free', 'sliding_scale', 'paid', 'unknown']);
const LANGUAGES = new Set(['es', 'en']);
const clean = value => String(value ?? '').trim();
const splitList = value => [...new Set(clean(value).split(/[|;]/).map(item => item.trim()).filter(Boolean))];
const parseBoolean = value => ['1', 'true', 'yes', 'si', 'sí'].includes(clean(value).toLocaleLowerCase());
const normalizeMatchValue = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/\s+/g, ' ');
const isEmptyValue = value => value == null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0);
const sameValue = (left, right) => Array.isArray(left) || Array.isArray(right)
  ? JSON.stringify(left || []) === JSON.stringify(right || [])
  : String(left ?? '').trim() === String(right ?? '').trim();
const CSV_RESOURCE_FIELDS = CSV_IMPORT_HEADERS.filter(header => !['slug', 'primary_category', 'additional_categories'].includes(header));
const SUMMARY_CONTACT_PATTERNS = {
  summary_url: /(?:https?:\/\/|www\.|\b(?:[a-z0-9-]+\.)+(?:com|org|net|gov|edu|us|io)\b)/i,
  summary_email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  summary_phone: /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/
};
const CSV_IMPORT_ROW_LIMIT = 500;

const CATEGORY_ALIASES = new Map([
  ['food', 'comida'], ['alimentos', 'comida'], ['comida', 'comida'],
  ['housing', 'vivienda'], ['vivienda', 'vivienda'],
  ['health', 'salud'], ['healthcare', 'salud'], ['mental health', 'salud'], ['salud mental', 'salud'], ['substance use & recovery', 'salud'], ['salud', 'salud'],
  ['transportation', 'transporte'], ['transport', 'transporte'], ['transporte', 'transporte'],
  ['financial assistance', 'recursos-financieros'], ['financial resources', 'recursos-financieros'], ['recursos financieros', 'recursos-financieros'],
  ['education', 'educacion'], ['educación', 'educacion'], ['educacion', 'educacion'],
  ['legal help', 'ayuda-legal'], ['legal aid', 'ayuda-legal'], ['ayuda legal', 'ayuda-legal'],
  ['other resources', 'otros-recursos'], ['family support', 'otros-recursos'], ['employment', 'otros-recursos'], ['otros recursos', 'otros-recursos']
]);

const normalizeCategorySlug = value => {
  const normalized = normalizeMatchValue(value);
  const direct = resourceCategories.find(category => category.slug === clean(value)
    || normalizeMatchValue(category.label_es) === normalized
    || normalizeMatchValue(category.label_en) === normalized);
  return direct?.slug || CATEGORY_ALIASES.get(normalized) || clean(value);
};

const normalizeLanguages = value => {
  const source = normalizeMatchValue(value);
  const items = splitList(value);
  const result = [];
  const hasEnglish = items.some(item => ['en', 'english', 'ingles'].includes(normalizeMatchValue(item))) || /\benglish\b/.test(source);
  const spanishIsUnconfirmed = /(not verified|not specified|should be confirmed|ask about|to confirm|case-by-case|availability should|disponibilidad.*confirmar|no verificado)/.test(source);
  const hasSpanish = items.some(item => ['es', 'spanish', 'espanol'].includes(normalizeMatchValue(item)))
    || (/\bspanish\b|\bespanol\b/.test(source) && !spanishIsUnconfirmed);
  if (hasSpanish) result.push('es');
  if (hasEnglish) result.push('en');
  return result.length ? result : items;
};

const normalizeServiceMethods = value => {
  const items = splitList(value);
  const result = [];
  for (const item of items) {
    const normalized = normalizeMatchValue(item).replace(/-/g, ' ');
    if (SERVICE_METHODS.has(item)) result.push(item);
    else {
      if (/(in person|presencial|residential|court|clinic|resource navigation|transportation service|scheduled rides|rideshare|demand response|volunteer transportation)/.test(normalized)) result.push('in_person');
      if (/(phone|telefono|llamada|contact provider)/.test(normalized)) result.push('phone');
      if (/(online|en linea|virtual|telehealth|remote|\bapp\b)/.test(normalized)) result.push('online');
      if (/(home visit|visita al hogar|home delivery|home\/community)/.test(normalized)) result.push('home_visit');
    }
  }
  return result.length ? [...new Set(result)] : items;
};

const normalizeCostType = value => {
  const original = clean(value || 'unknown');
  const normalized = normalizeMatchValue(original);
  if (COST_TYPES.has(original)) return original;
  if (/^(free|gratis)(\b|\s*\/)/.test(normalized) || /free for eligible|free if eligible|no cost/.test(normalized)) return 'free';
  if (/sliding|escala variable/.test(normalized)) return 'sliding_scale';
  if (/^\$|low[- ]cost|reduced fare|consultation|paid|pagado/.test(normalized)) return 'paid';
  if (/varies|eligibility|program|assistance|housing assistance/.test(normalized)) return 'unknown';
  return original;
};

const findExistingResource = (values, existingResources) => {
  const suppliedSlug = clean(values.slug);
  if (suppliedSlug) {
    const slugMatch = existingResources.find(resource => resource.slug === suppliedSlug);
    if (slugMatch) return { resource: slugMatch, method: 'slug', ambiguous: false };
  }
  const organization = normalizeMatchValue(values.organization_name);
  const titleEs = normalizeMatchValue(values.title_es);
  const titleEn = normalizeMatchValue(values.title_en);
  const matches = existingResources.filter(resource => {
    if (normalizeMatchValue(resource.organization_name) !== organization) return false;
    return (titleEs && normalizeMatchValue(resource.title_es) === titleEs)
      || (titleEn && normalizeMatchValue(resource.title_en) === titleEn);
  });
  if (matches.length === 1) return { resource: matches[0], method: 'name', ambiguous: false };
  return { resource: null, method: null, ambiguous: matches.length > 1 };
};

export function emptyCsvFieldPatch(existingResource, csvValues, candidateResource) {
  const patch = {};
  for (const field of CSV_RESOURCE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(csvValues, field) || !clean(csvValues[field])) continue;
    if (isEmptyValue(existingResource[field])) patch[field] = candidateResource[field];
  }
  if (clean(csvValues.primary_category) && isEmptyValue(existingResource.primary_category_id)) {
    patch.primary_category_id = candidateResource.primary_category_id;
  }
  if (clean(csvValues.additional_categories) && isEmptyValue(existingResource.additional_category_ids)) {
    patch.additional_category_ids = candidateResource.additional_category_ids;
  }
  return patch;
}

export function includedCsvFieldPatch(existingResource, csvValues, candidateResource) {
  const patch = {};
  for (const field of CSV_RESOURCE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(csvValues, field) || !clean(csvValues[field])) continue;
    if (!sameValue(existingResource[field], candidateResource[field])) patch[field] = candidateResource[field];
  }
  if (clean(csvValues.primary_category) && !sameValue(existingResource.primary_category_id, candidateResource.primary_category_id)) {
    patch.primary_category_id = candidateResource.primary_category_id;
  }
  if (clean(csvValues.additional_categories) && !sameValue(existingResource.additional_category_ids, candidateResource.additional_category_ids)) {
    patch.additional_category_ids = candidateResource.additional_category_ids;
  }
  return patch;
}

export function summaryContactWarnings(values) {
  const warnings = [];
  for (const field of ['summary_es', 'summary_en']) {
    const summary = clean(values[field]);
    if (!summary) continue;
    for (const [key, pattern] of Object.entries(SUMMARY_CONTACT_PATTERNS)) {
      if (pattern.test(summary)) warnings.push(`${key}:${field}`);
    }
  }
  return warnings;
}

export function parseCsv(text) {
  const source = String(text ?? '').replace(/^\ufeff/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else cell += character;
  }
  if (quoted) throw new Error('unclosed_quotes');
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  const nonEmptyRows = rows.filter(values => values.some(value => clean(value)) && !clean(values[0]).startsWith('#'));
  if (!nonEmptyRows.length) return { headers: [], records: [] };
  const headers = nonEmptyRows[0].map(value => clean(value));
  if (headers.some((header, index) => !header || headers.indexOf(header) !== index)) throw new Error('invalid_headers');
  const records = nonEmptyRows.slice(1).map((values, index) => ({
    rowNumber: index + 2,
    values: Object.fromEntries(headers.map((header, column) => [header, clean(values[column])]))
  }));
  return { headers, records };
}

export function csvTemplate() {
  const instructions = Object.fromEntries(CSV_IMPORT_HEADERS.map(header => [header, '']));
  instructions.organization_name = '# INSTRUCCIONES — conserva los encabezados y añade los recursos debajo de esta fila; esta fila se ignora al importar';
  instructions.primary_category = 'comida | vivienda | salud | transporte | recursos-financieros | educacion | ayuda-legal | otros-recursos';
  instructions.additional_categories = 'Separa varias con | o ;';
  instructions.languages = 'es|en (también acepta Español/English)';
  instructions.service_methods = 'in_person|phone|online|home_visit';
  instructions.cost_type = 'free | sliding_scale | paid | unknown';
  instructions.last_verified_at = 'AAAA-MM-DD';
  const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return `\ufeff${CSV_IMPORT_HEADERS.join(',')}\n${CSV_IMPORT_HEADERS.map(header => csvCell(instructions[header])).join(',')}\n`;
}

export function applyImportVerificationDate(resource, enabled, importDate) {
  if (resource.last_verified_at || !enabled) return resource;
  return { ...resource, last_verified_at: importDate };
}

export function prepareCsvResources(parsed, existingResources = [], updateMode = 'empty') {
  const missingHeaders = REQUIRED_HEADERS.filter(header => !parsed.headers.includes(header));
  if (missingHeaders.length) return { missingHeaders, rows: [] };
  const usedResources = [...existingResources];
  const seenTargets = new Set();
  const rows = parsed.records.slice(0, CSV_IMPORT_ROW_LIMIT).map(record => {
    const values = record.values;
    const errors = [];
    const errorValues = {};
    const addError = (key, value) => { errors.push(key); errorValues[key] = clean(value); };
    const organization = clean(values.organization_name);
    const titleEs = clean(values.title_es);
    const titleEn = clean(values.title_en);
    const primarySlug = normalizeCategorySlug(values.primary_category);
    const primary = resourceCategories.find(category => category.slug === primarySlug);
    if (!organization) errors.push('organization');
    if (!titleEs && !titleEn) errors.push('title');
    if (!primary) addError('primary_category', values.primary_category);

    const additionalSlugs = splitList(values.additional_categories).map(normalizeCategorySlug);
    const invalidAdditional = additionalSlugs.filter(slug => !resourceCategories.some(category => category.slug === slug));
    if (invalidAdditional.length) addError('additional_categories', invalidAdditional.join(', '));
    const languages = normalizeLanguages(values.languages);
    if (languages.some(value => !LANGUAGES.has(value))) addError('languages', values.languages);
    const methods = normalizeServiceMethods(values.service_methods);
    if (methods.some(value => !SERVICE_METHODS.has(value))) addError('service_methods', values.service_methods);
    const cost = normalizeCostType(values.cost_type);
    if (!COST_TYPES.has(cost)) addError('cost_type', values.cost_type);
    const postalCode = clean(values.postal_code);
    if (postalCode && !/^\d{5}$/.test(postalCode)) addError('postal_code', postalCode);
    const verified = clean(values.last_verified_at);
    if (verified && !/^\d{4}-\d{2}-\d{2}$/.test(verified)) addError('last_verified_at', verified);
    const latitude = clean(values.latitude);
    const longitude = clean(values.longitude);
    if (latitude && !Number.isFinite(Number(latitude))) addError('latitude', latitude);
    if (longitude && !Number.isFinite(Number(longitude))) addError('longitude', longitude);

    const match = findExistingResource(values, existingResources);
    if (match.ambiguous) errors.push('duplicate_match');
    const baseSlug = clean(values.slug) || createResourceSlug(titleEs || titleEn, organization);
    const slug = match.resource?.slug || createUniqueResourceSlug(baseSlug, usedResources, null);
    const normalizedServiceArea = normalizeServiceArea({
      serviceAreaEs: clean(values.service_area_es),
      serviceAreaEn: clean(values.service_area_en),
      city: clean(values.city),
      county: clean(values.county),
      postalCode
    });
    const resource = {
      status: 'draft',
      organization_name: organization,
      title_es: titleEs,
      title_en: titleEn,
      summary_es: clean(values.summary_es),
      summary_en: clean(values.summary_en),
      description_es: clean(values.description_es),
      description_en: clean(values.description_en),
      slug,
      primary_category_id: primary?.id || '',
      additional_category_ids: additionalSlugs
        .map(categorySlug => resourceCategories.find(category => category.slug === categorySlug)?.id)
        .filter(id => id && id !== primary?.id),
      keywords_es: splitList(values.keywords_es),
      keywords_en: splitList(values.keywords_en),
      languages,
      service_methods: methods,
      cost_type: cost,
      eligibility_es: clean(values.eligibility_es),
      eligibility_en: clean(values.eligibility_en),
      required_documents_es: clean(values.required_documents_es),
      required_documents_en: clean(values.required_documents_en),
      application_steps_es: clean(values.application_steps_es),
      application_steps_en: clean(values.application_steps_en),
      hours_es: clean(values.hours_es),
      hours_en: clean(values.hours_en),
      accessibility_notes_es: clean(values.accessibility_notes_es),
      accessibility_notes_en: clean(values.accessibility_notes_en),
      service_area_es: normalizedServiceArea.es,
      service_area_en: normalizedServiceArea.en,
      phone: clean(values.phone),
      sms_phone: clean(values.sms_phone),
      whatsapp_phone: clean(values.whatsapp_phone),
      email: clean(values.email),
      website_url: clean(values.website_url),
      address_line_1: clean(values.address_line_1),
      address_line_2: clean(values.address_line_2),
      city: clean(values.city),
      state: clean(values.state || 'TX'),
      postal_code: postalCode,
      county: clean(values.county),
      latitude: latitude || null,
      longitude: longitude || null,
      source_url: clean(values.source_url),
      is_featured: parseBoolean(values.is_featured),
      is_emergency: parseBoolean(values.is_emergency),
      last_verified_at: verified || null,
      verification_notes: clean(values.verification_notes),
      published_at: null,
      archived_at: null
    };
    const targetKey = match.resource ? `existing:${match.resource.id || match.resource.slug}` : `new:${baseSlug}`;
    if (seenTargets.has(targetKey)) errors.push('duplicate_csv');
    seenTargets.add(targetKey);
    if (!match.resource) usedResources.push({ slug });
    const patch = match.resource ? (updateMode === 'included' ? includedCsvFieldPatch(match.resource, values, resource) : emptyCsvFieldPatch(match.resource, values, resource)) : null;
    const action = match.resource ? (Object.keys(patch).length ? 'update' : 'unchanged') : 'create';
    return {
      rowNumber: record.rowNumber,
      resource,
      existingResource: match.resource,
      matchMethod: match.method,
      patch,
      action,
      category: primary?.label_es || clean(values.primary_category),
      errors,
      warnings: summaryContactWarnings(values),
      errorValues
    };
  });
  return { missingHeaders: [], rows, truncated: parsed.records.length > CSV_IMPORT_ROW_LIMIT };
}
