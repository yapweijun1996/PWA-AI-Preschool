import { el, button, link, chip, errorState, loadingState, offlineState } from '../ui.js';
import { createSettingsModel, PROVIDER_CHOICES, KEY_WARNING } from '../models/settings-model.js';

export function render(ctx) {
  const model = createSettingsModel(ctx);
  const root = el('section');
  const choices = providerChoices(model);
  const key = disposableKey(model);
  const connection = el('section', undefined, 'card');
  const result = el('div');
  const test = button('Test connection', async () => { await model.test(); refresh(); });
  const apply = button('Apply provider', () => {
    if (model.apply()) location.hash = '#/drafts';
    else refresh();
  }, true);
  const refresh = () => {
    const keyed = ['openai', 'gemini'].includes(model.state.id);
    key.root.hidden = !keyed;
    key.input.value = model.state.key;
    key.input.disabled = ctx.busy;
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
  };
  choices.addEventListener('change', refresh);
  connection.append(el('h2', 'Connection status'), result, test);
  root.append(el('h1', 'AI provider settings'),
    el('p', 'Choose how narrative drafts are generated.'), choices, key.root,
    el('p', "Sends only the child's first name, ratings and comments. Photos are never sent.",
      'notice'),
    el('p', 'A connection probe sends no child data. Browser memory is not secure key custody.'),
    connection, apply, link('Back to drafts', '#/drafts'));
  const unsubscribe = ctx.subscribe(refresh);
  root.dispose = () => {
    unsubscribe();
    model.dispose();
    key.input.value = '';
  };
  refresh();
  return root;
}

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
    label.append(radio, el('strong', choice.label), el('p', choice.description));
    if (choice.id === 'mock') label.append(chip('Default'));
    group.append(label);
  }
  return group;
}

function disposableKey(model) {
  const root = el('section', undefined, 'card');
  const label = el('label', 'Disposable test API key');
  const input = el('input');
  input.type = 'password';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Paste a disposable test key';
  input.value = '';
  input.setAttribute('aria-describedby', 'disposable-key-warning');
  input.addEventListener('input', () => model.setKey(input.value));
  const warning = el('p', KEY_WARNING, 'provider-warning');
  warning.id = 'disposable-key-warning';
  label.append(input);
  root.append(label, warning);
  return { root, input };
}
