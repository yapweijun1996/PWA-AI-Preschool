// Separate four-domain portfolio model; no browser or persistence dependencies.
export const DOMAINS = Object.freeze([
  { id: "english", label: "English" },
  { id: "chinese", label: "Chinese" },
  { id: "mathematics", label: "Mathematics" },
  { id: "social-emotional", label: "Social-Emotional Development" }
].map(Object.freeze));
export const RATINGS = Object.freeze(
  ["Emerging", "Developing", "Secure", "Extending"].map((label, i) =>
    Object.freeze({ value: i + 1, label, short: label })));
const ids = DOMAINS.map(d => d.id);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

export function semesterId(year, half) {
  requireValue(Number.isInteger(year) && year >= 1000 && year <= 9999,
    "Year must be a four-digit integer");
  requireValue(half === 1 || half === 2, "Semester half must be 1 or 2");
  return `${year}-S${half}`;
}

export function parseSemester(id) {
  requireValue(typeof id === "string" && /^\d{4}-S[12]$/.test(id),
    "Invalid semester: expected YYYY-S1 or YYYY-S2");
  const year = Number(id.slice(0, 4)), half = Number(id.at(-1));
  semesterId(year, half);
  return { year, half };
}

export function semesterOfDate(isoDate) {
  requireValue(typeof isoDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(isoDate),
    "Invalid date: expected YYYY-MM-DD");
  const date = new Date(`${isoDate}T00:00:00Z`);
  requireValue(!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === isoDate,
    "Invalid calendar date");
  return semesterId(date.getUTCFullYear(), date.getUTCMonth() < 6 ? 1 : 2);
}

export function previousSemesterId(id) {
  const { year, half } = parseSemester(id);
  return half === 2 ? semesterId(year, 1) : null;
}

export function emptyRecord(childId, semester) {
  return {
    childId,
    semester,
    domains: Object.fromEntries(ids.map(id => [id, { rating: null, comment: "", photos: [] }])),
    narratives: Object.fromEntries(ids.map(id => [id, null])),
    status: "not-started"
  };
}

function checkKeys(value, label) {
  requireValue(object(value) && Object.keys(value).length === 4 &&
    ids.every(id => Object.hasOwn(value, id)),
    `${label} must contain exactly the four known domain keys`);
}

export function validateRecord(record) {
  requireValue(object(record), "Record must be an object");
  requireValue(typeof record.childId === "string" && record.childId.trim() !== "",
    "Child id is required");
  parseSemester(record.semester);
  checkKeys(record.domains, "Domains");
  checkKeys(record.narratives, "Narratives");
  requireValue(record.reviewed === undefined || typeof record.reviewed === "boolean",
    "Reviewed must be boolean");
  const result = emptyRecord(record.childId, record.semester);
  for (const id of ids) {
    const entry = record.domains[id], narrative = record.narratives[id];
    requireValue(object(entry), `${id}: domain entry must be an object`);
    requireValue(entry.rating === null ||
      (Number.isInteger(entry.rating) && entry.rating >= 1 && entry.rating <= 4),
      `${id}: rating must be null or an integer 1-4`);
    requireValue(typeof entry.comment === "string" && entry.comment.length <= 1000,
      `${id}: comment must be a string of at most 1000 characters`);
    requireValue(Array.isArray(entry.photos) && entry.photos.length <= 6,
      `${id}: photos must be an array of at most 6`);
    const photos = entry.photos.map(photo => {
      requireValue(object(photo) && typeof photo.id === "string" && photo.id.trim() !== "",
        `${id}: photo id is required`);
      requireValue(typeof photo.alt === "string" && photo.alt.trim() !== "",
        `${id}: photo alt text is required`);
      requireValue(typeof photo.src === "string" && photo.src.startsWith("data:image/"),
        `${id}: photo src must be a data:image/ URI`);
      return { id: photo.id, alt: photo.alt, src: photo.src };
    });
    result.domains[id] = { rating: entry.rating, comment: entry.comment, photos };
    requireValue(narrative === null || (object(narrative) &&
      typeof narrative.text === "string" && narrative.text.length <= 2000 &&
      ["ai", "mock", "teacher"].includes(narrative.source) && typeof narrative.edited === "boolean"),
      `${id}: narrative must be null or have text (at most 2000 characters), source ai|mock|teacher and boolean edited`);
    result.narratives[id] = narrative === null ? null : {
      text: narrative.text, source: narrative.source, edited: narrative.edited
    };
  }
  if (record.reviewed !== undefined) result.reviewed = record.reviewed;
  result.status = computeStatus(result);
  return result;
}

export function domainState(entry) {
  if (entry.rating !== null && entry.comment.trim() !== "") return "ready";
  return entry.rating !== null || entry.comment.trim() !== "" || entry.photos.length > 0
    ? "partial" : "empty";
}

export function recordProgress(record) {
  let ratedCount = 0, commentedCount = 0, readyCount = 0, narrativeCount = 0, hasInput = false;
  for (const id of ids) {
    const entry = record.domains[id];
    ratedCount += Number(entry.rating !== null);
    commentedCount += Number(entry.comment.trim() !== "");
    readyCount += Number(domainState(entry) === "ready");
    narrativeCount += Number(record.narratives[id] !== null);
    hasInput ||= domainState(entry) !== "empty";
  }
  const status = narrativeCount === 4 ? (record.reviewed === true ? "reviewed" : "drafted")
    : readyCount === 4 && narrativeCount === 0 ? "ready-for-draft"
    : hasInput || narrativeCount > 0 ? "in-progress" : "not-started";
  return { ratedCount, commentedCount, readyCount, narrativeCount, total: 4, status };
}

export function computeStatus(record) {
  return recordProgress(record).status;
}

function findRecord(records, childId, semester) {
  return records.find(r => r.childId === childId && r.semester === semester)
    ?? emptyRecord(childId, semester);
}

export function classProgress(children, records, semester) {
  const rows = children.map(child => ({
    childId: child.id, ...recordProgress(findRecord(records, child.id, semester))
  }));
  const totals = {
    children: children.length, ratedCount: 0, commentedCount: 0, readyCount: 0, narrativeCount: 0,
    total: children.length * 4,
    statuses: Object.fromEntries(
      ["not-started", "in-progress", "ready-for-draft", "drafted", "reviewed"].map(s => [s, 0]))
  };
  for (const row of rows) {
    for (const key of ["ratedCount", "commentedCount", "readyCount", "narrativeCount"])
      totals[key] += row[key];
    totals.statuses[row.status]++;
  }
  return { rows, totals };
}

export function adjacentChildId(children, currentId, direction) {
  requireValue(direction === "previous" || direction === "next" || direction === -1 || direction === 1,
    "Direction must be previous/next or -1/1");
  if (!children.length) return null;
  const index = children.findIndex(c => c.id === currentId),
    step = direction === "previous" || direction === -1 ? -1 : 1;
  if (index < 0) return children[step === 1 ? 0 : children.length - 1].id;
  return children[(index + step + children.length) % children.length].id;
}

export function nextChildNeedingWork(children, records, semester, currentChildId) {
  const index = children.findIndex(c => c.id === currentChildId);
  for (let offset = 1; offset <= children.length; offset++) {
    const child = children[(index + offset + children.length) % children.length];
    if (computeStatus(findRecord(records, child.id, semester)) !== "reviewed") return child.id;
  }
  return null;
}

export function progressComparison(prevRecord, currentRecord) {
  return ids.map(domain => {
    const previous = prevRecord?.domains?.[domain]?.rating ?? null,
      current = currentRecord?.domains?.[domain]?.rating ?? null;
    return {
      domain, previous, current,
      change: previous === null || current === null ? null : current - previous
    };
  });
}

export function narrativeInputFor(child, record, previousRecord) {
  // Seed Chinese names use a single-character surname; never pass that surname.
  const name = child.name.trim(),
    firstName = /\s/.test(name) ? name.split(/\s+/)[0]
      : /^[\p{Script=Han}]+$/u.test(name) ? name.slice(1) : name;
  return {
    firstName, semester: record.semester,
    domains: Object.fromEntries(DOMAINS.map(({ id, label }) => {
      const entry = record.domains[id];
      return [id, {
        label, rating: entry.rating,
        ratingLabel: RATINGS.find(r => r.value === entry.rating)?.label ?? null,
        comment: entry.comment,
        previousRating: previousRecord?.domains?.[id]?.rating ?? null,
        photoCount: entry.photos.length,
        ...(domainState(entry) !== "ready" ? { noEvidence: true } : {})
      }];
    }))
  };
}
