// Legacy control: full wire receipts plus existing failure text/class/options.
// The comparison retains random WebSocket keys in a separate raw receipt.
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { writeFileSync } from 'node:fs';
import net from 'node:net';
import { createHash } from 'node:crypto';
import { WebSocketTransport } from '../src/mcpl/transport.ts';
const output = process.env.T2F13_ARTIFACT; assert.ok(output);
const raw = []; const normalized = []; const logs = []; const failures = {};
const originalError = console.error;
console.error = (...args) => logs.push(args.map(String).join(' '));
const requestList = []; const wireSockets = new Set();
// Raw server: retain actual incoming bytes, including all header whitespace,
// order and casing; delay the FIRST response to observe any premature frames.
const wss = net.createServer(socket => {
  wireSockets.add(socket); socket.on('close', () => wireSockets.delete(socket));
  let incoming = Buffer.alloc(0), responding = false, scheduled = false;
  socket.on('data', chunk => {
    if (responding) { socket.end(Buffer.from([0x88, 0x00])); return; }
    incoming = Buffer.concat([incoming, chunk]);
    const end = incoming.indexOf('\r\n\r\n');
    if (end < 0 || scheduled) return;
    scheduled = true;
    setTimeout(() => {
      const bytes = incoming.subarray(0, end + 4).toString('latin1');
      requestList.push({ bytes, preResponse: incoming.subarray(end + 4).toString('hex') });
      const key = bytes.match(/^Sec-WebSocket-Key: ([^\r]+)\r$/im)[1];
      const accept = createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
      responding = true;
      socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    }, 20);
  });
});
wss.listen(0, '127.0.0.1'); await once(wss, 'listening');
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
    const bytes = fixedPorts(request.bytes);
    assert.equal(request.preResponse, '', 'no frames before the first server response');
    raw.push({ mode, result, bytes, preResponse: request.preResponse });
    // Manager-approved C(2) exception: normalize ONLY this random value.
    // Retain it verbatim in raw; no production client is replaced or wrapped.
    normalized.push({ mode, result, preResponse: request.preResponse, bytes: bytes.replace(/^(Sec-WebSocket-Key: )[^\r]+/im, '$1<RANDOM-HANDSHAKE-KEY>') });
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
  for (const socket of wireSockets) socket.destroy();
  await new Promise(r => server.close(r)); await new Promise(r => wss.close(r));
}
console.log('legacy wire and failure receipts captured');
