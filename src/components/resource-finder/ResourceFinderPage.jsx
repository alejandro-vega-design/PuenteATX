import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCategories, getResourceFinderData } from '../../data/repository';
import { getServiceArea } from '../../config/serviceAreas';
import { RESOURCE_FINDER_EXPANDED_RADIUS_MILES, RESOURCE_FINDER_INITIAL_RADIUS_MILES, RESOURCE_FINDER_REGIONAL_RADIUS_MILES } from '../../config/resourceFinder';
import { boundingBoxFromCenter, hasCoordinates, sortResourcesByDistance } from '../../utils/geo';
import { toggleVisibleSelection } from '../../utils/resourceSelection';
import { trackPuenteEvent } from '../../analytics/client';
import { shareLink, sharedListUrl } from '../../services/share';
import ResourceSearchForm from './ResourceSearchForm';
import ResourceResultsPanel from './ResourceResultsPanel';
import ResourceFinderFilters from './ResourceFinderFilters';
// MapLibre GL (~200KB gzip) is the vast majority of what this page weighs, but the
// search form and results list don't need it — split it into its own chunk so
// those can render as soon as they're ready instead of waiting on the map's JS to
// finish downloading and parsing too. This only reorders when things arrive; the
// map still loads automatically and shows in the same place (see the Suspense
// fallback below, which reuses ResourceMap's own "loading map" look so the
// hand-off between the two is seamless).
const ResourceMap = lazy(() => import('./ResourceMap'));
const mapLoadingFallback = t => <div className="finder-map-status"><span className="loading-inline"><span className="admin-button-spinner" aria-hidden="true"/><span>{t.mapLoading}</span></span></div>;
import FinderPrintSheet from './FinderPrintSheet';
import StatusToast from '../StatusToast';

const list = value => value ? value.split(',').filter(Boolean) : [];
const emptyFinderFilters = { categories: [], languages: [], methods: [], costs: [], recent: false };
const filtersFromParams = params => ({
  categories: list(params.get('categoria')),
  languages: list(params.get('idioma')),
  methods: list(params.get('metodo')),
  costs: list(params.get('costo')),
  recent: params.get('reciente') === '1'
});
const filterCount = filters => filters.categories.length + filters.languages.length + filters.methods.length + filters.costs.length + (filters.recent ? 1 : 0);
const hasRemoteAccess = resource => resource.service_methods?.some(method => ['phone', 'online'].includes(method)) || resource.phone || resource.website_url;

const scrollCardInsideResults = (card, centerCard) => {
  const scrollArea = card?.closest('.finder-results');
  if (!scrollArea || scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  // The results count header is sticky (position: sticky; top: 0) and covers the
  // top of the scroll area while scrolled, so it must be excluded from both the
  // "is this card already visible" check and the available height used to center.
  const stickyHeight = scrollArea.querySelector('.finder-results-summary')?.getBoundingClientRect().height || 0;
  const areaRect = scrollArea.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const cardTop = scrollArea.scrollTop + cardRect.top - areaRect.top;
  const cardBottom = cardTop + cardRect.height;
  const visibleTop = scrollArea.scrollTop + stickyHeight;
  const visibleBottom = scrollArea.scrollTop + scrollArea.clientHeight;
  const availableHeight = scrollArea.clientHeight - stickyHeight;
  const hasRoomToCenter = centerCard && availableHeight >= cardRect.height + 32;
  let nextTop = scrollArea.scrollTop;
  if (hasRoomToCenter) nextTop = cardTop - stickyHeight - (availableHeight - cardRect.height) / 2;
  else if (cardTop < visibleTop) nextTop = cardTop - stickyHeight;
  else if (cardBottom > visibleBottom) nextTop = cardBottom - scrollArea.clientHeight;
  else return;
  scrollArea.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
};

// On mobile, centering a card also expands the bottom sheet, which animates its
// height via CSS transition (.28s, see .finder-results in styles.css). Centering
// math needs the sheet's FINAL height, so guessing a fixed delay before measuring
// is the same class of bug already fixed on desktop (content-visibility/scroll
// anchoring): it can run short under jank and land off-center. Instead, poll
// clientHeight across frames until it stops changing, then reveal — same "measure
// real state, don't guess timing" fix, applied to the sheet-resize case.
const waitForStableHeight = (el, done, framesLeft = 24) => {
  const before = el.clientHeight;
  window.requestAnimationFrame(() => {
    if (before === el.clientHeight || framesLeft <= 0) done();
    else waitForStableHeight(el, done, framesLeft - 1);
  });
};

const scheduleReveal = (getCard, centerCard, isMobile) => {
  const revealNow = () => {
    const card = getCard();
    if (card) scrollCardInsideResults(card, centerCard);
  };
  if (!isMobile) { window.requestAnimationFrame(revealNow); return; }
  // Wait a frame so the sheet's snap class (set just before calling this) has
  // committed to the DOM, then wait for its resize transition to settle.
  window.requestAnimationFrame(() => {
    const sheet = getCard()?.closest('.finder-results');
    if (!sheet) { revealNow(); return; }
    waitForStableHeight(sheet, revealNow);
  });
};

export default function ResourceFinderPage({ lang, t, filterT, locationSearch, navigate }) {
  const params = useMemo(() => new URLSearchParams(locationSearch), [locationSearch]);
  const initialZip = params.get('zip') || '';
  const initialFilters = useMemo(() => filtersFromParams(params), [params]);
  const [form, setForm] = useState({ zip: initialZip });
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [panelView, setPanelView] = useState('results');
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [activeZip, setActiveZip] = useState(initialZip);
  const [zipCenter, setZipCenter] = useState(() => getServiceArea(initialZip));
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [hoveredResourceId, setHoveredResourceId] = useState(null);
  const [includedResourceIds, setIncludedResourceIds] = useState([]);
  const [statusToast, setStatusToast] = useState(null);
  const [radius, setRadius] = useState(RESOURCE_FINDER_INITIAL_RADIUS_MILES);
  const [viewportBounds, setViewportBounds] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zipError, setZipError] = useState('');
  const [searched, setSearched] = useState(Boolean(initialZip));
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const [mobileSheetSnap, setMobileSheetSnap] = useState('peek');
  const [mobileSheetHeight, setMobileSheetHeight] = useState(null);
  const [mobileSheetDragging, setMobileSheetDragging] = useState(false);
  const [filterDrawerMounted, setFilterDrawerMounted] = useState(false);
  const [filterDrawerActive, setFilterDrawerActive] = useState(false);
  const cardRefs = useRef(new Map());
  const sheetDragRef = useRef(null);
  const requestSequence = useRef(0);
  const abortRef = useRef(null);
  const centerOnRevealRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = event => setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  useEffect(() => { getCategories().then(setCategories).catch(() => setError(t.loadError)); }, [t.loadError]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (!isMobile) { setFilterDrawerMounted(false); setFilterDrawerActive(false); return undefined; }
    if (panelView === 'filters') {
      setFilterDrawerMounted(true);
      const frame = window.requestAnimationFrame(() => setFilterDrawerActive(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setFilterDrawerActive(false);
    const timer = window.setTimeout(() => setFilterDrawerMounted(false), 260);
    return () => window.clearTimeout(timer);
  }, [isMobile, panelView]);
  useEffect(() => {
    if (!isMobile || panelView !== 'filters') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isMobile, panelView]);

  const urlForSearch = useCallback((zip, nextFilters) => {
    const next = new URLSearchParams();
    if (zip) next.set('zip', zip);
    if (nextFilters.categories.length) next.set('categoria', nextFilters.categories.join(','));
    if (nextFilters.languages.length) next.set('idioma', nextFilters.languages.join(','));
    if (nextFilters.methods.length) next.set('metodo', nextFilters.methods.join(','));
    if (nextFilters.costs.length) next.set('costo', nextFilters.costs.join(','));
    if (nextFilters.recent) next.set('reciente', '1');
    const query = next.toString();
    return `/buscador${query ? `?${query}` : ''}`;
  }, []);

  // Resources stream in progressively (see getPublishedResources' onProgress
  // batching) instead of blocking on one request for every published resource:
  // the map and result cards start rendering after the first small batch, and
  // a geographic bounding box (computed from the zip + search radius) is sent
  // to the server so a search only ever downloads resources that could plausibly
  // be in range — the set fetched stays bounded by the search area, not by how
  // many resources exist across the whole database, however large that grows.
  const runSearch = useCallback(async (zip, nextFilters, nextRadius = RESOURCE_FINDER_INITIAL_RADIUS_MILES, updateUrl = true) => {
    const center = getServiceArea(zip);
    if (!center) { setZipError(t.invalidZip); return; }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestSequence.current;
    const isCurrent = () => requestId === requestSequence.current && !controller.signal.aborted;
    setZipError(''); setError(null); setLoading(true); setSearched(true); setSelectedResourceId(null); setActiveZip(zip); setZipCenter(center); setRadius(nextRadius); setViewportBounds(null); setResources([]);
    const bbox = boundingBoxFromCenter(center, nextRadius);
    try {
      const found = await getResourceFinderData({
        filters: nextFilters, lang, bbox, signal: controller.signal,
        onProgress: partial => { if (isCurrent()) setResources(partial); }
      });
      if (!isCurrent()) return;
      setResources(found);
      const mappable = sortResourcesByDistance(found, center).filter(resource => resource.distance_miles <= nextRadius);
      const withoutCoordinates = found.filter(resource => !hasCoordinates(resource));
      const remote = withoutCoordinates.filter(hasRemoteAccess);
      const unlocated = withoutCoordinates.filter(resource => !hasRemoteAccess(resource));
      const resultCount = mappable.length + unlocated.length + remote.length;
      const categorySlug = nextFilters.categories.length === 1 ? nextFilters.categories[0] : undefined;
      trackPuenteEvent('search_submitted', { search_result_count: resultCount, category_slug: categorySlug, area_code: zip });
      if (!resultCount) trackPuenteEvent('search_no_results', { search_result_count: 0, category_slug: categorySlug, area_code: zip });
      if (updateUrl) navigate(urlForSearch(zip, nextFilters), { replace: true, scroll: false });
    } catch (loadError) {
      if (loadError?.name !== 'AbortError' && isCurrent()) setError(t.loadError);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [lang, navigate, t.invalidZip, t.loadError, urlForSearch]);

  useEffect(() => { if (initialZip) runSearch(initialZip, initialFilters, RESOURCE_FINDER_INITIAL_RADIUS_MILES, false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const updateSearchForm = useCallback(nextForm => {
    setForm(nextForm);
    if (nextForm.zip) return;
    setActiveZip(''); setZipCenter(null); setResources([]); setSearched(false); setLoading(false); setError(null); setZipError(''); setSelectedResourceId(null); setHoveredResourceId(null); setIncludedResourceIds([]); setViewportBounds(null); setRadius(RESOURCE_FINDER_INITIAL_RADIUS_MILES);
    navigate(urlForSearch('', filters), { replace: true, scroll: false });
  }, [filters, navigate, urlForSearch]);
  const sorted = useMemo(() => zipCenter ? sortResourcesByDistance(resources, zipCenter) : [], [resources, zipCenter]);
  const results = useMemo(() => viewportBounds
    ? sorted.filter(resource => {
      const longitude = Number(resource.longitude); const latitude = Number(resource.latitude);
      return longitude >= viewportBounds.west && longitude <= viewportBounds.east && latitude >= viewportBounds.south && latitude <= viewportBounds.north;
    })
    : sorted.filter(resource => resource.distance_miles <= radius), [sorted, radius, viewportBounds]);
  const remoteResults = useMemo(() => resources.filter(resource => !hasCoordinates(resource) && hasRemoteAccess(resource)), [resources]);
  const unlocatedResults = useMemo(() => resources.filter(resource => !hasCoordinates(resource) && !hasRemoteAccess(resource)), [resources]);
  const excludedCount = resources.length - sorted.length - unlocatedResults.length - remoteResults.length;
  const includedResources = useMemo(() => includedResourceIds.map(id => resources.find(resource => resource.id === id)).filter(Boolean), [includedResourceIds, resources]);
  const active = useMemo(() => [
    ...filters.categories.map(value => ({ key: 'categories', value, label: categories.find(category => category.slug === value)?.[`label_${lang}`] || value })),
    ...filters.languages.map(value => ({ key: 'languages', value, label: value === 'es' ? filterT.spanish : filterT.english })),
    ...filters.methods.map(value => ({ key: 'methods', value, label: filterT[value === 'phone' ? 'phoneMethod' : value] })),
    ...filters.costs.map(value => ({ key: 'costs', value, label: filterT[value] })),
    ...(filters.recent ? [{ key: 'recent', value: true, label: filterT.recent }] : [])
  ], [categories, filterT, filters, lang]);
  const categoryLabel = filters.categories.length === 1 ? active.find(item => item.key === 'categories')?.label || '' : '';

  const selectResource = useCallback((id, centerCard = false) => {
    if (selectedResourceId === id) {
      setSelectedResourceId(null);
      return;
    }
    setSelectedResourceId(id);
    centerOnRevealRef.current = centerCard;
    const resource = resources.find(item => item.id === id);
    const selectedCategory = categories.find(item => item.id === resource?.primary_category_id);
    if (resource) trackPuenteEvent('resource_selected', { resource_id: id, category_slug: selectedCategory?.slug, area_code: activeZip });
    if (centerCard && isMobile) setMobileSheetSnap('half');
    scheduleReveal(() => cardRefs.current.get(id), centerCard, isMobile);
  }, [activeZip, categories, isMobile, resources, selectedResourceId]);
  // Results keep streaming in after a marker is clicked (progressive batching),
  // and a closer resource arriving in a later batch can re-sort the list after
  // the initial scroll already ran — leaving the just-selected card wherever it
  // landed instead of centered. Re-run the same centering whenever the sorted
  // list changes while that selection is still the one asking to be centered.
  useEffect(() => {
    if (!selectedResourceId || !centerOnRevealRef.current) return;
    if (!cardRefs.current.get(selectedResourceId)) return;
    scheduleReveal(() => cardRefs.current.get(selectedResourceId), true, isMobile);
  }, [results, selectedResourceId, isMobile]);
  const hoverResource = useCallback(id => setHoveredResourceId(id), []);
  const toggleIncluded = useCallback(id => setIncludedResourceIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]), []);
  const toggleAllVisible = useCallback(ids => setIncludedResourceIds(current => toggleVisibleSelection(current, ids)), []);
  const showStatus = useCallback(message => setStatusToast({ id: Date.now(), message }), []);
  const shareSelected = useCallback(async () => {
    const url = sharedListUrl(includedResources.map(resource => resource.slug));
    trackPuenteEvent('list_shared');
    const result = await shareLink({ title: t.shareTitle(activeZip), text: t.shareText(includedResources.length), url });
    if (result === 'copied') showStatus(t.copied);
    if (result === 'failed') showStatus(t.shareError);
  }, [activeZip, includedResources, showStatus, t]);
  const printSelected = useCallback(pdf => {
    trackPuenteEvent('list_printed');
    if (pdf) showStatus(t.pdfHint);
    document.body.classList.add('printing-finder-list');
    const cleanup = () => document.body.classList.remove('printing-finder-list');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => { window.print(); window.setTimeout(cleanup, 1000); }, pdf ? 250 : 0);
  }, [showStatus, t.pdfHint]);
  const submit = event => { event.preventDefault(); runSearch(form.zip, filters); };
  const expand = useCallback(() => runSearch(form.zip, filters, radius === RESOURCE_FINDER_INITIAL_RADIUS_MILES ? RESOURCE_FINDER_EXPANDED_RADIUS_MILES : RESOURCE_FINDER_REGIONAL_RADIUS_MILES), [filters, form.zip, radius, runSearch]);
  const applyFilters = () => { setFilters(draftFilters); setPanelView('results'); runSearch(form.zip, draftFilters); };
  const removeFilter = item => {
    const next = { ...filters, [item.key]: Array.isArray(filters[item.key]) ? filters[item.key].filter(value => value !== item.value) : false };
    setFilters(next); setDraftFilters(next); runSearch(form.zip, next);
  };
  const clearCategory = useCallback(() => {
    const next = { ...filters, categories: [] };
    setFilters(next); setDraftFilters(next); runSearch(form.zip, next);
  }, [filters, form.zip, runSearch]);
  const clearFilters = () => {
    const next = { categories: [], languages: [], methods: [], costs: [], recent: false };
    setFilters(next); setDraftFilters(next); runSearch(form.zip, next);
  };
  // "Search this area" can pan well outside the zip-derived bounding box that
  // the original search fetched, so it re-queries the server with the panned
  // viewport as the new bbox rather than only re-filtering whatever the initial
  // search already happened to have in memory.
  const searchVisibleArea = useCallback(async bounds => {
    setViewportBounds(bounds); setSelectedResourceId(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestSequence.current;
    const isCurrent = () => requestId === requestSequence.current && !controller.signal.aborted;
    setLoading(true); setError(null);
    try {
      const found = await getResourceFinderData({
        filters, lang, bbox: bounds, signal: controller.signal,
        onProgress: partial => { if (isCurrent()) setResources(partial); }
      });
      if (isCurrent()) setResources(found);
    } catch (loadError) {
      if (loadError?.name !== 'AbortError' && isCurrent()) setError(t.loadError);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [filters, lang, t.loadError]);
  const startSheetDrag = event => {
    if (!isMobile) return;
    const sheet = event.currentTarget.closest('.finder-results');
    if (!sheet) return;
    sheetDragRef.current = { pointerId: event.pointerId, startY: event.clientY, startHeight: sheet.getBoundingClientRect().height, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setMobileSheetDragging(true);
  };
  const moveSheetDrag = event => {
    const drag = sheetDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = drag.startY - event.clientY;
    if (Math.abs(delta) > 4) drag.moved = true;
    const minHeight = 150;
    const maxHeight = Math.min(window.innerHeight * .72, window.innerHeight - 148);
    setMobileSheetHeight(Math.max(minHeight, Math.min(maxHeight, drag.startHeight + delta)));
  };
  const endSheetDrag = event => {
    const drag = sheetDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const minHeight = 150;
    const midHeight = Math.min(window.innerHeight * .5, window.innerHeight - 190);
    const maxHeight = Math.min(window.innerHeight * .72, window.innerHeight - 148);
    const currentHeight = mobileSheetHeight ?? drag.startHeight;
    const closestSnap = [
      { name: 'peek', height: minHeight },
      { name: 'half', height: midHeight },
      { name: 'expanded', height: maxHeight }
    ].reduce((closest, candidate) => Math.abs(candidate.height - currentHeight) < Math.abs(closest.height - currentHeight) ? candidate : closest);
    setMobileSheetSnap(closestSnap.name);
    setMobileSheetHeight(null);
    setMobileSheetDragging(false);
    window.setTimeout(() => { sheetDragRef.current = null; }, 0);
  };
  const toggleMobileSheet = () => {
    if (sheetDragRef.current?.moved) return;
    setMobileSheetSnap(current => current === 'peek' ? 'half' : current === 'half' ? 'expanded' : 'peek');
  };
  const mobileMapBottomInset = (() => {
    if (!isMobile) return 0;
    if (mobileSheetSnap === 'half') return Math.min(window.innerHeight * .5, window.innerHeight - 190);
    if (mobileSheetSnap === 'expanded') return Math.min(window.innerHeight * .72, window.innerHeight - 148);
    return 150;
  })();
  const selectResourceFromMap = useCallback(id => selectResource(id, true), [selectResource]);
  const requestHelp = useCallback(() => navigate('/conversacion'), [navigate]);
  const printIncluded = useCallback(() => printSelected(false), [printSelected]);
  const saveIncludedPdf = useCallback(() => printSelected(true), [printSelected]);
  const openMobileActions = useCallback(() => { if (isMobile) setMobileSheetSnap('expanded'); }, [isMobile]);
  const map = <Suspense fallback={mapLoadingFallback(t)}><ResourceMap t={t} zip={activeZip} zipCenter={zipCenter} resources={results} categories={categories} selectedId={selectedResourceId} hoveredId={hoveredResourceId} fitResults={!viewportBounds} bottomInset={mobileMapBottomInset} loading={loading} onSelect={selectResourceFromMap} onHover={hoverResource} onSearchArea={searchVisibleArea}/></Suspense>;
  const resultsPanel = <div className="finder-panel-results">
    {isMobile && <div className="finder-mobile-map">{map}</div>}
    <div className={`finder-results is-sheet-${mobileSheetSnap}${mobileSheetDragging ? ' is-sheet-dragging' : ''}`} style={mobileSheetHeight ? { '--finder-sheet-height': `${mobileSheetHeight}px` } : undefined}>
      <button className="finder-sheet-handle" type="button" aria-label={mobileSheetSnap === 'expanded' ? (lang === 'es' ? 'Contraer resultados' : 'Collapse results') : (lang === 'es' ? 'Expandir resultados' : 'Expand results')} aria-expanded={mobileSheetSnap !== 'peek'} onClick={toggleMobileSheet} onPointerDown={startSheetDrag} onPointerMove={moveSheetDrag} onPointerUp={endSheetDrag} onPointerCancel={endSheetDrag}><span aria-hidden="true"/></button>
      {error ? <div className="finder-empty"><p>{error}</p><button className="secondary-button" onClick={() => runSearch(form.zip, filters, radius)}>{t.retry}</button></div> : <ResourceResultsPanel t={t} lang={lang} results={results} unlocatedResults={unlocatedResults} remoteResults={remoteResults} categories={categories} selectedId={selectedResourceId} hoveredId={hoveredResourceId} includedIds={includedResourceIds} loading={loading} searched={searched} zip={activeZip} categoryLabel={categoryLabel} excludedCount={excludedCount} radius={radius} onSelect={selectResource} onHover={hoverResource} onToggleIncluded={toggleIncluded} onToggleAll={toggleAllVisible} onExpand={expand} onClearCategory={clearCategory} onRequestHelp={requestHelp} onShare={shareSelected} onPrint={printIncluded} onSavePdf={saveIncludedPdf} onOpenActions={openMobileActions} cardRefs={cardRefs}/>}
    </div>
  </div>;

  return <main className="resource-finder-page">
    {!isMobile && <div className="finder-desktop-map">{map}</div>}
    <section className="finder-sidebar" aria-labelledby="finder-title">
      <header className="finder-header">
        <h1 id="finder-title">{t.title}</h1>
        <ResourceSearchForm t={t} values={form} error={zipError} loading={loading} activeFilterCount={filterCount(filters)} onChange={updateSearchForm} onSubmit={submit} onOpenFilters={() => { setDraftFilters(filters); setPanelView('filters'); }}/>
        {active.length > 0 && <div className="finder-active-filters" aria-label={t.activeFilters}>{active.map(item => <button key={`${item.key}-${item.value}`} type="button" onClick={() => removeFilter(item)} aria-label={`${t.removeFilter}: ${item.label}`}>{item.label}<span aria-hidden="true">×</span></button>)}<button className="finder-clear-filters" type="button" onClick={clearFilters}>{t.clearFilters}</button></div>}
      </header>
      {isMobile ? resultsPanel : panelView === 'filters' ? <ResourceFinderFilters filters={draftFilters} setFilters={setDraftFilters} categories={categories} lang={lang} t={filterT} onApply={applyFilters} onClear={() => setDraftFilters(emptyFinderFilters)} onBack={() => setPanelView('results')}/> : resultsPanel}
    </section>
    {isMobile && filterDrawerMounted && <div className={`finder-filter-drawer-overlay${filterDrawerActive ? ' is-open' : ''}`} role="presentation" onPointerDown={event => { if (event.target === event.currentTarget) setPanelView('results'); }}>
      <div className="finder-filter-drawer" role="dialog" aria-modal="true" aria-labelledby="finder-filter-title">
        <ResourceFinderFilters drawer filters={draftFilters} setFilters={setDraftFilters} categories={categories} lang={lang} t={filterT} onApply={applyFilters} onClear={() => setDraftFilters(emptyFinderFilters)} onBack={() => setPanelView('results')}/>
      </div>
    </div>}
    <FinderPrintSheet resources={includedResources} categories={categories} zip={activeZip} lang={lang} t={t}/>
    <StatusToast toast={statusToast} onClose={() => setStatusToast(null)} closeLabel={filterT.closeNotification}/>
  </main>;
}
