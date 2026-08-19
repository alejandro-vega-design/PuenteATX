import { getSupabaseAnonKey, getSupabaseUrl } from '../data/supabaseClient';
import { getSessionAssuranceLevel } from './adminAuth';

async function mfaRequest(path, session, { method = 'POST', body } = {}) {
  const response = await fetch(`${getSupabaseUrl()}/auth/v1${path}`, {
    method,
    headers: {
      apikey: getSupabaseAnonKey(),
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const error = new Error(details.msg || details.message || 'mfa_request_failed');
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

export const getTotpFactors = session => (session?.user?.factors || []).filter(factor => factor.factor_type === 'totp');
export const getVerifiedTotpFactors = session => getTotpFactors(session).filter(factor => factor.status === 'verified');
export const requiresAdminMfa = session => Boolean(session && session.access_token !== 'demo-admin' && getSessionAssuranceLevel(session.access_token) !== 'aal2');

export function totpQrSource(value) {
  if (!value) return '';
  const source = String(value).trim();
  if (source.startsWith('data:') || source.startsWith('http')) return source;
  const svgStart = source.indexOf('<svg');
  if (svgStart >= 0) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source.slice(svgStart))}`;
  if (source.startsWith('%3C') || source.startsWith('%3c')) {
    try {
      const decoded = decodeURIComponent(source);
      const decodedSvgStart = decoded.indexOf('<svg');
      if (decodedSvgStart >= 0) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(decoded.slice(decodedSvgStart))}`;
    } catch { return ''; }
  }
  return '';
}

export async function beginTotpEnrollment(session) {
  const unverified = getTotpFactors(session).filter(factor => factor.status !== 'verified');
  await Promise.all(unverified.map(factor => mfaRequest(`/factors/${factor.id}`, session, { method: 'DELETE' }).catch(() => null)));
  return mfaRequest('/factors', session, { body: { factor_type: 'totp', friendly_name: 'Puente ATX' } });
}

export const createTotpChallenge = (session, factorId) => mfaRequest(`/factors/${factorId}/challenge`, session, { body: {} });

export async function verifyTotpChallenge(session, factorId, challengeId, code) {
  const result = await mfaRequest(`/factors/${factorId}/verify`, session, { body: { challenge_id: challengeId, code } });
  return {
    ...session,
    ...result,
    user: result.user || session.user,
    expires_at: result.expires_at || (result.expires_in ? Math.floor(Date.now() / 1000) + result.expires_in : session.expires_at),
    assurance_level: 'aal2'
  };
}
