import { DOMAINS, RATINGS, domainState, progressComparison } from '../portfolio-model.js';

export const EDITOR_TABS = Object.freeze([
  ...DOMAINS.map(domain => ({ id: domain.id, label: domain.label })),
  { id: 'review', label: 'Review narratives' }
]);

export function editorModel(record, previousRecord, selected = DOMAINS[0].id) {
  const active = EDITOR_TABS.some(tab => tab.id === selected) ? selected : DOMAINS[0].id;
  return {
    active,
    ready: DOMAINS.filter(domain => domainState(record.domains[domain.id]) === 'ready').length,
    canReview: DOMAINS.every(domain => record.narratives[domain.id]?.text.trim()),
    tabs: EDITOR_TABS.map(tab => ({ ...tab, selected: tab.id === active })),
    comparisons: progressComparison(previousRecord, record)
  };
}

export function comparisonText(comparison) {
  const label = value => RATINGS.find(rating => rating.value === value)?.label;
  const previous = label(comparison.previous) ?? 'Not rated in Semester 1';
  const current = label(comparison.current) ?? 'Not rated in Semester 2';
  const change = comparison.change;
  const suffix = change === null ? 'No comparison' : change > 0 ? `+${change}` : `${change}`;
  return `Semester 1: ${previous} → Semester 2: ${current} (${suffix})`;
}
