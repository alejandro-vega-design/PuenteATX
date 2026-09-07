const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const hasSupabaseConfig = Boolean(url && anonKey);
export const isDemoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

// On a slow/flaky cellular connection a request can stall indefinitely instead of
// failing outright, leaving the caller's loading state stuck forever with no way
// to recover short of a manual reload. Cap every public read at REQUEST_TIMEOUT_MS.
//
// This forwards into its own AbortController by hand rather than via
// AbortSignal.any([signal, AbortSignal.timeout(ms)]) — verified live against this
// exact combination that the abort from the timeout signal silently never
// propagated through .any() (the request ran to completion, uncancelled); a plain
// setTimeout + controller.abort(reason) reliably aborted the same request. Keep it
// this way unless that combinator behavior is reconfirmed fixed everywhere this runs.
//
// The timeout and a caller-supplied signal (used to cancel a request superseded by
// a newer search) stay distinguishable: a timeout aborts with a `TimeoutError`
// reason, a caller-triggered abort forwards whatever reason the caller used
// (`AbortError` for a plain .abort()). Existing `error.name !== 'AbortError'`
// checks in ResourcesPage/ResourceFinderPage already surface a timeout as a real
// error (and stop the loading state) without needing any changes there — a
// superseded-request abort still stays silent.
const REQUEST_TIMEOUT_MS = 20000;

export async function supabaseRequest(path, { method = 'GET', body, token, headers = {}, signal } = {}) {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured');
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(new DOMException('The request timed out.', 'TimeoutError')), REQUEST_TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) timeoutController.abort(signal.reason);
    else signal.addEventListener('abort', () => timeoutController.abort(signal.reason), { once: true });
  }
  try {
    const response = await fetch(`${url}${path}`, {
      method,
      headers: { apikey: anonKey, Authorization: `Bearer ${token || anonKey}`, 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: timeoutController.signal
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
  } finally {
    clearTimeout(timer);
  }
}

export const getSupabaseUrl = () => url;
export const getSupabaseAnonKey = () => anonKey;
