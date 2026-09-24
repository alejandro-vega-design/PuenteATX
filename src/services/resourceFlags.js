import { getAnonymousSessionId, getOriginAreaCode } from '../analytics/client';

const FLAGGED_KEY = 'puente-atx:flagged-resources:v1';

function readFlaggedIds() {
  try {
    const stored = sessionStorage.getItem(FLAGGED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

// Client-side only: keeps someone from reporting the same resource twice in a
// row from this browser session. Not a hard cap — clearing session storage or
// opening a new tab resets it, which is fine, this is about accidental
// double-submits, not abuse prevention.
export function hasFlaggedResource(resourceId) {
  return readFlaggedIds().has(resourceId);
}

function markResourceFlagged(resourceId) {
  const ids = readFlaggedIds();
  ids.add(resourceId);
  try { sessionStorage.setItem(FLAGGED_KEY, JSON.stringify([...ids])); } catch { /* best-effort only */ }
}

export async function submitResourceFlag({ resourceId, reasons, note, lang }) {
  const response = await fetch('/api/resource-flags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource_id: resourceId,
      reasons,
      note: note || '',
      lang,
      session_id: getAnonymousSessionId(),
      area_code: getOriginAreaCode()
    })
  });
  if (!response.ok) throw new Error('resource_flag_failed');
  markResourceFlagged(resourceId);
  return response.json();
}
