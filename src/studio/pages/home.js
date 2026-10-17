import { homeModel } from '../models/home-model.js';
import { el, button, link, statusChip, ratingChip, progressBar, emptyState } from '../ui.js';
import { STATUS_LABELS } from '../../class-view.js';
import { editorLink } from '../page-controls.js';
import { draftReadyChildren } from '../bulk-draft.js';
import { buildRoute } from '../router.js';

export function render(ctx) {
  const root = el('section');
  root.append(el('h1', 'Good morning'),
    el('p', `Your class portfolio work for ${ctx.semester}.`));
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
  const root = el('div');
  const metrics = el('div', undefined, 'grid metrics');
  const values = [['Class progress', `${statuses.reviewed} / ${ctx.children.length} reviewed`],
    ['Ready to draft', `${statuses['ready-for-draft']} children`],
    ['Drafts awaiting review', String(statuses.drafted)],
    ['In progress', `${statuses['in-progress']} children`]];
  for (const [label, value] of values) {
    const card = el('section', undefined, 'card');
    card.append(el('h2', label), el('p', value, 'metric-value'));
    metrics.append(card);
  }
  const completion = el('section', undefined, 'summary');
  completion.append(el('h2', 'Class completion'), progressBar(statuses.reviewed,
    Math.max(1, ctx.children.length), `${statuses.reviewed} / ${ctx.children.length} reviewed`));
  const counts = el('div', undefined, 'chips');
  for (const [status, count] of Object.entries(statuses)) {
    const chip = statusChip(status);
    chip.textContent = `${STATUS_LABELS[status]}: ${count}`;
    counts.append(chip);
  }
  completion.append(counts);
  root.append(metrics, completion, workQueue(model, ctx.semester), draftPanel(statuses),
    actions(ctx, model));
  return root;
}

function workQueue(model, semester) {
  const section = el('section');
  section.append(el('h2', 'Children needing work'));
  for (const row of model.needingWork) {
    const card = el('article', undefined, 'card work-row');
    const action = editorLink('Open portfolio', {
      childId: row.child.id, semester, domain: row.domain
    });
    action.setAttribute('aria-label', `Open portfolio for ${row.child.name}`);
    const ratings = el('ul', undefined, 'indicators');
    for (const domain of row.domains) {
      const item = el('li');
      item.append(el('span', `${domain.label}: `), ratingChip(domain.rating));
      ratings.append(item);
    }
    card.append(el('h3', row.child.name), statusChip(row.status),
      ratings, el('p', row.task), action);
    section.append(card);
  }
  if (!model.needingWork.length) section.append(emptyState('All portfolios are reviewed.'));
  return section;
}

function draftPanel(statuses) {
  const panel = el('section', undefined, 'card');
  panel.append(el('h2', 'Drafts awaiting review'), el('p', statuses.drafted
    ? `${statuses.drafted} drafts are waiting for review.` : 'No drafts are waiting for review.'),
  el('p', `${statuses['ready-for-draft']} children are ready to draft.`),
  link('Open AI drafts', '#/drafts'), link('View ready children', '#/classes'));
  return panel;
}

function actions(ctx, model) {
  const group = el('div', undefined, 'toolbar');
  const next = button('Continue with next unfinished child', () => ctx.go(model.next), true);
  next.disabled = !model.next || ctx.busy;
  const draft = button(`Draft narratives for all ready children (${model.ready.length})`,
    () => ctx.runDraft(() => draftReadyChildren(ctx, model.ready)));
  draft.disabled = ctx.busy || !model.ready.length
    || (ctx.provider.id !== 'mock' && ctx.isOffline());
  group.append(next, draft, link('Print class report',
    buildRoute('reports', { semester: ctx.semester })));
  return group;
}
