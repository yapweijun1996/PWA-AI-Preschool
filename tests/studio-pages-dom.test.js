import test from 'node:test';
import assert from 'node:assert/strict';
import { createContext } from '../src/studio/context.js';
import { render as students } from '../src/studio/pages/students.js';
import { render as evidence } from '../src/studio/pages/evidence.js';
import { render as profile } from '../src/studio/pages/student-profile.js';
import { render as home } from '../src/studio/pages/home.js';
import { render as classes } from '../src/studio/pages/classes.js';

class Node {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.events = new Map();
  }
  set textContent(value) { this.text = value; this.children = []; }
  get textContent() {
    return (this.text ?? '') + this.children.map(node => node.textContent ?? node).join('');
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.text = ''; this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, fn) { this.events.set(key, fn); }
  querySelectorAll(tag) {
    return this.children.filter(node => node instanceof Node).flatMap(node =>
      [...(node.tag === tag ? [node] : []), ...node.querySelectorAll(tag)]);
  }
  querySelector(tag) { return this.querySelectorAll(tag)[0]; }
  async emit(event) { await this.events.get(event)?.(); }
}

function mount(t, render, route = {}) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true, value: { createElement: tag => new Node(tag),
      createElementNS: (_namespace, tag) => new Node(tag) }
  });
  const memory = new Map();
  const ctx = createContext({ storage: {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value)
  } });
  ctx.go = id => { ctx.destination = id; };
  ctx.setSemester = semester => { ctx.semester = semester; ctx.notify(); };
  const page = render(ctx, route);
  t.after(() => {
    page.dispose?.();
    ctx.persist();
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  return { page, ctx };
}

const control = (page, text) => page.querySelectorAll('button')
  .find(node => node.textContent === text);

test('directory search narrows profiles and clear filters restores the roster', async t => {
  const { page } = mount(t, students);
  const search = page.querySelector('input');
  search.value = 'Ellis B.';
  await search.emit('input');
  assert.match(page.textContent, /Showing 1 of 20 students/);
  assert.equal(page.querySelectorAll('a')[0].href, '#/students/C-05');
  search.value = 'no matching student';
  await search.emit('input');
  assert.match(page.textContent, /No students match these filters/);
  await control(page, 'Clear filters').emit('click');
  assert.match(page.textContent, /Showing 20 of 20 students/);
  assert.equal(page.querySelector('input'), search);
});

test('evidence selects source child, Chinese search and exact editor tab', async t => {
  const { page } = mount(t, evidence);
  const child = page.querySelectorAll('select')[0];
  child.value = 'C-05';
  await child.emit('change');
  assert.equal(page.querySelectorAll('article').length, 3);
  const search = page.querySelector('input');
  search.value = '华文问好';
  await search.emit('input');
  assert.equal(page.querySelectorAll('article').length, 1);
  assert.equal(page.querySelectorAll('a')[0].href,
    '#/classes/class-a/children/C-05?sem=2026-S2&domain=chinese');
  await control(page, 'Photos').emit('click');
  assert.match(page.textContent, /No evidence matches these filters/);
  await control(page, 'Clear filters').emit('click');
  assert.equal(search.value, '');
  assert.ok(page.querySelectorAll('img').every(image => image.alt));
});

test('profile exposes comparison, mock provenance and selected-semester report entry', t => {
  const { page } = mount(t, profile, { childId: 'C-05' });
  assert.match(page.textContent, /Not rated in Semester 2/);
  assert.match(page.textContent, /MOCK DRAFT \(offline, not AI\)/);
  assert.match(page.textContent, /No narratives reviewed yet/);
  const print = page.querySelectorAll('a').find(node => node.textContent === 'Print report');
  assert.equal(print.href, '#/reports?sem=2026-S2&child=C-05');
  assert.equal(page.querySelectorAll('img')[0].src, 'assets/demo/avatar-05.webp');
  assert.match(page.querySelectorAll('img')[0].alt, /AI-generated illustration, not a real child/);
  assert.ok(page.querySelectorAll('img').some(image => image.src.startsWith('assets/demo/scene-')));
});

test('home counts refresh from edits and Continue uses the next unfinished child', async t => {
  const { page, ctx } = mount(t, home);
  assert.equal(page.querySelectorAll('article').length, 3);
  const dashboard = page.querySelectorAll('div').find(node => node.className === 'home-dashboard');
  assert.equal(dashboard.children[0].className, 'card home-actions');
  const viewAll = page.querySelectorAll('a').find(node => node.href === '#/classes');
  assert.equal(viewAll.href, '#/classes');
  assert.match(page.textContent, /Ready to draft: 3/);
  const record = ctx.get('C-01');
  record.domains.english.comment = '';
  ctx.notify();
  assert.match(page.textContent, /Ready to draft: 2/);
  assert.match(page.textContent, /English: Add a comment/);
  await control(page, 'Continue with next unfinished child').emit('click');
  assert.equal(ctx.destination, 'C-01');
});

for (const size of [20, 3]) {
  test(`Home shows an explicit done state for ${size} reviewed children`, async t => {
    const { page, ctx } = mount(t, home);
    const template = ctx.get('C-05');
    await ctx.draft(ctx.children.find(child => child.id === 'C-05'), template,
      Object.keys(template.domains));
    ctx.children = ctx.children.slice(0, size);
    for (const child of ctx.children) {
      const record = ctx.current(child.id);
      record.domains = structuredClone(template.domains);
      record.narratives = structuredClone(template.narratives);
      ctx.markReviewed(record);
    }
    assert.match(page.textContent, new RegExp(`All ${size} children reviewed`));
    assert.equal(control(page, 'Continue with next unfinished child'), undefined);
    assert.equal(ctx.destination, undefined);
    const done = page.querySelectorAll('p').find(node => node.attributes.role === 'status');
    assert.equal(done.textContent, `All ${size} children reviewed`);
    assert.equal(page.querySelectorAll('a').find(node => node.textContent === 'Drafts').href,
      '#/drafts');
    assert.equal(page.querySelectorAll('a').find(node =>
      node.textContent.includes('Print class report')).href, '#/reports?sem=2026-S2');
    ctx.change(ctx.get(ctx.children[0].id));
    assert.ok(control(page, 'Continue with next unfinished child'));
  });
}

test('class cards retain domain comparisons, matching open routes and accurate filtered counts', async t => {
  const { page } = mount(t, classes);
  assert.equal(page.querySelectorAll('article').length, 20);
  assert.match(page.textContent, /Showing 20 of 20 children/);
  const first = page.querySelectorAll('article')[0];
  assert.match(first.textContent, /English/);
  assert.match(first.textContent, /Chinese/);
  assert.match(first.textContent, /Mathematics/);
  assert.match(first.textContent, /Social-Emotional Development/);
  assert.match(first.textContent, /Change: \+2/);
  assert.equal(first.querySelector('a').href,
    '#/classes/class-a/children/C-01?sem=2026-S2');
  await control(page, 'Ready to draft 3').emit('click');
  assert.equal(page.querySelectorAll('article').length, 3);
  assert.match(page.textContent, /Showing 3 of 20 children/);
  assert.equal(control(page, 'Ready to draft 3').attributes['aria-pressed'], 'true');
  const search = page.querySelectorAll('input').find(node => node.type === 'search');
  search.value = 'Aster V.';
  await search.emit('input');
  assert.equal(page.querySelectorAll('article').length, 1);
  assert.match(page.textContent, /Showing 1 of 20 children/);
});

test('count chips stay accurate after evidence edits and search clearing', async t => {
  const { page, ctx } = mount(t, classes);
  assert.equal(control(page, 'Needs work 17').dataset.filter, 'needs-work');
  ctx.get('C-01').domains.english.comment = '';
  ctx.notify();
  await control(page, 'Needs work 18').emit('click');
  const destinations = page.querySelectorAll('article').map(card => card.querySelector('a').href);
  assert.ok(destinations.some(href => href.includes('/C-01?')));
  assert.ok(!destinations.some(href => href.includes('/C-02?')));
  const search = page.querySelectorAll('input').find(node => node.type === 'search');
  search.value = 'Ellis B.';
  await search.emit('input');
  assert.equal(control(page, 'Needs work 1').attributes['aria-pressed'], 'true');
  assert.equal(page.querySelectorAll('article')[0].querySelector('a').href,
    '#/classes/class-a/children/C-05?sem=2026-S2');
  search.value = '';
  await search.emit('input');
  assert.equal(control(page, 'Needs work 18').attributes['aria-pressed'], 'true');
});

test('sample reset requires confirmation and restores changed evidence', async t => {
  const { page, ctx } = mount(t, classes);
  ctx.get('C-01').domains.english.comment = 'Changed fictional observation.';
  ctx.confirm = () => false;
  await control(page, 'Reset sample data').emit('click');
  assert.equal(ctx.get('C-01').domains.english.comment, 'Changed fictional observation.');
  ctx.confirm = () => true;
  await control(page, 'Reset sample data').emit('click');
  assert.notEqual(ctx.get('C-01').domains.english.comment, 'Changed fictional observation.');
  assert.equal(control(page, 'Ready to draft 3').dataset.filter, 'ready-for-draft');
});
