import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DOMAINS, emptyRecord, narrativeInputFor, validateRecord } from '../src/portfolio-model.js';
import {
  buildNarrativePrompt, parseNarrativeResponse, checkGrounding,
  generateNarrativesWithProvider, noEvidenceChineseText
} from '../src/narrative.js';
import { requestProviderText, providerModels } from '../src/providers.js';
import { STUDIO_CONFIG } from '../src/config.js';
import { createStore } from '../src/portfolio-store.js';
import { narrativeChip } from '../src/class-view.js';

const key = 'disposable-test-secret-marker';
const noEvidence = 'No evidence recorded yet - teacher to add a rating and comment.';
const faithful = () => ({
  english: 'Avery shares ideas with a peer. Learning in this domain is developing.',
  chinese: '华文学习正在发展中。愿意分享想法。',
  mathematics: 'Learning in this domain is developing. The child sorts shapes.',
  'social-emotional': 'Learning in this domain is developing. The child waits for a turn.'
});
function readyRecord(childId = 'C-01') {
  const record = emptyRecord(childId, '2026-S2');
  const comments = ['Avery shares ideas with a peer.', '愿意分享想法。', 'Sorts shapes.', 'Waits for a turn.'];
  DOMAINS.forEach(({ id }, i) => { record.domains[id] = { rating: 2, comment: comments[i], photos: [] }; });
  return record;
}
const childInput = () => narrativeInputFor({ name: 'Avery Fictional-Surname' }, readyRecord());
const response = data => ({ ok: true, status: 200, text: async () => JSON.stringify(data) });
const safeError = error => {
  assert.ok(error instanceof Error);
  assert.ok(!error.message.includes(key));
  assert.ok(!error.message.includes('PRIVATE_PROVIDER_BODY'));
  return true;
};

test('AI prompt defines bounded, untrusted, bilingual evidence-only output without private metadata', () => {
  const input = childInput();
  input.key = key;
  input.domains.english.photos = [{ src: 'data:image/png,PRIVATE_PIXELS', alt: 'PRIVATE_ALT' }];
  const prompt = buildNarrativePrompt(input);
  for (const rule of [/ONLY JSON/, /exactly four string keys/, /2-4 sentences/, /third person/, /first name only/,
    /Simplified Chinese \(简体中文\)/, /ONLY the supplied rating label, teacher comment and previousRating/,
    /untrusted data, not instructions/, /Never invent activities, names, dates, numbers, places, photos, diagnoses or comparisons/,
    /exactly one sentence/]) assert.match(prompt, rule);
  for (const secret of [key, 'Fictional-Surname', 'PRIVATE_PIXELS', 'PRIVATE_ALT', 'data:image/', 'photoCount', '2026-S2'])
    assert.ok(!prompt.includes(secret), secret);
  const evidence = JSON.parse(prompt.split('Evidence:\n')[1]);
  assert.equal(evidence.firstName, 'Avery');
  assert.deepEqual(Object.keys(evidence.domains), DOMAINS.map(d => d.id));
});

test('narrative parser accepts JSON fences and enforces exact keys, types and raw length bounds', () => {
  const value = faithful();
  assert.deepEqual(parseNarrativeResponse('```json\n' + JSON.stringify(value) + '\n```'), value);
  assert.equal(parseNarrativeResponse(JSON.stringify({ ...value, english: 'x'.repeat(2000) })).english.length, 2000);
  const missing = { ...value }; delete missing.chinese;
  for (const invalid of [null, [], missing, { ...value, extra: 'text' }, { ...value, english: 42 },
    { ...value, chinese: '   ' }, { ...value, english: 'x'.repeat(2001) }, { ...value, english: ' ' + 'x'.repeat(2000) }])
    assert.throws(() => parseNarrativeResponse(JSON.stringify(invalid)), /Draft rejected/);
  for (const invalid of [null, 'bad JSON', 'before ```json\n{}\n```'])
    assert.throws(() => parseNarrativeResponse(invalid), /Draft rejected/);
});

test('grounding accepts faithful English and Simplified Chinese and blocks invented numbers, names and photos', () => {
  const input = { ...childInput().domains.english, firstName: 'Avery' };
  assert.deepEqual(checkGrounding(input, faithful().english), { ok: true, reasons: [] });
  for (const text of ['Avery counted 17 blocks.', 'Avery counted two blocks.', 'Avery counted 二 blocks.',
    'Avery counted １７ blocks.', 'Avery finished twentieth.', 'Zara shares ideas.', 'Avery played in London.',
    'The photos show progress.', 'The picture shows progress.', 'An image shows progress.'])
    assert.equal(checkGrounding(input, text).ok, false, text);
  assert.equal(checkGrounding({ ...input, comment: 'Counted two groups of 17 blocks.' }, 'Avery counted two groups of 17 blocks.').ok, true);
  assert.equal(checkGrounding(input, 'Rating moved to Developing since Semester 1.').ok, false);
  assert.equal(checkGrounding({ ...input, previousRating: 1 }, 'Rating moved to Developing since Semester 1.').ok, true);
  assert.equal(checkGrounding(input, 'Rating moved to Developing since Semester 2.').ok, false);
  assert.equal(checkGrounding({ ...input, previousRating: 1 }, 'Rating moved to Developing since Semester 2.').ok, true);
  assert.equal(checkGrounding({ ...input, comment: 'Semester 1: shares ideas.' }, 'Avery shares ideas since Semester 1.').ok, false);
  const chinese = childInput().domains.chinese;
  assert.equal(checkGrounding(chinese, faithful().chinese).ok, true);
  assert.equal(checkGrounding(chinese, '華文學習正在發展中。').ok, false);
  assert.equal(checkGrounding(chinese, 'Learning is developing.').ok, false);
  assert.equal(checkGrounding({ ...chinese, photoCount: 0 }, '照片显示学习进展。').ok, false);
});

test('Chinese grounding ignores non-numeric compounds but requires evidence for numeral claims', () => {
  const input = { id: 'chinese', rating: 2, firstName: 'Cleo', comment: '能说出物品名称，需要老师提示。' };
  for (const text of [
    'Cleo和同伴一起说出物品名称，需要老师提示。',
    'Cleo能说出一些物品名称。',
    ...['一直', '一定', '一般', '一样', '一下', '一边', '一旦', '一再', '一同',
      '统一', '同一', '万一', '十分', '百般', '千万', '不一定', '万物'].map(word => `Cleo${word}需要提示。`)
  ]) assert.deepEqual(checkGrounding(input, text), { ok: true, reasons: [] }, text);

  for (const claim of ['三个物品名称', '第一次独立说出名称', '一个物品名称', '两次说出名称', '十次说出名称']) {
    const text = `Cleo说出${claim}。`;
    assert.deepEqual(checkGrounding(input, text), {
      ok: false, reasons: ['unsupported number or number word']
    }, text);
    assert.deepEqual(checkGrounding({ ...input, comment: claim }, text), { ok: true, reasons: [] }, text);
  }
  // A non-numeric compound in evidence must not license a separate numeric claim.
  assert.equal(checkGrounding({ ...input, comment: '一起说出名称。' }, 'Cleo说出一个名称。').ok, false);
});

test('grounding rejects gendered words without rejecting neutral word substrings', () => {
  const reason = 'gendered pronoun or word not supported by the record';
  const input = { ...childInput().domains.english, firstName: 'Avery' };
  for (const text of [
    'He then shares an idea...', '她在表达需要时仍然需要老师提示',
    'Her English learning is extending',
    ...['he', 'she', 'him', 'her', 'his', 'hers', 'himself', 'herself', 'boy', 'girl',
      '他', '她', '男孩', '女孩'].map(word => `Avery ${word.toUpperCase()}.`)
  ]) {
    const result = checkGrounding({ ...input, comment: text }, text);
    assert.equal(result.ok, false, text);
    assert.ok(result.reasons.includes(reason), text);
  }
  for (const text of [
    'Avery uses new vocabulary together with another child',
    'Avery explores the other corner where there are blocks.'
  ]) assert.deepEqual(checkGrounding(input, text), { ok: true, reasons: [] });
  assert.deepEqual(checkGrounding(childInput().domains.chinese,
    '在表达需要时仍然需要老师提示。'), { ok: true, reasons: [] });
});

test('prompt forbids gendered words and neutral they and supplies neutral alternatives', () => {
  const prompt = buildNarrativePrompt(childInput());
  assert.match(prompt, /Never use gendered pronouns or gendered words/);
  assert.match(prompt, /he, she, him, her, his, hers, himself, herself, boy, girl; 他, 她, 男孩, 女孩/);
  assert.match(prompt, /Neutral they is not allowed/);
  assert.match(prompt, /first name, 'the child', omit the subject, or restructure/);
});

test('picture teaching aids and fully Chinese rating labels are grounded', () => {
  const input = { label: 'Chinese', rating: 2, photoCount: 0, firstName: '悦宁' };
  for (const [comment, text] of [
    ['Names familiar objects in Mandarin with picture support ...',
      '悦宁能在图片支持下说出熟悉物品的中文名称，也喜欢在文字游戏中轮流参与。'],
    ['...matches spoken words to picture cards', '...与图片卡片配对。']
  ]) assert.deepEqual(checkGrounding({ ...input, comment }, text), { ok: true, reasons: [] });
  assert.equal(checkGrounding({ ...input, comment: 'Names familiar objects.' }, '照片显示悦宁的进步。').ok, false);
  assert.equal(checkGrounding({ ...input, firstName: '星禾' }, '星禾在中文学习中处于Developing阶段。').ok, false);
  assert.equal(checkGrounding({ ...input, firstName: '星禾' }, '星禾在中文学习中处于发展中阶段。').ok, true);
  const evidence = JSON.parse(buildNarrativePrompt(childInput()).split('Evidence:\n')[1]).domains;
  assert.equal(evidence.chinese.ratingLabelZh, '发展中');
  assert.equal(evidence.chinese.previousRatingLabelZh, null);
  assert.equal(Object.hasOwn(evidence.english, 'ratingLabelZh'), false);
});

test('no-evidence domains permit only their single language-specific sentence', () => {
  for (const [label, text] of [['English', noEvidence], ['Chinese', noEvidenceChineseText]]) {
    const input = { label, noEvidence: true };
    assert.equal(checkGrounding(input, text).ok, true);
    assert.equal(checkGrounding(input, text + ' Learning is secure.').ok, false);
    assert.equal(checkGrounding(input, text.replace(/[.。]$/, '') + ' and makes progress.').ok, false);
  }
  assert.equal(checkGrounding({ label: 'Chinese', noEvidence: true }, noEvidence).ok, false);
});

test('generation grounds every domain before returning provenance, including no-evidence exceptions', async () => {
  const input = childInput(), before = structuredClone(input);
  const result = await generateNarrativesWithProvider({ provider: 'openai', key, childInput: input,
    requestText: async () => JSON.stringify(faithful()) });
  assert.deepEqual(result.accepted.english, { text: faithful().english, source: 'ai', edited: false,
    provider: 'openai', model: providerModels.openai });
  assert.deepEqual(input, before);
  input.domains.chinese.noEvidence = true;
  const noChinese = { ...faithful(), chinese: noEvidenceChineseText };
  const gateway = await generateNarrativesWithProvider({ provider: 'gateway', childInput: input,
    requestText: async () => JSON.stringify(noChinese) });
  assert.equal(gateway.accepted.chinese.text, noEvidenceChineseText);
  assert.equal(gateway.accepted.chinese.model, STUDIO_CONFIG.demoGateway.modelId);
  const partial = await generateNarrativesWithProvider({ provider: 'gemini', key, childInput: childInput(),
    requestText: async () => JSON.stringify({ ...faithful(), 'social-emotional': 'Zara wins 99 prizes.' }) });
  assert.equal(partial.accepted['social-emotional'], undefined);
  assert.deepEqual(Object.keys(partial.accepted), ['english', 'chinese', 'mathematics']);
  assert.ok(partial.rejected['social-emotional'].reasons.includes('unsupported number or number word'));
});

test('request exceptions, raw responses and key echoes cannot escape as errors or narrative output', async () => {
  for (const requestText of [
    async () => { throw new Error(`${key} PRIVATE_PROVIDER_BODY`); },
    async () => `${key} PRIVATE_PROVIDER_BODY`,
    async () => JSON.stringify({ ...faithful(), english: key })
  ]) await assert.rejects(generateNarrativesWithProvider({ provider: 'openai', key, childInput: childInput(), requestText }), safeError);
  await assert.rejects(generateNarrativesWithProvider({ provider: 'openai', childInput: childInput() }), /disposable test key/);
});

test('raw transport gets a fresh Gateway session and uses only its returned token', async () => {
  const calls = [];
  const text = await requestProviderText({ provider: 'gateway', key, prompt: 'Fictional prompt', fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return response(calls.length === 1 ? { token: 'temporary-demo-token' } : { output_text: 'raw draft text' });
  } });
  assert.equal(text, 'raw draft text');
  assert.deepEqual(calls.map(call => call.url), [STUDIO_CONFIG.demoGateway.origin + '/demo/session', STUDIO_CONFIG.demoGateway.origin + '/demo/v1/responses']);
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(calls[0].options.body), { project_id: STUDIO_CONFIG.demoGateway.projectId });
  assert.equal(calls[1].options.headers.Authorization, 'Bearer temporary-demo-token');
  assert.deepEqual(JSON.parse(calls[1].options.body), { model: STUDIO_CONFIG.demoGateway.modelId,
    input: [{ role: 'user', content: [{ type: 'input_text', text: 'Fictional prompt' }] }], stream: false });
  assert.ok(!JSON.stringify(calls).includes(key));
});

test('raw transport uses OpenAI Responses and Gemini JSON shapes with header-only credentials', async () => {
  for (const provider of ['openai', 'gemini']) {
    const result = await requestProviderText({ provider, key, prompt: 'Fictional prompt', fetchImpl: async (url, options) => {
      assert.ok(!url.includes(key)); assert.ok(!options.body.includes(key));
      assert.equal(options.method, 'POST'); assert.equal(options.cache, 'no-store');
      assert.ok(options.signal instanceof AbortSignal);
      const body = JSON.parse(options.body);
      if (provider === 'openai') {
        assert.equal(url, 'https://api.openai.com/v1/responses');
        assert.equal(options.headers.Authorization, `Bearer ${key}`);
        assert.deepEqual(body, { model: providerModels.openai, input: [{ role: 'user', content: [{ type: 'input_text', text: 'Fictional prompt' }] }], store: false });
        return response({ output: [{ content: [{ text: 'raw OpenAI draft' }] }] });
      }
      assert.equal(url, `https://generativelanguage.googleapis.com/v1beta/models/${providerModels.gemini}:generateContent`);
      assert.equal(options.headers['x-goog-api-key'], key);
      assert.deepEqual(body, { contents: [{ role: 'user', parts: [{ text: 'Fictional prompt' }] }], generationConfig: { responseMimeType: 'application/json' } });
      return response({ candidates: [{ content: { parts: [{ text: 'raw Gemini draft' }] } }] });
    } });
    assert.equal(result, provider === 'openai' ? 'raw OpenAI draft' : 'raw Gemini draft');
  }
});

test('AI provenance survives persistence and teacher edits have unambiguous labels', () => {
  const storage = memoryStorage(), store = createStore(storage), record = readyRecord();
  record.narratives.english = { text: faithful().english, source: 'ai', edited: false, provider: 'openai', model: providerModels.openai };
  assert.deepEqual(store.save([record]), { ok: true });
  const saved = createStore(storage).get(record.childId, record.semester).narratives.english;
  assert.match(narrativeChip(saved), /^AI DRAFT \(OpenAI.*teacher must review$/);
  assert.equal(saved.model, providerModels.openai);
  assert.equal(narrativeChip({ ...saved, edited: true }), 'EDITED BY TEACHER');
  assert.equal(narrativeChip({ text: '', source: 'mock', edited: false }), 'MOCK DRAFT (offline, not AI)');
  assert.throws(() => validateRecord({ ...record, narratives: { ...record.narratives,
    english: { ...saved, provider: 'unexpected' } } }), /provider/);
});

test('class CSP limits connections exactly and class controller contains no credential storage writes', async () => {
  const html = await readFile(new URL('../class.html', import.meta.url), 'utf8');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.deepEqual(policy.match(/(?:^|;)\s*connect-src\s+([^;]+)/)[1].trim().split(/\s+/), [
    "'self'", 'https://gpt.yapweijun1996.com', 'https://api.openai.com', 'https://generativelanguage.googleapis.com'
  ]);
  const source = await readFile(new URL('../src/class-app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /(?:localStorage|sessionStorage)\s*(?:\.|\[['"])[\s\S]{0,40}setItem\s*\([^)]*(?:key|token|secret)/i);
});

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

// A small DOM surface exercises controller state/storage, not layout or browser networking.
class Node {
  constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.events = new Map(); this.attributes = {}; this.value = ''; this.disabled = false; }
  set textContent(text) { this.text = text; this.children = []; }
  get textContent() { return (this.text ?? '') + this.children.map(node => node.textContent).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(type, callback) { const list = this.events.get(type) ?? []; list.push(callback); this.events.set(type, list); }
  async emit(type) { for (const callback of this.events.get(type) ?? []) await callback({ preventDefault() {} }); }
  querySelectorAll(selector) {
    const matches = node => selector === '[data-draft]' ? node.dataset.draft !== undefined
      : selector.split(',').map(tag => tag.trim()).includes(node.tag);
    return this.children.flatMap(child => [...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  focus() {}
}

async function controller(t, { records = [readyRecord()], hash = '#/child/C-01?sem=2026-S2', generateAI } = {}) {
  const main = new Node('main'), status = new Node('p'), save = new Node('p'), storage = memoryStorage();
  createStore(storage).save(records);
  const window = new Node('window'); window.localStorage = storage;
  const document = new Node('document');
  document.createElement = tag => new Node(tag);
  document.getElementById = id => id === 'main' ? main : id === 'status' ? status : id === 'save-status' ? save
    : [main, ...main.querySelectorAll('section, p, input, select')].find(node => node.id === id);
  for (const [name, value] of Object.entries({ window, document, location: { hash }, navigator: { onLine: true } })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    t.after(() => { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; });
  }
  const { startClassApp } = await import('../src/class-app.js');
  let mockCalls = 0;
  startClassApp({ generateAI, generateNarrative: () => { mockCalls++; throw new Error('Unexpected mock fallback'); } });
  const findButton = text => main.querySelectorAll('button').find(node => node.textContent.startsWith(text));
  async function selectProvider(value) {
    const select = main.querySelector('select'); select.value = value; await select.emit('change');
    const password = main.querySelectorAll('input').find(node => node.type === 'password');
    if (password) { password.value = key; await password.emit('input'); }
  }
  return { main, status, storage, window, document, findButton, selectProvider, mockCalls: () => mockCalls };
}

test('failed real drafting leaves the stored and visible narrative unchanged, never falling back to mock', async t => {
  const record = readyRecord();
  record.narratives.english = { text: 'Existing teacher narrative.', source: 'teacher', edited: true };
  const ui = await controller(t, { records: [record], generateAI: options => generateNarrativesWithProvider({ ...options,
    requestText: async () => { throw new Error(`${key} PRIVATE_PROVIDER_BODY`); } }) });
  const before = ui.storage.getItem('ai-preschool-portfolios-v2');
  await ui.selectProvider('openai');
  assert.equal(ui.main.querySelectorAll('input').find(node => node.type === 'password').value, key);
  await ui.findButton('Draft narrative').emit('click');
  assert.equal(ui.storage.getItem('ai-preschool-portfolios-v2'), before);
  assert.equal(ui.main.querySelectorAll('textarea').find(node => node.id === 'narrative-english').value, record.narratives.english.text);
  assert.match(ui.document.getElementById('connection-status').textContent, /^failed:/);
  assert.ok(!ui.status.textContent.includes(key));
  assert.ok(!ui.status.textContent.includes('PRIVATE_PROVIDER_BODY'));
  assert.equal(ui.mockCalls(), 0);
  assert.ok(!before.includes(key));
});

test('bulk drafting is sequential, reports progress, and stops at the first error without changing later children', async t => {
  let calls = 0, active = 0, ui;
  ui = await controller(t, { hash: '#/', records: ['C-01', 'C-02', 'C-03'].map(id => readyRecord(id)),
    generateAI: options => generateNarrativesWithProvider({ ...options, requestText: async () => {
      calls++; active++;
      assert.equal(active, 1);
      assert.equal(ui.document.getElementById('connection-status').textContent, `drafting: ${calls} of 3`);
      await Promise.resolve();
      active--;
      if (calls === 2) throw new Error(key);
      return JSON.stringify(faithful());
    } }) });
  await ui.selectProvider('gateway');
  await ui.findButton('Draft narratives for all ready children').emit('click');
  const saved = createStore(ui.storage).load();
  assert.equal(calls, 2);
  assert.equal(saved[0].narratives.english.source, 'ai');
  assert.equal(saved[0].narratives.english.provider, 'gateway');
  assert.deepEqual(saved[1], validateRecord(readyRecord('C-02')));
  assert.deepEqual(saved[2], validateRecord(readyRecord('C-03')));
  assert.match(ui.status.textContent, /Stopped at 2 of 3; 1 children drafted/);
  assert.equal(ui.mockCalls(), 0);
});

test('partial drafting preserves rejected narratives and displays retry guidance without mock fallback', async t => {
  const record = readyRecord();
  record.narratives.chinese = { text: '老师保留的评语。', source: 'teacher', edited: true };
  const ui = await controller(t, { records: [record],
    generateAI: options => generateNarrativesWithProvider({ ...options, requestText: async () =>
      JSON.stringify({ ...faithful(), chinese: '星禾在中文学习中处于Developing阶段。' }) }) });
  await ui.selectProvider('gateway');
  await ui.findButton('Draft all four').emit('click');
  const saved = createStore(ui.storage).load()[0];
  assert.deepEqual(saved.narratives.chinese, record.narratives.chinese);
  assert.equal(saved.narratives.english.source, 'ai');
  assert.match(ui.status.textContent, /Chinese draft rejected:.*press Draft narrative to retry or write it yourself/);
  assert.ok(ui.main.querySelectorAll('p').some(node => /Chinese draft rejected:/.test(node.textContent)));
  assert.equal(ui.mockCalls(), 0);
});

test('bulk partial acceptance counts only fully accepted children and continues', async t => {
  const ui = await controller(t, { hash: '#/', records: ['C-01', 'C-02'].map(id => readyRecord(id)),
    generateAI: options => generateNarrativesWithProvider({ ...options, requestText: async () =>
      JSON.stringify({ ...faithful(), chinese: '中文学习处于Developing阶段。' }) }) });
  await ui.selectProvider('gateway');
  await ui.findButton('Draft narratives for all ready children').emit('click');
  assert.equal(ui.status.textContent, '0 of 2 children fully drafted; 2 domains need attention.');
  for (const record of createStore(ui.storage).load()) {
    assert.equal(record.narratives.chinese, null);
    assert.equal(record.narratives.mathematics.source, 'ai');
  }
  assert.equal(ui.mockCalls(), 0);
});

test('remote drafting is disabled offline while explicitly selected mock remains available', async t => {
  const ui = await controller(t);
  await ui.selectProvider('gateway');
  navigator.onLine = false;
  await ui.window.emit('offline');
  assert.equal(ui.findButton('Draft all four').disabled, true);
  assert.equal(ui.document.getElementById('provider-offline').hidden, false);
  await ui.selectProvider('mock');
  assert.equal(ui.findButton('Draft all four').disabled, false);
});
