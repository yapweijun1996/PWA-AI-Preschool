import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_LANGUAGE_STORAGE_KEY, loadReportLanguage, saveReportLanguage } from '../src/report-language.js';
import { mockNarrative, buildNarrativePrompt, checkGrounding, generateNarrativesWithProvider,
  noEvidenceMalayText, noEvidenceChineseText } from '../src/narrative.js';
import { DOMAINS, emptyRecord, narrativeInputFor, validateRecord } from '../src/portfolio-model.js';
import { createContext } from '../src/studio/context.js';
import { createStore } from '../src/portfolio-store.js';
import { draftReadyChildren } from '../src/studio/bulk-draft.js';
import { buildReport } from '../src/report-model.js';
import { profileModel } from '../src/studio/models/profile-model.js';

const memoryStorage = () => {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value) };
};
const readyRecord = () => {
  const record = emptyRecord('C-01', '2026-S2');
  for (const { id } of DOMAINS) record.domains[id] = {
    rating: 2, comment: id === 'chinese' ? '愿意分享想法。' : 'Berkongsi dua idea.', photos: []
  };
  return record;
};

test('report preference always defaults to English and safely persists only supported languages', () => {
  const storage = memoryStorage();
  assert.equal(loadReportLanguage(storage), 'en');
  for (const value of ['ms', 'zh-Hans', 'en']) {
    assert.equal(saveReportLanguage(storage, value), true);
    assert.equal(storage.values.get(REPORT_LANGUAGE_STORAGE_KEY), value);
    assert.equal(loadReportLanguage(storage), value);
  }
  storage.values.set(REPORT_LANGUAGE_STORAGE_KEY, 'ms-MY');
  assert.equal(loadReportLanguage(storage), 'en');
  assert.equal(loadReportLanguage(null), 'en');
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.equal(loadReportLanguage(denied), 'en');
  assert.equal(saveReportLanguage(denied, 'ms'), false);
  const ctx = createContext({ storage: denied });
  ctx.setReportLanguage('ms');
  assert.equal(ctx.reportLanguage, 'ms');
  assert.equal(ctx.reportLanguageSaved, false);
  assert.equal(createContext({ storage: denied }).reportLanguage, 'en');
});

test('Malay offline mock uses every rating and comparison template while preserving verbatim evidence', () => {
  const labels = ['Permulaan', 'Sedang berkembang', 'Kukuh', 'Lanjutan'];
  for (let rating = 1; rating <= 4; rating++) {
    const input = { id: 'english', rating, comment: '  Berkongsi dua idea.\n' };
    const same = mockNarrative(input, { reportLanguage: 'ms', previousRating: rating });
    assert.equal(same.text, `Penilaian: ${labels[rating - 1]}. ${input.comment}`);
    for (let previousRating = 1; previousRating <= 4; previousRating++) {
      if (previousRating === rating) continue;
      const draft = mockNarrative(input, { reportLanguage: 'ms', previousRating });
      assert.equal(draft.text, `${input.comment} Penilaian berubah daripada ${labels[previousRating - 1]} kepada ${labels[rating - 1]} sejak Semester 1.`);
    }
  }
  assert.equal(mockNarrative({}, { reportLanguage: 'ms' }).text, noEvidenceMalayText);
  for (const reportLanguage of ['en', 'ms', 'zh-Hans']) {
    assert.equal(mockNarrative({ id: 'chinese', noEvidence: true }, { reportLanguage }).text, noEvidenceChineseText);
    assert.match(mockNarrative({ id: 'chinese', rating: 2, comment: '愿意分享想法。' }, { reportLanguage }).text, /^华文学习正在发展中。/);
  }
});

test('provider prompt carries report preference across privacy projection and preserves Chinese-domain rules', () => {
  const input = narrativeInputFor({ name: 'Avery Sample' }, readyRecord());
  for (const reportLanguage of ['en', 'ms', 'zh-Hans']) {
    const prompt = buildNarrativePrompt({ ...input, reportLanguage });
    const evidence = JSON.parse(prompt.split('Evidence:\n')[1]);
    assert.equal(evidence.reportLanguage, reportLanguage);
    assert.ok(!prompt.includes('Avery'));
    assert.match(prompt, /always write Simplified Chinese/);
    if (reportLanguage === 'ms') {
      assert.match(prompt, /Write Malay \(Bahasa Melayu\) for english, mathematics and social-emotional/);
      assert.match(prompt, /neutral Malay pronoun 'dia'/);
      assert.match(prompt, /preserve number tokens exactly/);
      assert.equal(evidence.domains.english.ratingLabelMs, 'Sedang berkembang');
      assert.equal(Object.hasOwn(evidence.domains.chinese, 'ratingLabelMs'), false);
    }
    if (reportLanguage === 'zh-Hans') assert.equal(evidence.domains.english.ratingLabelZh, '发展中');
  }
});

test('Malay grounding permits neutral dia and supplied quantities but rejects invented numbers, names, photos and altered first names', () => {
  const input = { id: 'english', reportLanguage: 'ms', rating: 2, firstName: 'Avery',
    comment: 'Berkongsi dua idea.', photoCount: 0 };
  for (const text of ['Avery berkongsi dua idea. Dia sedang berkembang.', 'Dia berkongsi dua idea.'])
    assert.deepEqual(checkGrounding(input, text), { ok: true, reasons: [] });
  for (const number of ['tiga', 'sebelas', 'seratus', 'pertama', 'sekali', 'setiap', '17'])
    assert.ok(checkGrounding(input, `Avery berkongsi ${number} idea.`).reasons.includes('unsupported number or number word'));
  assert.ok(checkGrounding(input, 'Zara berkongsi idea.').reasons.includes('unsupported capitalised word or name'));
  assert.ok(checkGrounding(input, 'Avery bermain di Melaka.').reasons.includes('unsupported capitalised word or name'));
  assert.ok(checkGrounding(input, 'avery berkongsi idea.').reasons.includes('child first name must match the supplied spelling and script exactly'));
  for (const word of ['Foto', 'Gambar', 'Imej'])
    assert.ok(checkGrounding(input, `${word} menunjukkan pembelajaran.`).reasons.includes('photo claim without a recorded photo'));
  assert.equal(checkGrounding({ ...input, comment: 'Gambar menunjukkan dua idea.' }, 'Avery berkongsi dua idea dalam gambar.').ok, true);
  assert.equal(checkGrounding({ ...input, firstName: '星禾' }, '星禾 berkongsi dua idea. Dia sedang berkembang.').ok, true);
  assert.equal(checkGrounding({ ...input, noEvidence: true }, noEvidenceMalayText).ok, true);
  assert.equal(checkGrounding({ ...input, noEvidence: true }, noEvidenceMalayText + ' Dia berkongsi.').ok, false);
  for (const word of ['lelaki', 'perempuan', 'jantan', 'betina'])
    assert.ok(checkGrounding(input, `Avery ${word} berkongsi idea.`).reasons.includes('gendered pronoun or word not supported by the record'));
});

test('Malay remote response is restored exactly, grounded and stamped without mock fallback on failure', async () => {
  const input = { ...narrativeInputFor({ name: 'Avery Sample' }, readyRecord()), reportLanguage: 'ms' };
  const result = await generateNarrativesWithProvider({ provider: 'gateway', childInput: input,
    requestText: async ({ prompt }) => {
      const evidence = JSON.parse(prompt.split('Evidence:\n')[1]);
      return JSON.stringify(Object.fromEntries(DOMAINS.map(({ id }) => [id,
        id === 'chinese' ? '华文学习正在发展中。愿意分享想法。'
          : `${evidence.firstName} berkongsi dua idea. Dia sedang berkembang.`])));
    } });
  assert.deepEqual(Object.keys(result.rejected), []);
  for (const { id } of DOMAINS) {
    assert.equal(result.accepted[id].language, id === 'chinese' ? 'zh-Hans' : 'ms');
    assert.equal(result.accepted[id].source, 'ai');
    if (id !== 'chinese') assert.match(result.accepted[id].text, /^Avery /);
  }
  await assert.rejects(generateNarrativesWithProvider({ provider: 'gateway', childInput: input,
    requestText: async () => { throw new Error('offline'); } }), /AI request failed/);
});

test('single and class drafting use remembered report preference; stored drafts keep language after preference changes', async () => {
  const storage = memoryStorage();
  const ctx = createContext({ storage });
  assert.equal(ctx.reportLanguage, 'en');
  ctx.setReportLanguage('ms');
  const child = ctx.children[0], record = ctx.current(child.id);
  await ctx.draft(child, record, ['english', 'chinese']);
  assert.equal(record.narratives.english.language, 'ms');
  assert.equal(record.narratives.chinese.language, 'zh-Hans');
  const originalDraft = record.narratives.english.text;
  ctx.setReportLanguage('en');
  assert.equal(record.narratives.english.language, 'ms');
  assert.equal(record.narratives.english.text, originalDraft);
  ctx.setReportLanguage('ms');
  const batch = await draftReadyChildren(ctx, ctx.children.slice(0, 2));
  assert.equal(batch.count, 2);
  const restored = createContext({ storage });
  assert.equal(restored.reportLanguage, 'ms');
  for (const member of restored.children.slice(0, 2)) {
    const saved = restored.get(member.id);
    for (const { id } of DOMAINS) assert.equal(saved.narratives[id].language, id === 'chinese' ? 'zh-Hans' : 'ms');
  }
  const report = buildReport({ child, record });
  assert.equal(report.domains[0].narrative.language, 'ms');
  const profile = profileModel(child, [record]);
  assert.equal(profile.semesters[0].narratives[0].language, 'ms');
});

test('narrative language metadata survives export/import and invalid Chinese overrides are refused', () => {
  const record = readyRecord();
  record.narratives.english = { text: 'Dia berkongsi dua idea.', source: 'teacher', edited: true, language: 'ms' };
  const store = createStore(memoryStorage());
  assert.equal(store.save([record]).ok, true);
  const imported = createStore(memoryStorage());
  assert.equal(imported.importJson(store.exportJson()).ok, true);
  assert.equal(imported.get(record.childId, record.semester).narratives.english.language, 'ms');
  record.narratives.chinese = { ...record.narratives.english, language: 'ms' };
  assert.throws(() => validateRecord(record), /Chinese must be zh-Hans/);
  record.narratives.chinese.language = 'zh-Hans';
  record.narratives.english.language = 'unsupported';
  assert.throws(() => validateRecord(record), /narrative language must be/);
});
