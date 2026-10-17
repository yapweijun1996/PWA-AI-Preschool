import { el, link, chip, emptyState, avatar } from '../ui.js';
import { selectField } from '../page-controls.js';
import { reportsModel } from '../models/reports-model.js';

export function render(ctx, route = {}) {
  const root = el('section', undefined, 'reports-page');
  const heading = el('header', undefined, 'page-header');
  heading.append(el('h1', 'Reports'),
    el('p', 'Choose a report and check missing content before printing.'));
  if (route.semester) ctx.semester = route.semester;
  const selection = { type: 'child', childId: route.childId ?? ctx.children[0]?.id };
  const controls = el('div', undefined, 'toolbar report-selectors');
  const child = selectField('Child', ctx.children.map(child => [child.id, child.name]),
    selection.childId, value => { selection.childId = value; refresh(); });
  const type = selectField('Report type', [['child', 'Child report'], ['class', 'Class report']],
    selection.type, value => {
      selection.type = value;
      child.hidden = value === 'class';
      refresh();
    });
  const semester = selectField('Semester', ['2026-S1', '2026-S2'].map(value => [value, value]),
    route.semester ?? ctx.semester, value => ctx.setSemester(value));
  controls.append(type, semester, child);
  const completeness = el('section', undefined, 'card report-completeness');
  const preview = el('details', undefined, 'card report-preview');
  preview.open = globalThis.matchMedia?.('(min-width: 601px)').matches ?? false;
  const columns = el('div', undefined, 'report-columns');
  columns.append(completeness, preview);
  const print = link('Print / Save as PDF', '#/reports');
  print.className = 'button-link primary-link';
  const actions = el('div', undefined, 'toolbar report-actions');
  actions.append(print, link('Back to class portfolios', '#/classes'));
  const refresh = () => {
    const model = reportsModel(ctx, selection);
    semester.querySelector('select').value = ctx.semester;
    showCompleteness(completeness, model);
    preview.replaceChildren(el('summary', 'Live preview'),
      el('p', 'Preview updates when selections change.'));
    if (selection.type === 'class') {
      preview.append(el('p', `${ctx.children.length} fictional children`));
    }
    for (const report of model.reports) preview.append(reportThumbnail(report));
    if (!model.reports.length) preview.append(emptyState('No matching child. Choose a child.'));
    print.href = model.href;
    print.hidden = !model.reports.length;
  };
  root.append(heading, actions, controls, columns);
  root.dispose = ctx.subscribe(refresh);
  refresh();
  return root;
}

function reportThumbnail(report) {
  const page = el('article', undefined, 'report-thumbnail');
  page.append(avatar({ id: report.childId, name: report.childName,
    initials: report.childInitials || '?' }));
  page.append(el('p', report.header.productName, 'report-thumbnail-brand'),
    el('h3', report.header.title), el('h4', report.childName),
    el('p', report.semesterLabel));
  for (const domain of report.domains) {
    const row = el('section', undefined, 'report-thumbnail-domain');
    row.append(el('h5', domain.label), el('p', `Rating: ${domain.ratingLabel}`),
      el('p', domain.comment || 'No comment recorded.', 'report-thumbnail-comment'));
    page.append(row);
  }
  if (!report.status.complete) page.append(el('p', 'INCOMPLETE', 'incomplete-chip chip'));
  page.append(el('p', 'Open Print / Save as PDF to review the complete report.', 'hint'));
  return page;
}

function showCompleteness(root, model) {
  const state = chip(model.complete ? 'Complete' : 'INCOMPLETE');
  state.className += model.complete ? ' complete-chip' : ' incomplete-chip';
  const heading = el('div', undefined, 'completeness-heading');
  heading.append(el('h2', 'Completeness'), state);
  root.replaceChildren(heading,
    el('p', model.complete ? 'All required report content is recorded.'
      : 'This report has missing content. Check these items before printing.', 'hint'));
  const list = el('ul', undefined, 'report-warnings');
  for (const warning of model.warnings.slice(0, 3)) list.append(el('li', warning));
  root.append(list);
  if (model.warnings.length > 3) {
    const more = el('details');
    more.append(el('summary', `${model.warnings.length - 3} more warnings`));
    const remaining = el('ul');
    for (const warning of model.warnings.slice(3)) remaining.append(el('li', warning));
    more.append(remaining);
    root.append(more);
  }
}

