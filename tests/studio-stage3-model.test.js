import test from 'node:test';
import assert from 'node:assert/strict';
import { context } from './helpers/studio-dom.js';
import { DOMAINS } from '../src/portfolio-model.js';
import { draftsModel } from '../src/studio/models/drafts-model.js';
import { reportsModel } from '../src/studio/models/reports-model.js';
import { createSettingsModel, CONNECTION_ERROR } from '../src/studio/models/settings-model.js';
import { draftReadyChildren } from '../src/studio/bulk-draft.js';
import { parseRoute, buildRoute } from '../src/studio/router.js';
import { writeupHref } from '../src/studio/pages/about.js';

const key = 'disposable-private-key-marker';

test('draft queues isolate partial, reviewed and semester-specific rejected work', () => {
  const { ctx } = context();
  const record = ctx.get('C-01');
  record.narratives.english = { text: 'Fictional evidence.', source: 'ai', provider: 'gateway',
    edited: false };
  record.narratives.chinese = { text: '华文学习正在发展中。', source: 'mock', edited: false };
  ctx.rejections.set('C-01:2026-S2:mathematics', 'unsupported capitalised word or name');
  ctx.rejections.set('C-02:2026-S1:english', 'Only prior semester');
  ctx.rejections.set('unknown:2026-S2:english', 'Not a child');
  const model = draftsModel(ctx);
  assert.deepEqual(model.ready.map(child => child.id), ['C-02', 'C-03']);
  assert.deepEqual(model.queue.map(item => item.child.id), ['C-01']);
  assert.deepEqual(model.queue[0].narratives.map(item => item.source), [
    'AI DRAFT (GPT Demo Gateway) - teacher must review', 'MOCK DRAFT (offline, not AI)'
  ]);
  assert.deepEqual(parseRoute(model.queue[0].href), { name: 'child-editor', childId: 'C-01',
    semester: '2026-S2', domain: 'review' });
  assert.equal(model.rejected[0].domain.id, 'mathematics');
  assert.equal(model.rejected.length, 1);
  assert.equal(parseRoute(model.rejected[0].href).domain, 'mathematics');
  record.reviewed = true;
  assert.deepEqual(draftsModel(ctx).queue, []);
  ctx.semester = '2026-S1';
  assert.deepEqual(draftsModel(ctx).rejected.map(item => item.child.id), ['C-02']);
});

test('batch progress preserves completed and later children on request failure', async () => {
  let calls = 0;
  const { ctx } = context({ generateAI: async () => {
    calls++;
    if (calls === 2) throw new Error(key);
    return { accepted: Object.fromEntries(DOMAINS.map(domain => [domain.id,
      { text: domain.id === 'chinese' ? '华文学习正在发展中。' : 'Fictional narrative.',
        source: 'ai', provider: 'gateway', edited: false }])), rejected: {} };
  } });
  ctx.provider.id = 'gateway';
  const before = structuredClone(ctx.get('C-03'));
  const progress = [];
  ctx.subscribe(() => { if (ctx.batch) progress.push(ctx.batch.completed); });
  assert.equal(await ctx.runDraft(() => draftReadyChildren(ctx, draftsModel(ctx).ready)), false);
  assert.equal(calls, 2);
  assert.equal(ctx.batch.completed, 1);
  assert.equal(ctx.batch.total, 3);
  assert.ok(progress.includes(0) && progress.includes(1));
  assert.equal(ctx.get('C-01').narratives.english.source, 'ai');
  assert.deepEqual(ctx.get('C-03'), before);
  assert.match(ctx.draftError, /Stopped at 2 of 3; 1 children drafted/);
  assert.ok(!ctx.draftError.includes(key));
});

test('retry replaces one domain; rejection reasons never persist', async () => {
  const { ctx, writes, storage } = context();
  const record = ctx.get('C-01');
  const old = { text: 'Keep this narrative.', source: 'teacher', edited: true };
  record.narratives.english = old;
  ctx.rejections.set('C-01:2026-S2:chinese', 'session-only-rejection-marker');
  await ctx.runDraft(() => ctx.draft(ctx.children[0], record, ['chinese']));
  assert.deepEqual(record.narratives.english, old);
  assert.equal(record.narratives.chinese.source, 'mock');
  assert.equal(ctx.rejections.has('C-01:2026-S2:chinese'), false);
  assert.ok(!JSON.stringify(writes).includes('session-only-rejection-marker'));
  const restored = context({ storage }).ctx;
  assert.equal(restored.rejections.size, 0);
});

test('grounding rejection detail uses only allowlisted word kinds and stays session-only', async () => {
  const reason = 'unsupported capitalised word or name';
  const privateText = 'PrivateProviderIdentifier';
  for (const [unsupportedWordKind, expected] of [
    ['sentence-start word', `${reason}: sentence-start word`],
    ['name or mid-sentence word', `${reason}: name or mid-sentence word`],
    [undefined, reason],
    [privateText, reason]
  ]) {
    const rejection = { reasons: [reason, 'unsupported number or number word'],
      unsupportedWordKind, text: privateText };
    const { ctx, writes } = context({ generateAI: async () => ({
      accepted: {}, rejected: { english: rejection }
    }) });
    ctx.provider.id = 'gateway';
    const record = ctx.get('C-01');
    const before = structuredClone(record);
    await ctx.runDraft(() => ctx.draft(ctx.children[0], record, ['english']));
    assert.equal(ctx.rejections.get('C-01:2026-S2:english'),
      `Draft rejected: ${expected}; unsupported number or number word. Retry or write it yourself.`);
    assert.deepEqual(rejection.reasons, [reason, 'unsupported number or number word']);
    assert.deepEqual(record, before);
    assert.ok(!JSON.stringify([...ctx.rejections]).includes(privateText));
    assert.ok(!JSON.stringify(writes).includes('Draft rejected:'));
    assert.ok(!JSON.stringify(writes).includes(privateText));
  }
});

test('report completeness follows child, semester and class without invented evidence', () => {
  const { ctx } = context();
  const selected = { childId: 'C-05', semester: '2026-S2' };
  const model = reportsModel(ctx, selected);
  assert.equal(model.complete, false);
  assert.ok(model.warnings.includes('Chinese: narrative not drafted'));
  assert.ok(model.warnings.includes('Mathematics: rating not recorded'));
  assert.equal(model.reports[0].domains[2].ratingValue, null);
  assert.equal(model.href, '#/print/C-05?sem=2026-S2');
  const prior = reportsModel(ctx, { childId: 'C-01', semester: '2026-S1' });
  assert.equal(prior.complete, true);
  assert.deepEqual(prior.warnings, []);
  const all = reportsModel(ctx, { type: 'class', semester: '2026-S2' });
  assert.equal(all.reports.length, 20);
  assert.ok(all.warnings.includes('Ellis B.: Chinese: narrative not drafted'));
  assert.equal(all.href, '#/print-class?sem=2026-S2');
  assert.deepEqual(reportsModel(ctx, { childId: 'missing' }).reports, []);
  ctx.records = [];
  const missing = reportsModel(ctx, selected);
  assert.equal(missing.warnings.length, 12);
  assert.ok(missing.reports[0].domains.every(domain => domain.narrative === null));
});

test('settings keep credentials only in memory and clear selection/disposal fields', async () => {
  const { ctx, writes } = context();
  const model = createSettingsModel(ctx, async () => {});
  assert.equal(model.state.key, '');
  assert.equal(model.state.id, 'mock');
  model.choose('openai');
  model.setKey(key);
  await model.test();
  assert.equal(model.state.status, 'Connected');
  assert.equal(model.apply(), true);
  assert.equal(ctx.provider.key, key);
  const record = ctx.current('C-01');
  record.domains.english.comment = 'Fictional changed comment.';
  ctx.change(record);
  ctx.persist();
  assert.ok(!JSON.stringify(writes).includes(key));
  model.dispose();
  assert.equal(model.state.key, '');
  assert.equal(createSettingsModel(ctx).state.key, '');
  assert.equal(ctx.provider.key, key);
  const next = createSettingsModel(ctx);
  next.choose('gemini');
  assert.equal(ctx.provider.key, '');
  assert.equal(next.state.status, 'Not tested');
});

test('settings sanitize exceptions and ignore stale or disposed probes', async () => {
  const { ctx } = context();
  const failed = createSettingsModel(ctx, async () => { throw new Error(key); });
  failed.choose('gateway');
  await failed.test();
  assert.equal(failed.state.status, 'Failed');
  assert.equal(failed.state.message, CONNECTION_ERROR);
  let finish;
  const pending = createSettingsModel(ctx, () => new Promise(resolve => { finish = resolve; }));
  pending.choose('gateway');
  const request = pending.test();
  assert.equal(ctx.busy, true);
  pending.choose('mock');
  finish();
  await request;
  assert.equal(pending.state.status, 'Not tested');
  assert.equal(ctx.busy, false);
  pending.choose('gateway');
  const leaving = pending.test();
  pending.dispose();
  finish();
  await leaving;
  assert.notEqual(pending.state.status, 'Connected');
});

test('offline and missing-key guards block remote probes without changing narratives', async () => {
  let calls = 0;
  const { ctx } = context({ isOffline: () => true });
  const model = createSettingsModel(ctx, async () => { calls++; });
  const before = JSON.stringify(ctx.records);
  model.choose('gateway');
  await model.test();
  assert.equal(model.state.status, 'Offline');
  assert.equal(model.apply(), false);
  assert.equal(calls, 0);
  model.choose('mock');
  assert.equal(model.apply(), true);
  ctx.isOffline = () => false;
  model.choose('openai');
  await model.test();
  assert.match(model.state.message, /Enter a disposable test key/);
  assert.equal(calls, 0);
  assert.equal(JSON.stringify(ctx.records), before);
});

test('review and ready-filter links roundtrip; write-up never invents a repository owner', () => {
  assert.deepEqual(parseRoute(buildRoute('classes', { filter: 'ready-for-draft' })),
    { name: 'classes', filter: 'ready-for-draft' });
  assert.equal(writeupHref({}), null);
  assert.equal(writeupHref({ repositoryUrl: 'https://github.com/example/studio.git' }),
    'https://github.com/example/studio/blob/main/docs/26-submission-writeup.md');
  assert.equal(writeupHref({ repositoryUrl: 'javascript:alert(1)' }), null);
});
