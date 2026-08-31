import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPublishedResources } from '../data/repository';
import { getCategoryBySlug } from '../data/categories';
import { emptyResourceFilters, parseResourceFilters, serializeResourceFilters } from '../services/resourceUrl';
import ResourceCard from './ResourceCard';
import { FilterDialog, FilterFields } from './ResourceFilters';
import { SearchIcon } from './Icons';
import { trackPuenteEvent } from '../analytics/client';
import { SERVICE_AREA_ALL, SERVICE_AREA_UNDISCLOSED } from '../config/serviceAreas';

export default function ResourcesPage({ lang, t, locationSearch, navigate, savedSlugs = [], onToggleSaved }) {
  const filters = useMemo(() => parseResourceFilters(locationSearch), [locationSearch]);
  const [query, setQuery] = useState(filters.q); const [resources, setResources] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const [filterOpen, setFilterOpen] = useState(false); const [draftFilters, setDraftFilters] = useState(filters);
  const [analyticsNonce, setAnalyticsNonce] = useState(0);
  const lastTrackedNonce = useRef(0);
  const requestSequence = useRef(0);
  const updateUrl = useCallback((next, { trackSearch = false } = {}) => {
    if (trackSearch) setAnalyticsNonce(value => value + 1);
    navigate(`/recursos?${serializeResourceFilters(next)}`, { replace: true, scroll: false, analyticsSearch: trackSearch });
  }, [navigate]);
  const load = useCallback(async signal => {
    const requestId = ++requestSequence.current;
    setResources([]); setLoading(true); setError(false);
    const shouldTrack = Boolean(window.history.state?.analyticsSearch) || analyticsNonce > lastTrackedNonce.current;
    if (analyticsNonce > lastTrackedNonce.current) lastTrackedNonce.current = analyticsNonce;
    if (shouldTrack) window.history.replaceState({ ...window.history.state, analyticsSearch: false }, '', window.location.href);
    try {
      const result = await getPublishedResources(filters, lang, { signal, onProgress: partial => { if (requestId === requestSequence.current && !signal?.aborted) setResources(partial); } });
      if (requestId !== requestSequence.current || signal?.aborted) return;
      setResources(result);
      if (shouldTrack) {
        const areaCode = /^\d{5}$/.test(filters.area) && ![SERVICE_AREA_ALL, SERVICE_AREA_UNDISCLOSED].includes(filters.area) ? filters.area : null;
        const properties = {
          search_term_normalized: filters.q,
          search_result_count: result.length,
          category_slug: filters.categories.length === 1 ? filters.categories[0] : undefined,
          area_code: areaCode
        };
        trackPuenteEvent('search_submitted', properties);
        if (result.length === 0) trackPuenteEvent('search_no_results', properties);
      }
    } catch (loadError) {
      if (loadError?.name !== 'AbortError' && requestId === requestSequence.current) setError(true);
    } finally {
      if (requestId === requestSequence.current && !signal?.aborted) setLoading(false);
    }
  }, [filters, lang, analyticsNonce]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  useEffect(() => { setQuery(filters.q); setDraftFilters(filters); }, [filters]);
  const shown = resources.slice(0, filters.page * 6);
  const remaining = resources.length - shown.length;
  const active = [...(filters.area ? [{ key: 'area', value: filters.area, label: filters.area }] : []), ...filters.categories.map(value => ({ key: 'categories', value, label: getCategoryBySlug(value)?.[`label_${lang}`] || value })), ...filters.languages.map(value => ({ key: 'languages', value, label: value === 'es' ? t.spanish : t.english })), ...filters.methods.map(value => ({ key: 'methods', value, label: t[value === 'phone' ? 'phoneMethod' : value] })), ...filters.costs.map(value => ({ key: 'costs', value, label: t[value] })), ...(filters.recent ? [{ key: 'recent', value: true, label: t.recent }] : [])];
  const remove = item => updateUrl({ ...filters, [item.key]: Array.isArray(filters[item.key]) ? filters[item.key].filter(value => value !== item.value) : item.key === 'recent' ? false : '', page: 1 });
  return <main className="resources-page"><div className="site-container resources-container">
    <header className="results-header"><h1>{t.resultsTitle}</h1><form className="results-search" onSubmit={event => { event.preventDefault(); updateUrl({ ...filters, q: query, sort: query ? 'relevance' : 'updated', page: 1 }, { trackSearch: true }); }}><div><SearchIcon/><input id="results-search" aria-label={t.searchLabel} value={query} onChange={event => setQuery(event.target.value)} placeholder={t.searchPlaceholder}/><button>{t.search}</button></div></form>
      <div className="results-toolbar"><p aria-live="polite">{loading ? t.resultsLoading(resources.length) : t.resultsFound(resources.length)}</p><button className={`secondary-button filter-button toolbar-control${active.length > 0 ? ' has-active-filters' : ''}`} onClick={() => { setDraftFilters(filters); setFilterOpen(true); }}><span className="material-symbols-rounded" aria-hidden="true">filter_list</span><span>{t.filter}</span>{active.length > 0 && <b className="filter-count" aria-label={`${active.length} ${t.activeFilters}`}>{active.length}</b>}</button><label className="sort-control toolbar-control"><span className="sr-only">{t.sortLabel}</span><span className="material-symbols-rounded sort-control-icon" aria-hidden="true">swap_vert</span><select aria-label={t.sortLabel} value={filters.sort} onChange={event => updateUrl({ ...filters, sort: event.target.value, page: 1 })}><option value="relevance">{t.relevance}</option><option value="updated">{t.updated}</option><option value="az">{t.az}</option><option value="za">{t.za}</option></select></label></div>
      {active.length > 0 && <div className="active-filters" aria-label={t.activeFilters}>{active.map(item => <button key={`${item.key}-${item.value}`} onClick={() => remove(item)} aria-label={`${t.removeFilter}: ${item.label}`}>{item.label}<span aria-hidden="true">×</span></button>)}<button className="clear-filters" onClick={() => updateUrl({ ...emptyResourceFilters })}>{t.clear}</button></div>}
    </header>
    <div className="results-layout"><aside className="desktop-filters"><div className="filter-heading"><h2>{t.filters}</h2></div><FilterFields filters={filters} onChange={next => updateUrl(next, { trackSearch: true })} lang={lang} t={t}/></aside>
      <section className="results-list" aria-busy={loading}>{loading && resources.length === 0 ? <div className="loading-state resource-loading-state" role="status" aria-live="polite"><span className="admin-button-spinner resource-loading-spinner" aria-hidden="true"/><strong>{t.loading}</strong><span>{t.loadingHelp}</span></div> : error ? <div className="public-state"><h2>{t.loadError}</h2><button className="primary-button" onClick={() => load()}>{t.retry}</button></div> : resources.length === 0 ? <div className="public-state"><h2>{t.noResults}</h2><p>{t.noResultsHelp}</p><button className="secondary-button" onClick={() => updateUrl({ ...emptyResourceFilters })}>{t.clear}</button></div> : <>{shown.map(resource => <ResourceCard key={resource.id} resource={resource} lang={lang} t={t} saved={savedSlugs.includes(resource.slug)} onSave={onToggleSaved}/>)}{loading && <div className="resource-progressive-loading" role="status" aria-live="polite"><span className="admin-button-spinner resource-loading-spinner" aria-hidden="true"/><span>{t.loadingMore}</span></div>}{!loading && remaining > 0 && <button className="secondary-button secondary-cta show-more" onClick={() => updateUrl({ ...filters, page: filters.page + 1 })}>{t.loadMore(remaining)}</button>}</>}</section>
    </div>
  </div><FilterDialog open={filterOpen} onClose={() => setFilterOpen(false)} filters={draftFilters} setFilters={setDraftFilters} onApply={() => { updateUrl(draftFilters, { trackSearch: true }); setFilterOpen(false); }} onClear={() => setDraftFilters({ ...emptyResourceFilters })} lang={lang} t={t}/></main>;
}
