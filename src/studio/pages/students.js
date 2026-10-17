import { studentsModel } from '../models/students-model.js';
import { el, button, link, statusChip, ratingChip, emptyState } from '../ui.js';
import { selectField, searchField, filterChips } from '../page-controls.js';
import { FILTER_LABELS } from '../../class-view.js';
import { CLASS } from '../../portfolio-seed.js';
import { buildRoute } from '../router.js';

export function render(ctx) {
  const root = el('section');
  root.append(el('h1', 'Students'), el('p', 'Find a child and open a profile.'));
  const tools = el('div', undefined, 'toolbar');
  const listing = el('section');
  const options = { query: '', filter: 'all', classId: '' };
  const refresh = () => {
    const rows = studentsModel(ctx.children, ctx.records, ctx.semester, options);
    listing.replaceChildren(el('h2', `${ctx.children.length} fictional students`),
      roster(rows), el('p', `Showing ${rows.length} of ${ctx.children.length} students`));
    if (!rows.length) listing.append(emptyState('No students match these filters.'),
      button('Clear filters', () => {
        options.query = '';
        options.filter = 'all';
        options.classId = '';
        search.input.value = '';
        classField.querySelector('select').value = '';
        for (const [index, node] of [...chips.children].entries()) {
          node.setAttribute('aria-pressed', String(index === 0));
        }
        refresh();
      }));
  };
  const search = searchField('Search students', query => { options.query = query; refresh(); });
  const classField = selectField('Class', [['', 'All classes'], [CLASS.id, CLASS.name]], '',
    classId => { options.classId = classId; refresh(); });
  const semester = selectField('Semester', ['2026-S1', '2026-S2'].map(s => [s, s]),
    ctx.semester, value => ctx.setSemester(value));
  const chips = filterChips(Object.entries(FILTER_LABELS), 'all', filter => {
    options.filter = filter;
    refresh();
  });
  tools.append(search.root, classField, semester);
  root.append(tools, chips, listing);
  root.dispose = ctx.subscribe(refresh);
  refresh();
  return root;
}

function roster(rows) {
  const table = el('table', undefined, 'responsive-table');
  const head = el('thead');
  const header = el('tr');
  for (const label of ['Student', 'Class', 'Status', 'Latest ratings', 'Profile']) {
    const cell = el('th', label);
    cell.scope = 'col';
    header.append(cell);
  }
  head.append(header);
  const body = el('tbody');
  for (const row of rows) {
    const tr = el('tr');
    const name = el('th', row.child.name);
    name.scope = 'row';
    const ratings = el('td');
    for (const domain of row.ratings) {
      const value = el('div', undefined, 'rating-line');
      value.append(el('span', domain.label), ratingChip(domain.value));
      ratings.append(value);
    }
    const status = el('td');
    status.append(statusChip(row.status));
    const action = el('td');
    const open = link('View profile', buildRoute('student-profile', { childId: row.child.id }));
    open.setAttribute('aria-label', `View profile for ${row.child.name}`);
    action.append(open);
    tr.append(name, el('td', row.className), status, ratings, action);
    body.append(tr);
  }
  table.append(head, body);
  return table;
}
