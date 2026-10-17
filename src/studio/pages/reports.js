import { renderReport } from '../../report-view.js';
import { el, link, chip, emptyState } from '../ui.js';
import { selectField } from '../page-controls.js';
import { reportsModel } from '../models/reports-model.js';

export function render(ctx, route = {}) {
  const root = el('section');
  if (route.semester) ctx.semester = route.semester;
  const selection = { type: 'child', childId: route.childId ?? ctx.children[0]?.id };
  const controls = el('div', undefined, 'toolbar');
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
  const completeness = el('section', undefined, 'card');
  const preview = el('section', undefined, 'card report-preview');
  const print = link('Print / Save as PDF', '#/reports');
  print.className = 'primary-link';
  const refresh = () => {
    const model = reportsModel(ctx, selection);
    semester.querySelector('select').value = ctx.semester;
    showCompleteness(completeness, model);
    preview.replaceChildren(el('h2', 'Live preview'),
      el('p', 'Preview updates when selections change.'));
    if (selection.type === 'class') {
      preview.append(el('p', `${ctx.children.length} fictional children`));
    }
    for (const report of model.reports) {
      const page = renderReport(report);
      const heading = page.querySelector('h1');
      heading.replaceWith(el('h3', heading.textContent));
      preview.append(page);
    }
    if (!model.reports.length) preview.append(emptyState('No matching child. Choose a child.'));
    print.href = model.href;
    print.hidden = !model.reports.length;
  };
  root.append(el('h1', 'Reports'),
    el('p', 'Choose a report and check missing content before printing.'), controls,
    completeness, preview, print, link('Back to class portfolios', '#/classes'));
  root.dispose = ctx.subscribe(refresh);
  refresh();
  return root;
}

function showCompleteness(root, model) {
  root.replaceChildren(el('h2', 'Completeness'), chip(model.complete ? 'Complete' : 'INCOMPLETE'));
  const list = el('ul');
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
