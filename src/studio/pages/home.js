import { homeModel } from '../models/home-model.js';
import { el, button, link, statusChip, progressBar, emptyState, icon } from '../ui.js';
import { STATUS_LABELS } from '../../class-view.js';
import { editorLink } from '../page-controls.js';
import { draftReadyChildren } from '../bulk-draft.js';
import { buildRoute } from '../router.js';

export function render(ctx) {
  const root = el('section', undefined, 'home-page');
  const [year, semester] = ctx.semester.split('-S');
  root.append(el('h1', 'Good morning, Ms. Jordan'),
    el('p', `Your class portfolio work for Semester ${semester}, ${year}.`, 'page-intro'));
  const content = el('div');
  const refresh = () => content.replaceChildren(dashboard(ctx));
  root.append(content);
  const unsubscribe = ctx.subscribe(refresh);
  root.dispose = unsubscribe;
  refresh();
  return root;
}

function dashboard(ctx) {
  const model = homeModel(ctx.children, ctx.records, ctx.semester);
  const statuses = model.totals.statuses;
  const root = el('div', undefined, 'home-dashboard');
  const metrics = el('div', undefined, 'grid metrics home-metrics');
  const values = [
    ['Class progress', `${statuses.reviewed} / ${ctx.children.length} reviewed`,
      'users', 'progress'],
    ['Ready to draft', `${statuses['ready-for-draft']} children`, 'file', 'ready'],
    ['Drafts awaiting review', String(statuses.drafted), 'file', 'drafts'],
    ['In progress', `${statuses['in-progress']} children`, 'pencil', 'active']];
  for (const [label, value, glyph, tone] of values) {
    const card = el('section', undefined, `card home-metric home-metric-${tone}`);
    const badge = el('span', undefined, 'home-metric-icon');
    badge.append(icon(glyph));
    const body = el('div');
    body.append(el('h2', label), el('p', value, 'metric-value'));
    card.append(badge, body);
    metrics.append(card);
  }
  const completion = el('section', undefined, 'summary home-completion');
  completion.append(el('h2', 'Class completion'), progressBar(statuses.reviewed,
    Math.max(1, ctx.children.length), `${statuses.reviewed} / ${ctx.children.length} reviewed`));
  const counts = el('div', undefined, 'chips');
  for (const [status, count] of Object.entries(statuses)) {
    const chip = statusChip(status);
    chip.textContent = `${STATUS_LABELS[status]}: ${count}`;
    counts.append(chip);
  }
  completion.append(counts);
  const panels = el('div', undefined, 'home-panels');
  panels.append(workQueue(model, ctx.semester), draftPanel(statuses));
  root.append(metrics, completion, panels, actions(ctx, model));
  return root;
}

function workQueue(model, semester) {
  const section = el('section', undefined, 'card home-work');
  const heading = el('div', undefined, 'home-panel-heading');
  heading.append(el('h2', 'Children needing work'),
    link('View all in Class portfolios', '#/classes'));
  section.append(heading);
  for (const row of model.needingWork) {
    const card = el('article', undefined, 'home-work-row');
    const action = editorLink('Open portfolio', {
      childId: row.child.id, semester, domain: row.domain
    });
    action.setAttribute('aria-label', `Open portfolio for ${row.child.name}`);
    const avatar = el('span', row.child.initials, 'avatar');
    avatar.setAttribute('aria-hidden', 'true');
    card.append(avatar, el('h3', row.child.name), statusChip(row.status),
      el('p', row.task, 'home-work-task'), action);
    section.append(card);
  }
  if (!model.needingWork.length) section.append(emptyState('All portfolios are reviewed.'));
  return section;
}

function draftPanel(statuses) {
  const panel = el('section', undefined, 'card home-drafts');
  const body = el('div', undefined, 'home-drafts-body');
  const badge = el('span', undefined, 'home-drafts-icon');
  badge.append(icon('file'));
  body.append(badge, el('p', statuses.drafted
    ? `${statuses.drafted} drafts are waiting for review.` : 'No drafts are waiting for review.'),
  el('p', `${statuses['ready-for-draft']} children are ready to draft.`, 'muted'),
  link('Open AI drafts', '#/drafts'),
  link('View ready children', '#/classes?filter=ready-for-draft'));
  panel.append(el('h2', 'Drafts awaiting review'), body);
  return panel;
}

function actions(ctx, model) {
  const panel = el('section', undefined, 'card home-actions');
  panel.append(el('h2', 'Quick actions'));
  const group = el('div', undefined, 'home-action-group');
  const next = button('Continue with next unfinished child', () => ctx.go(model.next), true);
  next.disabled = !model.next || ctx.busy;
  const draft = button(`Draft narratives for all ready children (${model.ready.length})`,
    () => ctx.runDraft(() => draftReadyChildren(ctx, model.ready)));
  draft.disabled = ctx.busy || !model.ready.length
    || (ctx.provider.id !== 'mock' && ctx.isOffline());
  const print = link('Print class report', buildRoute('reports', { semester: ctx.semester }));
  next.replaceChildren(icon('arrow'), 'Continue with next unfinished child');
  draft.replaceChildren(icon('pencil'),
    `Draft narratives for all ready children (${model.ready.length})`);
  print.replaceChildren(icon('file'), 'Print class report');
  group.append(next, draft, print);
  panel.append(group);
  return panel;
}
