import { DOMAINS, progressComparison, recordProgress } from '../../portfolio-model.js';
import { narrativeChip } from '../../class-view.js';
import { evidenceModel } from './evidence-model.js';

export function profileComparison(previous, current) {
  return progressComparison(previous, current).map(row => ({ ...row,
    label: DOMAINS.find(domain => domain.id === row.domain).label,
    changeText: row.current === null ? 'Not rated in Semester 2'
      : row.previous === null ? 'Not rated in Semester 1'
      : row.change === 0 ? 'No change' : `${row.change > 0 ? '+' : ''}${row.change}`
  }));
}

export function profileModel(child, records) {
  const semesters = ['2026-S2', '2026-S1'].map(semester => {
    const record = records.find(r => r.childId === child.id && r.semester === semester);
    const narratives = DOMAINS.flatMap(domain => {
      const narrative = record?.narratives[domain.id];
      return narrative ? [{ domain: domain.label, text: narrative.text,
        source: narrativeChip(narrative) }] : [];
    });
    return { semester, status: record ? recordProgress(record).status : 'not-started',
      reviewed: record?.reviewed === true, narratives,
      evidence: evidenceModel([child], records, { semester }) };
  });
  const previous = records.find(r => r.childId === child.id && r.semester === '2026-S1');
  const current = records.find(r => r.childId === child.id && r.semester === '2026-S2');
  return { comparison: profileComparison(previous, current), semesters };
}

export function groupProfileEvidence(items) {
  const groups = new Map();
  for (const item of items) {
    const key = `${item.semester}:${item.domain}`;
    if (!groups.has(key)) groups.set(key, { ...item, items: [] });
    groups.get(key).items.push(item);
  }
  return [...groups.values()];
}
