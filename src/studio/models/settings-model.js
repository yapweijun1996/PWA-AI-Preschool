import { probeProviderConnection } from '../../providers.js';

export const PROVIDER_CHOICES = Object.freeze([
  { id: 'mock', label: 'Offline mock (default)',
    description: 'Simulated text, not AI. Works offline without a network request.' },
  { id: 'gateway', label: 'GPT Demo Gateway',
    description: 'Temporary public demo session. No private Gateway key is stored.' },
  { id: 'openai', label: 'OpenAI test key',
    description: 'Direct provider request using a disposable test key held in page memory.' },
  { id: 'gemini', label: 'Gemini test key',
    description: 'Direct provider request using a disposable test key held in page memory.' }
]);
export const KEY_WARNING =
  'Use a disposable test key only. Not stored. Not suitable for production.';
export const CONNECTION_ERROR = 'Connection test failed. Check the connection, model, permissions '
  + 'or quota, then retry. No narratives were changed.';

export function createSettingsModel(ctx, probe = probeProviderConnection) {
  const state = { id: ctx.provider.id, key: '', status: 'Not tested', message: '' };
  const lifecycle = { revision: 0, disposed: false };
  const reset = () => {
    lifecycle.revision++;
    state.status = 'Not tested';
    state.message = '';
  };
  return {
    state,
    choose(id) {
      if (!PROVIDER_CHOICES.some(choice => choice.id === id)) return;
      state.id = id;
      state.key = '';
      ctx.provider.key = '';
      ctx.provider.status = 'not tested';
      reset();
      ctx.notify();
    },
    setKey(key) { state.key = key; reset(); ctx.notify(); },
    test: () => testConnection(state, lifecycle, ctx, probe),
    apply() {
      if (ctx.busy || lifecycle.disposed || !canUse(state, ctx)) return false;
      ctx.provider = { id: state.id, key: state.key, status: state.status.toLowerCase() };
      ctx.notify();
      return true;
    },
    dispose() { lifecycle.disposed = true; state.key = ''; lifecycle.revision++; }
  };
}

async function testConnection(state, lifecycle, ctx, probe) {
  if (ctx.busy || lifecycle.disposed || !canUse(state, ctx)) return;
  const current = ++lifecycle.revision;
  state.status = 'Testing…';
  state.message = '';
  ctx.busy = true;
  ctx.notify();
  try {
    await probe({ provider: state.id, key: state.key });
    if (current !== lifecycle.revision || lifecycle.disposed) return;
    state.status = state.id === 'mock' ? 'Offline mock (not AI)' : 'Connected';
    state.message = state.id === 'gateway' ? 'Demo session created; generation was not tested.'
      : state.id === 'mock' ? 'Simulated provider. No connection or AI request was made.'
        : 'Connection probe succeeded. No child data was sent.';
  } catch {
    if (current !== lifecycle.revision || lifecycle.disposed) return;
    state.status = 'Failed';
    state.message = CONNECTION_ERROR;
  } finally {
    ctx.busy = false;
    ctx.notify();
  }
}

function canUse(state, ctx) {
  if (state.id !== 'mock' && ctx.isOffline()) {
    state.status = 'Offline';
    state.message = 'Offline: select Offline mock or reconnect before remote drafting.';
    return false;
  }
  if (['openai', 'gemini'].includes(state.id) && !state.key.trim()) {
    state.status = 'Not tested';
    state.message = 'Enter a disposable test key for the selected provider.';
    return false;
  }
  return true;
}
