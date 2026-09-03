#!/usr/bin/env node

import fs from 'node:fs';
import WebSocket from 'ws';

const [idsFile, reportFile, debuggerUrl = 'http://127.0.0.1:9223/json/list'] = process.argv.slice(2);
const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!idsFile || !reportFile || !supabaseUrl || !anonKey) {
  console.error('Usage: source .env.local && node scripts/archive-admin-resources-via-cdp.mjs <ids.json> <report.json> [debugger-list-url]');
  process.exit(2);
}

const requestedIds = JSON.parse(fs.readFileSync(idsFile, 'utf8'));
if (!Array.isArray(requestedIds) || !requestedIds.length || requestedIds.some(id => typeof id !== 'string')) {
  throw new Error('The IDs file must contain a non-empty JSON array of resource IDs.');
}
if (new Set(requestedIds).size !== requestedIds.length) throw new Error('The IDs file contains duplicate IDs.');

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
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
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
    const ids = ${JSON.stringify(requestedIds)};
    const baseHeaders = {
      apikey: ${JSON.stringify(anonKey)},
      Authorization: 'Bearer ' + session.access_token,
      Accept: 'application/json'
    };
    const select = 'id,slug,status,organization_name,title_es,title_en,archived_at';
    const beforeResponse = await fetch(${JSON.stringify(`${supabaseUrl}/rest/v1/resources`)} + '?id=in.(' + ids.join(',') + ')&select=' + select, { headers: baseHeaders });
    if (!beforeResponse.ok) throw new Error('Preflight failed: ' + beforeResponse.status);
    const before = await beforeResponse.json();
    const byId = new Map(before.map(row => [row.id, row]));
    const invalid = ids.filter(id => !byId.has(id) || byId.get(id).status !== 'draft');
    if (invalid.length) throw new Error('Preflight rejected IDs: ' + invalid.join(','));

    const archivedAt = new Date().toISOString();
    const archived = [];
    for (const id of ids) {
      const response = await fetch(${JSON.stringify(`${supabaseUrl}/rest/v1/resources`)} + '?id=eq.' + encodeURIComponent(id) + '&status=eq.draft&select=' + select, {
        method: 'PATCH',
        headers: { ...baseHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ status: 'archived', archived_at: archivedAt })
      });
      if (!response.ok) throw new Error('Archive failed for ' + id + ': ' + response.status);
      const rows = await response.json();
      if (rows.length !== 1 || rows[0].status !== 'archived') throw new Error('Conditional archive did not update ' + id);
      archived.push(rows[0]);
    }
    return { archivedAt, requestedIds: ids, before, archived };
  })()
`;

try {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Browser evaluation failed');
  const report = result.result?.value;
  if (!report || report.archived?.length !== requestedIds.length) throw new Error('Incomplete archive report.');
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`Archived ${report.archived.length} draft resources. Report: ${reportFile}`);
} finally {
  socket.close();
}
