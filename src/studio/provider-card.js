import { PROVIDER_LABELS } from '../class-view.js';
import { el, link, offlineState } from './ui.js';
import { privacyDisclosure } from './privacy-disclosure.js';

export function providerCard(ctx) {
  const panel = el('section', undefined, 'provider-panel');
  const label = el('label', 'Provider');
  const select = el('select');
  for (const [id, text] of Object.entries(PROVIDER_LABELS)) {
    const option = el('option', text);
    option.value = id;
    select.append(option);
  }
  select.value = ctx.provider.id;
  label.append(select);
  const key = keyField(ctx);
  select.addEventListener('change', () => {
    ctx.provider.id = select.value;
    ctx.provider.key = '';
    ctx.provider.status = 'not tested';
    key.input.value = '';
    if (ctx.provider.id !== 'mock') disclosure.querySelector('details').open = true;
    ctx.notify();
  });
  const status = el('p');
  status.setAttribute('role', 'status');
  const offline = offlineState();
  const disclosure = privacyDisclosure(ctx, { noticeInDetails: true });
  disclosure.querySelector('details').append(status, link('Provider settings', '#/settings/ai'));
  disclosure.querySelector('details').open = ctx.provider.id !== 'mock';
  panel.append(label, key.root, disclosure, offline);
  const refresh = () => {
    select.disabled = key.input.disabled = ctx.busy;
    key.root.hidden = !['openai', 'gemini'].includes(ctx.provider.id);
    status.textContent = ctx.provider.status;
    offline.hidden = ctx.provider.id === 'mock' || !ctx.isOffline();
  };
  panel.dispose = () => { unsubscribe(); disclosure.dispose(); key.input.value = ''; };
  const unsubscribe = ctx.subscribe(refresh);
  refresh();
  return panel;
}

function keyField(ctx) {
  const root = el('div');
  const label = el('label', 'Disposable test API key');
  const input = el('input');
  input.type = 'password';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Paste a disposable test key';
  input.value = '';
  label.append(input);
  input.addEventListener('input', () => {
    ctx.provider.key = input.value;
    ctx.provider.status = 'not tested';
    ctx.notify();
  });
  root.append(label, el('p',
    'Use a disposable test key only. Not stored. Not suitable for production.',
    'provider-warning'));
  return { root, input };
}
