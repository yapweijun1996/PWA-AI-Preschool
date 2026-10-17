import { DOMAINS, emptyRecord, recordProgress } from '../../portfolio-model.js';
import { filterChildren, compactPortfolio } from '../../class-view.js';
import { CLASS } from '../../portfolio-seed.js';

export function studentsModel(children, records, semester, options = {}) {
  if (options.classId && options.classId !== CLASS.id) return [];
  return filterChildren(children, records, semester, options).map(child => {
    const record = records.find(r => r.childId === child.id && r.semester === semester)
      ?? emptyRecord(child.id, semester);
    return { child, className: CLASS.name, status: recordProgress(record).status,
      compact: compactPortfolio(record),
      ratings: DOMAINS.map(domain => ({ ...domain, value: record.domains[domain.id].rating })) };
  });
}
