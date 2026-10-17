import { RATINGS, classProgress, computeStatus, domainState, emptyRecord } from "./portfolio-model.js";

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
    return filter === "needs-work" ? status !== "reviewed" : status === filter;
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
