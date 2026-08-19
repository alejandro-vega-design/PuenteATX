export const MAP_MIN_EVENTS = 20;
export const MAP_MIN_SESSIONS = 10;
export const NO_RESULTS_TERM_MIN_COUNT = 5;
export const INSIGHT_MIN_EVENTS = 20;
export const INSIGHT_MIN_NET_CHANGE = 5;
export const INSIGHT_MIN_PERCENT_CHANGE = 10;
export const RESOURCE_REVIEW_DAYS = 180;

export const metricDefinitions = {
  active_sessions: {
    es: 'Sesiones con actividad',
    en: 'Sessions with activity',
    description: {
      es: 'Sesiones anónimas que realizaron al menos una acción.',
      en: 'Anonymous sessions that performed at least one action.'
    },
    formula: 'Conteo distinto de sesiones anónimas con al menos un evento válido.',
    source: 'analytics_events',
    limitation: 'Una sesión no equivale a una persona única.'
  },
  searches: {
    es: 'Búsquedas realizadas',
    en: 'Searches performed',
    description: {
      es: 'Búsquedas enviadas desde el directorio.',
      en: 'Searches submitted from the directory.'
    },
    formula: 'Conteo de search_submitted.',
    source: 'analytics_events',
    limitation: 'No confirma que se encontró o recibió ayuda.'
  },
  resource_saves: {
    es: 'Recursos guardados',
    en: 'Resources saved',
    description: {
      es: 'Veces que se añadió un recurso a una lista.',
      en: 'Times a resource was added to a list.'
    },
    formula: 'Conteo de resource_saved.',
    source: 'analytics_events',
    limitation: 'Un recurso guardado puede quitarse posteriormente.'
  },
  contact_actions: {
    es: 'Acciones de contacto',
    en: 'Contact actions',
    description: {
      es: 'Llamadas, WhatsApp, sitios y direcciones iniciadas.',
      en: 'Calls, WhatsApp, websites, and directions initiated.'
    },
    formula: 'call_clicked + whatsapp_clicked + website_clicked + directions_clicked.',
    source: 'analytics_events',
    limitation: 'Una acción de contacto indica que alguien inició una acción. No confirma que haya recibido ayuda.'
  },
  no_result_rate: {
    es: 'Tasa sin resultados',
    en: 'No-results rate',
    description: {
      es: 'Porcentaje de búsquedas que devolvieron cero resultados.',
      en: 'Percentage of searches that returned zero results.'
    },
    formula: 'search_no_results / search_submitted × 100.',
    source: 'analytics_events',
    limitation: 'Si no hubo búsquedas, se muestra 0%.'
  }
};

export function metricTrend(current, previous, { inverse = false, minimumCurrent = INSIGHT_MIN_EVENTS } = {}) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  const net = currentValue - previousValue;
  if (currentValue < minimumCurrent || previousValue <= 0 || Math.abs(net) < INSIGHT_MIN_NET_CHANGE) return null;
  const percent = Math.round((net / previousValue) * 100);
  if (Math.abs(percent) < INSIGHT_MIN_PERCENT_CHANGE) return null;
  return { net, percent, direction: percent > 0 ? 'up' : 'down', sentiment: inverse ? (percent > 0 ? 'negative' : 'positive') : 'neutral' };
}

export function buildImportantChanges(snapshot, lang = 'es') {
  if (!snapshot) return [];
  const changes = [];
  const category = [...(snapshot.categories || [])].sort((a, b) => b.current_count - a.current_count)[0];
  if (category?.current_count >= INSIGHT_MIN_EVENTS) {
    changes.push({
      id: `top-${category.slug}`,
      title: lang === 'es' ? `${category.label_es} fue la categoría más buscada.` : `${category.label_en} was the most searched category.`,
      detail: lang === 'es' ? `${category.current_count} búsquedas con categoría.` : `${category.current_count} searches with a category.`
    });
  }
  for (const item of snapshot.categories || []) {
    const trend = metricTrend(item.current_count, item.previous_count);
    if (!trend) continue;
    changes.push({
      id: `category-${item.slug}`,
      title: lang === 'es'
        ? `Las búsquedas de ${item.label_es.toLocaleLowerCase()} ${trend.direction === 'up' ? 'aumentaron' : 'disminuyeron'} ${Math.abs(trend.percent)}%.`
        : `${item.label_en} searches ${trend.direction === 'up' ? 'increased' : 'decreased'} ${Math.abs(trend.percent)}%.`,
      detail: `${item.previous_count} → ${item.current_count}`
    });
  }
  const currentRate = Number(snapshot.overview?.no_result_rate || 0);
  const previousRate = Number(snapshot.overview?.previous_no_result_rate || 0);
  const rateDifference = Math.round(currentRate - previousRate);
  if (snapshot.overview?.current?.searches >= INSIGHT_MIN_EVENTS
    && snapshot.overview?.previous?.searches >= INSIGHT_MIN_EVENTS
    && Math.abs(rateDifference) >= INSIGHT_MIN_PERCENT_CHANGE) {
    changes.push({
      id: 'no-results-rate',
      title: lang === 'es'
        ? `La tasa sin resultados ${rateDifference > 0 ? 'aumentó' : 'bajó'} ${Math.abs(rateDifference)} puntos.`
        : `The no-results rate ${rateDifference > 0 ? 'increased' : 'decreased'} by ${Math.abs(rateDifference)} points.`,
      detail: `${previousRate}% → ${currentRate}%`
    });
  }
  if (snapshot.quality?.needs_review > 0) {
    changes.push({
      id: 'needs-review',
      title: lang === 'es' ? `${snapshot.quality.needs_review} recursos necesitan revisión.` : `${snapshot.quality.needs_review} resources need review.`,
      detail: lang === 'es' ? 'Según la fecha de última verificación.' : 'Based on the last verification date.'
    });
  }
  return changes.slice(0, 5);
}
