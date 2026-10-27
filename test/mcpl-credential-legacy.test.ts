/** Non-strict behavioral controls. Run unchanged against the base overlay and
 * final production modules on both engines; these also assert object semantics. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocketServer } from 'ws';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { WebSocketTransport } from '../src/mcpl/transport.js';
import { serverConfigProblems } from '../src/mcpl/protocol-family.js';
import { InferenceRouter } from '../src/mcpl/inference-router.js';
import type { FeatureSetManager } from '../src/mcpl/feature-set-manager.js';
import type { HookOrchestrator } from '../src/mcpl/hook-orchestrator.js';
import { MockMembrane, createMockResponse } from './helpers/mock-membrane.js';
import type { McplServerConfig, McplInferenceRequestResult, InferenceChunkParams } from '../src/mcpl/types.js';

for (const flag of [undefined, false, null]) test(`control: legacy flag ${String(flag)} preserves validation`, () => {
  const config = { id: 'legacy', url: 'ws://192.0.2.1/mcpl', token: 'synthetic', credentialRequired: flag };
  assert.deepEqual(serverConfigProblems(config as McplServerConfig), []);
});

for (const mode of ['query', 'header'] as const) for (const result of ['throws', 'null', 'empty', 'value']) {
  test(`control: legacy ${mode} provider ${result} preserves receiver, fallback, wire and shape`, async () => {
    let request: http.IncomingMessage | undefined;
    const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    wss.on('connection', (_ws, req) => { request = req; });
    await once(wss, 'listening');
    const error = new TypeError('synthetic provider failure', { cause: { synthetic: true } });
    const descriptor = Object.getOwnPropertyDescriptors(error);
    class Configuration {
      id = 'legacy';
      url = `ws://127.0.0.1:${(wss.address() as AddressInfo).port}/mcpl?x=1`;
      tokenTransport = mode;
      token = 'CANARY-static-synthetic';
      calls = 0;
      async accessProvider() {
        assert.equal(this, config); this.calls++;
        if (result === 'throws') throw error;
        return result === 'null' ? null : result === 'empty' ? '' : 'CANARY-provider-synthetic';
      }
    }
    const config = new Configuration(); const keys = Reflect.ownKeys(config);
    let transport: WebSocketTransport | undefined;
    try {
      transport = await WebSocketTransport.open(config);
      assert.equal(config.calls, 1); assert.deepEqual(Reflect.ownKeys(config), keys);
      assert.equal(Object.getPrototypeOf(config), Configuration.prototype);
      assert.equal(config.accessProvider, Configuration.prototype.accessProvider);
      assert.deepEqual(Object.getOwnPropertyDescriptors(error), descriptor);
      assert.ok(transport instanceof WebSocketTransport);
      const transportKeys = Reflect.ownKeys(transport);
      const got = once([...wss.clients][0], 'message');
      transport.writeLine('synthetic frame'); await got;
      assert.deepEqual(Reflect.ownKeys(transport), transportKeys);
      const expected = result === 'empty' ? '' : result === 'value' ? 'CANARY-provider-synthetic' : 'CANARY-static-synthetic';
      assert.equal(request?.url, mode === 'query' && expected ? `/mcpl?x=1&token=${expected}` : '/mcpl?x=1');
      assert.equal(request?.headers.authorization, mode === 'header' && expected ? `Bearer ${expected}` : undefined);
    } finally { await transport?.close(); await new Promise<void>(r => wss.close(() => r())); }
  });
}

for (const shape of ['prototype', 'non-enumerable', 'stateful'] as const) for (const stream of [false, true]) {
  test(`control: inference responder ${shape}, streaming=${stream}, preserves this and methods`, async () => {
    const membrane = new MockMembrane();
    membrane.pushResponse(createMockResponse([{ type: 'text', text: 'synthetic response' }]));
    const traces: Array<{ type: string }> = [];
    const router = new InferenceRouter(membrane.asMembrane(), { isInHook: false } as HookOrchestrator,
      { validateInbound() {} } as unknown as FeatureSetManager, { default: 'synthetic' }, e => traces.push(e));
    class Responder {
      requestId = 23; result?: McplInferenceRequestResult; chunks: InferenceChunkParams[] = []; calls = 0;
      respond(result: McplInferenceRequestResult) { assert.equal(this, responder); this.calls++; this.result = result; }
      respondError() { assert.fail('unexpected failure'); }
      sendChunk(chunk: InferenceChunkParams) { assert.equal(this, responder); this.chunks.push(chunk); }
    }
    const responder = new Responder();
    if (shape === 'non-enumerable') for (const name of ['respond', 'respondError', 'sendChunk'] as const) {
      Object.defineProperty(responder, name, { value: Responder.prototype[name], enumerable: false });
    }
    const keys = Reflect.ownKeys(responder); const respond = responder.respond; const sendChunk = responder.sendChunk;
    await router.handleInferenceRequest('legacy', { featureSet: 'synthetic', stream, messages: [{ role: 'user', content: 'synthetic' }] }, responder);
    assert.equal(responder.result?.content, 'synthetic response'); assert.equal(responder.calls, 1);
    assert.equal(responder.chunks.length, stream ? 1 : 0);
    assert.equal(responder.respond, respond); assert.equal(responder.sendChunk, sendChunk);
    assert.deepEqual(Reflect.ownKeys(responder), keys); assert.equal(Object.getPrototypeOf(responder), Responder.prototype);
    assert.deepEqual(traces.map(e => e.type), ['mcpl:inference_start', 'mcpl:inference_complete']);
  });
}

test('control: fixed inference failure event and reason remain unchanged', async () => {
  const traces: Array<{ type: string; error?: string }> = []; let message = '';
  const router = new InferenceRouter({ complete: async () => { throw new Error('synthetic inference failure'); } } as never,
    { isInHook: false } as HookOrchestrator, { validateInbound() {} } as unknown as FeatureSetManager,
    { default: 'synthetic' }, e => traces.push(e));
  await router.handleInferenceRequest('legacy', { featureSet: 'synthetic', messages: [] }, {
    respond() { assert.fail('unexpected success'); }, respondError(code, reason) { assert.equal(code, -32603); message = reason; },
  });
  assert.equal(message, 'synthetic inference failure');
  assert.equal(traces.at(-1)?.type, 'mcpl:inference_fail'); assert.equal(traces.at(-1)?.error, message);
});
