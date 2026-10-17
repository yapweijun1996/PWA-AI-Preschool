import test from 'node:test';
import assert from 'node:assert/strict';
import { childInitials, normalizeChildName } from '../src/child-name.js';
import { CHILDREN } from '../src/portfolio-seed.js';
import { createStore } from '../src/portfolio-store.js';
import { createContext } from '../src/studio/context.js';
import { DOMAINS, narrativeInputFor } from '../src/portfolio-model.js';
import { buildNarrativePrompt, checkGrounding, generateNarrativesWithProvider } from '../src/narrative.js';
import { classesModel } from '../src/studio/pages/classes.js';
import { studentsModel } from '../src/studio/models/students-model.js';
import { evidenceModel } from '../src/studio/models/evidence-model.js';
import { printModel } from '../src/studio/pages/print.js';
import { mountShell } from '../src/studio/shell.js';
import { dom } from './helpers/studio-dom.js';

function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value) };
}

const firstName = name => name.split(/\s+/u)[0];

test('names trim, normalize NFC and count Unicode code points rather than UTF-16 units', () => {
  assert.equal(normalizeChildName('  E\u0301lodie Vale  '), 'Élodie Vale');
  for (const name of ['林小雨', 'Nur Imani', 'கனிமொழி', "O’River-Sky", '𐐀'.repeat(60)])
    assert.equal(normalizeChildName(name), name);
  for (const name of ['', '   ', 'a'.repeat(61), '𐐀'.repeat(61), 'A\nB', 'A\tB', 'A\u0000B',
    'A\u007fB', 'A\u0085B', 'A\u202eB', null])
    assert.throws(() => normalizeChildName(name), /child name/);
});

test('initials derive complete graphemes in multiple scripts without splitting surrogate pairs', () => {
  for (const [name, initials] of [
    ['Aster V.', 'AV'], ['  e\u0301lodie   vale ', 'ÉV'], ['林小雨', '林'],
    ['𐐨 Vale', '𐐀V'], ['கனிமொழி', 'க'], ['👩🏽 Vale', '👩🏽V'], ['Nur Bina Imani', 'NI']
  ]) assert.equal(childInitials(name), initials, name);
  assert.ok(CHILDREN.every(child => child.initials === childInitials(child.name)));
});

test('the existing v2 envelope loads old records and round-trips names through save, upsert, export and import', () => {
  const disk = storage();
  const ctx = createContext({ storage: disk });
  const old = JSON.parse(disk.getItem('ai-preschool-portfolios-v2'));
  delete old.childNames;
  disk.setItem('ai-preschool-portfolios-v2', JSON.stringify(old));
  const store = createStore(disk);
  assert.equal(store.load().length, 40);
  assert.deepEqual(store.childNames, {});
  assert.deepEqual(store.save(ctx.records, { 'C-05': '  E\u0301lodie Vale  ' }), { ok: true });
  assert.deepEqual(store.childNames, { 'C-05': 'Élodie Vale' });
  store.upsert(store.get('C-05', '2026-S2'));
  const copy = createStore(storage());
  assert.deepEqual(copy.importJson(store.exportJson()), { ok: true });
  assert.deepEqual(copy.childNames, store.childNames);
  const detached = copy.childNames;
  detached['C-05'] = 'Changed';
  assert.equal(copy.childNames['C-05'], 'Élodie Vale');
  const before = store.exportJson();
  assert.equal(store.save(ctx.records, { 'C-05': '\u0000' }).ok, false);
  assert.equal(store.save(ctx.records, { unknown: 'Fictional' }).ok, false);
  assert.equal(store.exportJson(), before);
  store.reset();
  assert.deepEqual(store.childNames, {});
});

test('rename updates identity-based lists, evidence, reports and subsequent sessions without changing IDs or prose', () => {
  const disk = storage(), ctx = createContext({ storage: disk });
  const child = ctx.children[4];
  const record = ctx.current(child.id);
  record.narratives.english = { text: 'Ellis shares ideas with Beck.', source: 'teacher', edited: true };
  record.reviewed = true;
  const evidence = record.domains.english.comment;
  assert.deepEqual(ctx.renameChild(child.id, '  E\u0301lodie Vale '),
    { name: 'Élodie Vale', duplicate: false });
  assert.equal(child.id, 'C-05');
  assert.equal(child.initials, 'ÉV');
  assert.equal(record.domains.english.comment, evidence);
  assert.equal(record.narratives.english.text, 'Ellis shares ideas with Beck.');
  assert.equal(record.reviewed, false);
  assert.ok(ctx.stale.has('C-05:2026-S2:english'));
  assert.equal(classesModel(ctx, { query: 'Élodie' }).children[0].name, child.name);
  assert.equal(studentsModel(ctx.children, ctx.records, ctx.semester, { query: 'Élodie' })[0].child.name, child.name);
  assert.ok(evidenceModel(ctx.children, ctx.records, { childId: child.id })
    .every(item => item.childName === child.name));
  assert.equal(printModel(ctx, { name: 'print', childId: child.id }, '')[0].childName, child.name);
  const restored = createContext({ storage: disk });
  assert.equal(restored.children[4].name, child.name);
  assert.equal(restored.children[4].initials, 'ÉV');
  assert.equal(restored.children[0].name, CHILDREN[0].name);
  assert.notEqual(ctx.children, CHILDREN);
  ctx.reset();
  assert.deepEqual(ctx.children, CHILDREN);
});

test('duplicates are allowed, invalid names never commit, busy drafts lock identity and failed writes are retryable', () => {
  const disk = storage(), ctx = createContext({ storage: disk });
  const originalId = ctx.children[4].id;
  assert.equal(ctx.renameChild(originalId, ctx.children[0].name).duplicate, true);
  assert.equal(ctx.children[4].id, originalId);
  const before = ctx.children[4].name;
  assert.throws(() => ctx.renameChild(originalId, '  '));
  assert.equal(ctx.children[4].name, before);
  ctx.busy = true;
  assert.throws(() => ctx.renameChild(originalId, 'Fictional Name'), /drafting/);
  ctx.busy = false;
  const write = disk.setItem;
  disk.setItem = () => { throw new Error('Quota exceeded'); };
  ctx.renameChild(originalId, 'Fictional Name');
  assert.equal(ctx.children[4].name, 'Fictional Name');
  assert.match(ctx.saveStatus, /^Not saved/);
  disk.setItem = write;
  ctx.retrySave();
  assert.equal(createContext({ storage: disk }).children[4].name, 'Fictional Name');
});

test('every English seed name supports actual mock drafting and masked remote grounding including Chinese', async () => {
  const ctx = createContext({ storage: storage() });
  for (const child of ctx.children) {
    const record = ctx.current(child.id);
    for (const { id } of DOMAINS) record.domains[id] = { rating: 2, photos: [],
      comment: id === 'chinese' ? '愿意分享想法。' : 'Shares ideas with a peer.' };
    assert.equal(await ctx.runDraft(() => ctx.draft(child, record, DOMAINS.map(({ id }) => id))), true, child.name);
    assert.ok(DOMAINS.every(({ id }) => record.narratives[id]?.source === 'mock'));
    const input = ctx.narrativeInput(child, record);
    const chinese = { ...input.domains.chinese, id: 'chinese', firstName: firstName(child.name) };
    assert.equal(checkGrounding(chinese, `${chinese.firstName}愿意分享想法。`).ok, true);
    assert.equal(checkGrounding(chinese, `${chinese.firstName}的学习处于Developing阶段。`).ok, false);
    const remote = await generateNarrativesWithProvider({ provider: 'gateway', childInput: input,
      requestText: async ({ prompt }) => {
        assert.equal(prompt, buildNarrativePrompt(input));
        assert.ok(!prompt.includes(child.name));
        const maskedName = JSON.parse(prompt.split('Evidence:\n')[1]).firstName;
        return JSON.stringify(Object.fromEntries(DOMAINS.map(({ id }) => [id, id === 'chinese'
          ? `${maskedName}愿意分享想法。华文学习正在发展中。`
          : `${maskedName} shares ideas with a peer. Learning in this domain is developing.`])));
      } });
    assert.deepEqual(remote.rejected, {}, child.name);
    assert.equal(Object.keys(remote.accepted).length, 4, child.name);
    assert.ok(remote.accepted.chinese.text.includes(firstName(child.name)));
  }
});

test('renamed multilingual names flow to new prompts, mask boundaries and locally restored narratives', async () => {
  const ctx = createContext({ storage: storage() });
  const child = ctx.children[4], record = ctx.current(child.id);
  for (const name of ['Élodie Vale', '陈星禾', 'கனிமொழி', 'Nur Imani']) {
    ctx.renameChild(child.id, name);
    record.domains.english.comment = `${ctx.narrativeInput(child, record).firstName} shares ideas.`;
    const input = ctx.narrativeInput(child, record);
    assert.ok(!buildNarrativePrompt(input).includes(input.firstName));
    assert.equal(await ctx.runDraft(() => ctx.draft(child, record, ['english'])), true);
    assert.ok(record.narratives.english.text.includes(input.firstName));
  }
});

test('given names preserve single Han characters and supplementary code points', () => {
  const ctx = createContext({ storage: storage() });
  for (const [name, expected] of [['林', '林'], ['𠀀星禾', '星禾'], ['E\u0301lodie Vale', 'Élodie']])
    assert.equal(narrativeInputFor({ name }, ctx.current('C-01')).firstName, expected);
});

test('the open child breadcrumb refreshes immediately after renaming', t => {
  dom(t);
  const ctx = createContext({ storage: storage() });
  const shell = mountShell(ctx);
  shell.update({ name: 'child-editor', childId: 'C-05' });
  const breadcrumb = shell.root.querySelectorAll('nav')
    .find(node => node.attributes['aria-label'] === 'Breadcrumb');
  assert.match(breadcrumb.textContent, /Ellis B\./);
  ctx.renameChild('C-05', 'Fictional Newname');
  assert.match(breadcrumb.textContent, /Fictional Newname/);
  assert.doesNotMatch(breadcrumb.textContent, /Ellis B\./);
});
