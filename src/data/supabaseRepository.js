import { supabaseRequest } from './supabaseClient';
import { filterAndSortResources } from './resourceUtils';
import { getAdminSession } from '../services/adminAuth';

const sessionToken = () => getAdminSession()?.access_token;
const adminHeaders = () => ({ token: sessionToken(), headers: { Prefer: 'return=representation' } });
// Keep public reads compatible before migration 009 is applied. The finder only
// needs the existing latitude/longitude columns; geocoding workflow fields are
// administrative metadata and do not belong in public queries.
const PUBLIC_RESOURCE_COLUMNS = 'id,slug,status,organization_name,title_es,title_en,summary_es,summary_en,description_es,description_en,primary_category_id,keywords_es,keywords_en,languages,service_methods,cost_type,eligibility_es,eligibility_en,required_documents_es,required_documents_en,application_steps_es,application_steps_en,hours_es,hours_en,accessibility_notes_es,accessibility_notes_en,service_area_es,service_area_en,phone,sms_phone,whatsapp_phone,email,website_url,address_line_1,address_line_2,city,state,postal_code,county,latitude,longitude,source_url,logo_url,is_featured,is_emergency,last_verified_at,published_at,created_at,updated_at,resource_categories(category_id)';
const resourceRow = values => {
  const row = { ...values };
  delete row.additional_category_ids;
  delete row.resource_categories;
  if (row.latitude === '') row.latitude = null;
  if (row.longitude === '') row.longitude = null;
  return row;
};
const syncAdditionalCategories = async (resourceId, ids = []) => { await supabaseRequest(`/rest/v1/resource_categories?resource_id=eq.${encodeURIComponent(resourceId)}`, { method: 'DELETE', ...adminHeaders() }); if (ids.length) await supabaseRequest('/rest/v1/resource_categories', { method: 'POST', body: [...new Set(ids)].map(category_id => ({ resource_id: resourceId, category_id })), ...adminHeaders() }); };

export const supabaseRepository = {
  mode: 'supabase',
  async getPublishedResources(filters = {}, lang = 'es') { const rows = await supabaseRequest(`/rest/v1/resources?status=eq.published&select=${PUBLIC_RESOURCE_COLUMNS}`); return filterAndSortResources(rows.map(row => ({ ...row, additional_category_ids: row.resource_categories?.map(link => link.category_id) || [] })), filters, lang); },
  async getResourceBySlug(slug) { const rows = await supabaseRequest(`/rest/v1/resources?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=${PUBLIC_RESOURCE_COLUMNS}&limit=1`); return rows[0] ? { ...rows[0], additional_category_ids: rows[0].resource_categories?.map(link => link.category_id) || [] } : null; },
  async searchResources(term, lang = 'es') { return this.getPublishedResources({ q: term }, lang); },
  async filterResources(filters, lang = 'es') { return this.getPublishedResources(filters, lang); },
  async getResourceFinderData({ filters = {}, lang = 'es' } = {}) { return this.getPublishedResources({ q: '', categories: [], languages: [], methods: [], costs: [], area: '', recent: false, sort: 'updated', page: 1, ...filters }, lang); },
  async getAdminResources() {
    const rows = await supabaseRequest('/rest/v1/resources?select=*,resource_categories(category_id)&order=updated_at.desc', adminHeaders());
    return rows.map(row => ({ ...row, additional_category_ids: row.resource_categories?.map(link => link.category_id) || [] }));
  },
  async createResource(values) { const rows = await supabaseRequest('/rest/v1/resources', { method: 'POST', body: resourceRow(values), ...adminHeaders() }); await syncAdditionalCategories(rows[0].id, values.additional_category_ids); return rows[0]; },
  async updateResource(id, values) { const rows = await supabaseRequest(`/rest/v1/resources?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: resourceRow(values), ...adminHeaders() }); if (Object.prototype.hasOwnProperty.call(values, 'additional_category_ids')) await syncAdditionalCategories(id, values.additional_category_ids); return rows[0]; },
  async publishResource(id) { return this.updateResource(id, { status: 'published', published_at: new Date().toISOString(), archived_at: null }); },
  async archiveResource(id) { return this.updateResource(id, { status: 'archived', archived_at: new Date().toISOString() }); },
  async restoreResource(id) { return this.updateResource(id, { status: 'draft', archived_at: null }); },
  async deleteResourcePermanently(id) { return supabaseRequest('/rest/v1/rpc/delete_resource_permanently', { method: 'POST', body: { p_resource_id: id }, ...adminHeaders() }); },
  async getCategories({ admin = false } = {}) { return supabaseRequest(`/rest/v1/categories?${admin ? '' : 'is_active=eq.true&'}select=*&order=sort_order.asc`, admin ? adminHeaders() : {}); },
  async createCategory(values) { const rows = await supabaseRequest('/rest/v1/categories', { method: 'POST', body: values, ...adminHeaders() }); return rows[0]; },
  async updateCategory(id, values) { const rows = await supabaseRequest(`/rest/v1/categories?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: values, ...adminHeaders() }); return rows[0]; }
};
