import test from 'node:test';
import assert from 'node:assert/strict';
import { createContext } from '../src/studio/context.js';
import { render } from '../src/studio/pages/child-editor.js';

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
  replaceChildren(...nodes) { this.text = ''; this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = value; }
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
  const before = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: doc });
  const data = new Map();
  const ctx = createContext({ storage: {
    getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value)
  } });
  ctx.go = id => { ctx.destination = id; };
  const page = render(ctx, { name: 'child-editor', childId: 'C-05', semester: '2026-S2',
    ...route });
  const find = text => page.querySelectorAll('button').find(node => node.textContent === text);
  t.after(() => {
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

test('placeholder photo requires alt text and explicit saving before entering the record', async t => {
  const { ctx, page, find } = setup(t);
  const before = ctx.get('C-05').domains.english.photos.length;
  await find('Add sample placeholder photo').emit('click');
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

test('draft review deep links open the Review step and retain quick provider settings access', t => {
  const { page } = setup(t, { domain: 'review' });
  assert.equal(page.querySelectorAll('h2')[0].textContent, 'Review narratives');
  assert.equal(page.querySelectorAll('textarea').length, 4);
  assert.match(page.textContent, /Local review is not authenticated approval/);
  const settings = page.querySelectorAll('a').find(link => link.textContent === 'Provider settings');
  assert.equal(settings.href, '#/settings/ai');
  assert.equal(page.querySelectorAll('select')[0].value, 'mock');
});
