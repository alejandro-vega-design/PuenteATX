const STORAGE_KEY = 'puente-atx:saved-resources:v1';
const VERSION = 1;
const MAX_ITEMS = 50;
const listeners = new Set();
let memoryFallback = [];

const clean = slugs => [...new Set((Array.isArray(slugs) ? slugs : []).filter(slug => typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))].slice(0, MAX_ITEMS);
const emit = slugs => listeners.forEach(listener => listener(slugs));

export function getSavedResources() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!value || value.version !== VERSION) return memoryFallback;
    return clean(value.slugs);
  } catch { return memoryFallback; }
}

function write(slugs) {
  const cleaned = clean(slugs); memoryFallback = cleaned;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, slugs: cleaned, updatedAt: new Date().toISOString() })); } catch { /* Memory fallback remains available. */ }
  emit(cleaned); return cleaned;
}

export const saveResource = slug => write([...getSavedResources(), slug]);
export const removeResource = slug => write(getSavedResources().filter(item => item !== slug));
export const toggleResource = slug => getSavedResources().includes(slug) ? removeResource(slug) : saveResource(slug);
export const isResourceSaved = slug => getSavedResources().includes(slug);
export const clearSavedResources = () => write([]);
export const importSharedList = slugs => write([...getSavedResources(), ...clean(slugs)]);
export const exportSharedList = () => clean(getSavedResources());
export const parseSharedList = value => clean((value || '').split(',')).slice(0, 20);

export function subscribeSavedResources(listener) {
  listeners.add(listener);
  const storage = event => event.key === STORAGE_KEY && listener(getSavedResources());
  window.addEventListener('storage', storage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', storage); };
}
