import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCategories, getResourceFinderData } from '../../data/repository';
import { getServiceArea } from '../../config/serviceAreas';
import { RESOURCE_FINDER_EXPANDED_RADIUS_MILES, RESOURCE_FINDER_INITIAL_RADIUS_MILES, RESOURCE_FINDER_REGIONAL_RADIUS_MILES } from '../../config/resourceFinder';
import { hasCoordinates, sortResourcesByDistance } from '../../utils/geo';
import { trackPuenteEvent } from '../../analytics/client';
import { shareLink, sharedListUrl } from '../../services/share';
import ResourceSearchForm from './ResourceSearchForm';
import ResourceResultsPanel from './ResourceResultsPanel';
import ResourceFinderFilters from './ResourceFinderFilters';
import ResourceMap from './ResourceMap';
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
const hasStreetAddress = resource => Boolean(resource.address_line_1?.trim());
const hasRemoteAccess = resource => resource.service_methods?.some(method => ['phone', 'online'].includes(method)) || resource.phone || resource.website_url;

const scrollCardInsideResults = (card, centerCard) => {
  const scrollArea = card?.closest('.finder-results');
  if (!scrollArea || scrollArea.scrollHeight <= scrollArea.clientHeight) return;
  const areaRect = scrollArea.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const cardTop = scrollArea.scrollTop + cardRect.top - areaRect.top;
  const cardBottom = cardTop + cardRect.height;
  const visibleTop = scrollArea.scrollTop;
  const visibleBottom = visibleTop + scrollArea.clientHeight;
  const hasRoomToCenter = centerCard && scrollArea.clientHeight >= cardRect.height + 32;
  let nextTop = visibleTop;
  if (hasRoomToCenter) nextTop = cardTop - (scrollArea.clientHeight - cardRect.height) / 2;
  else if (cardTop < visibleTop) nextTop = cardTop;
  else if (cardBottom > visibleBottom) nextTop = cardBottom - scrollArea.clientHeight;
  else return;
  scrollArea.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
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

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = event => setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  useEffect(() => { getCategories().then(setCategories).catch(() => setError(t.loadError)); }, [t.loadError]);
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

  const runSearch = useCallback(async (zip, nextFilters, nextRadius = RESOURCE_FINDER_INITIAL_RADIUS_MILES, updateUrl = true) => {
    const center = getServiceArea(zip);
    if (!center) { setZipError(t.invalidZip); return; }
    setZipError(''); setError(null); setLoading(true); setSearched(true); setSelectedResourceId(null); setActiveZip(zip); setZipCenter(center); setRadius(nextRadius); setViewportBounds(null);
    try {
      const found = await getResourceFinderData({ filters: nextFilters, lang });
      setResources(found);
      const mappable = sortResourcesByDistance(found, center).filter(resource => resource.distance_miles <= nextRadius);
      const withoutCoordinates = found.filter(resource => !hasCoordinates(resource));
      const unlocated = withoutCoordinates.filter(hasStreetAddress);
      const remote = withoutCoordinates.filter(resource => !hasStreetAddress(resource) && hasRemoteAccess(resource));
      const resultCount = mappable.length + unlocated.length + remote.length;
      const categorySlug = nextFilters.categories.length === 1 ? nextFilters.categories[0] : undefined;
      trackPuenteEvent('search_submitted', { search_result_count: resultCount, category_slug: categorySlug, area_code: zip });
      if (!resultCount) trackPuenteEvent('search_no_results', { search_result_count: 0, category_slug: categorySlug, area_code: zip });
      if (updateUrl) navigate(urlForSearch(zip, nextFilters), { replace: true, scroll: false });
    } catch { setError(t.loadError); } finally { setLoading(false); }
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
  const unlocatedResults = useMemo(() => resources.filter(resource => !hasCoordinates(resource) && hasStreetAddress(resource)), [resources]);
  const remoteResults = useMemo(() => resources.filter(resource => !hasCoordinates(resource) && !hasStreetAddress(resource) && hasRemoteAccess(resource)), [resources]);
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
    const resource = resources.find(item => item.id === id);
    const selectedCategory = categories.find(item => item.id === resource?.primary_category_id);
    if (resource) trackPuenteEvent('resource_selected', { resource_id: id, category_slug: selectedCategory?.slug, area_code: activeZip });
    const revealCard = () => {
      const card = cardRefs.current.get(id);
      if (!card) return;
      scrollCardInsideResults(card, centerCard);
    };
    if (centerCard && isMobile) {
      setMobileSheetSnap('half');
      window.setTimeout(revealCard, 300);
    } else window.requestAnimationFrame(revealCard);
  }, [activeZip, categories, isMobile, resources, selectedResourceId]);
  const hoverResource = useCallback(id => setHoveredResourceId(id), []);
  const toggleIncluded = useCallback(id => setIncludedResourceIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]), []);
  const toggleAllVisible = useCallback(ids => setIncludedResourceIds(current => ids.every(id => current.includes(id)) ? current.filter(id => !ids.includes(id)) : [...new Set([...current, ...ids])]), []);
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
  const searchVisibleArea = useCallback(bounds => { setViewportBounds(bounds); setSelectedResourceId(null); }, []);
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
  const map = <ResourceMap t={t} zip={activeZip} zipCenter={zipCenter} resources={results} categories={categories} selectedId={selectedResourceId} hoveredId={hoveredResourceId} fitResults={!viewportBounds} bottomInset={mobileMapBottomInset} onSelect={selectResourceFromMap} onHover={hoverResource} onSearchArea={searchVisibleArea}/>;
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
