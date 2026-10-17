import { createContext } from '../../src/studio/context.js';

class Element {
  constructor(tag, document) {
    this.tag = tag;
    this.document = document;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.events = new Map();
    this.value = '';
    this.classList = { toggle: (name, enabled) => {
      const names = new Set((this.className ?? '').split(' ').filter(Boolean));
      if (enabled ?? !names.has(name)) names.add(name);
      else names.delete(name);
      this.className = [...names].join(' ');
    } };
  }
  set textContent(value) { this.text = value; this.children = []; }
  get textContent() {
    return (this.text ?? '') + this.children.map(node => node.textContent ?? node).join('');
  }
  append(...nodes) {
    for (const node of nodes) {
      if (node instanceof Element) node.parent = this;
      this.children.push(node);
    }
  }
  prepend(...nodes) {
    for (const node of nodes) if (node instanceof Element) node.parent = this;
    this.children.unshift(...nodes);
  }
  replaceChildren(...nodes) { this.text = ''; this.children = []; this.append(...nodes); }
  replaceWith(node) {
    const index = this.parent.children.indexOf(this);
    this.parent.children.splice(index, 1, node);
    node.parent = this.parent;
  }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, fn) {
    if (!this.events.has(key)) this.events.set(key, new Set());
    this.events.get(key).add(fn);
  }
  removeEventListener(key, fn) { this.events.get(key)?.delete(fn); }
  querySelectorAll(selector) {
    const matches = node => selector.startsWith('[')
      ? node.attributes[selector.slice(1).split('=')[0]] === 'true' : node.tag === selector;
    return this.children.filter(node => node instanceof Element).flatMap(node =>
      [...(matches(node) ? [node] : []), ...node.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  focus() { this.document.activeElement = this; }
  async emit(type, event = {}) {
    for (const fn of this.events.get(type) ?? []) await fn({ preventDefault() {}, ...event });
  }
}

export function context(options = {}) {
  const writes = [];
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null,
    setItem(key, value) { writes.push([key, value]); data.set(key, value); } };
  const ctx = createContext({ storage, ...options });
  ctx.setSemester = semester => { ctx.semester = semester; ctx.notify(); };
  ctx.go = childId => { ctx.destination = childId; };
  return { ctx, writes, storage };
}

export function dom(t) {
  const document = new Element('document');
  document.createElement = tag => new Element(tag, document);
  document.createElementNS = (_namespace, tag) => new Element(tag, document);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  return document;
}

export function control(page, text) {
  return page.querySelectorAll('button').find(node => node.textContent === text);
}
