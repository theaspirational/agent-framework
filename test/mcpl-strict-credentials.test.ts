/** Production-path, synthetic-only strict dial probes; every test is also run
 * against a base-source overlay. Labels distinguish additions from controls. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { WebSocketServer } from 'ws';
import type { AddressInfo } from 'node:net';
import { WebSocketTransport } from '../src/mcpl/transport.js';
import { serverConfigProblems } from '../src/mcpl/protocol-family.js';
import { McplServerConnection } from '../src/mcpl/server-connection.js';
import type { McplServerConfig } from '../src/mcpl/types.js';

type Config = McplServerConfig & { credentialRequired?: unknown };
const canary = () => `CANARY-${randomBytes(12).toString('hex')}`;
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
async function mock(status?: number, location?: string) {
  const requests: http.IncomingMessage[] = [];
  const server = http.createServer();
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    requests.push(req);
    if (status) {
      socket.end(`HTTP/1.1 ${status} Refused\r\n${location ? `Location: ${location}\r\n` : ''}Content-Length: 0\r\nConnection: close\r\n\r\n`);
    } else {
      wss.handleUpgrade(req, socket, head, ws => {
        wss.emit('connection', ws, req);
        ws.on('message', data => {
          const m = JSON.parse(String(data));
          if (m.id === undefined) return;
          const result = m.method === 'initialize'
            ? { protocolVersion: '2024-11-05', capabilities: { experimental: { mcpl: { version: '0.4', pushEvents: true } } } }
            : { tools: [] };
          ws.send(JSON.stringify({ jsonrpc: '2.0', id: m.id, result }));
        });
      });
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}/mcpl`;
  return { requests, wss, url, async close() {
    for (const ws of wss.clients) ws.terminate();
    await new Promise<void>(r => server.close(() => r()));
    wss.close();
  } };
}
function config(url: string, fields: Record<string, unknown> = {}): Config {
  return { id: 'strict-server', url, credentialRequired: true, tokenTransport: 'header', accessProvider: async () => canary(), ...fields } as Config;
}
async function rejected(c: Config, reason: string, signal?: AbortSignal) {
  let error: unknown;
  try { const t = await WebSocketTransport.open(c as McplServerConfig, signal); await t.close(); }
  catch (e) { error = e; }
  assert.ok(error instanceof Error, 'dial must reject');
  assert.equal(error.message, `MCPL server "strict-server": ${reason}`);
  assert.equal(error.constructor, Error);
  assert.equal('cause' in error, false);
  assert.deepEqual(Object.keys(error), []);
}

for (const [label, provided, reason] of [
  ['null', null, 'provider-empty'], ['empty', '', 'provider-empty'],
  ['leading space', ' x', 'credential-unusable'], ['trailing space', 'x ', 'credential-unusable'],
  ['control', 'x\nx', 'credential-unusable'], ['non-ASCII', 'xé', 'credential-unusable'],
  ['number', 17, 'credential-unusable'], ['object', {}, 'credential-unusable'],
] as const) test(`new: strict provider ${label} refuses with zero upgrades`, async () => {
  const s = await mock();
  try {
    await rejected(config(s.url, { accessProvider: async () => provided }), reason);
    assert.equal(s.requests.length, 0);
  } finally { await s.close(); }
});

test('new: strict throwing provider never falls back or exposes its error', async () => {
  const s = await mock();
  try {
    await rejected(config(s.url, { accessProvider: async () => { throw new Error(canary(), { cause: canary() }); } }), 'provider-threw');
    assert.equal(s.requests.length, 0);
  } finally { await s.close(); }
});

test('new: strict missing provider refuses with zero upgrades', async () => {
  const s = await mock();
  try { await rejected(config(s.url, { accessProvider: undefined }), 'provider-empty'); assert.equal(s.requests.length, 0); }
  finally { await s.close(); }
});

test('new: strict server refusal is fixed-code, one authenticated attempt, no fallback', async () => {
  const s = await mock(401); const token = canary();
  try {
    await rejected(config(s.url, { accessProvider: async () => token }), 'credential-unusable');
    assert.equal(s.requests.length, 1);
    assert.equal(s.requests[0].headers.authorization, `Bearer ${token}`);
    assert.equal(s.requests[0].url, '/mcpl');
  } finally { await s.close(); }
});

for (const [label, fields] of [
  ['static token', { token: canary() }], ['empty static token', { token: '' }],
  ['query', { tokenTransport: 'query' }], ['omitted transport mode', { tokenTransport: undefined }],
  ['query token', { url: 'ws://127.0.0.1/mcpl?token=synthetic' }],
  ['userinfo', { url: 'ws://synthetic:synthetic@127.0.0.1/mcpl' }],
  ['cleartext remote', { url: 'ws://192.0.2.1/mcpl' }],
  ['http', { url: 'http://127.0.0.1/mcp', tokenTransport: undefined }],
  ['https', { url: 'https://127.0.0.1/mcp', tokenTransport: undefined }],
  ['stdio', { url: undefined, command: 'never-spawn', tokenTransport: undefined }],
  ['modern', { url: undefined, command: 'never-spawn', protocol: 'modern', tokenTransport: undefined, accessProvider: undefined }],
] as const) test(`${['query token', 'userinfo'].includes(label) ? 'control' : 'new'}: strict validation rejects ${label}`, () => {
  assert.ok(serverConfigProblems(config('ws://127.0.0.1/mcpl', fields) as McplServerConfig).length > 0);
});

for (const value of ['true', 'CANARY-invalid-flag', 1, 0, {}, []]) test(`new: flag validation rejects ${JSON.stringify(value)} without quoting it`, () => {
  const problems = serverConfigProblems(config('ws://127.0.0.1/mcpl', { credentialRequired: value }) as McplServerConfig);
  assert.ok(problems.length > 0);
  assert.ok(problems.some(p => p.includes('credentialRequired')));
  if (typeof value === 'string') assert.ok(!problems.join('').includes(value));
});

for (const fields of [{ token: '' }, { token: canary() }, { tokenTransport: 'query' }, { url: 'ws://192.0.2.1/mcpl' }, { protocol: 'modern' }]) {
  test(`new: strict direct dial validates before provider (${Object.keys(fields)[0]} ${fields.token === '' ? 'empty' : 'set'})`, async () => {
    const s = await mock(); let calls = 0;
    try {
      await rejected(config(s.url, { accessProvider: async () => { calls++; return canary(); }, ...fields }), 'credential-unusable');
      assert.equal(calls, 0); assert.equal(s.requests.length, 0);
    } finally { await s.close(); }
  });
}

for (const version of ['bun', 'node'] as const) test(`new: unsupported ${version} refuses before provider or I/O`, async () => {
  const s = await mock(); let calls = 0;
  const descriptor = Object.getOwnPropertyDescriptor(process.versions, version);
  // Make the Bun discriminator present even on Node; for the Node case remove it.
  const bun = Object.getOwnPropertyDescriptor(process.versions, 'bun');
  try {
    if (version === 'node') Reflect.deleteProperty(process.versions, 'bun');
    Object.defineProperty(process.versions, version, { value: '0.0.0', configurable: true });
    await rejected(config(s.url, { accessProvider: async () => { calls++; return canary(); } }), 'engine-unsupported');
    assert.equal(calls, 0); assert.equal(s.requests.length, 0);
  } finally {
    if (descriptor) Object.defineProperty(process.versions, version, descriptor); else Reflect.deleteProperty(process.versions, version);
    if (bun) Object.defineProperty(process.versions, 'bun', bun); else Reflect.deleteProperty(process.versions, 'bun');
    await s.close();
  }
});

for (const status of [301, 302, 303, 307, 308]) test(`new: strict ${status} redirect fails closed at original origin`, async () => {
  const second = await mock(); const first = await mock(status, second.url); const token = canary();
  try {
    await rejected(config(first.url, { accessProvider: async () => token }), 'credential-unusable');
    await sleep(30);
    assert.equal(first.requests.length, 1);
    assert.equal(first.requests[0].headers.authorization, `Bearer ${token}`);
    assert.equal(second.requests.length, 0);
  } finally { await first.close(); await second.close(); }
});

for (const field of ['url', 'tokenTransport', 'credentialRequired', 'token', 'accessProvider', 'id', 'command', 'transport', 'protocol']) {
  test(`${['url', 'tokenTransport', 'id'].includes(field) ? 'new' : 'control'}: strict snapshot holds ${field} while provider is pending`, async () => {
    const original = await mock(); const replacement = await mock(); const token = canary();
    let release!: (token: string) => void;
    const pending = new Promise<string>(r => { release = r; });
    const c = config(original.url, { accessProvider: function(this: Config) { assert.equal(this, c); return pending; } });
    const mutations: Record<string, unknown> = { url: replacement.url, tokenTransport: 'query', credentialRequired: false, token: canary(), accessProvider: async () => canary(), id: 'changed', command: 'never-spawn', transport: 'stdio', protocol: 'modern' };
    let transport: WebSocketTransport | undefined;
    try {
      const opened = WebSocketTransport.open(c as McplServerConfig);
      (c as unknown as Record<string, unknown>)[field] = mutations[field];
      release(token); transport = await opened;
      assert.equal(original.requests.length, 1); assert.equal(replacement.requests.length, 0);
      assert.equal(original.requests[0].headers.authorization, `Bearer ${token}`);
      assert.equal(original.requests[0].url, '/mcpl');
      assert.equal((transport as unknown as { serverId: string }).serverId, 'strict-server');
    } finally { release(token); await transport?.close(); await original.close(); await replacement.close(); }
  });
}

test('control: provider rotation on each header dial sends no query token', async () => {
  const s = await mock(); let token = canary();
  const c = config(s.url, { credentialRequired: undefined, accessProvider: async () => token });
  try {
    for (let i = 0; i < 2; i++) {
      const t = await WebSocketTransport.open(c as McplServerConfig); await t.close();
      assert.equal(s.requests[i].headers.authorization, `Bearer ${token}`); assert.equal(s.requests[i].url, '/mcpl');
      token = canary();
    }
  } finally { await s.close(); }
});

test('control: flag unset throwing provider falls back to static token', async () => {
  const s = await mock(); const token = canary();
  try {
    const c = config(s.url, { credentialRequired: undefined, token, accessProvider: async () => { throw new Error('synthetic'); } });
    const keys = Reflect.ownKeys(c); const t = await WebSocketTransport.open(c as McplServerConfig);
    assert.equal(s.requests[0].headers.authorization, `Bearer ${token}`); assert.deepEqual(Reflect.ownKeys(c), keys);
    await t.close();
  } finally { await s.close(); }
});

test('control: abort during pending provider cannot create a late dial', async () => {
  const s = await mock(); const controller = new AbortController(); let release!: (s: string) => void;
  try {
    const p = WebSocketTransport.open(config(s.url, { accessProvider: () => new Promise<string>(r => { release = r; }) }) as McplServerConfig, controller.signal);
    controller.abort(); await assert.rejects(p);
    release(canary()); await sleep(30); assert.equal(s.requests.length, 0);
  } finally { await s.close(); }
});

test('control: strict connection reconnect fetches a rotated credential', async () => {
  const s = await mock(); let token = canary(); let calls = 0; let conn: McplServerConnection | undefined;
  try {
    conn = await McplServerConnection.connect(config(s.url, { reconnect: true, reconnectIntervalMs: 40, accessProvider: async () => { calls++; return token; } }) as McplServerConfig,
      { version: '0.4', pushEvents: true, featureSets: true });
    assert.equal(s.requests[0].headers.authorization, `Bearer ${token}`);
    conn.ready();
    token = canary(); for (const ws of s.wss.clients) ws.terminate();
    const deadline = Date.now() + 7000;
    while (s.requests.length < 2 && Date.now() < deadline) await sleep(20);
    assert.equal(s.requests.length, 2); assert.equal(calls, 2);
    assert.equal(s.requests[1].headers.authorization, `Bearer ${token}`); assert.equal(s.requests[1].url, '/mcpl');
  } finally { await conn?.close(); await s.close(); }
});

test('control: strict successful header dial stores no provider result on configuration', async () => {
  const s = await mock(); const token = canary(); const c = config(s.url, { accessProvider: async () => token });
  const before = Object.getOwnPropertyDescriptors(c); let t: WebSocketTransport | undefined;
  try {
    t = await WebSocketTransport.open(c as McplServerConfig);
    assert.equal(s.requests[0].headers.authorization, `Bearer ${token}`); assert.equal(s.requests[0].url, '/mcpl');
    assert.deepEqual(Object.getOwnPropertyDescriptors(c), before);
    assert.ok(!JSON.stringify(c).includes(token));
  } finally { await t?.close(); await s.close(); }
});

test('new: strict captures all policy reads before the provider await', async () => {
  const s = await mock(); const token = canary(); let release!: (s: string) => void;
  const c = config(s.url, { accessProvider: () => new Promise<string>(r => { release = r; }) });
  let t: WebSocketTransport | undefined;
  try {
    const opened = WebSocketTransport.open(c as McplServerConfig);
    for (const field of ['id', 'url', 'tokenTransport', 'credentialRequired', 'token', 'accessProvider', 'command', 'transport', 'protocol']) {
      Object.defineProperty(c, field, { get() { throw new Error(`late ${field} read`); } });
    }
    release(token); t = await opened;
    assert.equal(s.requests.length, 1); assert.equal(s.requests[0].headers.authorization, `Bearer ${token}`);
  } finally { release(token); await t?.close(); await s.close(); }
});

test('new: strict non-loopback hostname refuses before provider or DNS/connect', async () => {
  let called = false;
  await rejected(config('ws://never-resolve.invalid/mcpl', { accessProvider: async () => { called = true; return canary(); } }), 'credential-unusable');
  assert.equal(called, false);
});
