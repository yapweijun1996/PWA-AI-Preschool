import {
  DOMAINS, computeStatus, nextChildNeedingWork, progressComparison
} from '../../portfolio-model.js';
import { filterChildren, domainDot, classSummary, FILTER_LABELS } from '../../class-view.js';
import { el, button, link, statusChip, ratingChip, progressBar, emptyState,
  rejectedState } from '../ui.js';
import { buildRoute } from '../router.js';
import { providerCard } from '../provider-card.js';
import { draftReadyChildren } from '../bulk-draft.js';

export function classesModel(ctx, options = {}) {
  return {
    summary: classSummary(ctx.children, ctx.records, ctx.semester),
    children: filterChildren(ctx.children, ctx.records, ctx.semester, options),
    ready: ctx.children.filter(child => computeStatus(ctx.get(child.id)) === 'ready-for-draft')
  };
}

function childCard(ctx, child) {
  const record = ctx.get(child.id);
  const card = el('article', undefined, 'card class-child-card');
  const header = el('div', undefined, 'class-child-heading');
  const avatar = el('span', child.initials, 'avatar');
  avatar.setAttribute('aria-hidden', 'true');
  const identity = el('div', undefined, 'class-child-identity');
  identity.append(el('h2', child.name), statusChip(computeStatus(record)));
  header.append(avatar, identity);
  const open = link('Open portfolio', buildRoute('child-editor', {
    childId: child.id, semester: ctx.semester
  }));
  open.setAttribute('aria-label', `Open portfolio for ${child.name}`);
  open.className += ' class-child-open';
  card.append(header, open);
  const comparisons = progressComparison(ctx.get(child.id, '2026-S1'), record);
  const list = el('ul', undefined, 'indicators class-domain-list');
  for (const domain of DOMAINS) {
    const dot = domainDot(record.domains[domain.id]);
    const row = el('li', undefined, 'class-domain-row');
    const label = el('span', domain.label, 'class-domain-label');
    const rating = ratingChip(record.domains[domain.id].rating);
    rating.title = dot.state;
    row.append(label, rating, el('span', dot.state, 'class-domain-readiness'));
    if (ctx.semester === '2026-S2') {
      const change = comparisons.find(c => c.domain === domain.id).change;
      const comparison = el('span', change === null ? 'No comparison'
        : `Change: ${change > 0 ? '+' : ''}${change}`, 'class-domain-change');
      if (change > 0) comparison.className += ' positive';
      row.append(comparison);
    }
    const rejection = ctx.rejections.get(`${child.id}:${ctx.semester}:${domain.id}`);
    if (rejection) row.append(rejectedState(`${domain.label}: ${rejection}`));
    list.append(row);
  }
  card.append(list);
  return card;
}

export function render(ctx, route = {}) {
  const root = el('section', undefined, 'classes-page');
  root.append(el('h1', 'Class portfolios'),
    el('p', `Review learning progress across ${ctx.children.length} fictional children.`,
      'page-intro'));
  const provider = providerCard(ctx);
  provider.className += ' classes-provider';
  const listing = childListing(ctx, route.filter);
  const summary = el('section', undefined, 'summary classes-summary');
  const actions = classActions(ctx, listing.refresh);
  const refresh = () => {
    const model = classesModel(ctx);
    summary.replaceChildren(progressBar(model.summary.statuses.reviewed, ctx.children.length,
      `${model.summary.statuses.reviewed} / ${ctx.children.length} reviewed`));
    const counts = el('div', undefined, 'classes-status-counts');
    for (const [status, value] of Object.entries(model.summary.statuses)) {
      const node = statusChip(status);
      node.append(`: ${value}`);
      counts.append(node);
    }
    summary.append(counts);
    actions.refresh();
    listing.refresh();
  };
  const unsubscribe = ctx.subscribe(refresh);
  root.dispose = () => {
    unsubscribe();
    provider.dispose();
  };
  const controls = el('div', undefined, 'classes-controls');
  controls.append(listing.filters, actions.root);
  root.append(provider, listing.tools, summary, controls,
    listing.grid, listing.count, el('p',
      'Fictional demonstration only. Not an approved school system. '
      + 'Printed portfolios contain teacher-reviewable drafts, not assessments.',
      'classes-disclaimer'));
  refresh();
  return root;
}

function childListing(ctx, initialFilter = 'all') {
  const tools = el('div', undefined, 'toolbar classes-tools');
  const label = el('label', 'Search children');
  const search = el('input');
  search.type = 'search';
  search.placeholder = 'Search children';
  label.append(search);
  tools.append(label, link('Print class report', buildRoute('print-class', {
    semester: ctx.semester
  })));
  const filters = el('div', undefined, 'chips classes-filters');
  filters.setAttribute('aria-label', 'Filter portfolios');
  const grid = el('div', undefined, 'grid classes-grid');
  const count = el('p', undefined, 'classes-count');
  count.setAttribute('role', 'status');
  let filter = initialFilter;
  const refresh = () => {
    const model = classesModel(ctx, { query: search.value, filter });
    grid.replaceChildren(...model.children.map(child => childCard(ctx, child)));
    count.textContent = `Showing ${model.children.length} of ${ctx.children.length} children`;
    if (!model.children.length) grid.append(emptyState('No children match this search.',
      button('Clear search', () => {
        search.value = '';
        filter = 'all';
        for (const node of filters.children) {
          node.setAttribute('aria-pressed', String(node.textContent === FILTER_LABELS.all));
        }
        refresh();
        search.focus();
      })));
  };
  for (const [value, text] of Object.entries(FILTER_LABELS)) {
    const control = button(text, () => {
      filter = value;
      for (const node of filters.children) {
        node.setAttribute('aria-pressed', String(node === control));
      }
      refresh();
    });
    control.dataset.filter = value;
    control.setAttribute('aria-pressed', String(value === filter));
    filters.append(control);
  }
  search.addEventListener('input', refresh);
  refresh();
  return { tools, filters, grid, count, refresh };
}

function classActions(ctx, refreshCards) {
  const root = el('div', undefined, 'toolbar classes-actions');
  root.append(button('Continue with next unfinished child', () => {
    const id = nextChildNeedingWork(ctx.children, ctx.records, ctx.semester);
    if (id) ctx.go(id);
    else ctx.announce('Class complete');
  }, true));
  const batch = button('', async () => {
    await ctx.runDraft(() => draftReadyChildren(ctx, classesModel(ctx).ready));
    refreshCards();
  });
  root.append(batch, button('Reset sample data', () => {
    if (ctx.confirm('Replace all browser portfolios with fictional sample data?')) {
      ctx.reset();
      refreshCards();
    }
  }));
  const refresh = () => {
    const ready = classesModel(ctx).ready;
    batch.textContent = `Draft narratives for all ready children (${ready.length})`;
    batch.disabled = ctx.busy || !ready.length
      || (ctx.provider.id !== 'mock' && ctx.isOffline());
    for (const node of root.querySelectorAll('button')) {
      if (node !== batch) node.disabled = ctx.busy;
    }
  };
  return { root, refresh };
}
