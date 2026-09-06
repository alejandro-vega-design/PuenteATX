import { supabaseRequest } from './supabaseClient';
import { adminSupabaseRequest } from './adminSupabaseClient';
import { filterAndSortResources } from './resourceUtils';

const adminRequest = (path, options = {}) => adminSupabaseRequest(path, {
  ...options,
  headers: { Prefer: 'return=representation', ...options.headers }
});
// Keep public reads compatible before migration 009 is applied. The finder only
// needs the existing latitude/longitude columns; geocoding workflow fields are
// administrative metadata and do not belong in public queries.
//
// Two column sets, deliberately: list views (the resource directory, the map
// finder, saved lists, print sheets) only ever render the fields in
// RESOURCE_LIST_COLUMNS — see ResourceCard, CompactResourceCard and
// FinderPrintSheet. The long free-text fields below (eligibility, required
// documents, application steps, hours, accessibility notes) and secondary
// contact channels (email, sms/whatsapp) are read only by the single-resource
// detail page. Fetching them for every row of a 700+ resource bulk query wastes
// bandwidth and memory for data that is never displayed in that view; fetch
// them lazily, one resource at a time, via getResourceBySlug instead.
const RESOURCE_LIST_COLUMNS = 'id,slug,status,organization_name,title_es,title_en,summary_es,summary_en,description_es,description_en,primary_category_id,keywords_es,keywords_en,languages,service_methods,cost_type,service_area_es,service_area_en,phone,website_url,address_line_1,address_line_2,city,state,postal_code,county,latitude,longitude,source_url,is_featured,is_emergency,last_verified_at,updated_at,resource_categories(category_id)';
const RESOURCE_DETAIL_COLUMNS = `${RESOURCE_LIST_COLUMNS},eligibility_es,eligibility_en,required_documents_es,required_documents_en,application_steps_es,application_steps_en,hours_es,hours_en,accessibility_notes_es,accessibility_notes_en,sms_phone,whatsapp_phone,email,logo_url,published_at,created_at`;
const resourceRow = values => {
  const row = { ...values };
  delete row.additional_category_ids;
  delete row.resource_categories;
  if (row.latitude === '') row.latitude = null;
  if (row.longitude === '') row.longitude = null;
  return row;
};
const syncAdditionalCategories = async (resourceId, ids = []) => { await adminRequest(`/rest/v1/resource_categories?resource_id=eq.${encodeURIComponent(resourceId)}`, { method: 'DELETE' }); if (ids.length) await adminRequest('/rest/v1/resource_categories', { method: 'POST', body: [...new Set(ids)].map(category_id => ({ resource_id: resourceId, category_id })) }); };
// Server-side geographic pre-filter for the map finder: resources whose
// coordinates fall inside `bbox`, OR resources with no coordinates at all
// (phone/online-only resources the finder still lists under "remote access").
// This is what actually bounds how much data a single search downloads as the
// resource count grows — batching alone still eventually loads every matching
// row, just spread across more requests. A north-of-the-equator, east/west of
// antimeridian bbox is assumed, which matches this project's entire coverage area.
const geoFilterQuery = bbox => bbox
  ? `&or=(and(latitude.gte.${bbox.south.toFixed(6)},latitude.lte.${bbox.north.toFixed(6)},longitude.gte.${bbox.west.toFixed(6)},longitude.lte.${bbox.east.toFixed(6)}),latitude.is.null)`
  : '';

export const supabaseRepository = {
  mode: 'supabase',
  async getPublishedResources(filters = {}, lang = 'es', { onProgress, initialBatchSize = 12, batchSize = 24, signal, bbox } = {}) {
    const mapRows = rows => rows.map(row => ({ ...row, additional_category_ids: row.resource_categories?.map(link => link.category_id) || [] }));
    const geoQuery = geoFilterQuery(bbox);
    if (!onProgress) {
      const rows = await supabaseRequest(`/rest/v1/resources?status=eq.published&select=${RESOURCE_LIST_COLUMNS}${geoQuery}`, { signal });
      return filterAndSortResources(mapRows(rows), filters, lang);
    }
    const resources = [];
    let offset = 0;
    let complete = false;
    let filtered = [];
    while (!complete) {
      const currentBatchSize = offset === 0 ? initialBatchSize : batchSize;
      const rows = await supabaseRequest(`/rest/v1/resources?status=eq.published&select=${RESOURCE_LIST_COLUMNS}${geoQuery}&order=updated_at.desc.nullslast&limit=${currentBatchSize}&offset=${offset}`, { signal });
      resources.push(...mapRows(rows));
      filtered = filterAndSortResources(resources, filters, lang);
      complete = rows.length < currentBatchSize;
      onProgress(filtered, { loaded: resources.length, complete });
      offset += rows.length;
    }
    return filtered;
  },
  async getResourceBySlug(slug) { const rows = await supabaseRequest(`/rest/v1/resources?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=${RESOURCE_DETAIL_COLUMNS}&limit=1`); return rows[0] ? { ...rows[0], additional_category_ids: rows[0].resource_categories?.map(link => link.category_id) || [] } : null; },
  async searchResources(term, lang = 'es') { return this.getPublishedResources({ q: term }, lang); },
  async filterResources(filters, lang = 'es') { return this.getPublishedResources(filters, lang); },
  async getResourceFinderData({ filters = {}, lang = 'es', ...options } = {}) { return this.getPublishedResources({ q: '', categories: [], languages: [], methods: [], costs: [], area: '', recent: false, sort: 'updated', page: 1, ...filters }, lang, options); },
  async getAdminResources() {
    const rows = await adminRequest('/rest/v1/resources?select=*,resource_categories(category_id)&order=updated_at.desc');
    return rows.map(row => ({ ...row, additional_category_ids: row.resource_categories?.map(link => link.category_id) || [] }));
  },
  async createResource(values) { const rows = await adminRequest('/rest/v1/resources', { method: 'POST', body: resourceRow(values) }); await syncAdditionalCategories(rows[0].id, values.additional_category_ids); return rows[0]; },
  async updateResource(id, values) { const rows = await adminRequest(`/rest/v1/resources?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: resourceRow(values) }); if (Object.prototype.hasOwnProperty.call(values, 'additional_category_ids')) await syncAdditionalCategories(id, values.additional_category_ids); return rows[0]; },
  async publishResource(id) { return this.updateResource(id, { status: 'published', published_at: new Date().toISOString(), archived_at: null }); },
  async archiveResource(id) { return this.updateResource(id, { status: 'archived', archived_at: new Date().toISOString() }); },
  async restoreResource(id) { return this.updateResource(id, { status: 'draft', archived_at: null }); },
  async deleteResourcePermanently(id) { return adminRequest('/rest/v1/rpc/delete_resource_permanently', { method: 'POST', body: { p_resource_id: id } }); },
  async getCategories({ admin = false } = {}) { return admin ? adminRequest('/rest/v1/categories?select=*&order=sort_order.asc') : supabaseRequest('/rest/v1/categories?is_active=eq.true&select=*&order=sort_order.asc'); },
  async createCategory(values) { const rows = await adminRequest('/rest/v1/categories', { method: 'POST', body: values }); return rows[0]; },
  async updateCategory(id, values) { const rows = await adminRequest(`/rest/v1/categories?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: values }); return rows[0]; }
};
