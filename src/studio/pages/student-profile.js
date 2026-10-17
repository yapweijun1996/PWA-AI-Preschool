import { profileModel, groupProfileEvidence } from '../models/profile-model.js';
import { el, link, ratingChip, statusChip, emptyState, errorState, avatar, photoFigure } from '../ui.js';
import { buildRoute } from '../router.js';
import { CLASS } from '../../portfolio-seed.js';

export function render(ctx, route) {
  const root = el('section', undefined, 'student-profile-page');
  const child = ctx.children.find(c => c.id === route.childId);
  if (!child) {
    root.append(el('h1', 'Student not found'), errorState('Choose a fictional student.'),
      link('Back to students', '#/students'));
    return root;
  }
  const heading = el('header', undefined, 'page-header profile-header');
  const identity = el('div', undefined, 'profile-identity');
  const portrait = avatar(child, 'avatar profile-avatar');
  const title = el('div');
  title.append(el('h1', child.name, 'identity-text'),
    el('p', `${child.id} · ${CLASS.name} · Fictional student`));
  const portfolioStatus = el('span', undefined, 'profile-current-status');
  identity.append(portrait, title, portfolioStatus);
  const actions = el('div', undefined, 'toolbar profile-actions');
  const openEditor = link('Open editor', buildRoute('child-editor', {
    childId: child.id, semester: ctx.semester
  }));
  openEditor.className += ' primary-link';
  actions.append(openEditor, link('Print report', buildRoute('reports', {
    childId: child.id, semester: ctx.semester
  })));
  heading.append(identity, actions);
  const content = el('div', undefined, 'profile-content');
  const refresh = () => {
    const model = profileModel(child, ctx.records);
    portfolioStatus.replaceChildren(statusChip(
      model.semesters.find(semester => semester.semester === ctx.semester)?.status
      ?? 'not-started'));
    content.replaceChildren(comparison(model.comparison), timeline(model.semesters),
      narratives(model.semesters));
  };
  root.append(heading, content);
  root.dispose = ctx.subscribe(refresh);
  refresh();
  return root;
}

function comparison(rows) {
  const section = el('section', undefined, 'card profile-comparison');
  section.append(el('h2', 'S1 to S2 progress'));
  const table = el('table', undefined, 'responsive-table profile-comparison-table');
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
    const change = el('td', undefined,
      row.change > 0 ? 'progress-change positive' : 'progress-change');
    change.append(el('span', 'Change: ', 'mobile-cell-label'), el('span', row.changeText));
    entry.append(change);
    body.append(entry);
  }
  table.append(head, body);
  section.append(table);
  return section;
}

function timeline(semesters) {
  const section = el('section', undefined, 'card profile-timeline');
  section.append(el('h2', 'Learning timeline'));
  for (const semester of semesters) {
    const group = el('section', undefined, 'timeline-semester');
    group.append(el('h3', semester.semester));
    for (const entry of groupProfileEvidence(semester.evidence)) {
      const row = el('article', undefined, 'profile-evidence-row');
      row.append(el('h4', entry.domainLabel));
      for (const item of entry.items) {
        if (item.type === 'comment') row.append(el('p', item.text, 'evidence-text'));
        else {
          row.append(photoFigure({ src: item.src, alt: item.text }));
        }
      }
      row.append(link('Open in editor', buildRoute('child-editor', {
        childId: entry.childId, semester: entry.semester, domain: entry.domain
      })));
      group.append(row);
    }
    if (!semester.evidence.length) {
      group.append(emptyState('No evidence recorded for this semester.'));
    }
    section.append(group);
  }
  return section;
}

function narratives(semesters) {
  const section = el('section', undefined, 'card profile-narratives');
  section.append(el('h2', 'Narratives and review'));
  if (!semesters.some(s => s.reviewed)) {
    section.append(el('p', 'No narratives reviewed yet.', 'profile-review-notice'));
  }
  for (const semester of semesters) {
    const group = el('section', undefined, 'narrative-semester');
    group.append(el('h3', semester.semester), statusChip(semester.status));
    if (!semester.narratives.length) group.append(emptyState('No narratives for this semester.'));
    for (const narrative of semester.narratives) {
      const box = el('article', undefined, 'narrative-box');
      const source = el('p', narrative.source, 'narrative-source');
      source.dataset.source = narrative.source.startsWith('MOCK') ? 'mock'
        : narrative.source.startsWith('AI') ? 'ai' : 'teacher';
      const text = el('p', narrative.text, 'evidence-text');
      text.lang = narrative.language;
      box.append(el('h4', narrative.domain), source, text);
      group.append(box);
    }
    group.append(el('p', semester.reviewed
      ? 'Reviewed locally in this browser; not authenticated approval.' : 'Not reviewed.'));
    section.append(group);
  }
  return section;
}
