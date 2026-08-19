import React, { useEffect, useRef, useState } from 'react';
import CompactResourceCard from './CompactResourceCard';

function Cards({ resources, categories, lang, t, selectedId, hoveredId, includedIds, onSelect, onHover, onToggleIncluded, cardRefs }) {
  return <div className="finder-results-list">{resources.map(resource => <div key={resource.id} ref={node => { if (node) cardRefs.current.set(resource.id, node); else cardRefs.current.delete(resource.id); }}>
    <CompactResourceCard resource={resource} category={categories.find(category => category.id === resource.primary_category_id)} lang={lang} t={t} selected={selectedId === resource.id} hovered={hoveredId === resource.id} included={includedIds.includes(resource.id)} onSelect={() => onSelect(resource.id)} onHover={active => onHover(active ? resource.id : null)} onToggleIncluded={() => onToggleIncluded(resource.id)}/>
  </div>)}</div>;
}

export default function ResourceResultsPanel({ t, lang, results, unlocatedResults, remoteResults, categories, selectedId, hoveredId, includedIds, loading, searched, zip, categoryLabel, excludedCount, radius, onSelect, onHover, onToggleIncluded, onToggleAll, onExpand, onClearCategory, onRequestHelp, onShare, onPrint, onSavePdf, cardRefs }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef(null);
  useEffect(() => {
    if (!actionsOpen) return undefined;
    const close = event => { if (!actionsRef.current?.contains(event.target)) setActionsOpen(false); };
    const escape = event => { if (event.key === 'Escape') setActionsOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [actionsOpen]);
  if (loading) return <div className="finder-skeletons" aria-live="polite"><span className="sr-only">{t.resourcesLoading}</span>{[1, 2, 3].map(item => <div className="finder-card-skeleton" key={item}/>)}</div>;
  if (!searched) return <div className="finder-empty"><h2>{t.startTitle}</h2><p>{t.startText}</p></div>;
  if (!results.length && !unlocatedResults.length && !remoteResults.length) return <div className="finder-empty" aria-live="polite"><h2>{t.empty(categoryLabel, zip)}</h2><p>{t.emptyHelp}</p><div className="finder-empty-actions">{radius < 50 && <button className="secondary-button" onClick={onExpand}>{t.expand(radius === 15 ? 30 : 50)}</button>}{categoryLabel && <button className="secondary-button" onClick={onClearCategory}>{t.allNearby}</button>}<button className="text-link" onClick={onRequestHelp}>{t.requestHelp}</button></div></div>;
  const visibleIds = [...results, ...unlocatedResults, ...remoteResults].map(resource => resource.id);
  const allVisibleSelected = visibleIds.every(id => includedIds.includes(id));
  const cardProps = { categories, lang, t, selectedId, hoveredId, includedIds, onSelect, onHover, onToggleIncluded, cardRefs };
  return <div className="finder-results-content">
    <div className="finder-results-summary">
      <div className="finder-results-summary-main">
        <p className="finder-results-count" aria-live="polite"><strong>{t.results(results.length + unlocatedResults.length + remoteResults.length)}</strong><span aria-hidden="true">•</span><span>{t.nearbyCount(results.length)}</span></p>
        <div className="finder-more-actions finder-results-actions no-print" ref={actionsRef}>
          <button className="finder-results-actions-button" type="button" disabled={!includedIds.length} aria-label={`${t.moreActions}: ${includedIds.length}`} title={includedIds.length ? t.moreActions : t.selectResourcesFirst} aria-haspopup="menu" aria-expanded={actionsOpen} onClick={() => setActionsOpen(value => !value)}><span className="material-symbols-rounded" aria-hidden="true">more_horiz</span></button>
          {actionsOpen && <div className="finder-actions-menu" role="menu"><p>{lang === 'es' ? `${includedIds.length} ${includedIds.length === 1 ? 'recurso seleccionado' : 'recursos seleccionados'}` : `${includedIds.length} selected ${includedIds.length === 1 ? 'resource' : 'resources'}`}</p><button role="menuitem" onClick={() => { setActionsOpen(false); onShare(); }}><span className="material-symbols-rounded" aria-hidden="true">share</span>{t.shareList}</button><button role="menuitem" onClick={() => { setActionsOpen(false); onPrint(); }}><span className="material-symbols-rounded" aria-hidden="true">print</span>{t.printList}</button><button role="menuitem" onClick={() => { setActionsOpen(false); onSavePdf(); }}><span className="material-symbols-rounded" aria-hidden="true">picture_as_pdf</span>{t.savePdf}</button></div>}
        </div>
      </div>
      <div className="finder-results-select-row no-print"><button className={`finder-select-all-button${allVisibleSelected ? ' is-active' : ''}`} type="button" aria-pressed={allVisibleSelected} onClick={() => onToggleAll(visibleIds)}>{lang === 'es' ? (allVisibleSelected ? 'Quitar selección' : 'Seleccionar todo') : (allVisibleSelected ? 'Clear selection' : 'Select all')}</button></div>
    </div>
    {excludedCount > 0 && <p className="finder-location-note">{excludedCount} {lang === 'es' ? (excludedCount === 1 ? 'recurso todavía no tiene ubicación ni atención remota confirmada.' : 'recursos todavía no tienen ubicación ni atención remota confirmada.') : (excludedCount === 1 ? 'resource does not yet have a confirmed location or remote service.' : 'resources do not yet have a confirmed location or remote service.')}</p>}
    {results.length > 0 && <section className="finder-result-group"><Cards resources={results} {...cardProps}/></section>}
    {unlocatedResults.length > 0 && <section className="finder-result-group finder-remote-results"><h2>{t.unlocatedTitle}</h2><p>{t.unlocatedText}</p><Cards resources={unlocatedResults} {...cardProps}/></section>}
    {remoteResults.length > 0 && <section className="finder-result-group finder-remote-results"><h2>{results.length ? t.remoteTitle : t.noPhysical(zip)}</h2><p>{results.length ? t.remoteText : t.remoteOnlyText}</p><Cards resources={remoteResults} {...cardProps}/></section>}
  </div>;
}
