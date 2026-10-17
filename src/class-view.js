import {
  DOMAINS, RATINGS, classProgress, computeStatus, domainState, emptyRecord
} from "./portfolio-model.js";

const filters = new Set(["all", "needs-work", "ready-for-draft", "drafted", "reviewed"]);

export const STATUS_LABELS = Object.freeze({
  "not-started": "Not started",
  "in-progress": "In progress",
  "ready-for-draft": "Ready to draft",
  drafted: "Drafted",
  reviewed: "Reviewed"
});
export const FILTER_LABELS = Object.freeze({
  all: "All",
  "needs-work": "Needs work",
  "ready-for-draft": STATUS_LABELS["ready-for-draft"],
  drafted: STATUS_LABELS.drafted,
  reviewed: STATUS_LABELS.reviewed
});

export const PROVIDER_LABELS = Object.freeze({
  mock: "Offline mock (not AI)",
  gateway: "GPT Demo Gateway",
  openai: "OpenAI (test key)",
  gemini: "Gemini (test key)"
});

export function narrativeChip(narrative) {
  if (!narrative) return "No narrative";
  if (narrative.edited || narrative.source === "teacher") return "EDITED BY TEACHER";
  if (narrative.source === "mock") return "MOCK DRAFT (offline, not AI)";
  return `AI DRAFT (${PROVIDER_LABELS[narrative.provider] ?? "provider not recorded"}) - teacher must review`;
}

export function filterChildren(children, records, semester, { query = "", filter = "all" } = {}) {
  const search = query.trim().toLocaleLowerCase();
  if (!filters.has(filter)) return [];
  return children.filter(child => {
    if (!child.name.toLocaleLowerCase().includes(search)) return false;
    if (filter === "all") return true;
    const record = records.find(record => record.childId === child.id && record.semester === semester)
      ?? emptyRecord(child.id, semester);
    const status = computeStatus(record);
    return filter === "needs-work"
      ? status !== "reviewed" && status !== "ready-for-draft" : status === filter;
  });
}

export function domainDot(entry) {
  return {
    state: domainState(entry),
    ratingLabel: RATINGS.find(rating => rating.value === entry.rating)?.label ?? "Not rated"
  };
}

export function classSummary(children, records, semester) {
  return classProgress(children, records, semester).totals;
}

export function portfolioFilters(children, records, semester, query = "") {
  return Object.entries(FILTER_LABELS).map(([value, label]) => {
    const count = filterChildren(children, records, semester, { query, filter: value }).length;
    return [value, `${label} ${count}`];
  });
}

export function compactPortfolio(record) {
  return DOMAINS.every(domain => {
    const entry = record.domains[domain.id];
    return entry.rating === null && !entry.comment && !entry.photos.length
      && !record.narratives[domain.id];
  });
}

export function listComparison(change) {
  return change === null ? "No comparison" : `S1 → S2: ${change > 0 ? "+" : ""}${change}`;
}
