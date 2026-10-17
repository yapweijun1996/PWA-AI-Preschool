import { CHILDREN, CLASS, seedRecords } from '../portfolio-seed.js';
import { createStore } from '../portfolio-store.js';
import {
  DOMAINS, emptyRecord, computeStatus, narrativeInputFor, validateRecord
} from '../portfolio-model.js';
import {
  mockNarrative, generateNarrativesWithProvider, validateNarrativeText, NarrativeDraftError
} from '../narrative.js';
import { createPrivacyMask } from '../privacy-mask.js';
import { STUDIO_CONFIG } from '../config.js';
import { childInitials, normalizeChildName } from '../child-name.js';
import { loadReportLanguage, saveReportLanguage, normalizeReportLanguage, narrativeLanguage } from '../report-language.js';

export function createContext({ storage = null, generateNarrative = mockNarrative,
  generateAI = generateNarrativesWithProvider, isOffline = () => false } = {}) {
  const store = createStore(storage);
  const listeners = new Set();
  const ctx = {
    store, records: store.load(),
    children: CHILDREN.map(child => {
      const name = store.childNames[child.id] ?? child.name;
      return { ...child, name, initials: childInitials(name) };
    }), semester: '2026-S2',
    childNameHistory: store.childNameHistory,
    provider: { id: 'mock', key: '', status: 'not tested' },
    reportLanguage: loadReportLanguage(storage),
    reportLanguageSaved: true,
    setReportLanguage(value) {
      if (ctx.busy) return;
      ctx.reportLanguage = normalizeReportLanguage(value);
      ctx.reportLanguageSaved = saveReportLanguage(storage, ctx.reportLanguage);
      ctx.notify();
    },
    rejections: new Map(), stale: new Set(), busy: false, message: '', saveStatus: '', isOffline,
    batch: null, draftError: '', retryDraft: null, route: '', failures: [],
    routeVersion: 0,
    dismissDraftError() {
      ctx.draftError = '';
      ctx.retryDraft = null;
      ctx.notify();
    },
    enterRoute(route) {
      if (ctx.route === route) return;
      ctx.route = route;
      ctx.routeVersion++;
      ctx.dismissDraftError();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    notify() { for (const fn of listeners) fn(ctx); },
    announce(text) {
      ctx.message = text;
      ctx.notify();
    },
    get(id, sem = ctx.semester) {
      return ctx.records.find(r => r.childId === id && r.semester === sem) ?? emptyRecord(id, sem);
    },
    current(id, sem = ctx.semester) {
      let record = ctx.records.find(r => r.childId === id && r.semester === sem);
      if (!record) {
        record = emptyRecord(id, sem);
        ctx.records.push(record);
      }
      return record;
    }
  };
  Object.assign(ctx, persistence(ctx), {
    narrativeInput: (child, record) => ({
      ...narrativeInputFor(child, record,
        record.semester.endsWith('S2') ? ctx.get(child.id, '2026-S1') : null),
      reportLanguage: ctx.reportLanguage,
      knownIdentifiers: ctx.children.map(member => narrativeInputFor(member, record).firstName),
      privacyMetadata: { child, children: ctx.children, record, records: ctx.records,
        class: CLASS, organizationName: STUDIO_CONFIG.organizationName }
    }),
    draft: (child, record, ids) => draft(ctx, child, record, ids, generateNarrative, generateAI),
    runDraft: action => runDraft(ctx, action)
  });
  const initialError = store.lastError;
  if (!ctx.records.length) ctx.reset();
  if (store.lastError || initialError) ctx.saveStatus = 'Not saved: storage unavailable';
  if (!ctx.saveStatus) ctx.saveStatus = 'Saved in this browser';
  return ctx;
}

function persistence(ctx) {
  let timer = null;
  let dirty = false;
  return {
    retrySave() { dirty = true; ctx.persist(); },
    persist() {
      clearTimeout(timer);
      if (!dirty) return;
      const names = Object.fromEntries(ctx.children.map(child => [child.id, child.name]));
      const result = ctx.store.save(ctx.records, names, ctx.childNameHistory);
      dirty = !result.ok;
      ctx.saveStatus = result.ok ? 'Saved in this browser' : 'Not saved: storage unavailable';
      ctx.notify();
    },
    renameChild(id, value) {
      if (ctx.busy) throw new Error('Wait for drafting to finish before changing the child name.');
      const child = ctx.children.find(member => member.id === id);
      if (!child) throw new Error('Child not found.');
      const name = normalizeChildName(value);
      if (name !== child.name) {
        ctx.childNameHistory[id] = [...new Set([...(ctx.childNameHistory[id] ?? []), child.name])];
        child.name = name;
        child.initials = childInitials(name);
        dirty = true;
        ctx.persist();
      }
      const duplicate = ctx.children.some(member => member.id !== id &&
        member.name.toLocaleLowerCase('en') === name.toLocaleLowerCase('en'));
      return { name, duplicate };
    },
    oldNarrativeNames(id) {
      return narrativeNameChanges(ctx, id).names;
    },
    replaceOldNarrativeNames(id) {
      if (ctx.busy) throw new Error('Wait for drafting to finish before replacing old names.');
      const { record, updates } = narrativeNameChanges(ctx, id);
      const count = Object.keys(updates).length;
      if (!count) return 0;
      validateRecord({ ...record, narratives: { ...record.narratives, ...updates } });
      Object.assign(record.narratives, updates);
      ctx.change(record);
      ctx.persist();
      return count;
    },
    change(record) {
      record.reviewed = false;
      record.status = computeStatus(record);
      dirty = true;
      ctx.saveStatus = 'Saving…';
      clearTimeout(timer);
      timer = setTimeout(ctx.persist, 250);
      ctx.notify();
    },
    markReviewed(record) {
      ctx.change(record);
      record.reviewed = true;
      record.status = computeStatus(record);
      ctx.persist();
    },
    reset() {
      ctx.records = seedRecords();
      ctx.children = CHILDREN.map(child => ({ ...child }));
      ctx.childNameHistory = {};
      ctx.stale.clear();
      ctx.rejections.clear();
      ctx.batch = null;
      ctx.draftError = '';
      ctx.retryDraft = null;
      ctx.failures = [];
      dirty = true;
      ctx.persist();
      ctx.announce('Sample data restored.');
    }
  };
}

function narrativeNameChanges(ctx, id) {
  const child = ctx.children.find(member => member.id === id);
  if (!child) throw new Error('Child not found.');
  const record = ctx.get(id);
  const previousNames = [...new Set([
    ...(ctx.childNameHistory[id] ?? []),
    CHILDREN.find(member => member.id === id)?.name
  ])].filter(name => name && name !== child.name);
  const firstName = name => narrativeInputFor({ name }, record).firstName;
  const replacements = new Map();
  for (const name of previousNames) {
    for (const from of [name, firstName(name)]) {
      if (from === child.name) continue;
      if (!replacements.has(from)) replacements.set(from, { to: child.name, names: new Set() });
      replacements.get(from).names.add(name);
    }
  }
  // Protect the current full name from shorter historical-name matches.
  replacements.set(child.name, { to: child.name, names: new Set() });
  const alternatives = [...replacements.keys()].sort((a, b) => b.length - a.length)
    .map(name => {
      const literal = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const boundary = /\p{Script=Han}/u.test(name) ? ''
        : /\p{Script=Latin}/u.test(name) ? '\\p{Script=Latin}\\p{M}\\p{N}_'
          : '\\p{L}\\p{M}\\p{N}_';
      return boundary ? `(?<![${boundary}])${literal}(?![${boundary}])` : literal;
    });
  const matcher = new RegExp(alternatives.join('|'), 'gu');
  const remaining = new Set(), updates = {};
  for (const { id: domainId } of DOMAINS) {
    const narrative = record.narratives[domainId];
    if (!narrative) continue;
    const text = narrative.text.replace(matcher, match => {
      const replacement = replacements.get(match);
      for (const name of replacement.names) remaining.add(name);
      return replacement.to;
    });
    if (text !== narrative.text) updates[domainId] = { ...narrative, text, edited: true };
  }
  return { record, names: previousNames.filter(name => remaining.has(name)), updates };
}

async function runDraft(ctx, action) {
  if (ctx.busy) return false;
  if (ctx.provider.id !== 'mock' && ctx.isOffline()) {
    ctx.announce('Offline: select Offline mock or reconnect before remote drafting.');
    return false;
  }
  ctx.busy = true;
  const origin = ctx.routeVersion;
  ctx.draftError = '';
  ctx.retryDraft = null;
  ctx.provider.status = 'drafting';
  ctx.notify();
  try {
    await action();
    ctx.provider.status = 'ok';
    return true;
  } catch (error) {
    ctx.provider.status = 'failed';
    const message = error instanceof NarrativeDraftError ? error.message
      : 'AI request failed. Check the connection, model, permissions or quota, then retry. '
        + 'No narratives were changed.';
    ctx.failures.push(message);
    if (ctx.routeVersion === origin) {
      ctx.draftError = message;
      ctx.retryDraft = () => ctx.runDraft(action);
      ctx.announce(`${message} Existing narratives were kept. Retry explicitly.`);
    }
    return false;
  } finally {
    ctx.busy = false;
    ctx.notify();
  }
}

async function draft(ctx, child, record, ids, generateNarrative, generateAI) {
  const input = ctx.narrativeInput(child, record);
  const result = { accepted: {}, rejected: {} };
  if (ctx.provider.id === 'mock') {
    let mask;
    try {
      mask = createPrivacyMask(input);
      for (const id of ids) {
        const domain = { ...mask.input.domains[id], id };
        const narrative = await generateNarrative(domain, {
          previousRating: domain.previousRating, reportLanguage: input.reportLanguage
        });
        mask.assertSafe(narrative.text);
        result.accepted[id] = { ...narrative, text: mask.restore(narrative.text),
          language: narrativeLanguage(id, input.reportLanguage) };
      }
    } catch {
      throw new NarrativeDraftError('Privacy masking failed. No text was sent. '
        + 'Remove identifying or sensitive details and retry.');
    } finally {
      mask?.dispose();
    }
  } else {
    Object.assign(result, await generateAI({ provider: ctx.provider.id,
      key: ctx.provider.key, childInput: input }));
  }
  return acceptDrafts(ctx, child, record, ids, result);
}

function groundingRejectionReasons({ reasons, unsupportedWordKind }) {
  const detail = unsupportedWordKind === 'sentence-start word' ? 'sentence-start word'
    : unsupportedWordKind === 'name or mid-sentence word' ? 'name or mid-sentence word' : '';
  return reasons.map(reason => reason === 'unsupported capitalised word or name' && detail
    ? `${reason}: ${detail}` : reason).join('; ');
}

function acceptDrafts(ctx, child, record, ids, result) {
  const drafts = {};
  const rejected = {};
  for (const id of ids) {
    if (result.accepted[id]) drafts[id] = { ...result.accepted[id],
      text: validateNarrativeText(result.accepted[id].text) };
    if (result.rejected[id]) rejected[id] = result.rejected[id];
  }
  validateRecord({ ...record, narratives: { ...record.narratives, ...drafts } });
  Object.assign(record.narratives, drafts);
  for (const id of ids) {
    const key = `${child.id}:${record.semester}:${id}`;
    if (drafts[id]) ctx.stale.delete(key);
    if (rejected[id]) ctx.rejections.set(key,
      `Draft rejected: ${groundingRejectionReasons(rejected[id])}. Retry or write it yourself.`);
    else ctx.rejections.delete(key);
  }
  if (Object.keys(drafts).length) {
    ctx.change(record);
    ctx.persist();
  }
  ctx.announce(Object.keys(rejected).length ? 'Some domains were rejected. Review the reasons.'
    : 'Narratives drafted. Teacher review required.');
  return rejected;
}
