import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrivacyMask, maskProviderText } from '../src/privacy-mask.js';

test('request dictionary masks variants in multiple scripts and restores only the selected child locally', () => {
  const identifiers = ['Aster Vale', '星澄', 'Nur Bina', 'கனிமொழி', 'AV', 'child-private', 'Guardian Fiction', 'Teacher Fiction', 'Class Fiction', 'Centre Fiction'];
  const source = { firstName: 'Aster', childId: 'child-private', aliases: identifiers.slice(0, 4), initials: 'AV',
    guardianName: identifiers[6], teacherName: identifiers[7], className: identifiers[8], organizationName: identifiers[9],
    domains: { english: { rating: 2, comment: `Aster shares ideas. ${identifiers.join('; ')}.` } } };
  const mask = createPrivacyMask(source);
  const payload = JSON.stringify(mask.input);
  for (const identifier of ['Aster', ...identifiers]) assert.ok(!payload.includes(identifier));
  assert.equal(mask.restore(`${mask.input.firstName} shares ideas.`), 'Aster shares ideas.');
  assert.doesNotThrow(() => mask.assertSafe(payload));
  assert.throws(() => mask.assertSafe('Guardian Fiction shares ideas.'), /Privacy masking failed/);
  mask.dispose();
  assert.throws(() => mask.restore('学童 shares ideas.'), /Privacy masking failed/);
  assert.throws(() => mask.assertSafe(payload), /Privacy masking failed/);
});

test('privacy boundary removes contacts, dates, addresses, URLs and media filenames without a reverse map in output', () => {
  const identifiers = ['user@example.invalid', '+65 8123 4567', 'S1234567D', '2020-01-02', '12 March 2020', '2020年3月12日', '4-year-old', '4岁', '12 Fiction Road', '#02-12', 'Singapore 123456', 'https://example.invalid/avatar.png', 'private-photo.heic'];
  const mask = createPrivacyMask({ firstName: 'Aster', domains: { english: { rating: 2,
    comment: `Shares ideas. ${identifiers.join('; ')}`, photos: [{ src: 'data:image/png,PRIVATE_BYTES', id: 'PRIVATE_ID' }] } } });
  const payload = JSON.stringify(mask.input);
  for (const identifier of [...identifiers, 'PRIVATE_BYTES', 'PRIVATE_ID', 'reverse', 'photos']) assert.ok(!payload.includes(identifier), identifier);
  assert.equal(mask.restore(mask.input.domains.english.comment).includes('user@example.invalid'), false);
  mask.dispose();
});

test('colliding pseudonyms and sensitive comments fail closed rather than emitting uncertain masks', () => {
  for (const comment of ['学童 shares ideas.', 'Needs medication at lunch.', 'A custody detail.'])
    assert.throws(() => createPrivacyMask({ firstName: 'Aster', domains: { english: { comment } } }), /Privacy masking failed/);
  assert.throws(() => maskProviderText(null), /Privacy masking failed/);
});

test('masking and restoration never access browser storage, URL state, or logs', t => {
  const accesses = [];
  for (const key of ['localStorage', 'sessionStorage', 'indexedDB', 'location']) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, get() {
      accesses.push(key);
      throw new Error('Unexpected privacy side effect');
    } });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    });
  }
  const logs = [];
  for (const method of ['log', 'info', 'warn', 'error', 'debug'])
    t.mock.method(console, method, (...args) => logs.push(args));
  const mask = createPrivacyMask({ firstName: 'Aster', domains: {
    english: { rating: 2, comment: 'Aster shares ideas.' }
  } });
  const masked = mask.input.domains.english.comment;
  mask.assertSafe(masked);
  assert.equal(mask.restore(masked), 'Aster shares ideas.');
  mask.dispose();
  assert.deepEqual(accesses, []);
  assert.deepEqual(logs, []);
});

test('Latin identities embedded directly in Chinese or Tamil comments never escape boundaries', () => {
  const mask = createPrivacyMask({ firstName: 'Aster', initials: 'AV', domains: {
    chinese: { rating: 2, comment: 'Aster能表达需要。AV愿意参与。கதிர்Aster分享想法。' }
  } });
  const comment = mask.input.domains.chinese.comment;
  assert.doesNotMatch(comment, /Aster|AV/);
  assert.equal(mask.restore(comment), 'Aster能表达需要。隐私信息愿意参与。கதிர்Aster分享想法。');
  assert.throws(() => mask.assertSafe('Aster愿意参与。'), /Privacy masking failed/);
  mask.dispose();
});

test('malformed learning fields cannot smuggle unmasked metadata through the allowlist', () => {
  for (const field of ['rating', 'previousRating'])
    for (const value of [{ name: 'Aster' }, 'Aster', 99])
      assert.throws(() => createPrivacyMask({ firstName: 'Aster', domains: {
        english: { rating: 2, comment: 'Shares ideas.', [field]: value }
      } }), /Privacy masking failed/);
});

test('alias given names are masked and compatibility-normalized matches restore exact display spelling', () => {
  const mask = createPrivacyMask({ firstName: 'Ａｓｔｅｒ', aliases: ['Nur Bina'], domains: {
    english: { rating: 2, comment: 'Aster shares ideas with Nur and Nur Bina.' }
  } });
  assert.equal(mask.input.domains.english.comment, '学童 shares ideas with 隐私信息 and 隐私信息.');
  assert.equal(mask.restore('学童 shares ideas.'), 'Ａｓｔｅｒ shares ideas.');
  mask.dispose();
});
