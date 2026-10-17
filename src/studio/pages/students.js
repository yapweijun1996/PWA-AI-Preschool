import { studentsModel } from '../models/students-model.js';
import { el, button, link, statusChip, ratingChip, emptyState, icon, avatar } from '../ui.js';
import {
  selectField, searchField, filterChips, domainKey, updateFilterChips
} from '../page-controls.js';
import { portfolioFilters } from '../../class-view.js';
import { CLASS } from '../../portfolio-seed.js';
import { buildRoute } from '../router.js';

export function render(ctx) {
  const root = el('section', undefined, 'students-page');
  const heading = el('header', undefined, 'page-header');
  heading.append(el('h1', 'Students'), el('p', 'Find a child and open a profile.'));
  const tools = el('div', undefined, 'toolbar directory-toolbar');
  const listing = el('section', undefined, 'student-listing');
  const options = { query: '', filter: 'all', classId: '' };
  const refresh = () => {
    const rows = studentsModel(ctx.children, ctx.records, ctx.semester, options);
    updateFilterChips(chips, portfolioFilters(ctx.children, ctx.records,
      ctx.semester, options.query), options.filter);
    listing.replaceChildren(el('h2', `${ctx.children.length} fictional students`),
      roster(rows), el('p', `Showing ${rows.length} of ${ctx.children.length} students`,
        'listing-count'));
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
  const chips = filterChips(portfolioFilters(ctx.children, ctx.records, ctx.semester),
    'all', filter => {
    options.filter = filter;
    refresh();
  });
  search.input.placeholder = 'Search students';
  search.root.className = 'directory-search';
  tools.append(search.root, classField, semester, chips);
  root.append(heading, tools, domainKey(), listing);
  root.dispose = ctx.subscribe(refresh);
  refresh();
  return root;
}

function roster(rows) {
  const table = el('table', undefined, 'responsive-table student-roster');
  const head = el('thead');
  const header = el('tr');
  for (const label of ['Student', 'Class', 'Status', 'Latest ratings', 'Profile']) {
    const cell = el('th', label);
    cell.scope = 'col';
    header.append(cell);
  }
  head.append(header);
  const body = el('tbody');
  body.append(...rows.map(studentRow));
  table.append(head, body);
  return table;
}

function studentRow(row) {
  const tr = el('tr', undefined, 'student-row');
  const name = el('th', undefined, 'student-name');
  name.scope = 'row';
  name.append(avatar(row.child), el('span', row.child.name, 'identity-text'));
  const ratings = el('td', undefined, 'student-ratings');
  ratings.dataset.label = 'Latest ratings';
  if (row.compact) {
    tr.className += ' untouched-portfolio';
    ratings.append(el('p', 'No domains rated yet', 'compact-empty'));
  }
  for (const domain of row.ratings) {
    const value = el('div', undefined, 'rating-line');
    value.append(el('span', domain.label), ratingChip(domain.value));
    const short = el('span', ['EN', 'ZH', 'MA', 'SE'][row.ratings.indexOf(domain)],
      'compact-domain-label');
    short.setAttribute('aria-hidden', 'true');
    value.append(short);
    ratings.append(value);
  }
  const status = el('td', undefined, 'student-status');
  status.dataset.label = 'Status';
  status.append(statusChip(row.status));
  const action = el('td', undefined, 'student-action');
  const open = link('View profile', buildRoute('student-profile', { childId: row.child.id }));
  open.setAttribute('aria-label', `View profile for ${row.child.name}`);
  action.append(open);
  const chevron = icon('chevron');
  chevron.setAttribute('class', 'icon list-chevron');
  name.append(chevron);
  const className = el('td', row.className, 'student-class');
  className.dataset.label = 'Class';
  tr.append(name, className, status, ratings, action);
  return tr;
}
