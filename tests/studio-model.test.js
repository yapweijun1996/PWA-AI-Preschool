import test from 'node:test';
import assert from 'node:assert/strict';
import { createContext } from '../src/studio/context.js';
import { classesModel } from '../src/studio/pages/classes.js';
import { editorModel, comparisonText } from '../src/studio/editor-model.js';
import { printModel } from '../src/studio/pages/print.js';
import { DOMAINS } from '../src/portfolio-model.js';
import { avatarClass } from '../src/studio/ui.js';
import { CHILDREN } from '../src/portfolio-seed.js';
import { providerChipModel } from '../src/studio/shell.js';

test('provider chip keeps full disclosure and only emphasizes failed or ok states', () => {
  const labels = {
    mock: 'Offline mock', gateway: 'GPT Demo Gateway',
    openai: 'OpenAI key', gemini: 'Gemini key'
  };
  for (const [id, label] of Object.entries(labels)) {
    for (const status of ['not tested', 'testing', 'failed', 'ok']) {
      const model = providerChipModel({ id, status });
      const suffix = ['failed', 'ok'].includes(status) ? ` · ${status}` : '';
      assert.equal(model.short, label + suffix);
      assert.ok(model.full.endsWith(` · ${status}`));
      if (id === 'mock') assert.ok(model.full.includes('(not AI)'));
      if (id === 'openai' || id === 'gemini') assert.ok(model.full.includes('(test key)'));
    }
  }
});

test('three-letter Latin initials stay compact, including Chinese sample names', () => {
  for (const initials of ['CXH', 'WYQ', 'LYN']) {
    assert.equal(avatarClass(initials), 'avatar avatar-compact');
  }
  const child = CHILDREN.find(item => item.id === 'C-01');
  assert.equal(child.initials, 'LYN');
  assert.equal(avatarClass(child.initials, 'avatar editor-avatar'),
    'avatar editor-avatar avatar-compact');
  assert.equal(avatarClass('AB'), 'avatar');
  assert.equal(avatarClass('A'), 'avatar');
});

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value) };
}

test('seed overview derives all twenty states and semester-isolated search', () => {
  const ctx = createContext({ storage: storage() });
  const model = classesModel(ctx);
  assert.deepEqual(model.summary.statuses, {
    'not-started': 12, 'in-progress': 5, 'ready-for-draft': 3, drafted: 0, reviewed: 0
  });
  assert.deepEqual(model.ready.map(child => child.id), ['C-01', 'C-02', 'C-03']);
  assert.deepEqual(classesModel(ctx, { query: '李沐辰' }).children.map(child => child.id), ['C-05']);
  assert.equal(classesModel(ctx, { filter: 'reviewed' }).children.length, 0);
  ctx.semester = '2026-S1';
  assert.notDeepEqual(classesModel(ctx).summary.statuses, model.summary.statuses);
});

test('editor keeps a single active tab, evidence readiness and missing S2 comparison', () => {
  const ctx = createContext({ storage: storage() });
  const record = ctx.get('C-05');
  const model = editorModel(record, ctx.get('C-05', '2026-S1'));
  assert.equal(model.active, 'english');
  assert.equal(model.ready, 2);
  assert.equal(model.canReview, false);
  assert.equal(model.tabs.filter(tab => tab.selected).length, 1);
  assert.equal(editorModel(record, ctx.get('C-05', '2026-S1'), 'review').active, 'review');
  assert.match(comparisonText(model.comparisons.find(row => row.domain === 'english')), /\(\+1\)/);
  assert.match(comparisonText(model.comparisons.find(row => row.domain === 'mathematics')),
    /Not rated in Semester 2/);
  for (const domain of DOMAINS) record.narratives[domain.id] = { text: 'Reviewed evidence.' };
  assert.equal(editorModel(record, ctx.get('C-05', '2026-S1')).canReview, true);
});

test('explicit flush saves edits and reset never persists provider credentials', () => {
  const disk = storage();
  const ctx = createContext({ storage: disk });
  const record = ctx.current('C-05');
  record.reviewed = true;
  record.domains.english.comment = 'Fictional changed observation.';
  ctx.provider.key = 'disposable-secret-marker';
  ctx.change(record);
  assert.equal(record.reviewed, false);
  assert.equal(ctx.saveStatus, 'Saving…');
  ctx.persist();
  const restored = createContext({ storage: disk });
  assert.equal(restored.get('C-05').domains.english.comment, 'Fictional changed observation.');
  assert.equal(ctx.saveStatus, 'Saved in this browser');
  assert.equal(restored.provider.key, '');
  assert.ok(!disk.getItem('ai-preschool-portfolios-v2').includes('disposable-secret-marker'));
  ctx.reset();
  assert.notEqual(ctx.get('C-05').domains.english.comment, 'Fictional changed observation.');
});

test('storage denial retains edits, reports failure, and notifies subscribers', () => {
  const ctx = createContext();
  let status;
  const unsubscribe = ctx.subscribe(value => { status = value.saveStatus; });
  const record = ctx.current('C-05');
  record.domains.english.comment = 'Fictional retained edit.';
  ctx.change(record);
  ctx.persist();
  assert.equal(status, 'Not saved: storage unavailable');
  assert.equal(ctx.get('C-05').domains.english.comment, 'Fictional retained edit.');
  unsubscribe();
});

test('print routes select one child or all twenty without inventing absent evidence', () => {
  const ctx = createContext({ storage: storage() });
  const [report] = printModel(ctx,
    { name: 'print', childId: 'C-05', semester: '2026-S2' }, '2026-10-17');
  assert.equal(report.childName, '李沐辰');
  assert.equal(report.semesterLabel, 'Semester 2, 2026 (Jul-Dec)');
  assert.ok(report.status.warnings.includes('Mathematics: rating not recorded'));
  assert.equal(report.domains.find(row => row.id === 'mathematics').ratingValue, null);
  assert.equal(printModel(ctx, { name: 'print-class', semester: '2026-S1' }, '').length, 20);
  assert.deepEqual(printModel(ctx, { name: 'print', childId: 'missing', semester: '2026-S2' }, ''), []);
});
