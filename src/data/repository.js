import { demoRepository } from './demoRepository';
import { hasSupabaseConfig, isDemoEnabled } from './supabaseClient';
import { supabaseRepository } from './supabaseRepository';

const unavailable = async () => { throw new Error('Supabase is not configured'); };
const unavailableRepository = {
  mode: 'unavailable',
  getPublishedResources: unavailable, getResourceBySlug: unavailable, searchResources: unavailable, filterResources: unavailable,
  getResourceFinderData: unavailable, getAdminResources: unavailable, createResource: unavailable, updateResource: unavailable, publishResource: unavailable,
  archiveResource: unavailable, restoreResource: unavailable, deleteResourcePermanently: unavailable, getCategories: unavailable, createCategory: unavailable, updateCategory: unavailable
};

export const resourceRepository = hasSupabaseConfig ? supabaseRepository : isDemoEnabled ? demoRepository : unavailableRepository;
export const isDemoMode = resourceRepository.mode === 'demo';

export const getPublishedResources = (...args) => resourceRepository.getPublishedResources(...args);
export const getResourceBySlug = (...args) => resourceRepository.getResourceBySlug(...args);
export const searchResources = (...args) => resourceRepository.searchResources(...args);
export const filterResources = (...args) => resourceRepository.filterResources(...args);
export const getResourceFinderData = (...args) => resourceRepository.getResourceFinderData(...args);
export const getAdminResources = (...args) => resourceRepository.getAdminResources(...args);
export const createResource = (...args) => resourceRepository.createResource(...args);
export const updateResource = (...args) => resourceRepository.updateResource(...args);
export const publishResource = (...args) => resourceRepository.publishResource(...args);
export const archiveResource = (...args) => resourceRepository.archiveResource(...args);
export const restoreResource = (...args) => resourceRepository.restoreResource(...args);
export const deleteResourcePermanently = (...args) => resourceRepository.deleteResourcePermanently(...args);
export const getCategories = (...args) => resourceRepository.getCategories(...args);
export const createCategory = (...args) => resourceRepository.createCategory(...args);
export const updateCategory = (...args) => resourceRepository.updateCategory(...args);
