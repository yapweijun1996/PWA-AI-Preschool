import {
  DOMAINS, classProgress, emptyRecord, nextChildNeedingWork, recordProgress
} from '../../portfolio-model.js';

export function homeModel(children, records, semester) {
  const rows = children.map(child => {
    const record = records.find(r => r.childId === child.id && r.semester === semester)
      ?? emptyRecord(child.id, semester);
    const progress = recordProgress(record);
    const domain = DOMAINS.find(d => record.domains[d.id].rating === null
      || !record.domains[d.id].comment.trim()) ?? DOMAINS.find(d => !record.narratives[d.id])
      ?? DOMAINS[0];
    const entry = record.domains[domain.id];
    const task = entry.rating === null ? 'Add a rating'
      : !entry.comment.trim() ? 'Add a comment'
      : !record.narratives[domain.id] ? 'Draft a narrative' : 'Review the narrative';
    return { child, status: progress.status, domain: domain.id,
      task: `${domain.label}: ${task}`,
      domains: DOMAINS.map(d => ({ ...d, rating: record.domains[d.id].rating })) };
  });
  return {
    totals: classProgress(children, records, semester).totals,
    needingWork: [
      ...rows.filter(row => row.status === 'in-progress'),
      ...rows.filter(row => row.status !== 'reviewed' && row.status !== 'in-progress')
    ].slice(0, 3),
    ready: rows.filter(row => row.status === 'ready-for-draft').map(row => row.child),
    next: nextChildNeedingWork(children, records, semester)
  };
}
