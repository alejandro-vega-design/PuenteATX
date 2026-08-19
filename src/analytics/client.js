import { ANALYTICS_SCHEMA_VERSION, validateEventPayload } from './events.js';

const SESSION_KEY = 'puente-atx:analytics-session:v1';
let language = 'es';
let memorySessionId = null;

function fallbackUuid() {
  if (!globalThis.crypto?.getRandomValues) return null;
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((value, index) => `${[4, 6, 8, 10].includes(index) ? '-' : ''}${value.toString(16).padStart(2, '0')}`).join('');
}

export function getAnonymousSessionId() {
  if (memorySessionId) return memorySessionId;
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return (memorySessionId = stored);
    const created = globalThis.crypto?.randomUUID?.() || fallbackUuid();
    sessionStorage.setItem(SESSION_KEY, created);
    return (memorySessionId = created);
  } catch {
    return (memorySessionId = globalThis.crypto?.randomUUID?.() || fallbackUuid());
  }
}

export function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

export function getClientEnvironment() {
  if (typeof window === 'undefined') return 'development';
  if (window.location.hostname === 'puenteatx.org' || window.location.hostname === 'www.puenteatx.org') return 'production';
  if (window.location.hostname.endsWith('.vercel.app')) return 'preview';
  return 'development';
}

export const setAnalyticsLanguage = value => {
  if (value === 'es' || value === 'en') language = value;
};

export async function trackPuenteEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return false;
  const validation = validateEventPayload({
    event_name: eventName,
    ...properties,
    anonymous_session_id: getAnonymousSessionId(),
    language,
    device_type: getDeviceType(),
    page_path: window.location.pathname,
    environment: getClientEnvironment(),
    schema_version: ANALYTICS_SCHEMA_VERSION
  });
  if (!validation.ok) {
    if (import.meta.env.DEV) console.info('[Puente Insights] event ignored', validation.error);
    return false;
  }
  try {
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.value),
      keepalive: true
    });
    return response.ok;
  } catch (error) {
    if (import.meta.env.DEV) console.info('[Puente Insights] tracking unavailable', error?.message);
    return false;
  }
}
