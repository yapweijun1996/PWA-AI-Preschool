import { DOMAINS } from '../../portfolio-model.js';
import { evidenceModel } from '../models/evidence-model.js';
import { el, button, emptyState } from '../ui.js';
import { selectField, searchField, filterChips, evidenceCard } from '../page-controls.js';

export function render(ctx) {
  const root = el('section');
  root.append(el('h1', 'Evidence library'),
    el('p', 'Browse fictional comments and placeholder photos.'));
  const filters = { childId: '', domain: '', semester: ctx.semester, type: 'all', query: '' };
  const tools = el('div', undefined, 'toolbar');
  const listing = el('section');
  const update = (key, value) => { filters[key] = value; refresh(); };
  const fields = [
    ['Child', 'childId', [['', 'All children'], ...ctx.children.map(c => [c.id, c.name])]],
    ['Domain', 'domain', [['', 'All domains'], ...DOMAINS.map(d => [d.id, d.label])]],
    ['Semester', 'semester', [['', 'All semesters'], ['2026-S1', '2026-S1'],
      ['2026-S2', '2026-S2']]]
  ];
  for (const [label, key, options] of fields) {
    tools.append(selectField(label, options, filters[key], value => update(key, value)));
  }
  const search = searchField('Search evidence', value => update('query', value));
  const chips = filterChips([['all', 'All evidence'], ['comment', 'Comments'],
    ['photo', 'Photos']], filters.type, value => update('type', value));
  const refresh = () => {
    const items = evidenceModel(ctx.children, ctx.records, filters);
    const cards = el('div', undefined, 'evidence-grid');
    for (const item of items) cards.append(evidenceCard(item));
    listing.replaceChildren(el('h2', `${items.length} items`), cards);
    if (!items.length) listing.append(emptyState('No evidence matches these filters.'),
      button('Clear filters', () => {
        Object.assign(filters, { childId: '', domain: '', semester: '', type: 'all', query: '' });
        for (const field of tools.querySelectorAll('select')) field.value = '';
        search.input.value = '';
        for (const [index, node] of [...chips.children].entries()) {
          node.setAttribute('aria-pressed', String(index === 0));
        }
        refresh();
      }));
  };
  tools.append(search.root);
  root.append(tools, chips, listing);
  root.dispose = ctx.subscribe(refresh);
  refresh();
  return root;
}
