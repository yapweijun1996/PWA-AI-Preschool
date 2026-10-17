import { PROVIDER_LABELS } from '../../class-view.js';
import { draftsModel } from '../models/drafts-model.js';
import { draftReadyChildren } from '../bulk-draft.js';
import { el, button, link, chip, progressBar, emptyState, rejectedState } from '../ui.js';

export function render(ctx) {
  const root = el('section', undefined, 'drafts-page');
  const heading = el('header', undefined, 'page-header');
  heading.append(el('h1', 'AI drafts'),
    el('p', 'Draft, review, and retry narratives for the class.'));
  const provider = el('section', undefined, 'provider-panel drafts-provider');
  const status = el('div', undefined, 'drafts-provider-status');
  provider.append(el('h2', 'Narrative provider'), status,
    link('Provider settings', '#/settings/ai'),
    el('p', "Sends only the child's first name, ratings and comments. Photos are never sent.",
      'provider-disclosure'));
  const batch = el('section', undefined, 'card draft-batch');
  const progress = el('div', undefined, 'draft-batch-progress');
  const run = button('', () =>
    ctx.runDraft(() => draftReadyChildren(ctx, draftsModel(ctx).ready)), true);
  batch.append(el('h2', 'Draft ready children'), run,
    el('p', 'Generate narratives using the selected provider. Every draft needs teacher review.'),
    progress);
  const queue = el('section', undefined, 'card draft-queue');
  const rejected = el('section', undefined, 'card draft-queue');
  const failures = el('section', undefined, 'card draft-queue request-failures');
  const refresh = () => {
    const model = draftsModel(ctx);
    status.replaceChildren(el('strong', PROVIDER_LABELS[ctx.provider.id]),
      chip(ctx.provider.status));
    run.textContent = `Draft all ready children (${model.ready.length})`;
    run.disabled = ctx.busy || !model.ready.length
      || (ctx.provider.id !== 'mock' && ctx.isOffline());
    const state = ctx.batch?.semester === ctx.semester ? ctx.batch
      : { completed: 0, total: model.ready.length };
    progress.replaceChildren(progressBar(state.completed, Math.max(1, state.total),
      `${state.completed} of ${state.total} children`));
    reviewQueue(queue, model.queue);
    rejectionQueue(rejected, model.rejected, ctx);
    failures.replaceChildren(el('h2', `Request failures · ${ctx.failures?.length ?? 0}`));
    for (const message of ctx.failures ?? []) {
      const row = el('article', undefined, 'work-row request-failure-row');
      row.append(el('p', message));
      failures.append(row);
    }
  };
  root.append(heading, provider, batch, queue, rejected, failures,
    el('p', 'Rejected drafts and request failures are session memory only; reloading clears '
      + 'this history.', 'hint'),
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
    const identity = el('div', undefined, 'draft-identity');
    const avatar = el('span', item.child.initials, 'avatar');
    avatar.setAttribute('aria-hidden', 'true');
    identity.append(avatar, el('h3', item.child.name));
    const sources = el('div', undefined, 'draft-sources');
    for (const narrative of item.narratives) {
      const source = chip(narrative.source);
      source.className += ' narrative-source';
      source.dataset.source = narrative.source.startsWith('MOCK') ? 'mock'
        : narrative.source.startsWith('AI') ? 'ai' : 'teacher';
      const entry = el('div', undefined, 'draft-source-entry');
      entry.append(el('span', narrative.domain), source);
      sources.append(entry);
    }
    const review = link('Review draft', item.href);
    review.className = 'button-link primary-link';
    review.setAttribute('aria-label', `Review draft for ${item.child.name}`);
    row.append(identity, sources, review);
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
    row.className += ' rejected-draft-row';
    row.append(link('Write it yourself', item.href));
    row.prepend(el('h3', `${item.child.name} · ${item.domain.label}`));
    root.append(row);
  }
}
