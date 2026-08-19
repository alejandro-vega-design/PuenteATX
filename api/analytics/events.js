import { validateEventPayload } from '../../src/analytics/events.js';

const json = (response, status, body) => response.status(status).json(body);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { ok: false });
  }
  if (JSON.stringify(request.body || {}).length > 8192) return json(response, 413, { ok: false });
  const validation = validateEventPayload(request.body);
  if (!validation.ok) return json(response, 400, { ok: false });
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return json(response, 503, { ok: false });
  const environment = process.env.VERCEL_ENV === 'production'
    ? 'production'
    : process.env.VERCEL_ENV === 'preview'
      ? 'preview'
      : 'development';
  const payload = { ...validation.value, environment };
  try {
    if (payload.resource_id) {
      const resourceResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/resources?id=eq.${encodeURIComponent(payload.resource_id)}&status=eq.published&select=id&limit=1`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
      });
      if (!resourceResponse.ok || !(await resourceResponse.json())[0]) return json(response, 400, { ok: false });
    }
    const insertResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!insertResponse.ok) return json(response, 500, { ok: false });
    return json(response, 202, { ok: true });
  } catch {
    return json(response, 500, { ok: false });
  }
}
