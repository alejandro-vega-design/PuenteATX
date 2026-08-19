import React, { useEffect, useMemo, useRef, useState } from 'react';

const METRICS = ['active_sessions', 'searches', 'resource_saves', 'contact_actions', 'no_results'];

function dateLabel(value, granularity, lang, full = false) {
  const options = granularity === 'month'
    ? { month: full ? 'long' : 'short', year: 'numeric' }
    : { month: full ? 'long' : 'short', day: 'numeric', ...(full ? { year: 'numeric' } : {}) };
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', options).format(new Date(value));
}

function niceMaximum(value) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const rounded = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return rounded * magnitude;
}

function trendDirection(values) {
  if (values.length < 2 || !values.some(Boolean)) return 'neutral';
  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  values.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });
  const projectedChange = denominator ? numerator / denominator * (values.length - 1) : 0;
  const threshold = Math.max(0.5, Math.max(...values) * 0.03);
  if (projectedChange > threshold) return 'positive';
  if (projectedChange < -threshold) return 'negative';
  return 'neutral';
}

export default function ActivityTimeline({ timeline, t, lang }) {
  const [metric, setMetric] = useState('active_sessions');
  const [activeIndex, setActiveIndex] = useState(null);
  const chartRef = useRef(null);
  const [chartWidthValue, setChartWidthValue] = useState(960);
  const points = timeline?.points || [];
  const values = points.map(point => Number(point[metric] || 0));
  const hasData = values.some(Boolean);
  const width = chartWidthValue;
  const height = 286;
  const margin = { top: 62, right: 8, bottom: 42, left: 8 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const maximum = niceMaximum(Math.max(...values, 0));
  const trend = trendDirection(values);
  const coordinates = points.map((point, index) => ({
    x: margin.left + (points.length <= 1 ? chartWidth / 2 : index / (points.length - 1) * chartWidth),
    y: margin.top + chartHeight - (Number(point[metric] || 0) / maximum * chartHeight),
    point
  }));
  const linePath = coordinates.map(({ x, y }, index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const areaPath = coordinates.length ? `${linePath} L ${coordinates.at(-1).x} ${margin.top + chartHeight} L ${coordinates[0].x} ${margin.top + chartHeight} Z` : '';
  const xLabelIndexes = useMemo(() => [...new Set([0, Math.round((points.length - 1) / 3), Math.round((points.length - 1) * 2 / 3), points.length - 1])].filter(index => index >= 0), [points.length]);
  const active = activeIndex === null ? null : coordinates[activeIndex];
  const metricLabels = {
    active_sessions: t.activeSessions,
    searches: t.searches,
    resource_saves: t.saves,
    contact_actions: t.contacts,
    no_results: t.noResults
  };
  const trendIconClass = trend === 'positive' ? 'is-up' : trend === 'negative' ? '' : 'is-right';

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return undefined;
    const updateWidth = () => setChartWidthValue(Math.max(280, Math.round(element.getBoundingClientRect().width)));
    updateWidth();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div className={`insights-timeline is-${trend}`}>
    <div className="insights-timeline-toolbar">
      <div className="insights-timeline-controls">
        <label><span className="sr-only">{t.timelineMetric}</span><select aria-label={t.timelineMetric} value={metric} onChange={event => { setMetric(event.target.value); setActiveIndex(null); }}>{METRICS.map(key => <option key={key} value={key}>{metricLabels[key]}</option>)}</select></label>
        <span className={`insights-timeline-trend is-${trend}`}><span className={`material-symbols-rounded insights-trend-arrow ${trendIconClass}`} aria-hidden="true">arrow_downward_alt</span>{t.timelineTrendLabels[trend]}</span>
      </div>
      <p>{t.timelineGranularity[timeline?.granularity || 'day']}</p>
    </div>
    {!hasData ? <p className="insights-timeline-empty">{t.noData}</p> : <>
      <div className="insights-timeline-chart" ref={chartRef}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="activity-timeline-title activity-timeline-desc">
          <title id="activity-timeline-title">{t.activityOverTime}: {metricLabels[metric]}</title>
          <desc id="activity-timeline-desc">{t.timelineDescription} {t.timelineTrends[trend]}</desc>
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = margin.top + chartHeight - ratio * chartHeight;
            return <g key={ratio}><line className="insights-timeline-gridline" x1={margin.left} x2={width - margin.right} y1={y} y2={y}/><text className="insights-timeline-axis-label insights-timeline-y-label" x={margin.left + 6} y={y - 6} textAnchor="start">{Math.round(maximum * ratio)}</text></g>;
          })}
          <path className="insights-timeline-area" d={areaPath}/>
          <path className="insights-timeline-line" d={linePath} pathLength="1"/>
          {coordinates.map(({ x, y, point }, index) => <g key={point.bucket_start}>
            <rect className="insights-timeline-hit" x={x - Math.max(8, chartWidth / Math.max(points.length, 1) / 2)} y={margin.top} width={Math.max(16, chartWidth / Math.max(points.length, 1))} height={chartHeight} tabIndex="0" role="button" aria-label={`${dateLabel(point.bucket_start, timeline.granularity, lang, true)}: ${point[metric]} ${metricLabels[metric]}`} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onBlur={() => setActiveIndex(null)}/>
            <circle className={activeIndex === index ? 'is-active' : ''} cx={x} cy={y} r={activeIndex === index ? 5 : 3}/>
          </g>)}
          {xLabelIndexes.map(index => <text className="insights-timeline-axis-label" key={points[index].bucket_start} x={coordinates[index].x} y={height - 10} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}>{dateLabel(points[index].bucket_start, timeline.granularity, lang)}</text>)}
        </svg>
        {active && <div className={`insights-timeline-tooltip${activeIndex === 0 ? ' is-start' : activeIndex === points.length - 1 ? ' is-end' : ''}`} style={{ left: `${active.x / width * 100}%`, top: `${active.y / height * 100}%` }}><strong>{dateLabel(active.point.bucket_start, timeline.granularity, lang, true)}</strong><span>{active.point[metric]} {metricLabels[metric]}</span></div>}
      </div>
      <table className="sr-only"><caption>{t.activityOverTime}: {metricLabels[metric]}</caption><thead><tr><th>{t.date}</th><th>{metricLabels[metric]}</th></tr></thead><tbody>{points.map(point => <tr key={point.bucket_start}><th>{dateLabel(point.bucket_start, timeline.granularity, lang, true)}</th><td>{point[metric]}</td></tr>)}</tbody></table>
    </>}
  </div>;
}
