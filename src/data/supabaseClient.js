const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const hasSupabaseConfig = Boolean(url && anonKey);
export const isDemoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

export async function supabaseRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured');
  const response = await fetch(`${url}${path}`, {
    method,
    headers: { apikey: anonKey, Authorization: `Bearer ${token || anonKey}`, 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) {
    let details = {};
    try { details = await response.json(); } catch { details = { message: await response.text().catch(() => '') }; }
    const error = new Error(details.message || 'The data request could not be completed');
    error.code = details.code;
    error.details = details.details;
    error.hint = details.hint;
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

export const getSupabaseUrl = () => url;
export const getSupabaseAnonKey = () => anonKey;
