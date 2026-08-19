import { isValidServiceArea, SERVICE_AREA_ALL, SERVICE_AREA_UNDISCLOSED } from '../config/serviceAreas.js';

export const ANALYTICS_SCHEMA_VERSION = 1;
export const ANALYTICS_EVENT_NAMES = [
  'search_submitted',
  'search_no_results',
  'category_selected',
  'area_selected',
  'resource_viewed',
  'resource_selected',
  'resource_saved',
  'resource_removed',
  'call_clicked',
  'whatsapp_clicked',
  'website_clicked',
  'directions_clicked',
  'list_shared',
  'list_printed',
  'resource_printed',
  'conversation_requested',
  'shared_list_opened'
];

const EVENT_FIELDS = {
  search_submitted: { required: ['search_result_count'], optional: ['search_term_normalized', 'category_slug', 'area_code'] },
  search_no_results: { required: ['search_result_count'], optional: ['search_term_normalized', 'category_slug', 'area_code'] },
  category_selected: { required: ['category_slug'], optional: ['area_code'] },
  area_selected: { required: [], optional: ['area_code'] },
  resource_viewed: { required: ['resource_id'], optional: ['category_slug'] },
  resource_selected: { required: ['resource_id'], optional: ['category_slug', 'area_code'] },
  resource_saved: { required: ['resource_id'], optional: ['category_slug'] },
  resource_removed: { required: ['resource_id'], optional: ['category_slug'] },
  call_clicked: { required: ['resource_id'], optional: ['category_slug'] },
  whatsapp_clicked: { required: ['resource_id'], optional: ['category_slug'] },
  website_clicked: { required: ['resource_id'], optional: ['category_slug'] },
  directions_clicked: { required: ['resource_id'], optional: ['category_slug'] },
  list_shared: { required: [], optional: [] },
  list_printed: { required: [], optional: [] },
  resource_printed: { required: ['resource_id'], optional: ['category_slug'] },
  conversation_requested: { required: [], optional: [] },
  shared_list_opened: { required: [], optional: [] }
};

export const eventDefinitions = Object.freeze({
  search_submitted: { description: 'A search was explicitly submitted.', source: 'Resource search forms', metric: 'searchesPerformed' },
  search_no_results: { description: 'A submitted search returned zero results.', source: 'Resource results', metric: 'noResultSearches' },
  category_selected: { description: 'A category entry point was selected.', source: 'Homepage and filters', metric: 'categorySelections' },
  area_selected: { description: 'An optional service area was selected.', source: 'Resource filters', metric: 'areaSelections' },
  resource_viewed: { description: 'A published resource detail was opened.', source: 'Resource details', metric: 'resourcesViewed' },
  resource_selected: { description: 'A resource finder marker or card was selected.', source: 'Resource finder', metric: 'resourceSelections' },
  resource_saved: { description: 'A resource was added to the local list.', source: 'Resource cards and details', metric: 'resourcesSaved' },
  resource_removed: { description: 'A resource was removed from the local list.', source: 'Resource cards and saved list', metric: 'resourcesRemoved' },
  call_clicked: { description: 'A phone action was initiated.', source: 'Resource cards and details', metric: 'contactActions' },
  whatsapp_clicked: { description: 'A WhatsApp action was initiated.', source: 'Resource cards and details', metric: 'contactActions' },
  website_clicked: { description: 'An official website was opened.', source: 'Resource cards and details', metric: 'contactActions' },
  directions_clicked: { description: 'A directions action was initiated.', source: 'Resource cards and details', metric: 'contactActions' },
  list_shared: { description: 'A saved-resource list share action was initiated.', source: 'My list', metric: 'listsShared' },
  list_printed: { description: 'A saved-resource list print action was initiated.', source: 'My list', metric: 'listsPrinted' },
  resource_printed: { description: 'A single resource print action was initiated.', source: 'Resource cards and details', metric: 'resourcesPrinted' },
  conversation_requested: { description: 'A conversation request was successfully submitted.', source: 'Conversation form', metric: 'conversationRequests' },
  shared_list_opened: { description: 'A shared resource-list URL was opened.', source: 'My list', metric: 'sharedListsOpened' }
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CATEGORY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/i;
const PHONE_PATTERN = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;
const ADDRESS_PATTERN = /\b\d{1,6}\s+[a-záéíóúñ0-9.' -]{2,}\s(?:st(?:reet)?|ave(?:nue)?|rd|road|dr(?:ive)?|blvd|boulevard|ln|lane|ct|court|way|pkwy|parkway)\b/i;

export function sanitizeSearchTerm(value) {
  const withoutControls = [...String(value ?? '')].filter(character => {
    const code = character.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');
  const normalized = withoutControls.trim().replace(/\s+/g, ' ').toLocaleLowerCase().slice(0, 80);
  if (!normalized || EMAIL_PATTERN.test(normalized) || URL_PATTERN.test(normalized) || PHONE_PATTERN.test(normalized) || ADDRESS_PATTERN.test(normalized)) return null;
  return normalized;
}

export function validateEventPayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'invalid_payload' };
  const eventName = String(input.event_name || '');
  const definition = EVENT_FIELDS[eventName];
  if (!definition) return { ok: false, error: 'invalid_event' };
  const sessionId = String(input.anonymous_session_id || '');
  if (!UUID_PATTERN.test(sessionId)) return { ok: false, error: 'invalid_session' };
  if (!['es', 'en'].includes(input.language)) return { ok: false, error: 'invalid_language' };
  if (!['mobile', 'tablet', 'desktop', 'unknown'].includes(input.device_type)) return { ok: false, error: 'invalid_device' };
  for (const field of definition.required) {
    if (input[field] == null || input[field] === '') return { ok: false, error: `missing_${field}` };
  }
  const allowed = new Set(['event_name', 'anonymous_session_id', 'language', 'device_type', 'page_path', 'environment', 'schema_version', ...definition.required, ...definition.optional]);
  const value = Object.fromEntries(Object.entries(input).filter(([key]) => allowed.has(key)));
  value.event_name = eventName;
  value.anonymous_session_id = sessionId;
  value.schema_version = ANALYTICS_SCHEMA_VERSION;
  if (!['production', 'preview', 'development'].includes(value.environment)) value.environment = 'development';
  value.page_path = String(value.page_path || '/').split('?')[0].slice(0, 200);
  if (!value.page_path.startsWith('/')) value.page_path = '/';
  if (value.resource_id != null && !UUID_PATTERN.test(String(value.resource_id))) return { ok: false, error: 'invalid_resource' };
  if (value.category_slug != null && !CATEGORY_PATTERN.test(String(value.category_slug))) return { ok: false, error: 'invalid_category' };
  if (value.area_code === SERVICE_AREA_ALL || value.area_code === SERVICE_AREA_UNDISCLOSED || value.area_code === '') value.area_code = null;
  if (!isValidServiceArea(value.area_code)) return { ok: false, error: 'invalid_area' };
  if (value.search_result_count != null) {
    const count = Number(value.search_result_count);
    if (!Number.isInteger(count) || count < 0 || count > 100000) return { ok: false, error: 'invalid_result_count' };
    value.search_result_count = count;
  }
  if (Object.prototype.hasOwnProperty.call(value, 'search_term_normalized')) value.search_term_normalized = sanitizeSearchTerm(value.search_term_normalized);
  return { ok: true, value };
}
