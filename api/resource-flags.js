const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REASONS = new Set(['wrong_contact', 'closed', 'wrong_hours', 'outdated', 'other']);

const json = (response, status, body) => response.status(status).json(body);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { ok: false });
  }
  if (JSON.stringify(request.body || {}).length > 4096) return json(response, 413, { ok: false });

  const body = request.body || {};
  // Honeypot: same convention as api/conversation.js — a real visitor never fills
  // this hidden field, so a filled one is a bot; pretend success without writing.
  if (body.website) return json(response, 202, { ok: true });

  const resourceId = String(body.resource_id || '');
  const sessionId = String(body.session_id || '');
  const lang = body.lang === 'en' ? 'en' : body.lang === 'es' ? 'es' : null;
  const reasons = Array.isArray(body.reasons) ? [...new Set(body.reasons.filter(reason => REASONS.has(reason)))] : [];
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';
  const areaCode = typeof body.area_code === 'string' && body.area_code ? body.area_code.slice(0, 10) : null;

  if (!UUID_PATTERN.test(resourceId)) return json(response, 400, { ok: false });
  if (!UUID_PATTERN.test(sessionId)) return json(response, 400, { ok: false });
  if (!lang) return json(response, 400, { ok: false });
  if (reasons.length === 0) return json(response, 400, { ok: false });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return json(response, 503, { ok: false });

  try {
    const resourceResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/resources?id=eq.${encodeURIComponent(resourceId)}&status=eq.published&select=id&limit=1`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
    });
    if (!resourceResponse.ok || !(await resourceResponse.json())[0]) return json(response, 400, { ok: false });

    const insertResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/resource_flags`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ resource_id: resourceId, reasons, note: note || null, session_id: sessionId, lang, area_code: areaCode })
    });
    if (!insertResponse.ok) return json(response, 500, { ok: false });
    return json(response, 202, { ok: true });
  } catch {
    return json(response, 500, { ok: false });
  }
}
