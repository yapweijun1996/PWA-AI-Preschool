import { reportsModel } from '../models/reports-model.js';
import { renderReport, renderReportControls } from '../../report-view.js';
import { el, errorState } from '../ui.js';
import { buildRoute } from '../router.js';

export function printModel(ctx, route, generatedOn) {
  return reportsModel(ctx, { type: route.name === 'print-class' ? 'class' : 'child',
    childId: route.childId, semester: route.semester }, generatedOn).reports;
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
