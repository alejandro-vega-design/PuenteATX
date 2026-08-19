const list = value => value ? [...new Set(value.split(',').filter(Boolean))] : [];

export const emptyResourceFilters = { q: '', categories: [], languages: [], methods: [], costs: [], area: '', recent: false, sort: 'updated', page: 1 };

export function parseResourceFilters(search) {
  const params = new URLSearchParams(search);
  return { q: params.get('q') || '', categories: list(params.get('categoria')), languages: list(params.get('idioma')), methods: list(params.get('metodo')), costs: list(params.get('costo')), area: params.get('condado') || params.get('area') || '', recent: params.get('reciente') === '1', sort: params.get('orden') || (params.get('q') ? 'relevance' : 'updated'), page: Math.max(1, Number(params.get('pagina')) || 1) };
}

export function serializeResourceFilters(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q); if (filters.categories.length) params.set('categoria', filters.categories.join(',')); if (filters.languages.length) params.set('idioma', filters.languages.join(',')); if (filters.methods.length) params.set('metodo', filters.methods.join(',')); if (filters.costs.length) params.set('costo', filters.costs.join(',')); if (filters.area) params.set('condado', filters.area); if (filters.recent) params.set('reciente', '1'); if (filters.sort) params.set('orden', filters.sort); if (filters.page > 1) params.set('pagina', String(filters.page));
  return params.toString();
}
