import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseConfig, isDemoEnabled, supabaseRequest } from '../data/supabaseClient';

const SESSION_KEY = 'puente-atx:admin-session';
export const ADMIN_SESSION_EXPIRED_EVENT = 'puente-atx:admin-session-expired';
export const getAdminSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
export const clearAdminSession = () => sessionStorage.removeItem(SESSION_KEY);
export const saveAdminSession = session => sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
export const expireAdminSession = () => {
  clearAdminSession();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EXPIRED_EVENT));
};

const profileFor = async session => {
  const profiles = await supabaseRequest(`/rest/v1/admin_profiles?id=eq.${session.user.id}&select=*&limit=1`, { token: session.access_token });
  let memberships = [];
  try {
    memberships = await supabaseRequest(`/rest/v1/organization_users?user_id=eq.${session.user.id}&status=eq.active&select=id,organization_id,role,status,organizations(id,name,slug,status)`, { token: session.access_token });
  } catch (error) {
    // Keep existing administrators operational until the Community Passport
    // migrations have been applied in a given environment.
    if (!profiles[0] && error.status !== 404) throw error;
  }
  if (!profiles[0] && memberships.length === 0) throw new Error('not_authorized');
  return {
    ...(profiles[0] || { id: session.user.id, role: null, display_name: session.user.email }),
    organization_memberships: memberships
  };
};

export function getSessionAssuranceLevel(accessToken) {
  if (accessToken === 'demo-admin') return 'aal2';
  try {
    const encoded = accessToken?.split('.')[1];
    if (!encoded) return 'aal1';
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    return payload.aal === 'aal2' ? 'aal2' : 'aal1';
  } catch {
    return 'aal1';
  }
}

let refreshInFlight = null;
async function refreshSession(refreshToken) {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const response = await fetch(`${getSupabaseUrl()}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: getSupabaseAnonKey(), 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refreshToken }) });
    if (!response.ok) throw new Error('session_expired');
    const session = await response.json();
    return { ...session, expires_at: session.expires_at || Math.floor(Date.now() / 1000) + session.expires_in };
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function validateAdminSession(stored, { forceRefresh = false } = {}) {
  if (!stored) return null;
  if (!hasSupabaseConfig) return isDemoEnabled && stored.access_token === 'demo-admin' ? stored : null;
  let session = forceRefresh && stored.refresh_token ? await refreshSession(stored.refresh_token) : stored;
  let response = await fetch(`${getSupabaseUrl()}/auth/v1/user`, { headers: { apikey: getSupabaseAnonKey(), Authorization: `Bearer ${session.access_token}` } });
  if (!response.ok && session.refresh_token) {
    session = await refreshSession(session.refresh_token);
    response = await fetch(`${getSupabaseUrl()}/auth/v1/user`, { headers: { apikey: getSupabaseAnonKey(), Authorization: `Bearer ${session.access_token}` } });
  }
  if (!response.ok) throw new Error('session_expired');
  const user = await response.json();
  const result = { ...session, user, profile: await profileFor({ ...session, user }), assurance_level: getSessionAssuranceLevel(session.access_token) };
  saveAdminSession(result);
  return result;
}

export async function signInAdmin(email, password) {
  if (!hasSupabaseConfig) {
    if (isDemoEnabled) return { access_token: 'demo-admin', user: { email, id: 'demo-admin' }, profile: { role: 'admin', display_name: 'Administrador local', organization_memberships: [] }, assurance_level: 'aal2' };
    throw new Error('supabase_not_configured');
  }
  const response = await fetch(`${getSupabaseUrl()}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: getSupabaseAnonKey(), 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error('invalid_credentials');
  const session = await response.json();
  const result = { ...session, profile: await profileFor(session), assurance_level: getSessionAssuranceLevel(session.access_token) };
  saveAdminSession(result);
  return result;
}
