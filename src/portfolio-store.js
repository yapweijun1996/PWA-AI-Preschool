import { validateRecord } from './portfolio-model.js';
import { normalizeChildName } from './child-name.js';

const DEFAULT_KEY = 'ai-preschool-portfolios-v2';
const copyRecords = records => records.map(record => validateRecord(record));
const errorMessage = error => error instanceof Error ? error.message : String(error);

function validateRecords(records) {
  if (!Array.isArray(records)) throw new Error('Portfolio records must be an array.');
  const normalized = copyRecords(records), identities = new Set();
  for (const record of normalized) {
    const identity = JSON.stringify([record.childId, record.semester]);
    if (identities.has(identity)) throw new Error('Duplicate child and semester portfolio.');
    identities.add(identity);
  }
  return normalized;
}

function validateChildNames(names = {}) {
  if (!names || typeof names !== 'object' || Array.isArray(names))
    throw new Error('Child names must be an object.');
  return Object.fromEntries(Object.entries(names).map(([id, name]) => {
    if (!/^C-(?:0[1-9]|1[0-9]|20)$/.test(id)) throw new Error('Unknown child name identity.');
    return [id, normalizeChildName(name)];
  }));
}

function parseEnvelope(text) {
  const envelope = JSON.parse(text);
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope))
    throw new Error('Invalid portfolio envelope.');
  if (envelope.version !== 2) throw new Error('Unsupported portfolio storage version.');
  if (typeof envelope.savedAt !== 'string' || !Number.isFinite(Date.parse(envelope.savedAt)))
    throw new Error('Invalid portfolio savedAt timestamp.');
  return { version: 2, savedAt: envelope.savedAt, records: validateRecords(envelope.records),
    childNames: validateChildNames(envelope.childNames) };
}

// Construction loads immediately; load() explicitly reloads storage and returns a
// detached array. Missing storage data is empty, never automatically seeded.
// Mutations return {ok:true} or {ok:false,error}; only persisted changes commit.
// reset() persists an empty v2 envelope. Import replaces, rather than merges,
// records, rejects duplicate identities, and stamps a fresh local savedAt.
export function createStore(storage, key = DEFAULT_KEY) {
  let records = [], childNames = {}, savedAt = new Date().toISOString(), lastError = null;

  function fail(error) {
    lastError = errorMessage(error);
    return { ok: false, error: lastError };
  }

  function load() {
    try {
      if (!storage || typeof storage.getItem !== 'function')
        throw new Error('Portfolio storage is unavailable.');
      const text = storage.getItem(key);
      if (text === null) {
        records = [];
        childNames = {};
        savedAt = new Date().toISOString();
      } else {
        const envelope = parseEnvelope(text);
        records = envelope.records;
        childNames = envelope.childNames;
        savedAt = envelope.savedAt;
      }
      lastError = null;
    } catch (error) {
      records = [];
      childNames = {};
      savedAt = new Date().toISOString();
      fail(error);
    }
    return copyRecords(records);
  }

  function save(nextRecords, nextChildNames = childNames) {
    try {
      const next = validateRecords(nextRecords);
      const names = validateChildNames(nextChildNames);
      const timestamp = new Date().toISOString();
      const serialized = JSON.stringify({ version: 2, savedAt: timestamp, records: next,
        childNames: names });
      if (!storage || typeof storage.setItem !== 'function')
        throw new Error('Portfolio storage is unavailable.');
      storage.setItem(key, serialized);
      records = next;
      childNames = names;
      savedAt = timestamp;
      lastError = null;
      return { ok: true };
    } catch (error) {
      return fail(error);
    }
  }

  function upsert(record) {
    try {
      const nextRecord = validateRecord(record);
      const index = records.findIndex(item =>
        item.childId === nextRecord.childId && item.semester === nextRecord.semester);
      const next = records.slice();
      if (index === -1) next.push(nextRecord);
      else next[index] = nextRecord;
      return save(next);
    } catch (error) {
      return fail(error);
    }
  }

  function get(childId, semester) {
    const record = records.find(item => item.childId === childId && item.semester === semester);
    return record ? validateRecord(record) : null;
  }

  function exportJson() {
    return JSON.stringify({ version: 2, savedAt, records, childNames }, null, 2);
  }

  function importJson(text) {
    try {
      const envelope = parseEnvelope(text);
      return save(envelope.records, envelope.childNames);
    } catch (error) {
      return fail(error);
    }
  }

  load();
  return {
    load, save, upsert, get, reset: () => save([], {}), exportJson, importJson,
    get childNames() { return { ...childNames }; },
    get lastError() {
      return lastError
    }
  };
}
