import React from 'react';
import { getCategoryById, resourceCategories } from './categories.js';
import { VERIFICATION_REVIEW_DAYS } from './resourceTypes.js';
import { SERVICE_AREA_ALL, SERVICE_AREA_UNDISCLOSED } from '../config/serviceAreas.js';
import { isResourceCounty, normalizeCounty } from '../config/resourceCounties.js';

// Short connector words in es/en: skipped so a search for "circle of hope" or
// "despensa de alimentos" doesn't light up every "of"/"de" in a card — those
// words still count toward the AND match in searchResource() below, they just
// aren't visually distinctive enough to highlight.
const HIGHLIGHT_STOPWORDS = new Set(['de', 'la', 'el', 'los', 'las', 'del', 'al', 'en', 'un', 'una', 'unos', 'unas', 'y', 'o', 'a', 'con', 'por', 'que', 'es', 'se', 'su', 'sus', 'the', 'and', 'of', 'in', 'on', 'for', 'to', 'a']);

// Wraps every occurrence of a query word (2+ letters, not a stopword) in <mark>.
// Word-level, not phrase-level, on purpose: searchResource() below matches each
// query word independently across several concatenated fields, so a query can
// satisfy the filter without its words ever appearing contiguously in one
// field — highlighting the literal query string would then often highlight
// nothing at all on a real match.
export function highlightMatches(text, query) {
  if (!text) return text;
  const words = [...new Set(String(query || '').toLocaleLowerCase().trim().split(/\s+/).filter(word => word.length >= 2 && !HIGHLIGHT_STOPWORDS.has(word)))];
  if (!words.length) return text;
  const pattern = new RegExp(`(${words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = String(text).split(pattern);
  if (parts.length === 1) return text;
  return parts.map((part, index) => index % 2 === 1
    ? React.createElement('mark', { className: 'search-highlight', key: index }, part)
    : part);
}

export const localized = (item, field, lang) => item[`${field}_${lang}`] || item[`${field}_${lang === 'es' ? 'en' : 'es'}`] || '';
export const categoryLabel = (resource, lang) => localized(getCategoryById(resource.primary_category_id) || {}, 'label', lang);
export const isRecentlyVerified = resource => resource.last_verified_at && (Date.now() - new Date(resource.last_verified_at).getTime()) <= VERIFICATION_REVIEW_DAYS * 86400000;
export const verificationState = resource => !resource.last_verified_at ? 'unverified' : isRecentlyVerified(resource) ? 'recent' : 'review';
export const createResourceSlug = (...parts) => parts.filter(Boolean).join(' ')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export function createUniqueResourceSlug(base, resources = [], currentId) {
  const safeBase = createResourceSlug(base) || 'recurso';
  const used = new Set(resources.filter(resource => resource.id !== currentId).map(resource => resource.slug));
  if (!used.has(safeBase)) return safeBase;
  let suffix = 2;
  while (used.has(`${safeBase}-${suffix}`)) suffix += 1;
  return `${safeBase}-${suffix}`;
}

export function searchResource(resource, term, lang) {
  if (!term) return true;
  const category = getCategoryById(resource.primary_category_id);
  const haystack = [resource.organization_name, localized(resource, 'title', lang), localized(resource, 'summary', lang), localized(resource, 'description', lang), localized(resource, 'service_area', lang), ...(resource[`keywords_${lang}`] || []), category?.label_es, category?.label_en].join(' ').toLocaleLowerCase();
  return term.toLocaleLowerCase().trim().split(/\s+/).every(word => haystack.includes(word));
}

export function filterAndSortResources(resources, filters, lang) {
  const categoryIds = (filters.categories || []).map(slug => resourceCategories.find(category => category.slug === slug)?.id).filter(Boolean);
  const filtered = resources.filter(resource => searchResource(resource, filters.q, lang))
    .filter(resource => !categoryIds.length || categoryIds.includes(resource.primary_category_id) || resource.additional_category_ids?.some(id => categoryIds.includes(id)))
    .filter(resource => !filters.languages?.length || filters.languages.some(value => resource.languages.includes(value)))
    .filter(resource => !filters.methods?.length || filters.methods.some(value => resource.service_methods.includes(value)))
    .filter(resource => !filters.costs?.length || filters.costs.includes(resource.cost_type))
    .filter(resource => !filters.area
      || filters.area === SERVICE_AREA_ALL
      || filters.area === SERVICE_AREA_UNDISCLOSED
      || (isResourceCounty(filters.area) && (
        normalizeCounty(resource.county) === normalizeCounty(filters.area)
        || normalizeCounty(localized(resource, 'service_area', lang)).includes(normalizeCounty(filters.area))
      ))
      || resource.postal_code === filters.area
      || localized(resource, 'service_area', lang).toLocaleLowerCase().includes(filters.area.toLocaleLowerCase())
      || resource.city?.toLocaleLowerCase().includes(filters.area.toLocaleLowerCase()))
    .filter(resource => !filters.recent || isRecentlyVerified(resource));
  return [...filtered].sort((a, b) => {
    if (filters.sort === 'az') return localized(a, 'title', lang).localeCompare(localized(b, 'title', lang));
    if (filters.sort === 'za') return localized(b, 'title', lang).localeCompare(localized(a, 'title', lang));
    if (filters.sort === 'updated') return new Date(b.updated_at) - new Date(a.updated_at);
    return Number(b.is_featured) - Number(a.is_featured) || localized(a, 'title', lang).localeCompare(localized(b, 'title', lang));
  });
}
