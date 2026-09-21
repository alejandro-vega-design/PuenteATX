import React, { useMemo, useState } from 'react';
import { supportedCounties } from '../../config/serviceAreas';

const TONE_STEPS = 7;

// Sequential magnitude, one hue: sqrt scale because pair counts are heavily
// right-skewed (a few Travis-bound pairs dwarf the rest); the legend says so.
const toneFor = (value, max) => Math.min(TONE_STEPS - 1, Math.floor(Math.sqrt(value) / Math.sqrt(max) * TONE_STEPS));

export default function CrossCountyHeatmap({ data, t }) {
  const [tip, setTip] = useState(null);
  const min = Number(data?.min_sessions || 10);
  const pairs = data?.pairs || [];
  const counties = supportedCounties;
  const lookup = useMemo(() => new Map(pairs.map(pair => [`${pair.origin_county}|${pair.resource_county}`, Number(pair.sessions)])), [pairs]);
  const max = useMemo(() => Math.max(1, ...pairs.map(pair => Number(pair.sessions))), [pairs]);

  if (data?.unavailable) return <p>{t.crossCountyUnavailable}</p>;
  if (!pairs.length) return <p>{t.crossCountyEmpty.replace('{min}', min)}</p>;

  const show = (event, origin, destination, value) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.type === 'focus' ? rect.left + rect.width / 2 : event.clientX;
    const y = event.type === 'focus' ? rect.top : event.clientY;
    setTip({ x, y, origin, destination, value });
  };

  return <div className="cross-county">
    <p className="cross-county-intro">{t.crossCountyIntro}</p>
    <div className="cross-county-scroll">
      <div className="cross-county-grid" role="table" aria-label={t.crossCounty} style={{ gridTemplateColumns: `108px repeat(${counties.length}, minmax(46px, 1fr))` }}>
        <div className="cc-axis-title" role="presentation"><span>{t.crossCountyRowsAxis} ↓</span><span>{t.crossCountyColsAxis} →</span></div>
        {counties.map(county => <div key={`c-${county}`} className="cc-col-label" role="columnheader">{county}</div>)}
        {counties.map(origin => <React.Fragment key={origin}>
          <div className="cc-row-label" role="rowheader">{origin}</div>
          {counties.map(destination => {
            if (origin === destination) return <div key={destination} className="cc-cell is-same" role="cell" aria-label={`${origin}: ${t.crossCountySameCounty}`}>—</div>;
            const value = lookup.get(`${origin}|${destination}`);
            const handlers = { tabIndex: 0, onPointerMove: event => show(event, origin, destination, value), onPointerLeave: () => setTip(null), onFocus: event => show(event, origin, destination, value), onBlur: () => setTip(null) };
            if (value == null) return <div key={destination} className="cc-cell is-suppressed" role="cell" aria-label={`${origin} → ${destination}: ${t.crossCountySuppressed(min)}`} {...handlers}>·</div>;
            return <div key={destination} className={`cc-cell tone-${toneFor(value, max)}`} role="cell" aria-label={`${origin} → ${destination}: ${t.crossCountySessions(value)}`} {...handlers}>{value}</div>;
          })}
        </React.Fragment>)}
      </div>
    </div>
    <div className="cc-legend">
      <span className="cc-legend-scale"><span>{t.crossCountyLess}</span><span className="cc-swatches" aria-hidden="true">{Array.from({ length: TONE_STEPS }, (_, index) => <i key={index} className={`tone-${index}`}/>)}</span><span>{t.crossCountyMore}</span></span>
      <span className="cc-legend-item"><i className="cc-swatch is-same" aria-hidden="true"/>{t.crossCountySameCounty}</span>
      <span className="cc-legend-item"><i className="cc-swatch is-suppressed" aria-hidden="true"/>{t.crossCountySuppressed(min)}</span>
    </div>
    <p className="insights-panel-note">{t.crossCountyScaleNote} {t.crossCountyThreshold(min)}</p>
    <details className="cc-table-view"><summary>{t.crossCountyTable}</summary>
      <div className="insights-table-scroll"><table className="insights-data-table"><caption className="sr-only">{t.crossCounty}</caption><thead><tr><th>{t.crossCountyOrigin}</th><th>{t.crossCountyDestination}</th><th>{t.crossCountySessions(2).replace(/^\d+ /, '')}</th></tr></thead><tbody>{pairs.map(pair => <tr key={`${pair.origin_county}|${pair.resource_county}`}><th scope="row">{pair.origin_county}</th><td>{pair.resource_county}</td><td>{pair.sessions}</td></tr>)}</tbody></table></div>
    </details>
    {tip && <div className="cc-tooltip" role="tooltip" style={{ left: Math.min(tip.x + 14, window.innerWidth - 250), top: tip.y + 14 }}>
      <strong>{tip.value == null ? t.crossCountySuppressedTip(min) : t.crossCountySessions(tip.value)}</strong>
      <span>{tip.origin} → {tip.destination}</span>
    </div>}
  </div>;
}
