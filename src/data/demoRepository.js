import { resourceCategories } from './categories';
import { demoResources } from './demoResources';
import { filterAndSortResources } from './resourceUtils';

let resources = demoResources.map(resource => ({ ...resource }));
let categories = resourceCategories.map(category => ({ ...category }));
const delay = value => new Promise(resolve => window.setTimeout(() => resolve(value), 180));

export const demoRepository = {
  mode: 'demo',
  async getPublishedResources(filters = {}, lang = 'es', { onProgress } = {}) { const result = await delay(filterAndSortResources(resources.filter(resource => resource.status === 'published'), filters, lang)); onProgress?.(result, { loaded: result.length, complete: true }); return result; },
  async getResourceBySlug(slug) { return delay(resources.find(resource => resource.slug === slug && resource.status === 'published') || null); },
  async searchResources(term, lang = 'es') { return this.getPublishedResources({ q: term }, lang); },
  async filterResources(filters, lang = 'es') { return this.getPublishedResources(filters, lang); },
  async getResourceFinderData({ filters = {}, lang = 'es' } = {}) { return this.getPublishedResources({ q: '', categories: [], languages: [], methods: [], costs: [], area: '', recent: false, sort: 'updated', page: 1, ...filters }, lang); },
  async getAdminResources() { return delay([...resources]); },
  async createResource(values) { const resource = { ...values, id: crypto.randomUUID?.() || `demo-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; resources = [resource, ...resources]; return delay(resource); },
  async updateResource(id, values) { let updated; resources = resources.map(resource => resource.id === id ? (updated = { ...resource, ...values, updated_at: new Date().toISOString() }) : resource); return delay(updated); },
  async publishResource(id) { return this.updateResource(id, { status: 'published', published_at: new Date().toISOString(), archived_at: null }); },
  async archiveResource(id) { return this.updateResource(id, { status: 'archived', archived_at: new Date().toISOString() }); },
  async restoreResource(id) { return this.updateResource(id, { status: 'draft', archived_at: null }); },
  async deleteResourcePermanently(id) { const resource = resources.find(item => item.id === id); resources = resources.filter(item => item.id !== id); return delay(resource || null); },
  async getCategories({ admin = false } = {}) { return delay(categories.filter(category => admin || category.is_active).sort((a, b) => a.sort_order - b.sort_order)); },
  async createCategory(values) { const category = { ...values, id: `demo-cat-${Date.now()}` }; categories = [...categories, category]; return delay(category); },
  async updateCategory(id, values) { let updated; categories = categories.map(category => category.id === id ? (updated = { ...category, ...values }) : category); return delay(updated); }
};
