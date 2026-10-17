import { el, button, link, chip, icon, errorState, loadingState, offlineState } from '../ui.js';
import { createSettingsModel, PROVIDER_CHOICES, KEY_WARNING } from '../models/settings-model.js';
import { privacyDisclosure } from '../privacy-disclosure.js';
import { connectionProbePrompt } from '../../providers.js';
import { reportLanguageControl } from '../report-language-control.js';

export function render(ctx) {
  const model = createSettingsModel(ctx);
  const root = el('section', undefined, 'ai-settings-page');
  const heading = el('header', undefined, 'page-header');
  heading.append(el('h1', 'AI provider settings'),
    el('p', 'Choose how narrative drafts are generated.'));
  const choices = providerChoices(model);
  const key = disposableKey(model);
  const language = reportLanguageControl(ctx);
  const connection = el('section', undefined, 'card provider-connection');
  const result = el('div', undefined, 'provider-connection-result');
  result.setAttribute('aria-live', 'polite');
  const test = button('Test connection', async () => { await model.test(); refresh(); });
  const apply = button('Apply provider', () => {
    if (model.apply()) location.hash = '#/drafts';
    else refresh();
  }, true);
  const disclosure = privacyDisclosure(ctx, { provider: () => model.state.id });
  disclosure.className += ' provider-data-disclosure';
  disclosure.prepend(icon('shield'));
  const probePreview = el('pre', undefined, 'privacy-prompt');
  probePreview.setAttribute('aria-label', 'Exact connection probe payload');
  const refresh = () => {
    const keyed = ['openai', 'gemini'].includes(model.state.id);
    key.root.hidden = !keyed;
    key.input.value = model.state.key;
    key.input.disabled = ctx.busy || !keyed;
    for (const radio of choices.querySelectorAll('input')) {
      radio.checked = radio.value === model.state.id;
      radio.disabled = ctx.busy;
    }
    const offline = model.state.id !== 'mock' && ctx.isOffline();
    test.disabled = apply.disabled = ctx.busy || offline;
    const status = ctx.busy ? loadingState('Testing connection…')
      : model.state.status === 'Failed' ? errorState(model.state.message)
        : el('p', model.state.message);
    result.replaceChildren(chip(model.state.status), status);
    if (offline) result.append(offlineState());
    probePreview.textContent = model.state.id === 'mock'
      ? 'Offline mock: no connection request.'
      : model.state.id === 'gateway'
        ? 'Demo session only: no model prompt. Session project_id is configured for this demo.'
        : connectionProbePrompt;
  };
  choices.addEventListener('change', refresh);
  connection.append(el('h2', 'Connection status'), result, test);
  const probeDisclosure = el('details', undefined, 'privacy-probe');
  probeDisclosure.append(el('summary', 'Connection probe payload'),
    el('p', 'A connection probe sends no child data. Browser memory is not secure key custody.',
      'hint'), probePreview);
  disclosure.append(probeDisclosure);
  const actions = el('div', undefined, 'toolbar settings-actions');
  actions.append(apply, link('Back to drafts', '#/drafts'));
  root.append(heading, choices, language, key.root, disclosure, connection, actions);
  const unsubscribe = ctx.subscribe(refresh);
  root.dispose = () => {
    unsubscribe();
    model.dispose();
    disclosure.dispose();
    language.dispose();
    key.input.value = '';
  };
  refresh();
  return root;
}

const PROVIDER_ICONS = { mock: 'image', gateway: 'gateway', openai: 'hexagon', gemini: 'triangle' };

function providerChoices(model) {
  const group = el('fieldset', undefined, 'provider-choices card');
  group.append(el('legend', 'Choose a provider'));
  for (const choice of PROVIDER_CHOICES) {
    const label = el('label', undefined, 'provider-choice');
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'narrative-provider';
    radio.value = choice.id;
    radio.addEventListener('change', () => model.choose(choice.id));
    const badge = el('span', undefined, `provider-choice-icon provider-icon-${choice.id}`);
    badge.setAttribute('aria-hidden', 'true');
    badge.append(icon(PROVIDER_ICONS[choice.id]));
    const copy = el('div', undefined, 'provider-choice-copy');
    const title = el('div', undefined, 'provider-choice-title');
    title.append(el('strong', choice.label));
    if (choice.id === 'mock') title.append(chip('Default'));
    copy.append(title, el('p', choice.description));
    label.append(radio, badge, copy);
    group.append(label);
  }
  return group;
}

function disposableKey(model) {
  const root = el('section', undefined, 'card disposable-key-panel');
  const label = el('label', undefined, 'disposable-key-field');
  const input = el('input');
  input.type = 'password';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Paste a disposable test key';
  input.value = '';
  input.setAttribute('aria-describedby', 'disposable-key-warning');
  input.addEventListener('input', () => model.setKey(input.value));
  const reveal = el('button', undefined, 'icon-button key-reveal');
  reveal.type = 'button';
  reveal.setAttribute('aria-label', 'Show key');
  reveal.setAttribute('aria-pressed', 'false');
  reveal.append(icon('eye'));
  reveal.addEventListener('click', () => {
    const shown = input.type === 'password';
    input.type = shown ? 'text' : 'password';
    reveal.setAttribute('aria-pressed', String(shown));
    reveal.setAttribute('aria-label', shown ? 'Hide key' : 'Show key');
    reveal.replaceChildren(icon(shown ? 'eyeOff' : 'eye'));
  });
  const control = el('div', undefined, 'key-control');
  control.append(input, reveal);
  label.append(el('span', 'Disposable test API key', 'disposable-key-title'), control);
  const warning = el('p', undefined, 'provider-warning');
  warning.id = 'disposable-key-warning';
  warning.append(icon('warning'), el('span', KEY_WARNING));
  root.append(label, warning);
  return { root, input, reveal };
}
