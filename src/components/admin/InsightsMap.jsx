import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const WIDTH = 800;
const HEIGHT = 380;
const PADDING = 4;
const MAP_ZOOM = 1.16;

const allPoints = coordinates => {
  if (!Array.isArray(coordinates)) return [];
  if (typeof coordinates[0] === 'number') return [coordinates];
  return coordinates.flatMap(allPoints);
};

function geometryPath(geometry, project) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  return polygons.map(polygon => polygon.map(ring => ring.map((point, index) => {
    const [x, y] = project(point);
    return `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z').join(' ')).join(' ');
}

export default function InsightsMap({ data, t }) {
  const [geojson, setGeojson] = useState(null);
  const [state, setState] = useState('loading');
  const [activeZip, setActiveZip] = useState(null);
  const [tableOpen, setTableOpen] = useState(false);
  const tableTriggerRef = useRef(null);
  const drawerRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    if (!tableOpen) return undefined;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width
    };
    const trigger = tableTriggerRef.current;
    const key = event => {
      if (event.key === 'Escape') setTableOpen(false);
      if (event.key === 'Tab') {
        const controls = [...drawerRef.current.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])')].filter(item => !item.disabled);
        if (!controls.length) return;
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.addEventListener('keydown', key);
    closeRef.current?.focus();
    return () => {
      Object.assign(document.body.style, previousBodyStyles);
      window.scrollTo(0, scrollY);
      document.removeEventListener('keydown', key);
      trigger?.focus();
    };
  }, [tableOpen]);
  useEffect(() => {
    let active = true;
    fetch('/maps/austin-travis-zip-codes.geojson')
      .then(response => {
        if (!response.ok) throw new Error('missing');
        return response.json();
      })
      .then(value => {
        if (!value?.features?.length || value.features.some(feature => !feature.properties?.zip_code)) throw new Error('invalid');
        if (active) { setGeojson(value); setState('ready'); }
      })
      .catch(error => active && setState(error.message === 'missing' ? 'missing' : 'error'));
    return () => { active = false; };
  }, []);
  const shapes = useMemo(() => {
    if (!geojson) return [];
    const points = geojson.features.flatMap(feature => allPoints(feature.geometry.coordinates));
    const xs = points.map(point => point[0]); const ys = points.map(point => point[1]);
    const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const scale = Math.min((WIDTH - PADDING * 2) / (maxX - minX), (HEIGHT - PADDING * 2) / (maxY - minY)) * MAP_ZOOM;
    const contentWidth = (maxX - minX) * scale; const contentHeight = (maxY - minY) * scale;
    const offsetX = (WIDTH - contentWidth) / 2; const offsetY = (HEIGHT - contentHeight) / 2;
    const project = point => [offsetX + (point[0] - minX) * scale, HEIGHT - offsetY - (point[1] - minY) * scale];
    return geojson.features.map(feature => {
      const projectedPoints = allPoints(feature.geometry.coordinates).map(project);
      const projectedXs = projectedPoints.map(point => point[0]);
      const projectedYs = projectedPoints.map(point => point[1]);
      const shapeMinX = Math.min(...projectedXs);
      const shapeMaxX = Math.max(...projectedXs);
      const shapeMinY = Math.min(...projectedYs);
      const shapeMaxY = Math.max(...projectedYs);
      return {
        zip: feature.properties.zip_code,
        path: geometryPath(feature.geometry, project),
        x: (shapeMinX + shapeMaxX) / 2,
        y: (shapeMinY + shapeMaxY) / 2,
        minX: shapeMinX,
        maxX: shapeMaxX
      };
    });
  }, [geojson]);
  if (state === 'loading') return <p>{t.loading}</p>;
  if (state === 'missing') return <div className="insights-map-state"><p>{t.mapMissing}</p></div>;
  if (state === 'error') return <div className="insights-map-state"><p>{t.mapError}</p></div>;
  const visible = new Map((data?.visible || []).map(area => [area.area_code, area]));
  const total = Number(data?.visible_total || 0);
  if (!visible.size) return <div className="insights-map-state"><h3>{t.mapInsufficientTitle}</h3><p>{t.mapInsufficientText}</p></div>;
  const activityRanks = new Map(
    [...visible.values()]
      .sort((left, right) => left.event_count - right.event_count)
      .map((area, index, areas) => {
        const relativeRank = areas.length === 1 ? .5 : index / (areas.length - 1);
        const level = relativeRank < .2 ? 'low' : relativeRank < .6 ? 'medium' : 'high';
        return [area.area_code, level];
      })
  );
  const activeShape = shapes.find(shape => shape.zip === activeZip);
  const activeArea = activeShape ? visible.get(activeShape.zip) : null;
  const activePercentage = activeArea && total ? Math.round((activeArea.event_count / total) * 100) : 0;
  const tooltipSide = activeShape?.x > WIDTH * .62 ? 'left' : 'right';
  const tooltipX = activeShape ? (tooltipSide === 'left' ? activeShape.minX : activeShape.maxX) / WIDTH * 100 : 0;
  const tooltipY = activeShape ? Math.min(90, Math.max(10, activeShape.y / HEIGHT * 100)) : 0;
  return <div className="insights-map-content">
    <div className="insights-map-stage">
      <svg className="insights-map" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t.mapDescription}>
        {shapes.map(shape => {
          const area = visible.get(shape.zip);
          const areaPercentage = area && total ? Math.round((area.event_count / total) * 100) : 0;
          const label = area ? `${shape.zip}: ${area.event_count} ${t.searchesLabel}, ${areaPercentage}%` : `${shape.zip}: ${t.insufficient}`;
          const activate = () => setActiveZip(shape.zip);
          const activityClass = area ? `has-data activity-${activityRanks.get(shape.zip)}` : 'insufficient-data';
          return <path key={shape.zip} d={shape.path} className={`${activityClass}${activeZip === shape.zip ? ' is-active' : ''}`} tabIndex="0" role="button" aria-label={label} aria-pressed={activeZip === shape.zip} onMouseEnter={activate} onMouseLeave={() => setActiveZip(current => current === shape.zip ? null : current)} onFocus={activate} onBlur={() => setActiveZip(current => current === shape.zip ? null : current)} onClick={activate} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } }}/>;
        })}
        {activeShape && <path className="insights-map-active-outline" d={activeShape.path} aria-hidden="true"/>}
      </svg>
      {activeShape && <div className={`insights-map-tooltip is-${tooltipSide}`} style={{ left: `${tooltipX}%`, top: `${tooltipY}%` }} aria-hidden="true">
        <strong>{activeShape.zip}</strong>
        {activeArea ? <><span>{activeArea.event_count} {t.searchesLabel}</span><span>{activePercentage}%</span></> : <span>{t.insufficient}</span>}
      </div>}
    </div>
    <div className="insights-map-legend" aria-hidden="true">
      <span className="insights-map-level-key activity-low"><i/>{t.lowActivity}</span>
      <span className="insights-map-level-key activity-medium"><i/>{t.mediumActivity}</span>
      <span className="insights-map-level-key activity-high"><i/>{t.highActivity}</span>
      <span className="insights-map-neutral-key"><i/>{t.insufficient}</span>
    </div>
    <p className="insights-panel-note">{t.mapNote}</p>
    <button ref={tableTriggerRef} className="secondary-button secondary-cta insights-map-table-toggle" type="button" aria-haspopup="dialog" aria-expanded={tableOpen} onClick={() => setTableOpen(true)}>{t.showAreaTable}</button>
    {tableOpen && createPortal(<div className="insights-area-drawer-overlay" onMouseDown={event => event.target === event.currentTarget && setTableOpen(false)} onWheel={event => event.target === event.currentTarget && event.preventDefault()} onTouchMove={event => event.target === event.currentTarget && event.preventDefault()}>
      <aside ref={drawerRef} className="insights-area-drawer" role="dialog" aria-modal="true" aria-labelledby="insights-area-drawer-title">
        <header><h2 id="insights-area-drawer-title">{t.needsByArea}</h2><button ref={closeRef} type="button" onClick={() => setTableOpen(false)} aria-label={t.close}>×</button></header>
        <div className="insights-area-drawer-table-wrap"><table className="insights-area-drawer-table"><caption className="sr-only">{t.needsByArea}</caption><thead><tr><th>{t.area}</th><th>{t.searches}</th><th>{t.percent}</th></tr></thead><tbody>{shapes.map(shape => {
          const area = visible.get(shape.zip); const percentage = area && total ? Math.round((area.event_count / total) * 100) : null;
          return <tr key={shape.zip}><th scope="row">{shape.zip}</th><td>{area ? area.event_count : t.insufficient}</td><td>{percentage == null ? '—' : `${percentage}%`}</td></tr>;
        })}</tbody></table></div>
      </aside>
    </div>, document.body)}
  </div>;
}
