import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV_ITEMS, parseRoute, buildRoute, legacyRedirect } from '../src/studio/router.js';
import { navigationModel } from '../src/studio/shell.js';

test('canonical pages and encoded child paths roundtrip', () => {
  for (const item of NAV_ITEMS) {
    assert.deepEqual(parseRoute(buildRoute(item.name)), { name: item.name });
  }
  for (const childId of ['C-05', '林 小雨', 'a/b?c#d%', '<child>']) {
    for (const semester of ['2026-S1', '2026-S2']) {
      for (const name of ['child-editor', 'print']) {
        assert.deepEqual(parseRoute(buildRoute(name, { childId, semester })),
          { name, childId, semester });
      }
    }
    assert.deepEqual(parseRoute(buildRoute('student-profile', { childId })),
      { name: 'student-profile', childId });
  }
  for (const semester of ['2026-S1', '2026-S2']) {
    assert.deepEqual(parseRoute(buildRoute('print-class', { semester })),
      { name: 'print-class', semester });
  }
});

test('legacy editor URLs preserve child and semester without remapping Home', () => {
  assert.equal(legacyRedirect('#/'), null);
  assert.equal(legacyRedirect('#/child/C-05?sem=2026-S1'),
    '#/classes/class-a/children/C-05?sem=2026-S1');
  assert.deepEqual(parseRoute('#/child/C-05'),
    { name: 'child-editor', childId: 'C-05', semester: '2026-S2' });
});

test('unknown and malformed routes show Home with a notice', () => {
  for (const hash of [42, '#/overview', '#/child/', '#/child/%ZZ', '#/child/%20',
    '#/child/ready/extra', '#/child/ready?sem=2027-S1', '#/child/ready?sem=2026-S3',
    '#/child/ready?semester=2026-S2', '#/child/ready?sem=2026-S2&x=1',
    '#/child/ready#extra', '#/print/', '#/print/%ZZ', '#/print/%20',
    '#/print/ready?sem=2027-S1', '#/print-class/ready',
    '#/print-class?sem=2026-S3', '#/print-class?sem=2026-S1&x=1']) {
    const route = parseRoute(hash);
    assert.equal(route.name, 'home');
    assert.equal(route.unknown, true);
    assert.match(route.message, /Unknown route/);
  }
  for (const hash of [null, undefined, '', '#', '#/']) {
    assert.deepEqual(parseRoute(hash), { name: 'home' });
  }
  for (const params of [{ childId: '' }, { childId: 4 },
    { childId: 'C-01', semester: '2025-S2' }]) {
    assert.equal(buildRoute('child-editor', params), '#/');
  }
  assert.equal(buildRoute('print-class', { semester: 'invalid' }), '#/');
});

test('shell order and child active parents remain canonical on both navigations', () => {
  assert.deepEqual(NAV_ITEMS.map(item => item.label), ['Home', 'Class portfolios', 'Students',
    'Evidence library', 'AI drafts', 'Reports', 'AI provider settings', 'About and privacy']);
  for (const [route, parent, tab] of [['child-editor', 'classes', 'Classes'],
    ['student-profile', 'students', 'Students'], ['print', 'reports', 'More']]) {
    const selected = navigationModel(route).filter(item => item.active);
    assert.deepEqual(selected.map(item => [item.name, item.tab]), [[parent, tab]]);
  }
  assert.deepEqual(NAV_ITEMS.filter(item => item.tab === 'More').map(item => item.name),
    ['evidence', 'reports', 'ai-settings', 'about']);
});
