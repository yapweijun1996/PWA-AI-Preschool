import test from 'node:test';
import assert from 'node:assert/strict';
import { context, dom, control } from './helpers/studio-dom.js';
import { render as drafts } from '../src/studio/pages/drafts.js';
import { render as reports } from '../src/studio/pages/reports.js';
import { render as settings } from '../src/studio/pages/ai-settings.js';
import { render as about, NOT_IMPLEMENTED } from '../src/studio/pages/about.js';
import { mountShell } from '../src/studio/shell.js';
import { NAV_ITEMS } from '../src/studio/router.js';
import { saveState, loadingState, pwaStatusChip } from '../src/studio/ui.js';

function mount(t, render, route = {}, options = {}) {
  const document = dom(t);
  const value = context(options);
  const page = render(value.ctx, route);
  t.after(() => { page.dispose?.(); value.ctx.persist(); });
  return { ...value, page, document };
}

const anchor = (root, text) => root.querySelectorAll('a')
  .find(node => node.textContent === text);

test('drafts show current ready progress, provenance, review deep links and memory-only reasons',
  async t => {
    const { page, ctx } = mount(t, drafts);
    const emptyQueues = page.querySelectorAll('section').filter(node =>
      ['Rejected drafts · 0', 'Request failures · 0'].includes(node.textContent));
    assert.equal(emptyQueues.length, 2);
    assert.ok(emptyQueues.every(node => node.children.length === 1));
    assert.equal(control(page, 'Draft all ready children (3)').disabled, false);
    assert.match(page.textContent, /0 of 3 children/);
    assert.equal(anchor(page, 'Open ready class portfolios').href,
      '#/classes?filter=ready-for-draft');
    await control(page, 'Draft all ready children (3)').emit('click');
    assert.match(page.textContent, /3 of 3 children/);
    assert.match(page.textContent, /Drafts awaiting review · 3/);
    assert.match(page.textContent, /MOCK DRAFT \(offline, not AI\)/);
    assert.equal(anchor(page, 'Review draft').href,
      '#/classes/class-a/children/C-01?sem=2026-S2&domain=review');
    ctx.rejections.set('C-01:2026-S2:english', 'unsupported capitalised word or name');
    ctx.notify();
    assert.match(page.textContent, /Rejected drafts · 1/);
    assert.match(page.textContent, /unsupported capitalised word or name/);
    assert.match(page.textContent, /session memory only/);
    assert.equal(anchor(page, 'Write it yourself').href,
      '#/classes/class-a/children/C-01?sem=2026-S2&domain=english');
    await control(page, 'Retry').emit('click');
    assert.match(page.textContent, /Rejected drafts · 0/);
    assert.match(page.textContent, /Local review is not authenticated approval/);
  });

test('offline drafts cannot start remote work but explicit mock still works', async t => {
  const { page, ctx } = mount(t, drafts, {}, { isOffline: () => true });
  ctx.provider.id = 'gateway';
  ctx.notify();
  assert.equal(control(page, 'Draft all ready children (3)').disabled, true);
  ctx.provider.id = 'mock';
  ctx.notify();
  assert.equal(control(page, 'Draft all ready children (3)').disabled, false);
  await control(page, 'Draft all ready children (3)').emit('click');
  assert.equal(ctx.get('C-01').narratives.english.source, 'mock');
});

test('report selectors update warnings, class preview and print destination', async t => {
  const { page } = mount(t, reports, { childId: 'C-05', semester: '2026-S2' });
  assert.equal(page.querySelectorAll('h1').length, 1);
  const preview = page.querySelectorAll('details').find(node =>
    node.className === 'card report-preview');
  assert.equal(preview.open, false);
  assert.match(page.textContent, /Chinese: narrative not drafted/);
  assert.match(page.textContent, /Mathematics: rating not recorded/);
  const [type, semester, child] = page.querySelectorAll('select');
  assert.equal(anchor(page, 'Print / Save as PDF').href, '#/print/C-05?sem=2026-S2');
  child.value = 'C-01';
  await child.emit('change');
  semester.value = '2026-S1';
  await semester.emit('change');
  assert.equal(anchor(page, 'Print / Save as PDF').href, '#/print/C-01?sem=2026-S1');
  assert.doesNotMatch(page.textContent, /INCOMPLETE/);
  type.value = 'class';
  await type.emit('change');
  assert.match(page.textContent, /20 fictional children/);
  assert.equal(page.querySelectorAll('article').length, 20);
  assert.equal(page.querySelectorAll('h1').length, 1);
  assert.equal(anchor(page, 'Print / Save as PDF').href, '#/print-class?sem=2026-S1');
});

test('missing child report remains explicit rather than substituting another child', t => {
  const { page } = mount(t, reports, { childId: 'missing', semester: '2026-S2' });
  assert.match(page.textContent, /No matching child/);
  assert.equal(anchor(page, 'Print / Save as PDF').hidden, true);
  assert.equal(page.querySelectorAll('article').length, 0);
});

test('settings probe on click, apply memory-only keys and clear disposed fields', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return { ok: true, text: async () => JSON.stringify({ output_text: '{"ok":true}' }) };
  });
  const { page, ctx, writes } = mount(t, settings);
  const radios = page.querySelectorAll('input').filter(input => input.type === 'radio');
  const key = page.querySelectorAll('input').find(input => input.type === 'password');
  assert.equal(radios.find(input => input.checked).value, 'mock');
  assert.equal(key.value, '');
  assert.equal(key.autocomplete, 'off');
  assert.equal(key.placeholder, 'Paste a disposable test key');
  assert.match(page.textContent, /Use a disposable test key only\. Not stored\./);
  assert.match(page.textContent, /Photos are never sent/);
  await radios.find(input => input.value === 'openai').emit('change');
  key.value = 'disposable-dom-secret-marker';
  await key.emit('input');
  assert.equal(calls, 0);
  await control(page, 'Test connection').emit('click');
  assert.equal(calls, 1);
  assert.match(page.textContent, /Connected/);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'location');
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { hash: '' } });
  try {
    await control(page, 'Apply provider').emit('click');
    assert.equal(location.hash, '#/drafts');
    assert.equal(ctx.provider.key, 'disposable-dom-secret-marker');
    assert.ok(!JSON.stringify(writes).includes('disposable-dom-secret-marker'));
    page.dispose();
    assert.equal(key.value, '');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'location', previous);
    else delete globalThis.location;
  }
});

test('about contains the full nonimplemented scope, honest storage limits and legacy link', t => {
  const { page } = mount(t, about);
  for (const item of NOT_IMPLEMENTED) assert.ok(page.textContent.includes(item));
  assert.match(page.textContent, /Stored only in this browser/);
  assert.match(page.textContent, /not shared or backed up/);
  assert.match(page.textContent, /Alt \+ ArrowLeft/);
  assert.match(page.textContent, /Alt \+ ArrowRight/);
  assert.match(page.textContent, /CJK fonts/);
  assert.equal(anchor(page, 'Read the submission write-up').href,
    'https://github.com/yapweijun1996/PWA-AI-Preschool/blob/main/docs/26-submission-writeup.md');
  assert.equal(anchor(page, 'Open the legacy demo').href, './index.html');
});

test('every module keeps five tabs, More destinations and parent selection', async t => {
  dom(t);
  const { ctx } = context();
  const shell = mountShell(ctx);
  for (const item of NAV_ITEMS) {
    shell.update({ name: item.name });
    const navs = shell.root.querySelectorAll('nav');
    const tabs = navs.find(nav => nav.attributes['aria-label'] === 'Mobile navigation');
    assert.deepEqual(tabs.children.map(node => node.textContent),
      ['Home', 'Classes', 'Students', 'Drafts', 'More']);
    const more = navs.find(nav => nav.attributes['aria-label'] === 'More destinations');
    await control(tabs, 'More').emit('click');
    assert.equal(more.hidden, false);
    assert.deepEqual(more.querySelectorAll('a').map(link => link.href),
      ['#/evidence', '#/reports', '#/settings/ai', '#/about']);
    await more.emit('keydown', { key: 'Escape' });
    assert.equal(more.hidden, true);
    if (item.tab === 'More') assert.equal(control(tabs, 'More').attributes['aria-current'], 'page');
  }
  shell.update({ name: 'child-editor', childId: 'C-05' });
  const classes = anchor(shell.root, 'Classes');
  assert.equal(classes.attributes['aria-current'], 'page');
});

test('system states distinguish save failure, retry, loading and verified PWA', async t => {
  dom(t);
  let fail = true;
  const { ctx } = context({ storage: { getItem: () => null, setItem() {
    if (fail) throw new Error('Storage denied');
  } } });
  const shell = mountShell(ctx);
  shell.update({ name: 'home' });
  shell.main.append(shell.actionFeedback);
  assert.equal(shell.root.querySelectorAll('section')
    .some(node => node.dataset.state === 'unsaved'), false);
  assert.equal(loadingState().attributes['aria-busy'], 'true');
  assert.equal(saveState('Saved in this browser').dataset.state, 'saved');
  fail = false;
  const failedSave = saveState(ctx.saveStatus, ctx.retrySave);
  assert.match(failedSave.textContent, /Not saved: storage unavailable/);
  await control(failedSave, 'Retry save').emit('click');
  assert.equal(ctx.saveStatus, 'Saved in this browser');
  assert.doesNotMatch(pwaStatusChip({ cacheReady: false }).textContent, /^Offline ready$/);
  assert.equal(pwaStatusChip({ cacheReady: true }).textContent, 'Offline ready');
  ctx.pwa = { online: true, cacheReady: true, updateAvailable: true };
  ctx.notify();
  assert.match(shell.root.textContent, /Update available/);
  ctx.enterRoute('#/drafts');
  await ctx.runDraft(async () => { throw new Error('private provider response'); });
  assert.match(shell.main.textContent, /AI request failed/);
  assert.equal(control(shell.main, 'Retry draft').disabled, false);
  await control(shell.main, 'Dismiss').emit('click');
  assert.doesNotMatch(shell.main.textContent, /AI request failed/);
  await ctx.runDraft(async () => { throw new Error('private provider response'); });
  ctx.enterRoute('#/classes');
  assert.doesNotMatch(shell.main.textContent, /AI request failed/);
  assert.equal(ctx.provider.status, 'failed');
  assert.equal(ctx.failures.length, 2);
  assert.ok(ctx.failures.every(message => !message.includes('private provider response')));
  ctx.rejections.set('C-01:2026-S2:english', 'Draft rejected: unsupported claim.');
  const history = drafts(ctx);
  assert.match(history.textContent, /AI request failed/);
  assert.match(history.textContent, /unsupported claim/);
  history.dispose();
});

test('request failure arriving after navigation stays only in session history', async t => {
  dom(t);
  const { ctx } = context();
  ctx.enterRoute('#/classes/class-a/children/C-05');
  let reject;
  const pending = ctx.runDraft(() => new Promise((_resolve, fail) => { reject = fail; }));
  ctx.enterRoute('#/students');
  ctx.enterRoute('#/classes/class-a/children/C-05');
  reject(new Error('private failure'));
  await pending;
  assert.equal(ctx.draftError, '');
  assert.equal(ctx.retryDraft, null);
  assert.equal(ctx.provider.status, 'failed');
  assert.match(ctx.failures[0], /No narratives were changed/);
});
