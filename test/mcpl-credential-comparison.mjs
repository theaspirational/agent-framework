// Fixed non-strict production scenario. Run in fresh processes with/without
// mcpl-credential-base-overlay.mjs on the SAME installed dependency tree.
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { format } from 'node:util';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const RealDate = Date;
const fixedTime = 1793059200000;
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [fixedTime])); }
  static now() { return fixedTime; }
};
Object.defineProperty(performance, 'now', { value: () => 0, configurable: true });
const { AgentFramework, WorkspaceModule } = await import('../src/index.ts');
const { WebSocketTransport } = await import('../src/mcpl/transport.ts');
const { startScriptedServer } = await import('./helpers/toolset-servers.ts');
const { MockMembrane } = await import('./helpers/mock-membrane.ts');
const { renderCatalogue } = await import('../src/tool-presentation.ts');
const work = process.env.T2F13_WORKSPACE;
const output = process.env.T2F13_ARTIFACT;
assert.ok(work && output);
rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true });
const originalCwd = process.cwd(); process.chdir(work);
const logs = []; const realConsole = {};
for (const method of ['log', 'warn', 'error', 'info', 'debug']) {
  realConsole[method] = console[method];
  console[method] = (...args) => logs.push([method, format(...args)]);
}
const posted = [];
const hook = http.createServer((req, res) => {
  let body = ''; req.on('data', d => { body += d; }); req.on('end', () => { posted.push(body); res.end('ok'); });
});
hook.listen(0, '127.0.0.1'); await once(hook, 'listening');
process.env.CONNECTOME_OPS_WEBHOOK = `http://127.0.0.1:${hook.address().port}/ops`;
const refused = http.createServer();
refused.on('upgrade', (_req, socket) => socket.end('HTTP/1.1 401 Refused\r\nContent-Length: 0\r\nConnection: close\r\n\r\n'));
refused.listen(0, '127.0.0.1'); await once(refused, 'listening');
const tools = [{ name: 'echo', description: 'Synthetic echo.', inputSchema: { type: 'object', properties: {} } }];
const server = await startScriptedServer({
  advert: { featureSets: { 'synthetic.tools': { description: 'tools', uses: ['tools'] } } }, tools,
  on(msg, peer) { if (msg.method === 'tools/call') peer.reply(msg.id, { content: [{ type: 'text', text: 'synthetic success' }] }); },
});
let framework;
const pause = () => new Promise(r => setTimeout(r, 10));
async function until(predicate, label) {
  for (let i = 0; i < 1000; i++) { if (predicate()) return; await pause(); }
  throw new Error(`scenario timed out: ${label}`);
}
try {
  framework = await AgentFramework.create({
    storePath: join(work, 'store'), membrane: new MockMembrane().asMembrane(),
    agents: [{ name: 'scout', model: 'synthetic', systemPrompt: 'Synthetic scout.',
      toolPresentation: { path: join(work, 'tools.json'), cataloguePath: 'board/tools.md' } }],
    modules: [new WorkspaceModule({ mounts: [{ name: 'board', path: work, mode: 'read-write', watch: 'never' }] })],
    maintenanceIntervalMs: 0, mcplServers: [],
  });
  const traces = []; framework.onTrace(e => traces.push(e));
  await framework.connectMcplServer({ id: 'synthetic', toolPrefix: 'synthetic', url: server.url,
    tokenTransport: 'header', accessProvider: async () => 'CANARY-comparison-public-synthetic' });
  tools.push({ name: 'new_echo', description: 'Synthetic new echo.', inputSchema: { type: 'object', properties: {} } });
  server.peer.notify('notifications/tools/list_changed', {});
  await until(() => traces.some(e => e.type === 'process:received' && e.processEvent?.metadata?.newTools?.includes('synthetic--new_echo')), 'new-tools notice');
  assert.ok(framework.getAllTools().some(t => t.name === 'synthetic--echo'));
  let failure;
  try { await WebSocketTransport.open({ id: 'refused', url: `ws://127.0.0.1:${refused.address().port}/mcpl`,
    token: 'CANARY-comparison-public-fallback', tokenTransport: 'header',
    accessProvider: async () => { throw new Error('synthetic provider failure'); } }); }
  catch (error) { failure = error; }
  assert.ok(failure instanceof Error);
  framework.notifyOpsAlert('comparison-dial', 'scout', failure.message);
  await until(() => posted.length === 1, 'ops webhook');
  const notices = traces.filter(e => e.type === 'process:received' && e.processEvent?.metadata?.newTools).map(e => e.processEvent);
  const presentation = framework.inspectToolPresentation('scout'); assert.ok(presentation);
  const sinks = {
    traces, console: logs, failures: readFileSync('logs/failures.log', 'utf8'), webhook: posted,
    shared: framework.getAllTools(), presentation: { snapshot: presentation, catalogue: renderCatalogue(presentation) },
    notices, listing: framework.listMcplServers(),
  };
  // Only ephemeral loopback ports are normalized. Fixed Date/performance
  // clocks are set before framework modules load; no other output is changed.
  const ports = [server.url.match(/:(\d+)\//)[1], String(hook.address().port), String(refused.address().port)];
  const normalized = Object.fromEntries(Object.entries(sinks).map(([name, value]) => {
    let bytes = JSON.stringify(value);
    for (const port of ports) bytes = bytes.replaceAll(`127.0.0.1:${port}`, '127.0.0.1:PORT');
    return [name, bytes];
  }));
  assert.equal(notices.length, 2); assert.ok(traces.length > 0 && logs.length > 0 && posted.length > 0);
  writeFileSync(output, JSON.stringify(normalized, null, 2));
} finally {
  await framework?.stop(); await server.close();
  await new Promise(r => refused.close(r)); await new Promise(r => hook.close(r));
  for (const method of Object.keys(realConsole)) console[method] = realConsole[method];
  process.chdir(originalCwd);
}
console.log('eight production sinks captured');
