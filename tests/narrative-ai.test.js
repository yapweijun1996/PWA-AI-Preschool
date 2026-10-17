import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DOMAINS, emptyRecord, narrativeInputFor, validateRecord } from '../src/portfolio-model.js';
import {
  buildNarrativePrompt, parseNarrativeResponse, checkGrounding,
  generateNarrativesWithProvider, noEvidenceChineseText
} from '../src/narrative.js';
import { requestProviderText, providerModels, probeProviderConnection, connectionProbePrompt } from '../src/providers.js';
import { STUDIO_CONFIG } from '../src/config.js';
import { createStore } from '../src/portfolio-store.js';
import { narrativeChip } from '../src/class-view.js';
import { CHILDREN, CLASS } from '../src/portfolio-seed.js';

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
const promptEvidence = prompt => JSON.parse(prompt.split('Evidence:\n')[1]);
const maskedReply = ({ prompt }, value = faithful()) => {
  const firstName = promptEvidence(prompt).firstName;
  return JSON.stringify(Object.fromEntries(Object.entries(value)
    .map(([id, text]) => [id, text.replaceAll('Avery', firstName)])));
};
const response = data => ({ ok: true, status: 200, text: async () => JSON.stringify(data) });
const safeError = error => {
  assert.ok(error instanceof Error);
  assert.ok(error.message.length < 300);
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
  for (const secret of [key, 'Avery', 'Fictional-Surname', 'PRIVATE_PIXELS', 'PRIVATE_ALT', 'data:image/', 'photoCount', '2026-S2'])
    assert.ok(!prompt.includes(secret), secret);
  const evidence = JSON.parse(prompt.split('Evidence:\n')[1]);
  assert.ok(evidence.firstName && evidence.firstName !== 'Avery');
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

test('prompt masks first-name scripts while preserving rating words and comment quantities', () => {
  const prompt = buildNarrativePrompt({ ...childInput(), firstName: '星禾' });
  for (const rule of [
    /same characters and spelling, same script/,
    /Never translate, transliterate, romanise, abbreviate or mix it with another script/,
    /Chinese characters stay in Chinese characters even inside English sentences/,
    /Latin letters stay in Latin letters even inside Chinese sentences/,
    /For English domains, keep each rating word consistent with the supplied ratingLabel/,
    /copy numbers and counting phrases such as 'once' or 'each' as written/,
    /rather than rewording them into new number expressions/,
    /Never use gendered pronouns or gendered words/,
    /Neutral they is not allowed/,
    /Never invent activities, names, dates, numbers, places, photos, diagnoses or comparisons/
  ]) assert.match(prompt, rule);
  assert.notEqual(promptEvidence(prompt).firstName, '星禾');
  assert.ok(!prompt.includes('星禾'));
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
    requestText: async options => maskedReply(options) });
  assert.deepEqual(result.accepted.english, { text: faithful().english, source: 'ai', edited: false,
    provider: 'openai', model: providerModels.openai });
  assert.deepEqual(input, before);
  input.domains.chinese.noEvidence = true;
  const noChinese = { ...faithful(), chinese: noEvidenceChineseText };
  const gateway = await generateNarrativesWithProvider({ provider: 'gateway', childInput: input,
    requestText: async options => maskedReply(options, noChinese) });
  assert.equal(gateway.accepted.chinese.text, noEvidenceChineseText);
  assert.equal(gateway.accepted.chinese.model, STUDIO_CONFIG.demoGateway.modelId);
  const partial = await generateNarrativesWithProvider({ provider: 'gemini', key, childInput: childInput(),
    requestText: async options => maskedReply(options, { ...faithful(), 'social-emotional': 'Zara wins 99 prizes.' }) });
  assert.equal(partial.accepted['social-emotional'], undefined);
  assert.deepEqual(Object.keys(partial.accepted), ['english', 'chinese', 'mathematics']);
  assert.ok(partial.rejected['social-emotional'].reasons.includes('unsupported number or number word'));
});

test('all remote providers send exactly the masked preview without roster, metadata or photo identifiers', async () => {
  const names = CHILDREN.flatMap(child => [child.name, narrativeInputFor(child, readyRecord()).firstName, child.initials, child.id]);
  const identifiers = [...names, CLASS.name, CLASS.teacher, 'Fictional Guardian', 'Fictional Centre',
    '8123 4567', 'caregiver@example.invalid', 'S1234567D', '2020-03-12',
    '12 Sample Road', '#03-12', 'Singapore 123456',
    'https://example.invalid/private-child', 'PRIVATE_CAPTURE.png', 'data:image/png;base64,PRIVATE_PIXELS'];
  for (const provider of ['gateway', 'openai', 'gemini']) {
    const input = childInput();
    input.privacyMetadata = { children: CHILDREN, class: CLASS, guardianName: 'Fictional Guardian',
      organizationName: 'Fictional Centre' };
    input.domains.english.comment = 'Shares ideas with a peer. ' + identifiers.join('; ');
    input.domains.english.photos = [{ src: 'data:image/png;base64,PRIVATE_PIXELS', alt: 'PRIVATE_ALT', id: 'PRIVATE_PHOTO_ID' }];
    const before = structuredClone(input), preview = buildNarrativePrompt(input), calls = [];
    const result = await generateNarrativesWithProvider({ provider, key, childInput: input,
      requestText: options => requestProviderText({ ...options, fetchImpl: async (url, request) => {
        calls.push({ url, request });
        for (const value of [...identifiers, 'PRIVATE_ALT', 'PRIVATE_PHOTO_ID', 'PRIVATE_PIXELS'])
          assert.ok(!url.includes(value) && !request.body.includes(value), value);
        const body = JSON.parse(request.body);
        if (url.endsWith('/demo/session')) return response({ token: 'temporary-masked-session' });
        const prompt = provider === 'gemini' ? body.contents[0].parts[0].text : body.input[0].content[0].text;
        assert.equal(prompt, preview);
        const text = maskedReply({ prompt });
        return response(provider === 'gemini'
          ? { candidates: [{ content: { parts: [{ text }] } }] } : { output_text: text });
      } }) });
    assert.equal(calls.length, provider === 'gateway' ? 2 : 1);
    assert.equal(result.accepted.english.text, faithful().english);
    assert.deepEqual(input, before);
  }
});

test('provider generation round-trips child names in Latin, Chinese, Malay and Tamil scripts locally', async () => {
  for (const firstName of ['Avery', '星禾', 'Nur Imani', 'கதிர்']) {
    const input = childInput();
    input.firstName = firstName;
    input.domains.english.comment = `${firstName} shares ideas with a peer.`;
    const result = await generateNarrativesWithProvider({ provider: 'openai', key, childInput: input,
      requestText: async options => {
        assert.ok(!options.prompt.includes(firstName));
        const masked = promptEvidence(options.prompt).firstName;
        return maskedReply(options, { ...faithful(), chinese: `${masked}愿意分享想法。` });
      } });
    assert.equal(result.accepted.english.text, `${firstName} shares ideas with a peer. Learning in this domain is developing.`);
    assert.equal(result.accepted.chinese.text, `${firstName}愿意分享想法。`);
  }
});

test('masking fails closed before any provider call and rejects unsafe returned identifiers', async () => {
  let calls = 0;
  const input = childInput();
  input.domains.english.comment = 'Discusses custody arrangements.';
  await assert.rejects(generateNarrativesWithProvider({ provider: 'gateway', childInput: input,
    requestText: async () => { calls++; return JSON.stringify(faithful()); } }), /Privacy masking failed/);
  assert.equal(calls, 0);
  for (const text of ['Avery shares ideas.', 'Contact caregiver@example.invalid.', 'Call 8123 4567.']) {
    await assert.rejects(generateNarrativesWithProvider({ provider: 'openai', key, childInput: childInput(),
      requestText: async options => JSON.stringify({ ...JSON.parse(maskedReply(options)), english: text }) }),
    /Draft rejected:.*identifying or sensitive/);
  }
});

test('grounding checks masked and restored output without licensing leaked personal numbers or photos', async () => {
  const input = childInput();
  input.domains.english.comment = 'Avery shares ideas with a peer. Contact 8123 4567.';
  for (const english of ['Avery counts 8123 shapes.', 'Avery appears in a photo.', 'Avery wins 99 prizes.']) {
    const result = await generateNarrativesWithProvider({ provider: 'openai', key, childInput: input,
      requestText: async options => maskedReply(options, { ...faithful(), english }) });
    assert.equal(result.accepted.english, undefined);
    assert.ok(result.rejected.english.reasons.length);
  }
});

test('restored narratives retain the existing output length bound', async () => {
  const input = childInput();
  input.firstName = 'AveryFictionalLongName';
  input.domains.english.comment = 'AveryFictionalLongName shares ideas.';
  const result = await generateNarrativesWithProvider({ provider: 'openai', key, childInput: input,
    requestText: async options => maskedReply(options, {
      ...faithful(), english: (promptEvidence(options.prompt).firstName + ' ').repeat(120)
    }) });
  assert.equal(result.accepted.english, undefined);
  assert.deepEqual(result.rejected.english.reasons, ['restored narrative exceeds 2000 characters']);
});

test('direct transports pattern-mask contact details, identifiers, addresses and media before fetch', async () => {
  const identifiers = ['8123 4567', 'caregiver@example.invalid', 'S1234567D', '2020-03-12',
    '12 Sample Road', '#03-12', 'Singapore 123456', 'https://example.invalid/child',
    'PRIVATE_CAPTURE.png', 'data:image/png;base64,PRIVATE_PIXELS'];
  for (const provider of ['gateway', 'openai', 'gemini']) {
    await requestProviderText({ provider, key, prompt: identifiers.join('; '), fetchImpl: async (url, options) => {
      for (const value of identifiers) assert.ok(!options.body.includes(value) && !url.includes(value), value);
      if (url.endsWith('/demo/session')) return response({ token: 'temporary-masked-session' });
      return response(provider === 'gemini'
        ? { candidates: [{ content: { parts: [{ text: 'safe text' }] } }] } : { output_text: 'safe text' });
    } });
  }
  let calls = 0;
  await assert.rejects(requestProviderText({ provider: 'gateway', prompt: { private: 'invalid' },
    fetchImpl: async () => { calls++; } }), /Privacy masking failed/);
  assert.equal(calls, 0);
});

test('connection probe disclosure matches the exact text sent by direct providers', async () => {
  for (const provider of ['openai', 'gemini']) {
    await probeProviderConnection({ provider, key, fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body);
      const text = provider === 'gemini' ? body.contents[0].parts[0].text : body.input[0].content[0].text;
      assert.equal(text, connectionProbePrompt);
      return response(provider === 'gemini'
        ? { candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] } : { output_text: '{"ok":true}' });
    } });
  }
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

test('transport HTTP failures give bounded guidance without reading private response bodies', async () => {
  for (const [status, guidance] of [[400, /request/], [401, /Credentials/], [403, /permissions/],
    [404, /model/], [408, /timed out/], [413, /too large/], [422, /format/], [429, /quota/],
    [500, /unavailable/], [502, /unavailable/], [504, /timed out/]]) {
    let calls = 0, bodyReads = 0;
    await assert.rejects(requestProviderText({ provider: 'openai', key, prompt: 'Fictional prompt',
      fetchImpl: async () => {
        calls++;
        return { ok: false, status, text: async () => {
          bodyReads++;
          return JSON.stringify({ error: { message: `${key} PRIVATE_PROVIDER_BODY` } });
        } };
      } }), error => {
      safeError(error);
      assert.match(error.message, new RegExp(`HTTP ${status}:`));
      assert.match(error.message, guidance);
      return true;
    });
    assert.equal(calls, 1);
    assert.equal(bodyReads, 0);
  }
});

test('transport network and body-read failures never expose arbitrary exception messages', async () => {
  for (const [fetchImpl, guidance] of [
    [async () => { throw new Error(`${key} PRIVATE_PROVIDER_BODY`); }, /network.*CORS/],
    [async () => ({ ok: true, status: 200, text: async () => {
      throw new Error(`${key} PRIVATE_PROVIDER_BODY`);
    } }), /could not be read/]
  ]) await assert.rejects(requestProviderText({ provider: 'openai', key,
    prompt: 'Fictional prompt', fetchImpl }), error => {
    safeError(error);
    assert.match(error.message, guidance);
    return true;
  });
});

test('transport timeout aborts the request without exposing provider exception text', async t => {
  let triggerTimeout;
  const timer = t.mock.method(globalThis, 'setTimeout', callback => {
    triggerTimeout = callback;
    return 1;
  });
  const clear = t.mock.method(globalThis, 'clearTimeout', () => {});
  try {
    await assert.rejects(requestProviderText({ provider: 'openai', key, prompt: 'Fictional prompt',
      fetchImpl: async (url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error(`${key} PRIVATE_PROVIDER_BODY`)), { once: true });
        triggerTimeout();
      }) }), error => {
      safeError(error);
      assert.match(error.message, /timed out.*Offline Mock/);
      return true;
    });
  } finally {
    timer.mock.restore();
    clear.mock.restore();
  }
});

test('transport rejects invalid JSON and malformed provider envelopes without leaking content', async () => {
  for (const provider of ['openai', 'gemini']) {
    for (const envelope of [null, [], [{}], 'provider text'])
      await assert.rejects(requestProviderText({ provider, key, prompt: 'Fictional prompt',
        fetchImpl: async () => response(envelope) }), safeError);
    await assert.rejects(requestProviderText({ provider, key, prompt: 'Fictional prompt',
      fetchImpl: async () => ({ ok: true, status: 200,
        text: async () => `${key} PRIVATE_PROVIDER_BODY` }) }), error => {
      safeError(error);
      assert.match(error.message, /invalid JSON/);
      return true;
    });
  }
  const text = JSON.stringify(faithful());
  for (const envelope of [
    {}, { output_text: null }, { output: {} }, { output: 'text' }, { output: [null] },
    { output: [{ content: { text } }] }, { output: [{ content: [null] }] },
    { output: [{ content: [{ text: { message: `${key} PRIVATE_PROVIDER_BODY` } }] }] },
    { output_text: text, output: {} }, { choices: {} }, { choices: [null] },
    { choices: [{ message: { content: [text] } }] }, { output: [] }
  ]) await assert.rejects(requestProviderText({ provider: 'openai', key, prompt: 'Fictional prompt',
    fetchImpl: async () => response(envelope) }), safeError);
  for (const envelope of [
    {}, { candidates: {} }, { candidates: [null] }, { candidates: [{ content: null }] },
    { candidates: [{ content: { parts: {} } }] }, { candidates: [{ content: { parts: [null] } }] },
    { candidates: [{ content: { parts: [{ text: { message: `${key} PRIVATE_PROVIDER_BODY` } }] } }] },
    { candidates: [] }, { candidates: [{ content: { parts: [] } }] }
  ]) await assert.rejects(requestProviderText({ provider: 'gemini', key, prompt: 'Fictional prompt',
    fetchImpl: async () => response(envelope) }), safeError);
});

test('each Gateway request obtains a fresh session and rejects unusable tokens before generation', async () => {
  let sessions = 0, generations = 0;
  const fetchImpl = async (url, options) => {
    assert.ok(!url.includes(key));
    assert.ok(!options.body.includes(key));
    if (url.endsWith('/demo/session')) return response({ token: `temporary-session-${++sessions}` });
    generations++;
    assert.equal(options.headers.Authorization, `Bearer temporary-session-${sessions}`);
    return response({ output_text: 'raw draft text' });
  };
  for (let attempt = 0; attempt < 2; attempt++)
    assert.equal(await requestProviderText({ provider: 'gateway', key, prompt: 'Fictional prompt', fetchImpl }), 'raw draft text');
  assert.equal(sessions, 2);
  assert.equal(generations, 2);
  for (const token of [undefined, [], '', '   ']) {
    let calls = 0;
    await assert.rejects(requestProviderText({ provider: 'gateway', prompt: 'Fictional prompt',
      fetchImpl: async () => { calls++; return response({ token }); } }), safeError);
    assert.equal(calls, 1);
  }
});

test('Gateway generation errors expose neither session tokens nor private server bodies', async () => {
  let calls = 0, bodyReads = 0;
  await assert.rejects(requestProviderText({ provider: 'gateway', prompt: 'Fictional prompt',
    fetchImpl: async () => {
      if (++calls === 1) return response({ token: key });
      return { ok: false, status: 401, text: async () => {
        bodyReads++;
        return `${key} PRIVATE_PROVIDER_BODY`;
      } };
    } }), error => {
    safeError(error);
    assert.match(error.message, /HTTP 401/);
    return true;
  });
  assert.equal(calls, 2);
  assert.equal(bodyReads, 0);
});

test('missing keys, invalid Gemini models and unsupported providers fail before network access', async () => {
  let calls = 0;
  for (const options of [
    { provider: 'openai', key: '' }, { provider: 'gemini', key: '' },
    { provider: 'gemini', key, model: `bad/model/${key}` },
    { provider: `${key} PRIVATE_PROVIDER_BODY` }
  ]) await assert.rejects(requestProviderText({ ...options, prompt: 'Fictional prompt',
    fetchImpl: async () => { calls++; throw new Error('Unexpected request'); } }), safeError);
  assert.equal(calls, 0);
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

test('root CSP limits connections exactly and studio controller contains no credential storage writes', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.deepEqual(policy.match(/(?:^|;)\s*connect-src\s+([^;]+)/)[1].trim().split(/\s+/), [
    "'self'", 'https://gpt.yapweijun1996.com', 'https://api.openai.com', 'https://generativelanguage.googleapis.com'
  ]);
  const source = await readFile(new URL('../src/studio/context.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /(?:localStorage|sessionStorage)\s*(?:\.|\[['"])[\s\S]{0,40}setItem\s*\([^)]*(?:key|token|secret)/i);
});

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

async function controller({ records = [readyRecord()], generateAI, offline = false } = {}) {
  const { createContext } = await import('../src/studio/context.js');
  const storage = memoryStorage();
  createStore(storage).save(records);
  let mockCalls = 0;
  const ctx = createContext({ storage, generateAI, isOffline: () => offline,
    generateNarrative: () => { mockCalls++; throw new Error('Unexpected mock fallback'); } });
  ctx.provider.id = 'gateway';
  ctx.provider.key = key;
  return { ctx, storage, mockCalls: () => mockCalls };
}

test('failed real drafting preserves stored narrative and provenance with no mock fallback', async () => {
  const record = readyRecord();
  record.narratives.english = { text: 'Existing teacher narrative.', source: 'teacher', edited: true };
  const ui = await controller({ records: [record],
    generateAI: options => generateNarrativesWithProvider({ ...options,
      requestText: async () => { throw new Error(`${key} PRIVATE_PROVIDER_BODY`); } }) });
  const before = ui.storage.getItem('ai-preschool-portfolios-v2');
  const result = await ui.ctx.runDraft(() => ui.ctx.draft(
    { id: 'C-01', name: 'Avery' }, ui.ctx.current('C-01'), ['english']));
  assert.equal(result, false);
  assert.equal(ui.storage.getItem('ai-preschool-portfolios-v2'), before);
  assert.deepEqual(ui.ctx.get('C-01').narratives.english, record.narratives.english);
  assert.equal(ui.ctx.provider.status, 'failed');
  assert.ok(!ui.ctx.message.includes(key));
  assert.ok(!ui.ctx.message.includes('PRIVATE_PROVIDER_BODY'));
  assert.equal(ui.mockCalls(), 0);
  assert.ok(!before.includes(key));
});

test('bulk drafting is sequential and stops at the first error without changing later children', async () => {
  const { draftReadyChildren } = await import('../src/studio/bulk-draft.js');
  let calls = 0;
  let active = 0;
  let ui;
  const children = ['C-01', 'C-02', 'C-03'].map(id => ({ id, name: 'Avery' }));
  ui = await controller({ records: children.map(child => readyRecord(child.id)),
    generateAI: options => generateNarrativesWithProvider({ ...options, requestText: async request => {
      calls++;
      active++;
      assert.equal(active, 1);
      assert.equal(ui.ctx.provider.status, `drafting: ${calls} of 3`);
      await Promise.resolve();
      active--;
      if (calls === 2) throw new Error(key);
      return maskedReply(request);
    } }) });
  await ui.ctx.runDraft(() => draftReadyChildren(ui.ctx, children));
  const saved = createStore(ui.storage).load();
  assert.equal(calls, 2);
  assert.equal(saved[0].narratives.english.source, 'ai');
  assert.equal(saved[0].narratives.english.provider, 'gateway');
  assert.deepEqual(saved[1], validateRecord(readyRecord('C-02')));
  assert.deepEqual(saved[2], validateRecord(readyRecord('C-03')));
  assert.match(ui.ctx.message, /Stopped at 2 of 3; 1 children drafted/);
  assert.equal(ui.mockCalls(), 0);
});

test('partial drafting preserves rejected narratives and provides retry guidance', async () => {
  const record = readyRecord();
  record.narratives.chinese = { text: '老师保留的评语。', source: 'teacher', edited: true };
  const ui = await controller({ records: [record],
    generateAI: options => generateNarrativesWithProvider({ ...options, requestText: async request =>
      maskedReply(request, { ...faithful(), chinese: `${promptEvidence(request.prompt).firstName}在中文学习中处于Developing阶段。` }) }) });
  await ui.ctx.runDraft(() => ui.ctx.draft({ id: 'C-01', name: 'Avery' },
    ui.ctx.current('C-01'), DOMAINS.map(domain => domain.id)));
  const saved = createStore(ui.storage).load()[0];
  assert.deepEqual(saved.narratives.chinese, record.narratives.chinese);
  assert.equal(saved.narratives.english.source, 'ai');
  assert.match(ui.ctx.rejections.get('C-01:2026-S2:chinese'), /Draft rejected:.*Retry or write/);
  assert.equal(ui.mockCalls(), 0);
});

test('bulk partial acceptance counts only fully accepted children and continues', async () => {
  const { draftReadyChildren } = await import('../src/studio/bulk-draft.js');
  const children = ['C-01', 'C-02'].map(id => ({ id, name: 'Avery' }));
  const ui = await controller({ records: children.map(child => readyRecord(child.id)),
    generateAI: options => generateNarrativesWithProvider({ ...options, requestText: async request =>
      maskedReply(request, { ...faithful(), chinese: '中文学习处于Developing阶段。' }) }) });
  await ui.ctx.runDraft(() => draftReadyChildren(ui.ctx, children));
  assert.equal(ui.ctx.message, '0 of 2 children fully drafted; 2 domains need attention.');
  for (const record of createStore(ui.storage).load()) {
    assert.equal(record.narratives.chinese, null);
    assert.equal(record.narratives.mathematics.source, 'ai');
  }
  assert.equal(ui.mockCalls(), 0);
});

test('offline remote draft is blocked; explicitly selected mock is permitted', async () => {
  let calls = 0;
  const ui = await controller({ offline: true });
  assert.equal(await ui.ctx.runDraft(async () => { calls++; }), false);
  assert.equal(calls, 0);
  assert.match(ui.ctx.message, /Offline: select Offline mock/);
  ui.ctx.provider.id = 'mock';
  assert.equal(await ui.ctx.runDraft(async () => { calls++; }), true);
  assert.equal(calls, 1);
});
