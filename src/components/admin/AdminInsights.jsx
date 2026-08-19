import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getInsightsSnapshot } from '../../analytics/repository';
import { buildImportantChanges, metricDefinitions, metricTrend } from '../../analytics/metrics';
import { insightDateRange, parseInsightFilters, serializeInsightFilters } from '../../analytics/filters';
import { getCategoryById } from '../../data/categories';
import { insightsCopy } from '../../data/insightsCopy';
import InsightsMap from './InsightsMap';
import InsightsMethodology from './InsightsMethodology';
import ActivityTimeline from './ActivityTimeline';

const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
const percentage = (value, total) => total ? `${Math.round((value / total) * 100)}%` : '0%';
const sentenceCase = (value, lang) => {
  const text = String(value || '');
  return text ? `${text.charAt(0).toLocaleUpperCase(lang === 'es' ? 'es-US' : 'en-US')}${text.slice(1)}` : text;
};

function useCountUp(value, duration = 950, delay = 0) {
  const target = Number(value || 0);
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !Number.isFinite(target)) {
      setDisplayValue(target);
      return undefined;
    }
    let frame;
    const startedAt = performance.now() + delay;
    setDisplayValue(0);
    const update = now => {
      if (now < startedAt) {
        frame = requestAnimationFrame(update);
        return;
      }
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay]);
  return displayValue;
}

function AnimatedNumber({ value, lang, suffix = '', maximumFractionDigits = 0, delay = 0 }) {
  const animated = useCountUp(value, 950, delay);
  return <>{new Intl.NumberFormat(lang === 'es' ? 'es-US' : 'en-US', { maximumFractionDigits }).format(animated)}{suffix}</>;
}

function downloadInsightsCsv(snapshot, filters, t, lang) {
  const range = insightDateRange(filters.period);
  const lines = [
    ['Puente ATX Insights'],
    [lang === 'es' ? 'Generado' : 'Generated', new Date().toISOString()],
    [lang === 'es' ? 'Rango inicial' : 'Range start', range.start],
    [lang === 'es' ? 'Rango final' : 'Range end', range.end],
    [t.environment, t.environments[filters.environment]],
    [t.source, t.sources[filters.source]],
    [t.language, t.languages[filters.language]],
    [t.device, t.devices[filters.device]],
    [],
    [lang === 'es' ? 'Resumen' : 'Overview', lang === 'es' ? 'Valor' : 'Value'],
    [t.activeSessions, snapshot.overview.current.active_sessions],
    [t.searches, snapshot.overview.current.searches],
    [t.saves, snapshot.overview.current.resource_saves],
    [t.contacts, snapshot.overview.current.contact_actions],
    [t.noResultRate, `${snapshot.overview.no_result_rate}%`],
    [],
    [t.activityOverTime],
    [t.date, t.activeSessions, t.searches, t.saves, t.contacts, t.noResults],
    ...(snapshot.timeline?.points || []).map(item => [item.bucket_start, item.active_sessions, item.searches, item.resource_saves, item.contact_actions, item.no_results]),
    [],
    [t.categorySearches],
    [t.category, t.searches, t.percent],
    ...(snapshot.categories || []).map(item => [lang === 'es' ? item.label_es : item.label_en, item.current_count, percentage(item.current_count, snapshot.overview.current.searches)]),
    [],
    [t.needsByArea],
    [t.area, t.searches, t.percent],
    ...(snapshot.areas?.visible || []).map(item => [item.area_code, item.event_count, percentage(item.event_count, snapshot.areas.visible_total)]),
    [],
    [t.noResults],
    [lang === 'es' ? 'Término' : 'Term', t.occurrences, t.lastOccurrence],
    ...(snapshot.no_results?.terms || []).map(item => [item.search_term_normalized, item.occurrences, item.last_occurred_at]),
    [],
    [t.resourcePerformance],
    [t.resource, t.organization, t.views, t.saved, t.calls, t.whatsapp, t.websites, t.totalActions, t.actionRate],
    ...(snapshot.resources || []).map(item => [
      lang === 'es' ? item.title_es || item.title_en : item.title_en || item.title_es,
      item.organization_name, item.views, item.saves, item.calls, item.whatsapp, item.website,
      item.contact_actions, item.views ? `${Math.round(item.contact_actions / item.views * 100)}%` : '—'
    ]),
    [],
    [t.directoryQuality],
    [t.published, snapshot.quality?.published || 0],
    [t.drafts, snapshot.quality?.drafts || 0],
    [t.archived, snapshot.quality?.archived || 0],
    [t.unverified, snapshot.quality?.unverified || 0],
    [t.needsReview, snapshot.quality?.needs_review || 0],
    [t.incompleteTranslations, snapshot.quality?.incomplete_translation || 0],
    [t.missingSource, snapshot.quality?.missing_source || 0],
    [t.missingContact, snapshot.quality?.missing_contact || 0],
    [t.missingCategory, snapshot.quality?.missing_category || 0],
    [],
    [t.contactChannels, lang === 'es' ? 'Cantidad' : 'Count', t.percent],
    [t.calls, snapshot.contact_channels?.calls || 0, percentage(snapshot.contact_channels?.calls || 0, snapshot.contact_channels?.total || 0)],
    [t.whatsapp, snapshot.contact_channels?.whatsapp || 0, percentage(snapshot.contact_channels?.whatsapp || 0, snapshot.contact_channels?.total || 0)],
    [t.websites, snapshot.contact_channels?.websites || 0, percentage(snapshot.contact_channels?.websites || 0, snapshot.contact_channels?.total || 0)],
    [t.directions, snapshot.contact_channels?.directions || 0, percentage(snapshot.contact_channels?.directions || 0, snapshot.contact_channels?.total || 0)],
    [t.resourcePrints, snapshot.contact_channels?.resource_prints || 0, percentage(snapshot.contact_channels?.resource_prints || 0, snapshot.contact_channels?.total || 0)],
    [t.listShares, snapshot.contact_channels?.list_shares || 0, percentage(snapshot.contact_channels?.list_shares || 0, snapshot.contact_channels?.total || 0)],
    [t.conversations, snapshot.contact_channels?.conversations || 0, percentage(snapshot.contact_channels?.conversations || 0, snapshot.contact_channels?.total || 0)],
    [],
    [lang === 'es' ? 'Nota metodológica' : 'Methodology note', t.contactLimitation],
    [lang === 'es' ? 'Privacidad' : 'Privacy', t.methodologyPrivacy]
  ];
  const blob = new Blob([`\ufeff${lines.map(row => row.map(csvCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `puente-atx-insights-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function Panel({ title, source, updated, children, className = '' }) {
  return <section className={`insights-panel ${className}`.trim()}><header><h2>{title}</h2></header><div className="insights-panel-body">{children}</div><footer><span>{source}</span>{updated && <span>{updated}</span>}</footer></section>;
}

function KpiCard({ label, value, definition, trend, suffix = '', lang, delay = 0 }) {
  return <article className="insights-kpi"><p>{label}</p><strong><AnimatedNumber value={value} lang={lang} suffix={suffix} maximumFractionDigits={suffix ? 1 : 0} delay={delay}/></strong><div className="insights-kpi-trend">{trend ? <span className={`insights-trend-pill ${trend.direction === 'up' ? 'positive' : 'negative'}`}><span className={`material-symbols-rounded insights-trend-arrow is-${trend.direction}`} aria-hidden="true">arrow_downward_alt</span><AnimatedNumber value={Math.abs(trend.percent)} lang={lang} suffix="%" delay={delay + 60}/></span> : <span>—</span>}</div><p className="insights-kpi-definition">{definition}</p></article>;
}

function ChangeDetail({ detail, lang, delay = 0 }) {
  const values = String(detail).split(' → ');
  if (values.length !== 2) return <span>{detail}</span>;
  const previous = Number.parseFloat(values[0]);
  const current = Number.parseFloat(values[1]);
  const suffix = values[0].includes('%') ? '%' : '';
  const directionClass = Number.isFinite(previous) && Number.isFinite(current)
    ? current >= previous ? 'positive' : 'negative'
    : '';
  return <span className={`insights-change-values insights-change-pill ${directionClass}`.trim()}><span><AnimatedNumber value={previous} lang={lang} suffix={suffix} maximumFractionDigits={1} delay={delay}/></span><span className="sr-only"> a </span><span className="material-symbols-rounded insights-trend-arrow is-right" aria-hidden="true">arrow_downward_alt</span><span><AnimatedNumber value={current} lang={lang} suffix={suffix} maximumFractionDigits={1} delay={delay}/></span></span>;
}

function ChangeTitle({ title, lang, delay = 0 }) {
  const parts = String(title).split(/(\d+(?:[.,]\d+)?%)/);
  return <strong>{parts.map((part, index) => part.endsWith('%') ? <span className="insights-change-percent" key={`${part}-${index}`}><AnimatedNumber value={Number.parseFloat(part)} lang={lang} suffix="%" maximumFractionDigits={1} delay={delay}/></span> : part)}</strong>;
}

function NoResultsDonut({ rate, count, t, lang, delay = 0 }) {
  const value = Math.min(100, Math.max(0, Number(rate || 0)));
  const animatedValue = useCountUp(value, 950, delay);
  const formatted = new Intl.NumberFormat(lang === 'es' ? 'es-US' : 'en-US', { maximumFractionDigits: 1 }).format(animatedValue);
  const finalFormatted = new Intl.NumberFormat(lang === 'es' ? 'es-US' : 'en-US', { maximumFractionDigits: 1 }).format(value);
  const label = lang === 'es'
    ? `${finalFormatted}% de las búsquedas no tuvo resultados`
    : `${finalFormatted}% of searches returned no results`;
  return <div className="insights-no-results-summary">
    <div className="insights-donut" style={{ '--donut-angle': `${animatedValue * 3.6}deg` }} role="img" aria-label={label}>
      <span>{formatted}%</span>
    </div>
    <p><strong className="insights-no-result-count"><AnimatedNumber value={count} lang={lang} delay={delay}/></strong><span>{t.searchesLabel}</span></p>
  </div>;
}

function CategoryBar({ item, maximum, lang, delay = 0 }) {
  const animatedCount = useCountUp(item.current_count, 950, delay);
  return <div><span>{lang === 'es' ? item.label_es : item.label_en}</span><div><i style={{ width: `${animatedCount / maximum * 100}%` }}/></div><strong><AnimatedNumber value={item.current_count} lang={lang} delay={delay}/></strong></div>;
}

function ContactChannels({ data, t, lang }) {
  const total = Number(data?.total || 0);
  const channels = [
    ['calls', t.calls],
    ['whatsapp', t.whatsapp],
    ['websites', t.websites],
    ['directions', t.directions],
    ['resource_prints', t.resourcePrints],
    ['list_shares', t.listShares],
    ['conversations', t.conversations]
  ].map(([key, label]) => ({ key, label, value: Number(data?.[key] || 0) }));
  if (!total) return <p>{t.contactChannelsEmpty}</p>;
  return <><div className="insights-channel-summary"><strong><AnimatedNumber value={total} lang={lang} delay={680}/></strong><span>{t.initiatedActions}</span></div><div className="insights-channel-bars">{channels.map((channel, index) => {
    const share = channel.value / total * 100;
    return <div key={channel.key}><div><span>{channel.label}</span><strong><AnimatedNumber value={channel.value} lang={lang} delay={720 + index * 45}/> <small>({Math.round(share)}%)</small></strong></div><div className="insights-channel-track" aria-hidden="true"><i style={{ width: `${share}%` }}/></div></div>;
  })}</div><table className="sr-only"><caption>{t.contactChannels}</caption><thead><tr><th>{t.contactChannels}</th><th>{lang === 'es' ? 'Cantidad' : 'Count'}</th><th>{t.percent}</th></tr></thead><tbody>{channels.map(channel => <tr key={channel.key}><th>{channel.label}</th><td>{channel.value}</td><td>{percentage(channel.value, total)}</td></tr>)}</tbody></table></>;
}

export default function AdminInsights({ lang, locationSearch, navigate }) {
  const t = insightsCopy[lang];
  const filters = useMemo(() => parseInsightFilters(locationSearch), [locationSearch]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [resourceQuery, setResourceQuery] = useState('');
  const [resourceSort, setResourceSort] = useState('actions');
  const requestSequence = React.useRef(0);
  const updateFilters = next => navigate(`/admin/insights?${serializeInsightFilters(next)}`, { replace: true, scroll: false });
  const load = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true); setError(false);
    try {
      const result = await getInsightsSnapshot(filters);
      if (requestId === requestSequence.current) setSnapshot(result);
    }
    catch { if (requestId === requestSequence.current) setError(true); }
    finally { if (requestId === requestSequence.current) setLoading(false); }
  }, [filters]);
  useEffect(() => { load(); }, [load]);
  const updated = snapshot?.generated_at ? `${t.updated}: ${new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshot.generated_at))}` : '';
  const changes = buildImportantChanges(snapshot, lang);
  const current = snapshot?.overview?.current;
  const previous = snapshot?.overview?.previous;
  const noResultTrend = snapshot && current?.searches > 0 && previous?.searches > 0 && snapshot.overview.previous_no_result_rate > 0
    ? {
        percent: Math.round((snapshot.overview.no_result_rate - snapshot.overview.previous_no_result_rate) / snapshot.overview.previous_no_result_rate * 100),
        direction: snapshot.overview.no_result_rate >= snapshot.overview.previous_no_result_rate ? 'up' : 'down'
      }
    : null;
  const noActivity = snapshot && !current?.active_sessions;
  const resources = useMemo(() => {
    const query = resourceQuery.trim().toLocaleLowerCase();
    const filtered = (snapshot?.resources || []).filter(item => !query || [item.organization_name, item.title_es, item.title_en].join(' ').toLocaleLowerCase().includes(query));
    return [...filtered].sort((a, b) => resourceSort === 'views' ? b.views - a.views : resourceSort === 'saves' ? b.saves - a.saves : b.contact_actions - a.contact_actions);
  }, [snapshot, resourceQuery, resourceSort]);
  if (loading && !snapshot) return <div className="insights-loading" aria-live="polite">{t.loading}</div>;
  if (error && !snapshot) return <section className="admin-error-state"><h1>{t.title}</h1><p>{t.loadError}</p><button className="secondary-button" onClick={load}>{t.retry}</button></section>;
  const kpis = snapshot ? [
    { label: t.activeSessions, value: current.active_sessions, definition: metricDefinitions.active_sessions.description[lang], trend: metricTrend(current.active_sessions, previous.active_sessions), lang },
    { label: t.searches, value: current.searches, definition: metricDefinitions.searches.description[lang], trend: metricTrend(current.searches, previous.searches), lang },
    { label: t.saves, value: current.resource_saves, definition: metricDefinitions.resource_saves.description[lang], trend: metricTrend(current.resource_saves, previous.resource_saves), lang },
    { label: t.contacts, value: current.contact_actions, definition: metricDefinitions.contact_actions.description[lang], trend: metricTrend(current.contact_actions, previous.contact_actions), lang },
    { label: t.noResultRate, value: snapshot.overview.no_result_rate, suffix: '%', definition: metricDefinitions.no_result_rate.description[lang], trend: noResultTrend, lang }
  ] : [];
  return <div className="admin-insights-page">
    <header className="insights-header"><div><h1>{t.title}</h1><p>{t.subtitle}</p></div><div className="insights-header-actions"><button className="secondary-button" onClick={() => setMethodologyOpen(true)}><span className="material-symbols-outlined" aria-hidden="true">info</span>{t.methodology}</button><button className="secondary-button secondary-cta" onClick={() => { setExportError(false); try { downloadInsightsCsv(snapshot, filters, t, lang); } catch { setExportError(true); } }}><span className="material-symbols-outlined" aria-hidden="true">download</span>{t.exportCsv}</button></div></header>
    <section className="insights-filters" aria-label={lang === 'es' ? 'Filtros de Insights' : 'Insights filters'}>
      {[['period', t.period, t.periods], ['source', t.source, t.sources], ['language', t.language, t.languages], ['device', t.device, t.devices], ['environment', t.environment, t.environments]].map(([key, label, options]) => <label key={key}>{label}<select value={filters[key]} onChange={event => updateFilters({ ...filters, [key]: event.target.value })}>{Object.entries(options).map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>)}
    </section>
    {error && <p className="insights-partial-error" role="status">{t.loadError} <button onClick={load}>{t.retry}</button></p>}
    <p className="sr-only" aria-live="polite">{exportError ? t.exportFailed : ''}</p>
    {noActivity && <section className="insights-empty-overview"><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><div><button className="secondary-button" onClick={() => updateFilters({ ...filters, period: 'all' })}>{t.changePeriod}</button>{filters.environment !== 'preview' && <button className="secondary-button" onClick={() => updateFilters({ ...filters, environment: 'preview' })}>{t.viewPreview}</button>}<button className="text-button" onClick={() => setMethodologyOpen(true)}>{t.methodology}</button></div></section>}
    <section className="insights-kpi-grid" aria-label={lang === 'es' ? 'Métricas principales' : 'Primary metrics'}>{kpis.map((kpi, index) => <KpiCard key={kpi.label} {...kpi} delay={index * 45}/>)}</section>
    <div className="insights-grid">
      <Panel title={t.activityOverTime} source={t.sourceEvents} updated={updated} className="insights-panel-full insights-timeline-panel"><ActivityTimeline timeline={snapshot?.timeline} t={t} lang={lang}/></Panel>
      <Panel title={t.categorySearches} source={t.sourceEvents} updated={updated} className="insights-panel-wide insights-activity-panel">
        {(snapshot?.categories || []).some(item => item.current_count) ? <><div className="insights-bars">{snapshot.categories.map((item, index) => {
          const max = Math.max(...snapshot.categories.map(category => category.current_count), 1);
          return <CategoryBar item={item} maximum={max} lang={lang} delay={220 + index * 35} key={item.slug}/>;
        })}</div><table className="sr-only"><caption>{t.categorySearches}</caption><thead><tr><th>{t.category}</th><th>{t.searches}</th></tr></thead><tbody>{snapshot.categories.map(item => <tr key={item.slug}><th>{lang === 'es' ? item.label_es : item.label_en}</th><td>{item.current_count}</td></tr>)}</tbody></table></> : <p>{t.noData}</p>}
      </Panel>
      <Panel title={t.importantChanges} source={t.sourceEvents} updated={updated} className="insights-activity-panel"><ul className="insights-changes">{changes.length ? changes.map((change, index) => <li key={change.id}><ChangeTitle title={change.title} lang={lang} delay={240 + index * 45}/><ChangeDetail detail={change.detail} lang={lang} delay={240 + index * 45}/></li>) : <li>{t.noChanges}</li>}</ul></Panel>
      <Panel title={t.needsByArea} source={t.sourceEvents} updated={updated} className="insights-panel-wide insights-map-panel"><InsightsMap data={snapshot?.areas} t={t}/></Panel>
      <Panel title={t.noResults} source={t.sourceEvents} updated={updated}>{snapshot?.no_results?.terms?.length || snapshot?.no_results?.low_volume_occurrences ? <><NoResultsDonut rate={snapshot.overview.no_result_rate} count={current.no_results} t={t} lang={lang} delay={420}/><ol className="insights-no-results">{snapshot.no_results.terms.map((item, index) => <li key={item.search_term_normalized}><strong className="insights-no-result-title">{sentenceCase(item.search_term_normalized, lang)}</strong><strong className="insights-no-result-count"><AnimatedNumber value={item.occurrences} lang={lang} delay={460 + index * 35}/></strong><time dateTime={item.last_occurred_at}>{new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium' }).format(new Date(item.last_occurred_at))}</time></li>)}{snapshot.no_results.low_volume_occurrences > 0 && <li><strong className="insights-no-result-title">{sentenceCase(t.lowVolume, lang)}</strong><strong>—</strong></li>}</ol><p className="insights-panel-note">{t.lowVolumeNote}</p></> : <p>{t.noNoResults}</p>}</Panel>
      <Panel title={t.resourcePerformance} source={t.sourceEvents} updated={updated} className="insights-panel-full insights-performance-panel">
        <div className="insights-resource-toolbar"><label>{t.resourceSearch}<input value={resourceQuery} onChange={event => setResourceQuery(event.target.value)}/></label><label>{lang === 'es' ? 'Ordenar' : 'Sort'}<select value={resourceSort} onChange={event => setResourceSort(event.target.value)}><option value="actions">{t.totalActions}</option><option value="views">{t.views}</option><option value="saves">{t.saved}</option></select></label></div>
        {resources.length ? <div className="insights-table-scroll"><table className="insights-data-table"><caption className="sr-only">{t.resourcePerformance}</caption><thead><tr><th>{t.resource}</th><th>{t.category}</th><th>{t.views}</th><th>{t.saved}</th><th>{t.calls}</th><th>{t.whatsapp}</th><th>{t.websites}</th><th>{t.totalActions}</th><th>{t.actionRate}</th><th>{t.verified}</th><th>{t.edit}</th></tr></thead><tbody>{resources.map((item, index) => {
          const category = getCategoryById(item.primary_category_id);
          const delay = 620 + index * 30;
          return <tr key={item.id}><th scope="row"><span>{lang === 'es' ? item.title_es || item.title_en : item.title_en || item.title_es}</span><small>{item.organization_name}</small>{item.status === 'archived' && <em>{t.archivedLabel}</em>}</th><td>{category?.[`label_${lang}`] || '—'}</td><td><AnimatedNumber value={item.views} lang={lang} delay={delay}/></td><td><AnimatedNumber value={item.saves} lang={lang} delay={delay}/></td><td><AnimatedNumber value={item.calls} lang={lang} delay={delay}/></td><td><AnimatedNumber value={item.whatsapp} lang={lang} delay={delay}/></td><td><AnimatedNumber value={item.website} lang={lang} delay={delay}/></td><td><AnimatedNumber value={item.contact_actions} lang={lang} delay={delay}/></td><td>{item.views ? <AnimatedNumber value={Math.round(item.contact_actions / item.views * 100)} lang={lang} suffix="%" delay={delay}/> : '—'}</td><td>{item.last_verified_at || '—'}</td><td><button className="text-button" onClick={() => navigate(`/admin/recursos/${item.id}/editar`)}>{t.edit}</button></td></tr>;
        })}</tbody></table></div> : <p>{t.performanceEmpty}</p>}
      </Panel>
      <Panel title={t.directoryQuality} source={t.sourceResources} updated={updated} className="insights-panel-wide insights-quality-panel"><dl className="insights-quality">{[['published', t.published], ['drafts', t.drafts], ['archived', t.archived], ['unverified', t.unverified], ['needs_review', t.needsReview], ['incomplete_translation', t.incompleteTranslations], ['missing_source', t.missingSource], ['missing_contact', t.missingContact], ['missing_category', t.missingCategory]].map(([key, label], index) => <div key={key}><dt>{label}</dt><dd><AnimatedNumber value={snapshot?.quality?.[key] || 0} lang={lang} delay={620 + index * 35}/></dd></div>)}</dl><button className="secondary-button secondary-cta" onClick={() => navigate('/admin/recursos?revision=1')}>{t.reviewResources}</button></Panel>
      <Panel title={t.contactChannels} source={t.sourceEvents} updated={updated} className="insights-channel-panel"><ContactChannels data={snapshot?.contact_channels} t={t} lang={lang}/></Panel>
    </div>
    <aside className="insights-privacy-note">{t.privacy}</aside>
    <InsightsMethodology open={methodologyOpen} onClose={() => setMethodologyOpen(false)} lang={lang} t={t}/>
  </div>;
}
