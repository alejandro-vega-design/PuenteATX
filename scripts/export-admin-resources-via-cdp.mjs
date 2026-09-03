#!/usr/bin/env node

import fs from 'node:fs';
import WebSocket from 'ws';

const [outputFile, debuggerUrl = 'http://127.0.0.1:9223/json/list'] = process.argv.slice(2);
const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!outputFile || !supabaseUrl || !anonKey) {
  console.error('Usage: source .env.local && node scripts/export-admin-resources-via-cdp.mjs <output.json> [debugger-list-url]');
  process.exit(2);
}

const targets = await fetch(debuggerUrl).then(response => response.json());
const target = targets.find(item => item.type === 'page' && /127\.0\.0\.1:4173\/admin/.test(item.url));
if (!target?.webSocketDebuggerUrl) {
  console.error('Authenticated Puente ATX admin tab not found.');
  process.exit(1);
}

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
    const response = await fetch(${JSON.stringify(`${supabaseUrl}/rest/v1/resources?select=*,resource_categories(category_id)&order=created_at.asc`)}, {
      headers: {
        apikey: ${JSON.stringify(anonKey)},
        Authorization: 'Bearer ' + session.access_token,
        Accept: 'application/json'
      }
    });
    if (!response.ok) throw new Error('Admin export failed: ' + response.status);
    return await response.json();
  })()
`;

try {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Browser evaluation failed');
  const resources = result.result?.value;
  if (!Array.isArray(resources)) throw new Error('Admin export did not return an array');
  fs.writeFileSync(outputFile, `${JSON.stringify(resources, null, 2)}\n`, { mode: 0o600 });
  console.log(`Exported ${resources.length} resources to ${outputFile}.`);
} finally {
  socket.close();
}
