import { buildReport } from '../../report-model.js';
import { renderReport, renderReportControls } from '../../report-view.js';
import { el, errorState } from '../ui.js';
import { buildRoute } from '../router.js';

export function printModel(ctx, route, generatedOn) {
  const children = route.name === 'print-class' ? ctx.children
    : ctx.children.filter(child => child.id === route.childId);
  return children.map(child => buildReport({ child,
    record: ctx.get(child.id, route.semester),
    previousRecord: route.semester === '2026-S2' ? ctx.get(child.id, '2026-S1') : null,
    generatedOn
  }));
}

export function render(ctx, route) {
  const root = el('section');
  const back = route.name === 'print' ? buildRoute('child-editor', {
    childId: route.childId, semester: route.semester
  }) : '#/classes';
  root.append(renderReportControls(back));
  const pages = el('div', undefined, 'report-pages');
  const reports = printModel(ctx, route, new Date().toISOString().slice(0, 10));
  for (const [index, report] of reports.entries()) {
    const page = renderReport(report);
    if (index > 0) {
      const title = page.querySelector('h1');
      title.replaceWith(el('h2', title.textContent));
    }
    pages.append(page);
  }
  if (!reports.length) pages.append(el('h1', 'Child not found'),
    errorState('Choose a fictional child from the class.'));
  root.append(pages);
  return root;
}
