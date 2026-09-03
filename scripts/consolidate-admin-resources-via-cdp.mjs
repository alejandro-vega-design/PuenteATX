#!/usr/bin/env node

import fs from 'node:fs';
import WebSocket from 'ws';

const [operationsFile, reportFile, debuggerUrl = 'http://127.0.0.1:9223/json/list'] = process.argv.slice(2);
const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!operationsFile || !reportFile || !supabaseUrl || !anonKey) {
  console.error('Usage: source .env.local && node scripts/consolidate-admin-resources-via-cdp.mjs <operations.json> <report.json>');
  process.exit(2);
}

const operations = JSON.parse(fs.readFileSync(operationsFile, 'utf8'));
if (!Array.isArray(operations) || !operations.length) throw new Error('Operations must be a non-empty JSON array.');
for (const operation of operations) {
  if (!operation.canonical_id || !operation.expected_canonical_status || !operation.expected_archive_status || !operation.patch || !Array.isArray(operation.archive_ids)) {
    throw new Error('Each operation requires canonical_id, expected_canonical_status, expected_archive_status, patch, and archive_ids.');
  }
}
const allArchiveIds = operations.flatMap(operation => operation.archive_ids);
if (new Set(allArchiveIds).size !== allArchiveIds.length) throw new Error('An archive ID appears more than once.');

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
    const operations = ${JSON.stringify(operations)};
    const base = ${JSON.stringify(`${supabaseUrl}/rest/v1`)};
    const headers = { apikey: ${JSON.stringify(anonKey)}, Authorization: 'Bearer ' + session.access_token, Accept: 'application/json' };
    const jsonHeaders = { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' };
    const ids = [...new Set(operations.flatMap(item => [item.canonical_id, ...item.archive_ids]))];
    const beforeResponse = await fetch(base + '/resources?id=in.(' + ids.join(',') + ')&select=*,resource_categories(category_id)', { headers });
    if (!beforeResponse.ok) throw new Error('Preflight failed: ' + beforeResponse.status);
    const before = await beforeResponse.json();
    const byId = new Map(before.map(row => [row.id, row]));
    const invalid = [];
    for (const item of operations) {
      if (byId.get(item.canonical_id)?.status !== item.expected_canonical_status) invalid.push(item.canonical_id);
      for (const id of item.archive_ids) if (byId.get(id)?.status !== item.expected_archive_status) invalid.push(id);
    }
    if (invalid.length) throw new Error('Preflight rejected IDs: ' + [...new Set(invalid)].join(','));

    const completed = [];
    const archivedAt = new Date().toISOString();
    for (const item of operations) {
      let canonicalRows;
      if (Object.keys(item.patch).length) {
        const canonicalResponse = await fetch(base + '/resources?id=eq.' + encodeURIComponent(item.canonical_id) + '&status=eq.' + item.expected_canonical_status + '&select=id,slug,status,organization_name,title_es,title_en,updated_at', {
          method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(item.patch)
        });
        if (!canonicalResponse.ok) throw new Error('Canonical update failed for ' + item.canonical_id + ': ' + canonicalResponse.status);
        canonicalRows = await canonicalResponse.json();
        if (canonicalRows.length !== 1) throw new Error('Canonical conditional update missed ' + item.canonical_id);
      } else {
        const canonical = byId.get(item.canonical_id);
        canonicalRows = [{
          id: canonical.id,
          slug: canonical.slug,
          status: canonical.status,
          organization_name: canonical.organization_name,
          title_es: canonical.title_es,
          title_en: canonical.title_en,
          updated_at: canonical.updated_at
        }];
      }

      if (Array.isArray(item.additional_category_ids)) {
        const deleteResponse = await fetch(base + '/resource_categories?resource_id=eq.' + encodeURIComponent(item.canonical_id), { method: 'DELETE', headers });
        if (!deleteResponse.ok) throw new Error('Category reset failed for ' + item.canonical_id + ': ' + deleteResponse.status);
        if (item.additional_category_ids.length) {
          const categoryResponse = await fetch(base + '/resource_categories', {
            method: 'POST', headers: jsonHeaders,
            body: JSON.stringify([...new Set(item.additional_category_ids)].map(category_id => ({ resource_id: item.canonical_id, category_id })))
          });
          if (!categoryResponse.ok) throw new Error('Category insert failed for ' + item.canonical_id + ': ' + categoryResponse.status);
        }
      }

      const archived = [];
      for (const id of item.archive_ids) {
        const response = await fetch(base + '/resources?id=eq.' + encodeURIComponent(id) + '&status=eq.' + encodeURIComponent(item.expected_archive_status) + '&select=id,slug,status,archived_at', {
          method: 'PATCH', headers: jsonHeaders, body: JSON.stringify({ status: 'archived', archived_at: archivedAt })
        });
        if (!response.ok) throw new Error('Archive failed for ' + id + ': ' + response.status);
        const rows = await response.json();
        if (rows.length !== 1 || rows[0].status !== 'archived') throw new Error('Conditional archive missed ' + id);
        archived.push(rows[0]);
      }
      completed.push({ canonical: canonicalRows[0], archived });
    }
    return { archivedAt, before, completed };
  })()
`;

try {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Browser evaluation failed');
  const report = result.result?.value;
  if (!report || report.completed?.length !== operations.length) throw new Error('Incomplete consolidation report.');
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`Consolidated ${report.completed.length} canonical resources and archived ${report.completed.flatMap(item => item.archived).length} duplicates. Report: ${reportFile}`);
} finally {
  socket.close();
}
