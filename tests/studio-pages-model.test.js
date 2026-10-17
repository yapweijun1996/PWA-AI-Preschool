import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMAINS, emptyRecord, recordProgress } from '../src/portfolio-model.js';
import { CHILDREN, seedRecords } from '../src/portfolio-seed.js';
import { homeModel } from '../src/studio/models/home-model.js';
import { studentsModel } from '../src/studio/models/students-model.js';
import {
  profileModel, profileComparison, groupProfileEvidence
} from '../src/studio/models/profile-model.js';
import { evidenceModel } from '../src/studio/models/evidence-model.js';
import { buildRoute, parseRoute } from '../src/studio/router.js';

const records = seedRecords();

test('home status counts equal recordProgress for both semesters and after edits', () => {
  const changed = structuredClone(records);
  const record = changed.find(r => r.childId === 'C-01' && r.semester === '2026-S2');
  for (const domain of DOMAINS) record.narratives[domain.id] = { text: 'Draft', source: 'mock' };
  record.reviewed = true;
  for (const semester of ['2026-S1', '2026-S2']) {
    const model = homeModel(CHILDREN, changed, semester);
    for (const [status, count] of Object.entries(model.totals.statuses)) {
      const expected = changed.filter(r => r.semester === semester
        && recordProgress(r).status === status).length;
      assert.equal(count, expected);
    }
  }
  const totals = homeModel(CHILDREN, records, '2026-S2').totals.statuses;
  assert.deepEqual(totals, { 'not-started': 12, 'in-progress': 5,
    'ready-for-draft': 3, drafted: 0, reviewed: 0 });
});

test('needing-work tasks name only canonical domains and identify missing evidence', () => {
  const model = homeModel(CHILDREN, records, '2026-S2');
  assert.equal(model.needingWork.length, 3);
  assert.deepEqual(model.needingWork.map(row => row.child.id), ['C-04', 'C-05', 'C-06']);
  assert.ok(model.needingWork.every(row => row.status === 'in-progress'));
  for (const row of model.needingWork) {
    const domain = DOMAINS.find(d => d.id === row.domain);
    assert.ok(domain);
    assert.ok(row.task.startsWith(`${domain.label}: `));
  }
  const row = model.needingWork.find(r => r.child.id === 'C-05');
  assert.equal(row.domain, 'mathematics');
  assert.equal(row.task, 'Mathematics: Add a rating');
  assert.equal(model.next, 'C-01');
  assert.deepEqual(homeModel([], [], '2026-S2').needingWork, []);
  assert.equal(homeModel([], [], '2026-S2').next, null);
  const smallClass = CHILDREN.slice(0, 2);
  assert.equal(homeModel(smallClass, records, '2026-S2').needingWork.length, 2);
  const reviewed = structuredClone(records);
  for (const record of reviewed) {
    if (record.semester !== '2026-S2') continue;
    for (const domain of DOMAINS) {
      record.domains[domain.id].rating = 2;
      record.domains[domain.id].comment = 'Teacher evidence.';
      record.narratives[domain.id] = { text: 'Reviewed draft', source: 'mock' };
    }
    record.reviewed = true;
  }
  assert.deepEqual(homeModel(CHILDREN, reviewed, '2026-S2').needingWork, []);
});

test('roster filters actual semester status, names and the seeded class', () => {
  const rows = studentsModel(CHILDREN, records, '2026-S2', { query: '李沐辰' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].child.id, 'C-05');
  assert.equal(rows[0].status, 'in-progress');
  assert.deepEqual(rows[0].ratings.map(d => d.value), [2, 1, null, null]);
  assert.equal(studentsModel(CHILDREN, records, '2026-S2',
    { filter: 'ready-for-draft' }).length, 3);
  assert.equal(studentsModel(CHILDREN, records, '2026-S1',
    { filter: 'drafted' }).length, 5);
  assert.deepEqual(studentsModel(CHILDREN, records, '2026-S2', { classId: 'missing' }), []);
  assert.equal(studentsModel(CHILDREN, records, '2026-S2', { classId: 'class-a' }).length, 20);
  assert.equal(studentsModel(CHILDREN, [], '2026-S2')[0].status, 'not-started');
  const untouched = studentsModel(CHILDREN, [], '2026-S2');
  assert.equal(untouched[0].compact, true);
  const partial = studentsModel(CHILDREN, records, '2026-S2', { query: '李沐辰' });
  assert.equal(partial[0].compact, false);
});

test('evidence combines child, domain, semester, type and multilingual text filters', () => {
  const filters = { childId: 'C-05', semester: '2026-S2' };
  const items = evidenceModel(CHILDREN, records, filters);
  assert.equal(items.length, 3);
  assert.deepEqual(items.map(item => item.type), ['comment', 'photo', 'comment']);
  assert.equal(evidenceModel(CHILDREN, records,
    { ...filters, domain: 'chinese', type: 'comment', query: '华文问好' }).length, 1);
  assert.equal(evidenceModel(CHILDREN, records,
    { ...filters, domain: 'english', type: 'photo', query: 'SAMPLE ACTIVITY 1' }).length, 1);
  assert.equal(evidenceModel(CHILDREN, records,
    { ...filters, domain: 'chinese', type: 'photo' }).length, 0);
  assert.equal(evidenceModel(CHILDREN, records,
    { ...filters, semester: '2026-S1', type: 'comment' }).length, 4);
  assert.equal(evidenceModel(CHILDREN, records, { ...filters, query: 'absent phrase' }).length, 0);
  assert.deepEqual(evidenceModel(CHILDREN, [emptyRecord('C-05', '2026-S2')]), []);
});

test('profile comparison preserves missing prior/current ratings instead of invented gains', () => {
  const current = emptyRecord('C-05', '2026-S2');
  current.domains.english.rating = 2;
  const noPrevious = profileComparison(null, current);
  assert.equal(noPrevious[0].previous, null);
  assert.equal(noPrevious[0].change, null);
  assert.equal(noPrevious[0].changeText, 'Not rated in Semester 1');
  assert.equal(noPrevious[1].changeText, 'Not rated in Semester 2');
  const model = profileModel(CHILDREN.find(c => c.id === 'C-05'), records);
  assert.deepEqual(model.comparison.map(row => row.changeText),
    ['+1', 'No change', 'Not rated in Semester 2', 'Not rated in Semester 2']);
  assert.equal(model.semesters[0].evidence.length, 3);
  assert.equal(model.semesters[0].narratives.length, 0);
  assert.equal(model.semesters[1].status, 'drafted');
  assert.equal(model.semesters[1].reviewed, false);
  assert.ok(model.semesters[1].narratives.every(n => n.source === 'MOCK DRAFT (offline, not AI)'));
});

test('evidence deep links round-trip the source domain and semester', () => {
  const route = { childId: 'C-05', semester: '2026-S1', domain: 'chinese' };
  assert.deepEqual(parseRoute(buildRoute('child-editor', route)),
    { name: 'child-editor', ...route });
  assert.deepEqual(parseRoute(buildRoute('reports', { childId: 'C-05', semester: '2026-S1' })),
    { name: 'reports', childId: 'C-05', semester: '2026-S1' });
  assert.equal(parseRoute('#/classes/class-a/children/C-05?sem=2026-S2&domain=invalid').unknown,
    true);
});

test('profile groups preserve every evidence item and isolate semester and domain', () => {
  const items = evidenceModel([CHILDREN[4]], records);
  const before = structuredClone(items);
  const groups = groupProfileEvidence(items);
  assert.deepEqual(groups.flatMap(group => group.items).sort((a, b) =>
    items.indexOf(a) - items.indexOf(b)), items);
  for (const group of groups) {
    assert.ok(group.items.every(item =>
      item.semester === group.semester && item.domain === group.domain));
  }
  assert.equal(new Set(groups.map(group => `${group.semester}:${group.domain}`)).size,
    groups.length);
  assert.deepEqual(items, before);
});
