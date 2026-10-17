import { CHILDREN, seedRecords } from '../portfolio-seed.js';
import { createStore } from '../portfolio-store.js';
import {
  emptyRecord, computeStatus, narrativeInputFor, validateRecord
} from '../portfolio-model.js';
import {
  mockNarrative, generateNarrativesWithProvider, validateNarrativeText, NarrativeDraftError
} from '../narrative.js';

export function createContext({ storage = null, generateNarrative = mockNarrative,
  generateAI = generateNarrativesWithProvider, isOffline = () => false } = {}) {
  const store = createStore(storage);
  const listeners = new Set();
  const ctx = {
    store, records: store.load(), children: CHILDREN, semester: '2026-S2',
    provider: { id: 'mock', key: '', status: 'not tested' },
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
      const result = ctx.store.save(ctx.records);
      dirty = !result.ok;
      ctx.saveStatus = result.ok ? 'Saved in this browser' : 'Not saved: storage unavailable';
      ctx.notify();
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
  const input = narrativeInputFor(child, record,
    record.semester.endsWith('S2') ? ctx.get(child.id, '2026-S1') : null);
  const result = { accepted: {}, rejected: {} };
  if (ctx.provider.id === 'mock') {
    for (const id of ids) {
      result.accepted[id] = await generateNarrative(input.domains[id], {
        previousRating: input.domains[id].previousRating
      });
    }
  } else {
    Object.assign(result, await generateAI({ provider: ctx.provider.id,
      key: ctx.provider.key, childInput: input }));
  }
  return acceptDrafts(ctx, child, record, ids, result);
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
      `Draft rejected: ${rejected[id].reasons.join('; ')}. Retry or write it yourself.`);
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
