#!/usr/bin/env node

import fs from 'node:fs';
import WebSocket from 'ws';

const [outputFile, debuggerUrl = 'http://127.0.0.1:9223/json/list'] = process.argv.slice(2);
const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!outputFile || !supabaseUrl || !anonKey) {
  console.error('Usage: source .env.local && node scripts/export-admin-resource-usage-via-cdp.mjs <output.json>');
  process.exit(2);
}

const targets = await fetch(debuggerUrl).then(response => response.json());
const target = targets.find(item => item.type === 'page' && /127\.0\.0\.1:4173\/admin/.test(item.url));
if (!target?.webSocketDebuggerUrl) throw new Error('Authenticated Puente ATX admin tab not found.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
});
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const expression = `
  (async () => {
    const session = JSON.parse(sessionStorage.getItem('puente-atx:admin-session') || 'null');
    if (!session?.access_token) throw new Error('Admin session missing');
    const headers = {
      apikey: ${JSON.stringify(anonKey)}, Authorization: 'Bearer ' + session.access_token,
      Accept: 'application/json', 'Content-Type': 'application/json'
    };
    const end = new Date();
    const snapshotResponse = await fetch(${JSON.stringify(`${supabaseUrl}/rest/v1/rpc/get_insights_snapshot`)}, {
      method: 'POST', headers,
      body: JSON.stringify({
        p_start_date: '2020-01-01T00:00:00.000Z', p_end_date: end.toISOString(),
        p_environment: 'production', p_language: null, p_device_type: null, p_page_path: null
      })
    });
    if (!snapshotResponse.ok) throw new Error('Insights export failed: ' + snapshotResponse.status);
    const snapshot = await snapshotResponse.json();
    const referralsResponse = await fetch(${JSON.stringify(`${supabaseUrl}/rest/v1/referrals?select=id,resource_id,status,created_at`)}, { headers });
    const referrals = referralsResponse.ok ? await referralsResponse.json() : [];
    return { generated_at: end.toISOString(), resources: snapshot.resources || [], referrals };
  })()
`;

try {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Browser evaluation failed');
  const report = result.result?.value;
  if (!report || !Array.isArray(report.resources) || !Array.isArray(report.referrals)) throw new Error('Invalid usage report.');
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`Exported usage for ${report.resources.length} active resources and ${report.referrals.length} referrals to ${outputFile}.`);
} finally {
  socket.close();
}
