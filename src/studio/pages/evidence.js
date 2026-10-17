import { DOMAINS } from '../../portfolio-model.js';
import { evidenceModel } from '../models/evidence-model.js';
import { el, button, emptyState } from '../ui.js';
import { selectField, searchField, filterChips, evidenceCard } from '../page-controls.js';

export function render(ctx) {
  const root = el('section', undefined, 'evidence-page');
  const heading = el('header', undefined, 'page-header');
  heading.append(el('h1', 'Evidence library'),
    el('p', 'Browse fictional comments and sample activity illustrations.'));
  const filters = { childId: '', domain: '', semester: ctx.semester, type: 'all', query: '' };
  const tools = el('div', undefined, 'toolbar evidence-toolbar');
  const listing = el('section', undefined, 'card evidence-listing');
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
  const chips = filterChips([['all', 'All'], ['comment', 'Comments'],
    ['photo', 'Photos']], filters.type, value => update('type', value));
  chips.setAttribute('aria-label', 'Evidence type');
  const refresh = () => {
    const items = evidenceModel(ctx.children, ctx.records, filters);
    listing.className = `card evidence-listing${filters.type === 'photo' ? ' photos-only' : ''}`;
    const cards = libraryCards(items);
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
  search.input.placeholder = 'Search comments and photo descriptions';
  search.root.className = 'evidence-search';
  tools.append(search.root);
  root.append(heading, tools, chips, listing);
  root.dispose = ctx.subscribe(refresh);
  refresh();
  return root;
}

function libraryCards(items) {
  const cards = el('div', undefined, 'evidence-grid');
  for (const item of items) {
    const card = evidenceCard(item);
    card.className += ' library-evidence-card';
    const type = el('span', item.type === 'photo' ? 'Activity image' : 'Teacher comment',
      'evidence-type');
    card.replaceChildren(type, ...card.children);
    cards.append(card);
  }
  return cards;
}
