import test from 'node:test';
import assert from 'node:assert/strict';
import { localizeDocument, setLocale } from '../src/i18n/index.js';
import en from '../src/i18n/en.js';
import ms from '../src/i18n/ms.js';
import zhHans from '../src/i18n/zh-Hans.js';

// Minimal DOM protocol: exercise source preservation and mutation handling without dependencies.
class Node {
  constructor(tag, text, attributes = {}) {
    this.nodeType = tag ? 1 : 3;
    this.tag = tag;
    this.nodeValue = text;
    this.attributes = attributes;
    this.childNodes = [];
  }
  append(...children) {
    for (const child of children) { child.parentElement = this; this.childNodes.push(child); }
  }
  matches(selector) {
    return selector.split(',').some(part => {
      const token = part.trim();
      if (token === '[lang]:not(html)') return this.tag !== 'html' && this.hasAttribute('lang');
      if (token === '[data-i18n="off"]') return this.attributes['data-i18n'] === 'off';
      if (token.startsWith('.')) return (this.attributes.class ?? '').split(' ').includes(token.slice(1));
      return this.tag === token;
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector); }
  hasAttribute(key) { return Object.hasOwn(this.attributes, key); }
  getAttribute(key) { return this.attributes[key]; }
  setAttribute(key, value) { this.attributes[key] = value; }
}
const storage = { setItem() {} };

test('live locale changes preserve evidence, names, narrative language and English source for subsequent switches', t => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'MutationObserver');
  let observer;
  globalThis.MutationObserver = class {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    disconnect() {}
  };
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'MutationObserver', previous);
    else delete globalThis.MutationObserver;
    setLocale('en', storage);
  });
  const html = new Node('html', undefined, { lang: 'en' });
  const body = new Node('body'); html.append(body);
  const label = new Node('span'); const text = new Node(null, 'Fictional demo data'); label.append(text);
  const action = new Node('button', undefined, { 'aria-label': 'Fictional demo data' });
  const evidence = new Node('p', undefined, { class: 'evidence-text' });
  const observation = new Node(null, 'Fictional demo data'); evidence.append(observation);
  const name = new Node('h1', undefined, { class: 'identity-text' });
  const nameText = new Node(null, 'English'); name.append(nameText);
  const narrative = new Node('p', undefined, { lang: 'zh-Hans' });
  const prose = new Node(null, 'Fictional demo data'); narrative.append(prose);
  body.append(label, action, evidence, name, narrative);
  const scene = new Node('img', undefined, { alt: en['ui.media.sceneNine'] });
  const caption = new Node('span', undefined, { class: 'photo-description' });
  const sceneText = new Node(null, en['ui.media.sceneNine']); caption.append(sceneText);
  const teacherCaption = new Node('span', undefined,
    { class: 'photo-description', 'data-i18n': 'off' });
  const teacherText = new Node(null, en['ui.media.sceneNine']); teacherCaption.append(teacherText);
  const teacherImage = new Node('img', undefined,
    { alt: en['ui.media.sceneNine'], 'data-i18n': 'off' });
  body.append(scene, caption, teacherCaption, teacherImage);
  setLocale('en', storage);
  const dispose = localizeDocument(body);
  setLocale('ms', storage);
  assert.notEqual(text.nodeValue, 'Fictional demo data');
  assert.equal(action.getAttribute('aria-label'), text.nodeValue);
  assert.equal(observation.nodeValue, 'Fictional demo data');
  assert.equal(nameText.nodeValue, 'English');
  assert.equal(prose.nodeValue, 'Fictional demo data');
  const malay = text.nodeValue;
  assert.equal(scene.getAttribute('alt'), ms['ui.media.sceneNine']);
  assert.equal(sceneText.nodeValue, ms['ui.media.sceneNine']);
  assert.equal(teacherText.nodeValue, en['ui.media.sceneNine']);
  assert.equal(teacherImage.getAttribute('alt'), en['ui.media.sceneNine']);
  setLocale('zh-Hans', storage);
  assert.notEqual(text.nodeValue, malay);
  assert.notEqual(text.nodeValue, 'Fictional demo data');
  assert.equal(scene.getAttribute('alt'), zhHans['ui.media.sceneNine']);
  assert.equal(sceneText.nodeValue, zhHans['ui.media.sceneNine']);
  setLocale('en', storage);
  assert.equal(text.nodeValue, 'Fictional demo data');
  assert.equal(action.getAttribute('aria-label'), 'Fictional demo data');
  assert.equal(scene.getAttribute('alt'), en['ui.media.sceneNine']);
  assert.equal(sceneText.nodeValue, en['ui.media.sceneNine']);
  const inserted = new Node('span');
  const insertedText = new Node(null, 'Fictional demo data'); inserted.append(insertedText); body.append(inserted);
  setLocale('ms', storage);
  observer.callback([{ type: 'childList', addedNodes: [inserted] }]);
  assert.equal(insertedText.nodeValue, malay);
  insertedText.nodeValue = 'Unknown fictional user text';
  observer.callback([{ type: 'characterData', target: insertedText }]);
  setLocale('en', storage);
  assert.equal(insertedText.nodeValue, 'Unknown fictional user text');
  dispose();
});
