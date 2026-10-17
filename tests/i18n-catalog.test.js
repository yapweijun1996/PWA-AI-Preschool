import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/en.js';
import ms from '../src/i18n/ms.js';
import zhHans from '../src/i18n/zh-Hans.js';
import { DOMAINS, RATINGS } from '../src/portfolio-model.js';
import { STATUS_LABELS, PROVIDER_LABELS } from '../src/class-view.js';
import { csvCell, reviewSheetCsv } from '../scripts/i18n-review-sheet.mjs';
import { translateText } from '../src/i18n/index.js';

const locales = { ms, 'zh-Hans': zhHans };
// Deliberately exact: this is not a broad exception for English-looking phrases.
const identicalAllowlist = new Map([
  ['ui.brand.product', 'Product brand: AI Preschool Studio'],
  ['ui.editor.commentCount', 'Numeric character-count notation'],
  ['ui.editor.narrativeCount', 'Numeric character-count notation']
]);
const parameters = value => [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/gu)]
  .map(match => match[1]).sort();
const sourceValues = new Set(Object.values(en));
const templatePatterns = Object.values(en).filter(value => parameters(value).length)
  .map(value => new RegExp('^' + value.split(/\{[A-Za-z][A-Za-z0-9_]*\}/gu)
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')).join('(.+?)') + '$', 'u'));
const covered = value => sourceValues.has(value.trim())
  || templatePatterns.some(pattern => pattern.test(value.trim()));

test('catalogs have exactly the English keys, nonempty translations and matching named parameters', () => {
  const keys = Object.keys(en).sort();
  for (const key of keys) {
    assert.match(key, /^ui\.[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+$/u);
    assert.equal(typeof en[key], 'string', key);
    assert.ok(en[key].trim(), key);
    assert.equal(en[key].replace(/\{[A-Za-z][A-Za-z0-9_]*\}/gu, '').includes('{'), false,
      `${key}: malformed source parameter`);
  }
  for (const [locale, catalog] of Object.entries(locales)) {
    assert.deepEqual(Object.keys(catalog).sort(), keys, locale);
    for (const key of keys) {
      assert.equal(typeof catalog[key], 'string', `${locale}:${key}`);
      assert.ok(catalog[key].trim(), `${locale}:${key} is empty`);
      assert.deepEqual(parameters(catalog[key]), parameters(en[key]), `${locale}:${key}`);
      assert.equal(catalog[key].replace(/\{[A-Za-z][A-Za-z0-9_]*\}/gu, '').includes('{'), false,
        `${locale}:${key}: malformed parameter`);
      assert.ok(catalog[key] !== en[key] || identicalAllowlist.has(key),
        `${locale}:${key} accidentally retains English`);
    }
  }
  for (const [key, reason] of identicalAllowlist) {
    assert.ok(Object.hasOwn(en, key), `stale allowlist key: ${key}`);
    assert.ok(reason.trim());
    assert.ok(Object.values(locales).some(catalog => catalog[key] === en[key]),
      `remove unnecessary identical-string allowance: ${key}`);
  }
});

test('duplicate English source strings have consistent reverse-lookup translations', () => {
  const seen = new Map();
  for (const [key, source] of Object.entries(en)) {
    if (seen.has(source)) {
      for (const [locale, catalog] of Object.entries(locales)) {
        assert.equal(catalog[key], catalog[seen.get(source)], `${locale}: ${key}`);
      }
    } else seen.set(source, key);
  }
});


test('dynamic English labels have specific templates without translating child names or prose', () => {
  const fixtures = [
    'Your class portfolio work for Semester 2, 2026.', '3 / 20 reviewed',
    '20 fictional students', 'Showing 3 of 20 students', 'Showing 3 of 20 children',
    'Review learning progress across 20 fictional children.',
    'Open portfolio for English', 'View profile for 简体中文',
    'Review draft for Bahasa Melayu', 'Open English Chinese in editor',
    'All 20 children reviewed', 'Draft narratives for all ready children (3)',
    'Draft all ready children (3)', '3 of 20 children',
    'Drafts awaiting review · 3', 'Rejected drafts · 1', 'Request failures · 2',
    '3 / 4 domains ready', 'Add narratives for all four domains to mark reviewed - 3/4 complete',
    'drafting: 3 of 20', 'Change: +2', 'S1 → S2: +2',
    'Semester 1, 2026 (Jan-Jun)', 'Semester 2, 2026 (Jul-Dec)',
    'Class: Class A (Sample)', 'Teacher: English', 'Generated on: 2026-10-17',
    'Online · Build d2-build · Ready · offline shell available.',
    'Offline · Build source preview · Source preview only. Run npm run build and serve dist to enable installation and offline support. Remote AI is unavailable; Offline Mock remains an explicit choice.',
    'Stopped at 3 of 20; 2 children drafted; 1 domains need attention. AI request failed. Check the connection, model, permissions or quota, then retry. No narratives were changed.',
    '2 of 20 children fully drafted; 1 domains need attention.',
    'Draft rejected: unsupported number or number word; photo claim without a recorded photo. Retry or write it yourself.'
  ];
  for (const label of Object.values(STATUS_LABELS)) fixtures.push(`${label}: 3`);
  for (const domain of DOMAINS) {
    for (const task of ['Add a rating', 'Add a comment', 'Draft a narrative', 'Review the narrative']) {
      assert.ok(sourceValues.has(`${domain.label}: ${task}`));
    }
    for (const warning of ['rating not recorded', 'comment not recorded', 'narrative not drafted']) {
      assert.ok(sourceValues.has(`${domain.label}: ${warning}`));
      fixtures.push(`English: ${domain.label}: ${warning}`);
    }
  }
  for (const rating of [...RATINGS.map(item => item.label), 'Not rated']) {
    assert.ok(sourceValues.has(`Rating: ${rating}`));
    assert.ok(sourceValues.has(`${rating} (selected)`));
  }
  for (const provider of Object.values(PROVIDER_LABELS)) {
    fixtures.push(`Provider: ${provider}`, `${provider} · drafting: 3 of 20`);
    assert.ok(sourceValues.has(`AI DRAFT (${provider}) - teacher must review`));
  }
  for (const fixture of fixtures) assert.ok(covered(fixture), fixture);
  for (const locale of ['ms', 'zh-Hans']) {
    for (const fixture of fixtures) assert.notEqual(translateText(fixture, locale), fixture, `${locale}: ${fixture}`);
    assert.ok(translateText('Open portfolio for English', locale).includes('English'));
    const rejection = translateText('Draft rejected: unsupported number or number word; photo claim without a recorded photo. Retry or write it yourself.', locale);
    assert.ok(!rejection.includes('unsupported number or number word'));
    assert.ok(!rejection.includes('photo claim without a recorded photo'));
  }
  for (const sentence of [
    'Interface language', 'Report and narrative language', 'Report / narrative language',
    'Malay and Simplified Chinese interface text is machine-translated and not yet reviewed by a native speaker.',
    'Machine translations are unreviewed; educator review is required.',
    'Fictional demonstration only. Not an approved school system. Printed portfolios contain teacher-reviewable drafts, not assessments.',
    'Use a disposable test key only. Not stored. Not suitable for production.'
  ]) assert.ok(sourceValues.has(sentence), sentence);
});

function parseCsv(csv) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < csv.length; index++) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') { value += '"'; index++; }
      else quoted = !quoted;
    } else if (!quoted && character === ',') { row.push(value); value = ''; }
    else if (!quoted && character === '\r' && csv[index + 1] === '\n') {
      row.push(value); rows.push(row); row = []; value = ''; index++;
    } else value += character;
  }
  assert.equal(quoted, false);
  assert.equal(value, '');
  return rows;
}

test('review CSV contains every locale and honest unreviewed status with safe quoting', () => {
  const rows = parseCsv(reviewSheetCsv());
  assert.deepEqual(rows.shift(), ['key', 'en', 'ms', 'zh-Hans', 'status']);
  assert.equal(rows.length, Object.keys(en).length);
  assert.deepEqual(rows.map(row => row[0]), Object.keys(en).sort());
  for (const [key, english, malay, chinese, status] of rows) {
    assert.deepEqual([english, malay, chinese], [en[key], ms[key], zhHans[key]]);
    assert.equal(status, 'machine-translated-unreviewed');
  }
  assert.equal(csvCell('a,"b"\r\nc'), '"a,""b""\r\nc"');
  assert.equal(csvCell('=SUM(1,2)'), '"\'=SUM(1,2)"');
  assert.equal(csvCell('  +cmd'), '"\'  +cmd"');
});
