import test from 'node:test';
import assert from 'node:assert/strict';
import { probeProviderConnection } from '../src/providers.js';
import { STUDIO_CONFIG } from '../src/config.js';

const response = value => ({ ok: true, status: 200,
  text: async () => JSON.stringify(value) });
const key = 'disposable-probe-private-key';

test('gateway probes create only a session and discard its token', async () => {
  const requests = [];
  const result = await probeProviderConnection({ provider: 'gateway', key,
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return response({ token: 'temporary-session-marker' });
    } });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, `${STUDIO_CONFIG.demoGateway.origin}/demo/session`);
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    project_id: STUDIO_CONFIG.demoGateway.projectId
  });
  assert.equal(requests[0].options.headers.Authorization, undefined);
  assert.ok(!JSON.stringify(requests).includes(key));
  assert.equal(result, undefined);
});

test('keyed probes send no child data or key in URL/payload', async () => {
  for (const provider of ['openai', 'gemini']) {
    const requests = [];
    await probeProviderConnection({ provider, key, fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return response(provider === 'openai' ? { output_text: '{"ok":true}' }
        : { candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] });
    } });
    assert.equal(requests.length, 1);
    const { url, options } = requests[0];
    assert.ok(!url.includes(key));
    assert.ok(!options.body.includes(key));
    assert.doesNotMatch(options.body, /firstName|ratings|comments|photos|C-05/);
    assert.match(options.body, /Connection probe only/);
    assert.equal(options.cache, 'no-store');
    assert.equal(options.signal.aborted, false);
    if (provider === 'openai') {
      assert.equal(options.headers.Authorization, `Bearer ${key}`);
      assert.equal(JSON.parse(options.body).store, false);
    } else assert.equal(options.headers['x-goog-api-key'], key);
  }
});

test('mock probes stay local and failures discard remote bodies and exceptions', async () => {
  let calls = 0;
  let bodyReads = 0;
  const fetchImpl = async () => {
    calls++;
    return { ok: false, status: 401, text: async () => { bodyReads++; return key; } };
  };
  await probeProviderConnection({ provider: 'mock', fetchImpl });
  assert.equal(calls, 0);
  await assert.rejects(probeProviderConnection({ provider: 'gateway', fetchImpl }), error => {
    assert.match(error.message, /HTTP 401/);
    assert.ok(!error.message.includes(key));
    return true;
  });
  assert.equal(bodyReads, 0);
  await assert.rejects(probeProviderConnection({ provider: 'openai', key,
    fetchImpl: async () => { throw new Error(key); } }), error => {
    assert.ok(!error.message.includes(key));
    assert.match(error.message, /network.*CORS/);
    return true;
  });
  await assert.rejects(probeProviderConnection({ provider: 'gateway',
    fetchImpl: async () => response({ token: [] }) }), /no usable token/);
});
