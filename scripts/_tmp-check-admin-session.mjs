#!/usr/bin/env node
import WebSocket from 'ws';

const debuggerUrl = 'http://127.0.0.1:9223/json/list';
const targets = await fetch(debuggerUrl).then(r => r.json());
const target = targets.find(t => t.type === 'page' && /puenteatx\.org\/admin/.test(t.url));
if (!target) throw new Error('No admin tab found on 9223');

const socket = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
socket.addEventListener('message', e => {
  const msg = JSON.parse(e.data);
  if (!msg.id || !pending.has(msg.id)) return;
  const { resolve, reject } = pending.get(msg.id);
  pending.delete(msg.id);
  msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
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
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src).filter(s => s.includes('/assets/'));
    let supabaseUrl = null;
    let anonKey = null;
    const debugSizes = [];
    for (const src of scripts) {
      try {
        const text = await fetch(src).then(r => r.text());
        debugSizes.push([src, text.length]);
        const mUrl = text.match(/https:\/\/[a-z0-9-]+\.supabase\.co/);
        if (mUrl && !supabaseUrl) supabaseUrl = mUrl[0];
        const mKey = text.match(/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/);
        if (mKey && !anonKey) anonKey = mKey[0];
      } catch (e) {
        debugSizes.push([src, 'ERR:' + e.message]);
      }
    }
    return {
      hasSession: !!session?.access_token,
      email: session?.user?.email || null,
      role: session?.profile?.role || null,
      expiresAt: session?.expires_at || null,
      supabaseUrlGuess: supabaseUrl,
      anonKeyGuess: anonKey,
      debugSizes
    };
  })()
`;

try {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'eval failed');
  console.log(JSON.stringify(result.result?.value, null, 2));
} finally {
  socket.close();
}
