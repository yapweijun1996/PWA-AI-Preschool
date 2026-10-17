// Request-local pseudonymisation, not anonymisation. No storage or network access.
export const privacyNotice = 'Demo only. Pseudonymised (not anonymous) text goes to an external AI service via the demo gateway, or directly in BYOK mode. Photos are never sent. The gateway does not store prompt text; AI provider retention is not verified. Do not enter real children’s data in this public demo.';
const failure = () => new Error('Privacy masking failed. No text was sent. Remove identifying or sensitive details and retry.');
const patterns = [
  /data:[^\s"']+/giu,
  /(?:https?:\/\/|www\.)[^\s"'<>]+/giu,
  /[\w.+-]+@[\w.-]+\.[a-z]{2,}/giu,
  /\b[STFGM]\d{7}[A-Z]\b/giu,
  /(?:\+?\d[\d ()-]{6,}\d)/gu,
  /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4}\b/gu,
  /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b|\d{4}年\d{1,2}月\d{1,2}[日号]/giu,
  /\b\d+(?:\s+years?|\s+months?|-years?|-months?)[ -]old\b|\d+\s*[岁歲]/giu,
  /\b(?:block|blk|no\.)\s*\d[^\n,;]*|\b\d+[A-Z]?\s+(?:[\p{L}]+\s+){0,5}(?:street|road|avenue|drive|lane|crescent|close|walk)\b[^\n,;]*/giu,
  /#[0-9]{1,3}-[0-9]{1,4}\b|\bSingapore\s*\d{6}\b/giu,
  /[^\s"']+\.(?:jpe?g|png|webp|gif|heic|mp4|wav|pdf)\b/giu
];
const sensitive = /\b(?:diagnos\w*|autism|adhd|medication|custody|passport|allerg\w*)\b/iu;
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function matcher(value) {
  const boundary = /^[\p{Script=Latin}\d .'-]+$/u.test(value);
  return new RegExp(`${boundary ? '(?<![\\p{Script=Latin}\\p{N}])' : ''}${escape(value)}${boundary ? '(?![\\p{Script=Latin}\\p{N}])' : ''}`, /^[A-Z]{1,4}$/.test(value) ? 'gu' : 'giu');
}
export function maskProviderText(text) {
  if (typeof text !== 'string') throw failure();
  let result = text;
  for (const pattern of patterns) result = result.replace(pattern, '隐私信息');
  return result;
}
export function createPrivacyMask(source) {
  if (!source || typeof source !== 'object') throw failure();
  const names = new Map(), reverse = new Map();
  const childToken = '学童';
  const add = (value, token, restore = false) => {
    if (typeof value !== 'string' || !value.trim()) return;
    const original = value.trim();
    value = original.normalize('NFKC');
    if (value.includes(token)) throw failure();
    names.set(value, token);
    if (restore && !reverse.has(token)) reverse.set(token, original);
  };
  add(source.firstName, childToken, true);
  const visit = (object, depth = 0) => {
    if (!object || typeof object !== 'object' || depth > 8) return;
    for (const [key, value] of Object.entries(object)) {
      if (/domains|photos|narratives/i.test(key)) continue;
      if (Array.isArray(value) && /name|nickname|alias|initial|identifier/i.test(key)) {
        for (const item of value) if (typeof item === 'string') {
          add(item, '隐私信息');
          if (/name|nickname|alias/i.test(key))
            for (const part of item.trim().split(/\s+/u))
              if (part.length > 1 && !/^(?:sample|fictional|teacher|guardian|parent|class|centre|\(sample\))$/i.test(part))
                add(part, '隐私信息');
        }
      }
      if (typeof value === 'object') { visit(value, depth + 1); continue; }
      if (!/name|nickname|alias|initial|avatar|label|childId|^id$|class|school|organi[sz]ation|teacher|guardian|parent|birth|dob|address|phone|email/i.test(key)) continue;
      const token = /class/i.test(key) ? '班级' : /teacher/i.test(key) ? '老师' : /school|organi[sz]ation/i.test(key) ? '机构' : '隐私信息';
      add(value, key === 'firstName' ? childToken : token);
      if (key === 'name' && object.initials && typeof value === 'string' && /^[\p{Script=Han}]{2,}$/u.test(value))
        add(value.slice(1), token);
      if (/name|nickname|alias|teacher|guardian|parent/i.test(key) && typeof value === 'string' &&
          !/class|school|organi[sz]ation/i.test(key)) {
        for (const part of value.trim().split(/\s+/u))
          if (part.length > 1 && !/^(?:sample|fictional|teacher|guardian|parent|class|centre|\(sample\))$/i.test(part))
            add(part, names.get(part) ?? token);
      }
    }
  };
  visit(source);
  // Explicit lists can contain every known class member, in any script.
  for (const value of source.knownIdentifiers ?? []) add(value, '隐私信息');
  names.set((source.firstName ?? '').normalize('NFKC'), childToken);
  names.delete('');
  const entries = [...names].sort((a, b) => b[0].length - a[0].length);
  let disposed = false;
  const assertSafe = text => {
    if (disposed || typeof text !== 'string') throw failure();
    for (const [value] of entries) if (matcher(value).test(text.normalize('NFKC'))) throw failure();
    for (const pattern of patterns) { pattern.lastIndex = 0; if (pattern.test(text)) throw failure(); }
  };
  const mask = text => {
    if (typeof text !== 'string' || sensitive.test(text) || /学童|Child A|隐私信息|班级|机构/u.test(text)) throw failure();
    let result = text.normalize('NFKC');
    for (const [value, token] of entries) result = result.replace(matcher(value), token);
    result = maskProviderText(result);
    assertSafe(result);
    return result;
  };
  const input = { firstName: childToken, reportLanguage: source.reportLanguage, domains: {} };
  for (const [id, domain] of Object.entries(source.domains ?? {})) {
    if (!domain || typeof domain !== 'object' ||
        [domain.rating, domain.previousRating].some(value =>
          value != null && (!Number.isInteger(value) || value < 1 || value > 4))) throw failure();
    input.domains[id] = { rating: domain.rating, previousRating: domain.previousRating,
      noEvidence: domain.noEvidence, comment: mask(domain.comment ?? ''), photoCount: 0 };
  }
  return { input, assertSafe,
    restore(text) {
      if (disposed) throw failure();
      let result = text;
      for (const [token, value] of reverse) result = result.replaceAll(token, value);
      return result;
    },
    dispose() { disposed = true; names.clear(); reverse.clear(); entries.length = 0; }
  };
}
