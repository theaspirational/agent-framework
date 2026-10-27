// Legacy control: full wire receipts plus existing failure text/class/options.
// The comparison retains random WebSocket keys in a separate raw receipt.
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { writeFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';
import { WebSocketTransport } from '../src/mcpl/transport.ts';
const output = process.env.T2F13_ARTIFACT; assert.ok(output);
const raw = []; const normalized = []; const logs = []; const failures = {};
const originalError = console.error;
console.error = (...args) => logs.push(args.map(String).join(' '));
const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
const requestList = [];
wss.on('connection', (_ws, req) => requestList.push(req));
await once(wss, 'listening');
const server = http.createServer(); const held = new Set();
server.on('upgrade', (req, socket) => {
  held.add(socket); socket.on('close', () => held.delete(socket));
  if (req.url !== '/timeout') socket.end('HTTP/1.1 403 Refused\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const ports = [String(wss.address().port), String(server.address().port)];
function fixedPorts(text) { for (const port of ports) text = text.replaceAll(`127.0.0.1:${port}`, '127.0.0.1:PORT'); return text; }
async function fails(name, config, signal) {
  const keys = Reflect.ownKeys(config);
  let error;
  try { const t = await WebSocketTransport.open(config, signal); await t.close(); }
  catch (e) { error = e; }
  assert.ok(error instanceof Error, `${name} must fail`);
  assert.deepEqual(Reflect.ownKeys(config), keys);
  failures[name] = {
    text: fixedPorts(error.message), class: error.constructor.name,
    prototype: Object.getPrototypeOf(error).constructor.name,
    keys: Reflect.ownKeys(error), cause: 'cause' in error,
    descriptors: Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(error)).map(([k,d]) => [k,
      { enumerable: d.enumerable, configurable: d.configurable, writable: d.writable }])),
  };
}
try {
  for (const mode of ['header', 'query']) for (const result of ['throws', 'null', 'empty', 'value']) {
    const c = { id: 'legacy', url: `ws://127.0.0.1:${wss.address().port}/mcpl?x=1`, tokenTransport: mode,
      token: 'CANARY-wire-public-static', accessProvider: async function() {
        assert.equal(this, c);
        if (result === 'throws') throw new TypeError('synthetic provider failure');
        return result === 'null' ? null : result === 'empty' ? '' : 'CANARY-wire-public-provider';
      } };
    const t = await WebSocketTransport.open(c); await t.close();
    const request = requestList.at(-1);
    const bytes = fixedPorts(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n` +
      Array.from({ length: request.rawHeaders.length / 2 }, (_, i) => `${request.rawHeaders[2*i]}: ${request.rawHeaders[2*i+1]}\r\n`).join('') + '\r\n');
    raw.push({ mode, result, bytes });
    // Keep the random key verbatim in raw. The manager decides whether its
    // explicit exclusion is sufficient for C(2); no production client is replaced.
    normalized.push({ mode, result, bytes: bytes.replace(/^(Sec-WebSocket-Key: )[^\r]+/im, '$1<RANDOM-HANDSHAKE-KEY>') });
  }
  const base = { id: 'legacy', url: `ws://127.0.0.1:${server.address().port}/mcpl` };
  await fails('refused', base);
  await fails('connect failure', { ...base, url: 'ws://127.0.0.1:1/mcpl' });
  const controller = new AbortController(); let release;
  const p = fails('abandon', { ...base, accessProvider: () => new Promise(r => { release = r; }) }, controller.signal);
  controller.abort(); await p; release('CANARY-late-public-synthetic');
  await fails('timeout', { ...base, url: `ws://127.0.0.1:${server.address().port}/timeout` });
  for (const [label, fields] of [
    ['missing url', { url: undefined }], ['invalid url', { url: 'invalid synthetic url' }],
    ['wrong scheme', { url: 'http://127.0.0.1/mcpl' }], ['fragment', { url: base.url + '#synthetic' }],
    ['invalid mode', { tokenTransport: 'synthetic-invalid' }],
    ['header query token', { url: base.url + '?token=synthetic', tokenTransport: 'header' }],
    ['header userinfo', { url: base.url.replace('://', '://synthetic:synthetic@'), tokenTransport: 'header' }],
    ['unusable header', { token: 'synthetic\ninvalid', tokenTransport: 'header' }],
    ['constructor refusal', { url: base.url.replace('://', '://%zz@') }],
  ]) await fails(label, { ...base, ...fields });
  writeFileSync(output, JSON.stringify({ wire: normalized, raw, logs, failures }, null, 2));
} finally {
  console.error = originalError;
  for (const socket of held) socket.destroy();
  for (const ws of wss.clients) ws.terminate();
  await new Promise(r => server.close(r)); await new Promise(r => wss.close(r));
}
console.log('legacy wire and failure receipts captured');
