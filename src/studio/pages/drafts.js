import { PROVIDER_LABELS } from '../../class-view.js';
import { draftsModel } from '../models/drafts-model.js';
import { draftReadyChildren } from '../bulk-draft.js';
import { el, button, link, chip, progressBar, emptyState, rejectedState } from '../ui.js';

export function render(ctx) {
  const root = el('section');
  const provider = el('section', undefined, 'provider-panel');
  const status = el('p');
  provider.append(el('h2', 'Narrative provider'), status,
    link('Provider settings', '#/settings/ai'));
  const batch = el('section', undefined, 'card');
  const progress = el('div');
  const run = button('', () =>
    ctx.runDraft(() => draftReadyChildren(ctx, draftsModel(ctx).ready)), true);
  batch.append(el('h2', 'Draft ready children'), run, progress);
  const queue = el('section', undefined, 'card draft-queue');
  const rejected = el('section', undefined, 'card draft-queue');
  const refresh = () => {
    const model = draftsModel(ctx);
    status.textContent = `${PROVIDER_LABELS[ctx.provider.id]} · ${ctx.provider.status}`;
    run.textContent = `Draft all ready children (${model.ready.length})`;
    run.disabled = ctx.busy || !model.ready.length
      || (ctx.provider.id !== 'mock' && ctx.isOffline());
    const state = ctx.batch?.semester === ctx.semester ? ctx.batch
      : { completed: 0, total: model.ready.length };
    progress.replaceChildren(progressBar(state.completed, Math.max(1, state.total),
      `${state.completed} of ${state.total} children`));
    reviewQueue(queue, model.queue);
    rejectionQueue(rejected, model.rejected, ctx);
  };
  root.append(el('h1', 'AI drafts'),
    el('p', 'Draft, review, and retry narratives for the class.'), provider, batch, queue, rejected,
    el('p', 'Rejected drafts are session memory only; reloading clears these reasons.'),
    el('p', 'Review each narrative against teacher evidence. Local review is not authenticated '
      + 'approval or report release.', 'notice'));
  root.dispose = ctx.subscribe(refresh);
  refresh();
  return root;
}

function reviewQueue(root, queue) {
  root.replaceChildren(el('h2', `Drafts awaiting review · ${queue.length}`));
  for (const item of queue) {
    const row = el('article', undefined, 'work-row');
    row.append(el('h3', item.child.name));
    for (const narrative of item.narratives) {
      row.append(el('p', narrative.domain), chip(narrative.source));
    }
    row.append(link('Review draft', item.href));
    root.append(row);
  }
  if (!queue.length) root.append(emptyState('No drafts awaiting review.',
    link('Open ready class portfolios', '#/classes?filter=ready-for-draft')));
}

function rejectionQueue(root, rejected, ctx) {
  root.replaceChildren(el('h2', `Rejected drafts · ${rejected.length}`));
  for (const item of rejected) {
    const retry = button('Retry', () => ctx.runDraft(() =>
      ctx.draft(item.child, ctx.current(item.child.id), [item.domain.id])));
    retry.disabled = ctx.busy || (ctx.provider.id !== 'mock' && ctx.isOffline());
    const row = rejectedState(item.reason, retry);
    row.append(link('Write it yourself', item.href));
    row.prepend(el('h3', `${item.child.name} · ${item.domain.label}`));
    root.append(row);
  }
  if (!rejected.length) root.append(emptyState('No rejected drafts in this session.'));
}
