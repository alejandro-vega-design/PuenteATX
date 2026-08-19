export const insightFilterDefaults = {
  period: '30d',
  language: 'all',
  device: 'all',
  environment: 'production'
};

const allowed = {
  period: new Set(['7d', '30d', '90d', 'all']),
  language: new Set(['all', 'es', 'en']),
  device: new Set(['all', 'mobile', 'tablet', 'desktop']),
  environment: new Set(['production', 'preview', 'development'])
};

export function parseInsightFilters(search = '') {
  const params = new URLSearchParams(search);
  return Object.fromEntries(Object.entries(insightFilterDefaults).map(([key, fallback]) => {
    const value = params.get(key);
    return [key, allowed[key].has(value) ? value : fallback];
  }));
}

export function serializeInsightFilters(filters) {
  const params = new URLSearchParams();
  for (const key of Object.keys(insightFilterDefaults)) params.set(key, allowed[key].has(filters[key]) ? filters[key] : insightFilterDefaults[key]);
  return params.toString();
}

export function insightDateRange(period, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  if (period === 'all') start.setTime(new Date('2020-01-01T00:00:00.000Z').getTime());
  else start.setUTCDate(start.getUTCDate() - Number(period.replace('d', '')));
  return { start: start.toISOString(), end: end.toISOString() };
}

