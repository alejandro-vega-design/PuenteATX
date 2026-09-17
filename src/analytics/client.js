import { ANALYTICS_SCHEMA_VERSION, validateEventPayload } from './events.js';

const SESSION_KEY = 'puente-atx:analytics-session:v1';
// The ZIP/area a session first searched, so later interaction events (a call,
// a directions click) on a resource in a DIFFERENT county still carry where
// the person's need originated — e.g. a Williamson-area search that ends in a
// Travis-county resource stays attributable to Williamson. First-write-wins:
// we never overwrite it later in the same browser session (see
// setOriginAreaCode), so it answers "where did this need start," not "where
// did they most recently look."
const ORIGIN_AREA_KEY = 'puente-atx:analytics-origin-area:v1';
let language = 'es';
let memorySessionId = null;
let memoryOriginAreaCode;

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

export function getOriginAreaCode() {
  if (memoryOriginAreaCode !== undefined) return memoryOriginAreaCode;
  try {
    return (memoryOriginAreaCode = sessionStorage.getItem(ORIGIN_AREA_KEY) || null);
  } catch {
    return (memoryOriginAreaCode = null);
  }
}

// Call this wherever a real ZIP is searched (never with "all"/"undisclosed").
// First-write-wins for the life of the browser session — see the note above.
export function setOriginAreaCode(areaCode) {
  if (!areaCode || getOriginAreaCode()) return;
  memoryOriginAreaCode = areaCode;
  try { sessionStorage.setItem(ORIGIN_AREA_KEY, areaCode); } catch { /* best-effort only */ }
}

export async function trackPuenteEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return false;
  // A caller reporting its own area (search forms already compute one) wins;
  // otherwise fall back to the session's origin area so a later interaction
  // (a call, a directions click) still carries where the need started, even
  // on a resource in a different county. Harmless no-op for event types that
  // don't allow area_code at all — validateEventPayload just drops it.
  const areaCode = Object.prototype.hasOwnProperty.call(properties, 'area_code') ? properties.area_code : getOriginAreaCode();
  const validation = validateEventPayload({
    event_name: eventName,
    ...properties,
    area_code: areaCode,
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
