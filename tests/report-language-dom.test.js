import test from 'node:test';
import assert from 'node:assert/strict';
import { createContext } from '../src/studio/context.js';
import { render as settings } from '../src/studio/pages/ai-settings.js';
import { render as reports } from '../src/studio/pages/reports.js';
import { narrativeControls } from '../src/studio/narrative-controls.js';
import { buildReport } from '../src/report-model.js';
import { renderReport, renderReportControls } from '../src/report-view.js';
import { reportsModel } from '../src/studio/models/reports-model.js';
import { setLocale, getLocale, translateText } from '../src/i18n/index.js';

class Node {
  constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; this.dataset = {}; this.events = new Map(); }
  set textContent(value) { this.text = value; this.children = []; }
  get textContent() { return (this.text ?? '') + this.children.map(node => node.textContent ?? node).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
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
function mount(t) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true,
    value: { createElement: tag => new Node(tag), createElementNS: (_ns, tag) => new Node(tag) } });
  const values = new Map();
  const ctx = createContext({ storage: { getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value) } });
  ctx.setSemester = value => { ctx.semester = value; ctx.notify(); };
  t.after(() => {
    ctx.persist();
    setLocale('en');
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  return ctx;
}

test('AI settings and Reports share a remembered report control independently of UI language', async t => {
  const ctx = mount(t);
  setLocale('ms');
  assert.equal(ctx.reportLanguage, 'en');
  const settingsPage = settings(ctx);
  const reportPage = reports(ctx);
  t.after(() => { settingsPage.dispose(); reportPage.dispose(); });
  const first = settingsPage.querySelectorAll('select').find(node => node.name === 'report-language');
  const second = reportPage.querySelectorAll('select').find(node => node.name === 'report-language');
  assert.equal(first.value, 'en');
  assert.deepEqual(first.querySelectorAll('option').map(option => [option.value, option.lang]),
    [['en', 'en'], ['ms', 'ms'], ['zh-Hans', 'zh-Hans']]);
  first.value = 'zh-Hans';
  await first.emit('change');
  assert.equal(ctx.reportLanguage, 'zh-Hans');
  assert.equal(second.value, 'zh-Hans');
  assert.equal(getLocale(), 'ms');
  ctx.busy = true;
  ctx.notify();
  assert.equal(first.disabled, true);
  assert.equal(second.disabled, true);
  ctx.setReportLanguage('en');
  assert.equal(ctx.reportLanguage, 'zh-Hans');
});

test('editor and printed narratives retain per-block language independently of report document language', async t => {
  const ctx = mount(t), child = ctx.children[0], record = ctx.current(child.id);
  ctx.setReportLanguage('ms');
  await ctx.draft(child, record, ['english', 'chinese']);
  const english = narrativeControls(ctx, child, record, 'english');
  const chinese = narrativeControls(ctx, child, record, 'chinese');
  t.after(() => { english.dispose(); chinese.dispose(); });
  assert.equal(english.querySelector('textarea').lang, 'ms');
  assert.equal(chinese.querySelector('textarea').lang, 'zh-Hans');
  ctx.setReportLanguage('en');
  assert.equal(english.querySelector('textarea').lang, 'ms');
  const page = renderReport(buildReport({ child: { ...child, name: 'Reports' }, record, language: ctx.reportLanguage }));
  assert.equal(page.lang, 'en');
  const paragraphs = page.querySelectorAll('p');
  assert.equal(paragraphs.find(node => node.textContent === record.narratives.english.text).lang, 'ms');
  assert.equal(paragraphs.find(node => node.textContent === record.narratives.chinese.text).lang, 'zh-Hans');
  assert.equal(page.querySelectorAll('h2').find(node => node.textContent === 'Reports').dataset.i18n, 'off');
  assert.equal(page.querySelectorAll('h2').find(node => node.textContent === 'Chinese').lang, undefined);
});

test('report documents and preview use report language without changing the interface locale', t => {
  const ctx = mount(t), child = ctx.children[0];
  setLocale('ms');
  ctx.setReportLanguage('en');
  const englishReport = reportsModel(ctx).reports[0];
  assert.equal(englishReport.language, 'en');
  const english = renderReport(englishReport);
  assert.equal(english.lang, 'en');
  assert.ok(english.querySelectorAll('h2').some(node => node.textContent === 'Chinese'));
  assert.equal(getLocale(), 'ms');
  const navigation = renderReportControls('#/reports');
  assert.equal(navigation.lang, undefined);
  setLocale('en');
  ctx.setReportLanguage('ms');
  const malayReport = reportsModel(ctx).reports[0];
  const malay = renderReport(malayReport);
  assert.equal(malay.lang, 'ms');
  assert.ok(malay.querySelector('img').alt.includes(child.name));
  assert.ok(!malay.querySelector('img').alt.includes('not a real child'));
  assert.ok(malay.querySelectorAll('h2').some(node => node.textContent === translateText('Chinese', 'ms')));
  assert.notEqual(translateText('Chinese', 'ms'), 'Chinese');
  assert.equal(getLocale(), 'en');
  const preview = reports(ctx);
  t.after(() => preview.dispose());
  const article = preview.querySelector('article');
  assert.equal(article.lang, 'ms');
  assert.equal(article.querySelector('img').alt, malay.querySelector('img').alt);
  assert.ok(article.querySelectorAll('h5').some(node => node.textContent === translateText('Chinese', 'ms')));
  assert.equal(malayReport.childName, child.name);
});
