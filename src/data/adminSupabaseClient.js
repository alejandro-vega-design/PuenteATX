import { supabaseRequest } from './supabaseClient';
import { expireAdminSession, getAdminSession, validateAdminSession } from '../services/adminAuth';

const REFRESH_BUFFER_SECONDS = 90;

const sessionExpiredError = () => {
  const error = new Error('session_expired');
  error.code = 'session_expired';
  error.status = 401;
  return error;
};

const needsRefresh = session => (
  !session?.access_token
  || (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + REFRESH_BUFFER_SECONDS)
);

async function validAdminSession({ forceRefresh = false } = {}) {
  const stored = getAdminSession();
  if (!stored) throw sessionExpiredError();
  if (!forceRefresh && !needsRefresh(stored)) return stored;
  try {
    const refreshed = await validateAdminSession(stored, { forceRefresh: Boolean(stored.refresh_token) });
    if (!refreshed?.access_token) throw sessionExpiredError();
    return refreshed;
  } catch {
    expireAdminSession();
    throw sessionExpiredError();
  }
}

/**
 * Makes an authenticated admin request with a fresh token. A request rejected
 * with 401 is refreshed and retried once so a sleeping browser tab does not
 * leave the dashboard looking signed in while all saves silently fail.
 */
export async function adminSupabaseRequest(path, options = {}) {
  let session = await validAdminSession();
  try {
    return await supabaseRequest(path, { ...options, token: session.access_token });
  } catch (error) {
    if (error.status !== 401) throw error;
    session = await validAdminSession({ forceRefresh: true });
    try {
      return await supabaseRequest(path, { ...options, token: session.access_token });
    } catch (retryError) {
      if (retryError.status === 401) {
        expireAdminSession();
        throw sessionExpiredError();
      }
      throw retryError;
    }
  }
}
