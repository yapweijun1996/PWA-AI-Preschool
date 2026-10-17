import test from 'node:test';
import assert from 'node:assert/strict';
import { context, dom } from './helpers/studio-dom.js';
import { providerCard } from '../src/studio/provider-card.js';
import { render as settings } from '../src/studio/pages/ai-settings.js';
import { render as drafts } from '../src/studio/pages/drafts.js';
import { buildNarrativePrompt, noEvidenceChineseText } from '../src/narrative.js';
import { connectionProbePrompt } from '../src/providers.js';
import { DOMAINS, emptyRecord } from '../src/portfolio-model.js';
import { CLASS } from '../src/portfolio-seed.js';
import { privacyNotice, createPrivacyMask } from '../src/privacy-mask.js';

const promptNode = root => root.querySelectorAll('pre').find(node =>
  node.attributes['aria-label'] === 'Exact masked model prompt');

for (const [label, render] of [['class provider', providerCard], ['settings', settings],
  ['draft queue', drafts]]) {
  test(`${label} discloses the exact masked prompt and refreshes selected evidence`, async t => {
    dom(t);
    const { ctx } = context();
    ctx.provider.id = 'gateway';
    const page = render(ctx);
    t.after(() => { page.dispose(); ctx.persist(); });
    const child = ctx.children[0];
    const expected = () => buildNarrativePrompt(ctx.narrativeInput(child, ctx.get(child.id)));
    assert.ok(page.textContent.includes(privacyNotice));
    assert.ok(page.querySelectorAll('summary').some(node => node.textContent === 'What is sent?'));
    assert.equal(promptNode(page).textContent, expected());
    for (const member of ctx.children) {
      assert.ok(!promptNode(page).textContent.includes(member.name));
      assert.ok(!promptNode(page).textContent.includes(member.id));
      assert.ok(!promptNode(page).textContent.includes(member.initials));
    }
    const record = ctx.current(child.id);
    record.domains.english.comment = `${child.name} shares ideas. Contact pretend@example.test.`;
    ctx.notify();
    assert.equal(promptNode(page).textContent, expected());
    assert.doesNotMatch(promptNode(page).textContent, /pretend@example\.test/);
    const selector = page.querySelectorAll('select').find(node =>
      node.parent?.textContent.startsWith('Preview child (browser only)'));
    selector.value = ctx.children[1].id;
    await selector.emit('change');
    assert.equal(promptNode(page).textContent, buildNarrativePrompt(ctx.narrativeInput(
      ctx.children[1], ctx.get(ctx.children[1].id))));
  });
}

test('settings shows the shared exact probe prompt only for direct model providers', async t => {
  dom(t);
  const { ctx } = context();
  const page = settings(ctx);
  t.after(() => { page.dispose(); ctx.persist(); });
  const preview = page.querySelectorAll('pre').find(node =>
    node.attributes['aria-label'] === 'Exact connection probe payload');
  const choose = async id => page.querySelectorAll('input')
    .find(node => node.type === 'radio' && node.value === id).emit('change');
  assert.equal(preview.textContent, 'Offline mock: no connection request.');
  await choose('openai');
  assert.equal(preview.textContent, connectionProbePrompt);
  await choose('gemini');
  assert.equal(preview.textContent, connectionProbePrompt);
  await choose('gateway');
  assert.match(preview.textContent, /Demo session only: no model prompt/);
});

test('studio transmission matches the disclosed prompt and excludes local metadata and photos', async t => {
  dom(t);
  const { ctx } = context();
  const child = ctx.children[0];
  const record = emptyRecord(child.id, ctx.semester);
  ctx.records = [record];
  ctx.provider = { id: 'openai', key: 'disposable-privacy-ui-test', status: 'not tested' };
  const page = providerCard(ctx);
  t.after(() => { page.dispose(); ctx.persist(); });
  const shown = promptNode(page).textContent;
  const bodies = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return { ok: true, text: async () => JSON.stringify({ output_text: JSON.stringify(
      Object.fromEntries(DOMAINS.map(({ id }) => [id, id === 'chinese'
        ? noEvidenceChineseText : 'No evidence recorded yet - teacher to add a rating and comment.']))) }) };
  });
  assert.equal(await ctx.runDraft(() => ctx.draft(child, record,
    DOMAINS.map(({ id }) => id))), true);
  assert.equal(bodies.length, 1);
  assert.equal(bodies[0].input[0].content[0].text, shown);
  assert.doesNotMatch(JSON.stringify(bodies), /privacyMetadata|knownIdentifiers|photoCount|data:image|avatar|C-01/);
});

test('studio supplies all local identity variants and masks offline input before restoring the child', async t => {
  let captured;
  const { ctx } = context({ generateNarrative: input => {
    captured = input;
    return { text: input.comment, source: 'mock', edited: false };
  } });
  t.after(() => ctx.persist());
  const child = { ...ctx.children[6], aliases: ['Avi Fictional'],
    guardian: { name: 'Fictional Carer' }, teacherName: 'Fictional Educator' };
  ctx.children = ctx.children.map((member, index) => index === 6 ? child : member);
  const record = ctx.current(child.id);
  record.domains.english = { ...record.domains.english, rating: 2,
    comment: 'Avery shares ideas with 星禾 and Avi Fictional in Class A (Sample). '
      + 'Fictional Educator spoke with Fictional Carer at pretend@example.test.' };
  const input = ctx.narrativeInput(child, record);
  assert.equal(input.privacyMetadata.children, ctx.children);
  assert.equal(input.privacyMetadata.records, ctx.records);
  assert.equal(input.privacyMetadata.class, CLASS);
  assert.ok(input.knownIdentifiers.includes('星禾'));
  const mask = createPrivacyMask(input);
  try {
    for (const value of ['Avery', '星禾', 'Avi Fictional', 'Class A (Sample)',
      'Fictional Educator', 'Fictional Carer', 'pretend@example.test']) {
      assert.ok(!JSON.stringify(mask.input).includes(value), value);
    }
  } finally { mask.dispose(); }
  assert.equal(await ctx.runDraft(() => ctx.draft(child, record, ['english'])), true);
  assert.doesNotMatch(captured.comment, /Avery|星禾|Avi Fictional|Fictional Educator|Fictional Carer|pretend@example\.test/);
  assert.equal(captured.id, 'english');
  assert.equal(Object.hasOwn(captured, 'photos'), false);
  assert.equal(Object.hasOwn(captured, 'privacyMetadata'), false);
  assert.match(record.narratives.english.text, /^Avery shares ideas/);
});

test('unsafe input hides the preview and stops both remote and offline drafting visibly', async t => {
  dom(t);
  let calls = 0;
  const { ctx } = context({ generateNarrative: () => { calls++; } });
  const child = ctx.children[0];
  const record = ctx.current(child.id);
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new Error('Unexpected request'); });
  record.domains.english.comment = 'A custody detail must not be transmitted.';
  const page = providerCard(ctx);
  t.after(() => { page.dispose(); ctx.persist(); });
  assert.equal(promptNode(page).textContent, '');
  assert.match(page.textContent, /Privacy preview unavailable/);
  assert.ok(!page.textContent.includes(record.domains.english.comment));
  assert.equal(await ctx.runDraft(() => ctx.draft(child, record, ['english'])), false);
  assert.equal(calls, 0);
  assert.match(ctx.draftError, /Privacy masking failed/);
  assert.equal(record.narratives.english, null);
  ctx.provider = { id: 'openai', key: 'disposable-privacy-ui-test', status: 'not tested' };
  assert.equal(await ctx.runDraft(() => ctx.draft(child, record, ['english'])), false);
  assert.equal(calls, 0);
  assert.match(ctx.draftError, /Privacy/);
});

test('selecting an external provider opens its privacy notice before drafting', async t => {
  dom(t);
  const { ctx } = context();
  const page = providerCard(ctx);
  t.after(() => { page.dispose(); ctx.persist(); });
  const selector = page.querySelector('select');
  const disclosure = page.querySelector('details');
  disclosure.open = false;
  selector.value = 'gateway';
  await selector.emit('change');
  assert.equal(disclosure.open, true);
  assert.ok(disclosure.textContent.includes(privacyNotice));
  assert.equal(ctx.provider.id, 'gateway');
});
