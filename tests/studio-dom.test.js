import test from 'node:test';
import assert from 'node:assert/strict';
import { createContext } from '../src/studio/context.js';
import { render } from '../src/studio/pages/child-editor.js';
import { buildNarrativePrompt } from '../src/narrative.js';
import { privacyNotice } from '../src/privacy-mask.js';

class Element {
  constructor(tag, document) {
    this.tag = tag;
    this.document = document;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.events = new Map();
    this.value = '';
  }
  set textContent(value) { this.text = value; this.children = []; }
  get textContent() {
    return (this.text ?? '') + this.children.map(child => child.textContent ?? child).join('');
  }
  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  insertBefore(node, before) {
    this.children = this.children.filter(child => child !== node);
    this.children.splice(this.children.indexOf(before), 0, node);
  }
  replaceChildren(...nodes) { this.text = ''; this.children = nodes; }
  setAttribute(name, value) {
    assert.notEqual(name, 'style', 'Editor controls must remain compatible with strict CSP');
    this.attributes[name] = value;
  }
  addEventListener(name, fn) {
    const listeners = this.events.get(name) ?? new Set();
    listeners.add(fn);
    this.events.set(name, listeners);
  }
  removeEventListener(name, fn) { this.events.get(name)?.delete(fn); }
  async emit(name, event = {}) {
    for (const fn of this.events.get(name) ?? []) await fn({ preventDefault() {}, ...event });
  }
  querySelectorAll(selector) {
    const matches = node => selector.startsWith('[')
      ? node.attributes[selector.slice(1).split('=')[0]] === 'true' : node.tag === selector;
    return this.children.filter(child => child instanceof Element).flatMap(child =>
      [...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  focus() { this.document.activeElement = this; }
  setCustomValidity(text) { this.validationMessage = text; }
  reportValidity() { return !this.validationMessage; }
}

function setup(t, route = {}) {
  const doc = new Element('document');
  doc.createElement = tag => new Element(tag, doc);
  doc.createElementNS = (_namespace, tag) => new Element(tag, doc);
  const before = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: doc });
  const media = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
  Object.defineProperty(globalThis, 'matchMedia', { configurable: true, value: () => ({
    matches: false, addEventListener() {}, removeEventListener() {}
  }) });
  const history = Object.getOwnPropertyDescriptor(globalThis, 'history');
  Object.defineProperty(globalThis, 'history', { configurable: true,
    value: { replaceState() {} } });
  const data = new Map();
  const ctx = createContext({ storage: {
    getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value)
  } });
  ctx.go = id => { ctx.destination = id; };
  const page = render(ctx, { name: 'child-editor', childId: 'C-05', semester: '2026-S2',
    ...route });
  const find = text => page.querySelectorAll('button').find(node => node.textContent === text);
  t.after(() => {
    if (media) Object.defineProperty(globalThis, 'matchMedia', media);
    else delete globalThis.matchMedia;
    if (history) Object.defineProperty(globalThis, 'history', history);
    else delete globalThis.history;
    page.dispose();
    ctx.persist();
    if (before) Object.defineProperty(globalThis, 'document', before);
    else delete globalThis.document;
  });
  return { ctx, page, find, doc };
}

test('editor switches a single domain panel and saves evidence without losing focus', async t => {
  const { ctx, page, find, doc } = setup(t);
  assert.match(page.textContent, /5 \/ 20/);
  assert.equal(page.querySelectorAll('textarea').length, 2);
  assert.equal(page.querySelectorAll('h2')[0].textContent, 'English');
  await find('Chinese').emit('click');
  assert.equal(page.querySelectorAll('h2')[0].textContent, 'Chinese');
  assert.equal(page.querySelectorAll('textarea').length, 2);
  assert.equal(doc.activeElement.textContent, 'Chinese');
  const comment = page.querySelectorAll('textarea')[0];
  comment.value = 'Fictional revised evidence.';
  await comment.emit('input');
  assert.equal(ctx.get('C-05').domains.chinese.comment, 'Fictional revised evidence.');
  assert.equal(page.querySelectorAll('textarea')[0], comment);
  ctx.persist();
  assert.match(page.textContent, /Saved in this browser/);
  await doc.emit('keydown', { altKey: true, key: 'ArrowRight' });
  assert.equal(ctx.destination, 'C-06');
});

test('sample illustration requires alt text and explicit saving before entering the record', async t => {
  const { ctx, page, find } = setup(t);
  const before = ctx.get('C-05').domains.english.photos.length;
  await find('Add sample illustration').emit('click');
  await find('Save photo').emit('click');
  assert.equal(ctx.get('C-05').domains.english.photos.length, before);
  const alt = page.querySelectorAll('input').find(node => node.validationMessage);
  assert.equal(alt.validationMessage, 'Alt text is required.');
  alt.value = 'Fictional geometric activity';
  await alt.emit('input');
  await find('Save photo').emit('click');
  assert.equal(ctx.get('C-05').domains.english.photos.length, before + 1);
  assert.equal(ctx.get('C-05').domains.english.photos.at(-1).alt, 'Fictional geometric activity');
});

test('review is distinct, requires all narratives and advances only after explicit review', async t => {
  const { ctx, page, find } = setup(t);
  await find('Review narratives').emit('click');
  assert.equal(page.querySelectorAll('textarea').length, 4);
  assert.equal(find('Mark reviewed and go to next child').disabled, true);
  await find('Draft all four').emit('click');
  assert.equal(find('Mark reviewed and go to next child').disabled, false);
  assert.match(page.textContent, /MOCK DRAFT \(offline, not AI\)/);
  await find('Mark reviewed and go to next child').emit('click');
  assert.equal(ctx.get('C-05').reviewed, true);
  assert.equal(ctx.destination, 'C-06');
});

for (const size of [20, 3]) {
  test(`last review completes a ${size}-child class without null navigation`, async t => {
    const { ctx, page, find } = setup(t, { domain: 'review' });
    if (size !== 20) ctx.children = ctx.children.filter(child =>
      ['C-04', 'C-05', 'C-06'].includes(child.id));
    await find('Draft all four').emit('click');
    const template = ctx.get('C-05');
    for (const child of ctx.children) {
      if (child.id === 'C-05') continue;
      const record = ctx.current(child.id);
      record.domains = structuredClone(template.domains);
      record.narratives = structuredClone(template.narratives);
      ctx.markReviewed(record);
    }
    const review = find('Mark reviewed and go to next child');
    assert.equal(review.disabled, false);
    await review.emit('click');
    assert.equal(ctx.destination, undefined);
    assert.equal(ctx.get('C-05').reviewed, true);
    assert.equal(review.hidden, true);
    const completed = page.querySelectorAll('section').find(node =>
      node.attributes.role === 'status' && node.querySelectorAll('h2')
        .some(heading => heading.textContent === `All ${size} children reviewed`));
    assert.equal(completed.hidden, false);
    assert.match(completed.textContent, new RegExp(`All ${size} children reviewed`));
    const links = completed.querySelectorAll('a');
    assert.equal(links.find(node => node.textContent === 'Drafts').href,
      '#/drafts');
    assert.equal(links.find(node => node.textContent === 'Print class report').href,
      '#/print-class?sem=2026-S2');
    ctx.change(ctx.get('C-05'));
    assert.equal(completed.hidden, true);
    assert.equal(review.hidden, false);
  });
}

test('draft review deep links open the Review step and retain quick provider settings access', t => {
  const { page } = setup(t, { domain: 'review' });
  assert.equal(page.querySelectorAll('h2')[0].textContent, 'Review narratives');
  assert.equal(page.querySelectorAll('textarea').length, 4);
  assert.match(page.textContent, /Local review is not authenticated approval/);
  const settings = page.querySelectorAll('a')
    .find(link => link.textContent === 'Provider: Offline mock (not AI)');
  assert.equal(settings.href, '#/settings/ai');
  assert.equal(page.querySelectorAll('select').length, 0);
});


test('editor keeps one compact child header and reactive provider settings access', t => {
  const { page, ctx } = setup(t);
  const headers = page.querySelectorAll('header')
    .filter(node => node.className === 'child-header');
  assert.equal(headers.length, 1);
  assert.equal(page.querySelectorAll('h1').length, 1);
  assert.match(headers[0].textContent, /C-05 · Class A \(Sample\)/);
  assert.match(headers[0].textContent, /5 \/ 20/);
  assert.match(headers[0].textContent, /Print \/ PDF/);
  assert.equal(page.querySelectorAll('section')
    .some(node => node.className === 'provider-panel'), false);
  assert.equal(page.querySelectorAll('input')
    .some(node => node.type === 'password'), false);
  const provider = page.querySelectorAll('a')
    .find(link => link.className === 'editor-provider-settings');
  assert.equal(provider.textContent, 'Provider: Offline mock (not AI)');
  assert.equal(provider.href, '#/settings/ai');
  assert.equal(page.querySelectorAll('select').length, 0);
  ctx.provider.id = 'gateway';
  ctx.notify();
  assert.equal(provider.textContent, 'Provider: GPT Demo Gateway');
  ctx.busy = true;
  ctx.notify();
  assert.equal(page.querySelectorAll('button')
    .find(node => node.textContent === 'Draft all four').disabled, true);
  assert.equal(page.querySelectorAll('textarea').length, 2);
});

test('domain columns retain accessible comparison, photo editing and narrative provenance', async t => {
  const { ctx, page, find } = setup(t);
  const comparison = page.querySelectorAll('section')
    .find(node => node.className === 'editor-comparison');
  assert.match(comparison.attributes['aria-label'],
    /Semester 1: Emerging → Semester 2: Developing \(\+1\)/);
  const originalAlt = ctx.get('C-05').domains.english.photos[0].alt;
  assert.equal(page.querySelectorAll('figcaption')[0].textContent,
    originalAlt + 'AI-generated illustration, not a real child');
  const alt = page.querySelectorAll('input').find(node => node.value === originalAlt);
  alt.value = 'Fictional updated activity';
  await alt.emit('change');
  assert.equal(page.querySelectorAll('figcaption')[0].textContent,
    'Fictional updated activityAI-generated illustration, not a real child');
  const source = page.querySelectorAll('p')
    .find(node => node.className === 'chip narrative-source');
  assert.equal(source.textContent, 'No narrative');
  await find('Draft narrative').emit('click');
  assert.equal(source.textContent, 'MOCK DRAFT (offline, not AI)');
});

test('review counts live narratives and clearing text restores empty provenance', async t => {
  const { page } = setup(t, { domain: 'review' });
  const sources = page.querySelectorAll('p')
    .filter(node => node.className === 'chip narrative-source');
  assert.deepEqual(sources.map(node => node.textContent), Array(4).fill('No narrative'));
  const hint = page.querySelectorAll('p')
    .find(node => node.className === 'hint editor-review-hint');
  const input = page.querySelectorAll('textarea')[0];
  input.value = 'Fictional teacher observation.';
  await input.emit('input');
  assert.match(hint.textContent, /1\/4 complete$/);
  assert.notEqual(sources[0].textContent, 'No narrative');
  input.value = '   ';
  await input.emit('input');
  assert.match(hint.textContent, /0\/4 complete$/);
  assert.equal(sources[0].textContent, 'No narrative');
});

test('editor binds masked disclosure to its child and refreshes comments without exposing names', async t => {
  const { page, ctx } = setup(t);
  const child = ctx.children.find(member => member.id === 'C-05');
  const record = ctx.get(child.id);
  const preview = page.querySelectorAll('pre').find(node =>
    node.attributes['aria-label'] === 'Exact masked model prompt');
  assert.ok(page.textContent.includes(privacyNotice));
  assert.equal(preview.textContent, buildNarrativePrompt(ctx.narrativeInput(child, record)));
  const comment = page.querySelectorAll('textarea')[0];
  comment.value = `${child.name} shares ideas with Avery W.`;
  await comment.emit('input');
  assert.equal(preview.textContent, buildNarrativePrompt(ctx.narrativeInput(child, record)));
  assert.doesNotMatch(preview.textContent, /Ellis|Avery|C-05/);
  assert.equal(page.querySelectorAll('select').length, 0);
});

test('name panel stays outside sticky navigation and returns focus after keyboard save', async t => {
  const { page, ctx, doc } = setup(t);
  const input = page.querySelectorAll('input').find(node => node.id === 'child-name-C-05');
  const form = page.querySelectorAll('form').find(node => node.className === 'editor-name-form');
  const label = page.querySelectorAll('label').find(node => node.htmlFor === input.id);
  const feedback = page.querySelectorAll('p').find(node => node.id === `${input.id}-feedback`);
  const disclosure = page.querySelectorAll('details')
    .find(node => node.className === 'editor-name-disclosure');
  assert.equal(disclosure.open, false);
  assert.equal(disclosure.querySelector('summary').textContent, 'Edit child name');
  assert.ok(disclosure.querySelectorAll('form').includes(form));
  const navigation = page.querySelectorAll('div').find(node => node.className === 'editor-navigation');
  assert.equal(navigation.querySelectorAll('form').length, 0);
  disclosure.open = true;
  assert.match(label.textContent, /Child name/);
  assert.equal(input.type, 'text');
  assert.match(input.attributes['aria-describedby'], /child-name-C-05-feedback/);
  assert.equal(feedback.attributes.role, 'status');
  input.focus();
  input.value = '  E\u0301lodie Vale  ';
  await input.emit('input');
  await form.emit('submit');
  assert.equal(input.value, 'Élodie Vale');
  assert.equal(page.querySelector('h1').textContent, 'Élodie Vale');
  assert.equal(doc.activeElement, disclosure.querySelector('summary'));
  assert.equal(disclosure.open, false);
  assert.equal(ctx.children[4].name, 'Élodie Vale');
  assert.equal(page.querySelectorAll('img')[0].alt.startsWith('Élodie Vale:'), true);
  assert.equal(feedback.textContent, '');
  input.value = 'Unsaved edit';
  await input.emit('keydown', { key: 'Escape' });
  assert.equal(input.value, 'Élodie Vale');
  assert.equal(ctx.children[4].name, 'Élodie Vale');
  ctx.semester = '2026-S1';
  ctx.notify();
  assert.equal(page.querySelector('h1').textContent, 'Élodie Vale');
});

test('name validation rejects controls and long names, permits duplicates and locks during drafting', async t => {
  const { page, ctx } = setup(t);
  const input = page.querySelectorAll('input').find(node => node.id === 'child-name-C-05');
  const form = page.querySelectorAll('form').find(node => node.className === 'editor-name-form');
  const feedback = page.querySelectorAll('p').find(node => node.id === `${input.id}-feedback`);
  page.querySelectorAll('details').find(node => node.className === 'editor-name-disclosure').open = true;
  for (const value of [' ', 'A'.repeat(61), 'A\u0000B']) {
    input.value = value;
    await form.emit('submit');
    assert.equal(input.attributes['aria-invalid'], 'true');
    assert.ok(input.validationMessage);
    assert.equal(ctx.children[4].name, 'Ellis B.');
  }
  input.value = ctx.children[0].name;
  await input.emit('input');
  assert.equal(input.attributes['aria-invalid'], 'false');
  await form.emit('submit');
  assert.match(feedback.textContent, /Another child has this name/);
  assert.equal(ctx.children[4].id, 'C-05');
  assert.equal(ctx.children[4].name, ctx.children[0].name);
  ctx.busy = true;
  ctx.notify();
  assert.equal(input.disabled, true);
  assert.equal(page.querySelectorAll('button').find(node => node.textContent === 'Save name').disabled, true);
});

test('old-name replacement refreshes editable narratives without losing teacher prose', async t => {
  const { ctx, page, find } = setup(t, { domain: 'review' });
  const record = ctx.get('C-05');
  record.narratives.english = { text: 'Ellis B. shares ideas. Teacher detail retained.', source: 'teacher', edited: true };
  ctx.notify();
  ctx.renameChild('C-05', 'Sample Learner');
  const replace = find('Replace old name in narratives');
  assert.equal(replace.disabled, false);
  await replace.emit('click');
  assert.equal(record.narratives.english.text, 'Sample Learner shares ideas. Teacher detail retained.');
  assert.ok(page.querySelectorAll('textarea').some(node =>
    node.value === 'Sample Learner shares ideas. Teacher detail retained.'));
  assert.deepEqual(ctx.oldNarrativeNames('C-05'), []);
});
