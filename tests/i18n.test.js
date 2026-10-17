import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeLocale, setLocale, getLocale, t, translateText, formatNumber, formatDate,
  plural, missingTranslationKeys, LOCALE_STORAGE_KEY } from '../src/i18n/index.js';
import { mountShell } from '../src/studio/shell.js';
import { dom, context } from './helpers/studio-dom.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('English default ignores browser language, remembers explicit choice and rejects unknown stored locales', t => {
  const document = dom(t);
  document.documentElement = {};
  const storage = memoryStorage();
  initializeLocale(storage);
  assert.equal(getLocale(), 'en');
  assert.equal(document.documentElement.lang, 'en');
  setLocale('ms', storage);
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY), 'ms');
  assert.equal(document.documentElement.lang, 'ms');
  initializeLocale(storage);
  assert.equal(getLocale(), 'ms');
  setLocale('zh-Hans', storage);
  assert.equal(document.documentElement.lang, 'zh-Hans');
  assert.throws(() => setLocale('fr', storage), RangeError);
  assert.equal(getLocale(), 'zh-Hans');
  storage.setItem(LOCALE_STORAGE_KEY, 'fr');
  initializeLocale(storage);
  assert.equal(getLocale(), 'en');
});

test('storage denial never prevents language selection or the English default', () => {
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  setLocale('ms', denied);
  assert.equal(getLocale(), 'ms');
  initializeLocale(denied);
  assert.equal(getLocale(), 'en');
});

test('shell language selectors expose native names and persist user changes', async t => {
  const document = dom(t);
  document.documentElement = {};
  const storage = memoryStorage();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
    setLocale('en', memoryStorage());
  });
  initializeLocale(storage);
  const { ctx } = context();
  const shell = mountShell(ctx);
  shell.update({ name: 'home' });
  const selectors = shell.root.querySelectorAll('select').filter(node => node.attributes['aria-label'] === 'Interface language');
  assert.equal(selectors.length, 2);
  assert.deepEqual(selectors[0].children.map(option => [option.value, option.textContent]),
    [['en', 'English'], ['ms', 'Bahasa Melayu'], ['zh-Hans', '简体中文']]);
  selectors[1].value = 'ms';
  await selectors[1].emit('change');
  assert.equal(getLocale(), 'ms');
  assert.equal(selectors[0].value, 'ms');
  assert.equal(document.documentElement.lang, 'ms');
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY), 'ms');
});

test('translations preserve unknown user text and expose missing developer keys', () => {
  setLocale('ms', memoryStorage());
  assert.notEqual(translateText('Fictional demo data'), 'Fictional demo data');
  assert.equal(translateText('A fictional observation never present in the catalog.'), 'A fictional observation never present in the catalog.');
  assert.equal(t('missing.test.key'), 'missing.test.key');
  assert.equal(translateText('Fictional demo data', 'en'), 'Fictional demo data');
  assert.notEqual(translateText('Fictional demo data', 'zh-Hans'), translateText('Fictional demo data'));
  assert.equal(getLocale(), 'ms', 'report translation must not change the interface language');
  assert.ok(missingTranslationKeys().includes('missing.test.key'));
  setLocale('en', memoryStorage());
});

test('named parameters format numeric values without recursively expanding supplied text', () => {
  setLocale('en', memoryStorage());
  const result = t('ui.drafts.progress', { completed: '{total}', total: 12345 });
  assert.ok(result.includes('{total}'));
  assert.ok(result.includes('12,345'));
  assert.ok(!result.includes('{completed}'));
  assert.equal(getLocale(), 'en');
});

test('count messages select Intl plural forms through the same runtime used by the UI', () => {
  setLocale('en', memoryStorage());
  assert.equal(t('ui.home.childrenCount', { count: 1 }), '1 child');
  assert.equal(t('ui.home.childrenCount', { count: 2 }), '2 children');
  assert.equal(translateText('1 children'), '1 child');
  assert.equal(t('ui.evidence.count', { count: 1 }), '1 item');
  assert.equal(t('ui.evidence.count', { count: 0 }), '0 items');
  assert.equal(t('ui.home.draftsWaiting', { count: 1 }), '1 draft is waiting for review.');
  setLocale('ms', memoryStorage());
  assert.equal(t('ui.home.childrenCount', { count: 1 }), '1 kanak-kanak');
  setLocale('zh-Hans', memoryStorage());
  assert.equal(t('ui.home.childrenCount', { count: 1 }), '1 名儿童');
  setLocale('en', memoryStorage());
});

test('Intl formatting uses the selected locale rather than the browser locale', () => {
  for (const locale of ['en', 'ms', 'zh-Hans']) {
    setLocale(locale, memoryStorage());
    assert.equal(formatNumber(12345.6), new Intl.NumberFormat(locale).format(12345.6));
    const date = new Date('2026-01-02T00:00:00Z');
    const options = { dateStyle: 'long', timeZone: 'UTC' };
    assert.equal(formatDate(date, options), new Intl.DateTimeFormat(locale, options).format(date));
    const forms = { one: '{count} item', other: '{count} items' };
    const category = new Intl.PluralRules(locale).select(2);
    assert.equal(plural(2, forms), forms[category].replace('{count}', formatNumber(2)));
  }
  setLocale('en', memoryStorage());
});
