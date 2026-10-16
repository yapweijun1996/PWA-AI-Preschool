import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMAINS, emptyRecord } from '../src/portfolio-model.js';
import { buildReport, REPORT_DISCLAIMER } from '../src/report-model.js';

const child = { id: 'fictional', name: '林小雨' };
function complete(semester) {
  const record = emptyRecord(child.id, semester);
  for (const { id } of DOMAINS) {
    record.domains[id] = { rating: 3, comment: 'Fictional observation.', photos: [] };
    record.narratives[id] = { text: id === 'chinese' ? '华文学习正在发展中。' : 'Fictional draft.', source: 'mock', edited: false };
  }
  return record;
}

test('S1 report preserves Chinese names, photo descriptions and injected metadata without mutation', () => {
  const record = complete('2026-S1');
  record.domains.chinese.photos.push({ id: 'p1', src: 'data:image/png;base64,AA==', alt: 'Fictional Chinese learning card' });
  const before = JSON.stringify(record);
  const report = buildReport({ child, record, className: 'Demo class', teacherName: 'Demo educator', generatedOn: '2026-10-16' });
  assert.equal(report.childName, '林小雨');
  assert.equal(report.semesterLabel, 'Semester 1, 2026 (Jan-Jun)');
  assert.equal(report.generatedOn, '2026-10-16');
  assert.equal(report.className, 'Demo class');
  assert.equal(report.teacherName, 'Demo educator');
  assert.equal(report.status.complete, true);
  assert.deepEqual(report.status.warnings, []);
  assert.equal(report.header.productName, 'AI Preschool Studio');
  assert.equal(Object.hasOwn(report.header, 'organizationName'), false);
  assert.equal(report.disclaimer, REPORT_DISCLAIMER);
  assert.match(report.disclaimer, /Fictional demonstration data.*reviewed and approved by an educator/);
  const chinese = report.domains.find(row => row.id === 'chinese');
  assert.equal(chinese.narrative.text, '华文学习正在发展中。');
  assert.match(chinese.narrative.sourceLabel, /MOCK DRAFT/);
  assert.deepEqual(chinese.photos, [{ src: 'data:image/png;base64,AA==', alt: 'Fictional Chinese learning card' }]);
  assert.ok(report.domains.every(row => row.previous === null && row.changeText === ''));
  assert.equal(JSON.stringify(record), before);
});

test('S2 reports distinguish positive, unchanged, negative and absent previous ratings', () => {
  const record = complete('2026-S2'), previousRecord = complete('2026-S1');
  for (const [index, prior] of [2, 3, 4, null].entries()) previousRecord.domains[DOMAINS[index].id].rating = prior;
  const report = buildReport({ child, record, previousRecord });
  assert.equal(report.semesterLabel, 'Semester 2, 2026 (Jul-Dec)');
  assert.deepEqual(report.domains.map(row => row.changeText), [
    'Developing -> Secure (+1)', 'No change', 'Extending -> Secure (-1)', 'Not rated in Semester 1'
  ]);
  assert.deepEqual(report.domains.map(row => row.previous.ratingLabel), ['Developing', 'Secure', 'Extending', 'Not rated']);
  record.domains.english.rating = null;
  assert.equal(buildReport({ child, record, previousRecord }).domains[0].changeText, 'Not rated in Semester 2');
  assert.ok(buildReport({ child, record }).domains.every(row => row.changeText === 'Not rated in Semester 1'));
});

test('missing ratings, whitespace comments and blank narratives keep reports incomplete', () => {
  const record = complete('2026-S2');
  record.domains.english.rating = null;
  record.domains.mathematics.comment = '  ';
  record.narratives.chinese.text = ' ';
  const report = buildReport({ child, record });
  assert.equal(report.status.complete, false);
  assert.deepEqual(report.status.warnings, ['English: rating not recorded', 'Chinese: narrative not drafted', 'Mathematics: comment not recorded']);
  assert.equal(report.domains[1].narrative, null);
  assert.equal(report.domains[0].ratingLabel, 'Not rated');
});

test('reports reject mismatched children and previous semesters', () => {
  const record = complete('2026-S2');
  assert.throws(() => buildReport({ child: { ...child, id: 'other' }, record }), /child/);
  assert.throws(() => buildReport({ child, record, previousRecord: complete('2026-S2') }), /Semester 1/);
});
