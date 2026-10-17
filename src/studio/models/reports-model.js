import { buildReport } from '../../report-model.js';
import { buildRoute } from '../router.js';

export function reportsModel(ctx, { type = 'child', childId = ctx.children[0]?.id,
  semester = ctx.semester } = {}, generatedOn = '') {
  const children = type === 'class' ? ctx.children
    : ctx.children.filter(child => child.id === childId);
  const reports = children.map(child => buildReport({ child,
    record: ctx.get(child.id, semester),
    previousRecord: semester === '2026-S2' ? ctx.get(child.id, '2026-S1') : null,
    generatedOn, language: ctx.reportLanguage
  }));
  const warnings = reports.flatMap(report => report.status.warnings.map(text =>
    type === 'class' ? `${report.childName}: ${text}` : text));
  return { reports, warnings, complete: reports.length > 0 && warnings.length === 0,
    href: buildRoute(type === 'class' ? 'print-class' : 'print', { childId, semester }) };
}
