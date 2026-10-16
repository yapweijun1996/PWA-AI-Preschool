import { validateRecord } from './portfolio-model.js';

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

function parseEnvelope(text) {
  const envelope = JSON.parse(text);
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope))
    throw new Error('Invalid portfolio envelope.');
  if (envelope.version !== 2) throw new Error('Unsupported portfolio storage version.');
  if (typeof envelope.savedAt !== 'string' || !Number.isFinite(Date.parse(envelope.savedAt)))
    throw new Error('Invalid portfolio savedAt timestamp.');
  return { version: 2, savedAt: envelope.savedAt, records: validateRecords(envelope.records) };
}

// Construction loads immediately; load() explicitly reloads storage and returns a
// detached array. Missing storage data is empty, never automatically seeded.
// Mutations return {ok:true} or {ok:false,error}; only persisted changes commit.
// reset() persists an empty v2 envelope. Import replaces, rather than merges,
// records, rejects duplicate identities, and stamps a fresh local savedAt.
export function createStore(storage, key = DEFAULT_KEY) {
  let records = [], savedAt = new Date().toISOString(), lastError = null;

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
        savedAt = new Date().toISOString();
      } else {
        const envelope = parseEnvelope(text);
        records = envelope.records;
        savedAt = envelope.savedAt;
      }
      lastError = null;
    } catch (error) {
      records = [];
      savedAt = new Date().toISOString();
      fail(error);
    }
    return copyRecords(records);
  }

  function save(nextRecords) {
    try {
      const next = validateRecords(nextRecords);
      const timestamp = new Date().toISOString();
      const serialized = JSON.stringify({ version: 2, savedAt: timestamp, records: next });
      if (!storage || typeof storage.setItem !== 'function')
        throw new Error('Portfolio storage is unavailable.');
      storage.setItem(key, serialized);
      records = next;
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
    return JSON.stringify({ version: 2, savedAt, records }, null, 2);
  }

  function importJson(text) {
    try {
      return save(parseEnvelope(text).records);
    } catch (error) {
      return fail(error);
    }
  }

  load();
  return {
    load, save, upsert, get, reset: () => save([]), exportJson, importJson,
    get lastError() {
      return lastError
    }
  };
}
