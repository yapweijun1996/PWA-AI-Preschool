import { DOMAINS } from '../../portfolio-model.js';

export function evidenceModel(children, records, filters = {}) {
  const names = new Map(children.map(child => [child.id, child.name]));
  const items = [];
  for (const record of records) {
    if (!names.has(record.childId)) continue;
    for (const domain of DOMAINS) {
      const entry = record.domains[domain.id];
      const base = { childId: record.childId, childName: names.get(record.childId),
        semester: record.semester, domain: domain.id, domainLabel: domain.label };
      if (entry.comment.trim()) {
        items.push({ ...base, type: 'comment', text: entry.comment });
      }
      for (const photo of entry.photos) {
        items.push({ ...base, type: 'photo', text: photo.alt, src: photo.src, id: photo.id });
      }
    }
  }
  const query = (filters.query ?? '').trim().toLocaleLowerCase();
  return items.filter(item => (!filters.childId || item.childId === filters.childId)
    && (!filters.domain || item.domain === filters.domain)
    && (!filters.semester || item.semester === filters.semester)
    && (!filters.type || filters.type === 'all' || item.type === filters.type)
    && item.text.toLocaleLowerCase().includes(query));
}
