import { RATINGS, classProgress, computeStatus, domainState, emptyRecord } from "./portfolio-model.js";

const semesters = new Set(["2026-S1", "2026-S2"]);
const filters = new Set(["all", "needs-work", "ready-for-draft", "drafted", "reviewed"]);

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

export function routeParse(hash, children) {
  const overview = { page: "overview" };
  if (typeof hash !== "string") return overview;
  if (hash === "" || hash === "#" || hash === "#/") return overview;
  const match = /^#\/child\/([^/?#]+)(?:\?sem=(2026-S[12]))?$/.exec(hash);
  if (!match) return overview;
  let childId;
  try {
    childId = decodeURIComponent(match[1]);
  } catch {
    return overview;
  }
  if (!childId.trim()) return overview;
  if (children && !children.some(child => child.id === childId)) {
    return { page: "overview", message: "Child not found." };
  }
  return { page: "child", childId, semester: match[2] ?? "2026-S2" };
}

export function routeBuild(route) {
  if (route?.page !== "child" || typeof route.childId !== "string" || !route.childId.trim())
    return "#/";
  const semester = route.semester ?? "2026-S2";
  if (!semesters.has(semester)) return "#/";
  try {
    return `#/child/${encodeURIComponent(route.childId)}?sem=${semester}`;
  } catch {
    return "#/";
  }
}
