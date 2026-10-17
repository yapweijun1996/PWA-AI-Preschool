import { profileModel } from '../models/profile-model.js';
import { el, link, ratingChip, statusChip, emptyState, errorState } from '../ui.js';
import { evidenceCard } from '../page-controls.js';
import { buildRoute } from '../router.js';
import { CLASS } from '../../portfolio-seed.js';

export function render(ctx, route) {
  const root = el('section');
  const child = ctx.children.find(c => c.id === route.childId);
  if (!child) {
    root.append(el('h1', 'Student not found'), errorState('Choose a fictional student.'),
      link('Back to students', '#/students'));
    return root;
  }
  root.append(el('h1', child.name),
    el('p', `${child.id} · ${CLASS.name} · Fictional student`));
  const actions = el('div', undefined, 'toolbar');
  actions.append(link('Open editor', buildRoute('child-editor', {
    childId: child.id, semester: ctx.semester
  })), link('Print report', buildRoute('reports', {
    childId: child.id, semester: ctx.semester
  })));
  const content = el('div');
  const refresh = () => {
    const model = profileModel(child, ctx.records);
    content.replaceChildren(comparison(model.comparison), timeline(model.semesters),
      narratives(model.semesters));
  };
  root.append(actions, content);
  root.dispose = ctx.subscribe(refresh);
  refresh();
  return root;
}

function comparison(rows) {
  const section = el('section', undefined, 'card');
  section.append(el('h2', 'S1 to S2 progress'));
  const table = el('table', undefined, 'responsive-table');
  const head = el('thead');
  const tr = el('tr');
  for (const label of ['Domain', '2026-S1', '2026-S2', 'Change']) {
    const th = el('th', label);
    th.scope = 'col';
    tr.append(th);
  }
  head.append(tr);
  const body = el('tbody');
  for (const row of rows) {
    const entry = el('tr');
    const domain = el('th', row.label);
    domain.scope = 'row';
    entry.append(domain);
    for (const [label, value] of [['2026-S1', row.previous], ['2026-S2', row.current]]) {
      const cell = el('td');
      cell.append(el('span', `${label}: `, 'mobile-cell-label'), ratingChip(value));
      entry.append(cell);
    }
    entry.append(el('td', row.changeText));
    body.append(entry);
  }
  table.append(head, body);
  section.append(table);
  return section;
}

function timeline(semesters) {
  const section = el('section');
  section.append(el('h2', 'Learning timeline'));
  for (const semester of semesters) {
    const group = el('section');
    group.append(el('h3', semester.semester));
    for (const item of semester.evidence) group.append(evidenceCard(item));
    if (!semester.evidence.length) {
      group.append(emptyState('No evidence recorded for this semester.'));
    }
    section.append(group);
  }
  return section;
}

function narratives(semesters) {
  const section = el('section', undefined, 'card');
  section.append(el('h2', 'Narratives and review'));
  if (!semesters.some(s => s.reviewed)) section.append(el('p', 'No narratives reviewed yet.'));
  for (const semester of semesters) {
    const group = el('section');
    group.append(el('h3', semester.semester), statusChip(semester.status));
    if (!semester.narratives.length) group.append(emptyState('No narratives for this semester.'));
    for (const narrative of semester.narratives) {
      const box = el('article', undefined, 'narrative-box');
      box.append(el('h4', narrative.domain), el('p', narrative.source),
        el('p', narrative.text, 'evidence-text'));
      group.append(box);
    }
    group.append(el('p', semester.reviewed
      ? 'Reviewed locally in this browser; not authenticated approval.' : 'Not reviewed.'));
    section.append(group);
  }
  return section;
}
