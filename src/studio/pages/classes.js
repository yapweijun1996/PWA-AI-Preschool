import {
  DOMAINS, computeStatus, nextChildNeedingWork, progressComparison
} from '../../portfolio-model.js';
import {
  filterChildren, domainDot, classSummary, FILTER_LABELS, portfolioFilters,
  compactPortfolio, listComparison
} from '../../class-view.js';
import { el, button, link, statusChip, ratingChip, progressBar, emptyState,
  rejectedState, icon, avatar } from '../ui.js';
import { buildRoute } from '../router.js';
import { providerCard } from '../provider-card.js';
import { draftReadyChildren } from '../bulk-draft.js';
import { resetSampleButton, domainKey, updateFilterChips } from '../page-controls.js';

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
  const portrait = avatar(child);
  const identity = el('div', undefined, 'class-child-identity');
  identity.append(el('h2', child.name, 'identity-text'), statusChip(computeStatus(record)));
  header.append(portrait, identity);
  const chevron = icon('chevron');
  chevron.setAttribute('class', 'icon list-chevron');
  header.append(chevron);
  const open = link('Open portfolio', buildRoute('child-editor', {
    childId: child.id, semester: ctx.semester
  }));
  open.setAttribute('aria-label', `Open portfolio for ${child.name}`);
  open.className += ' class-child-open';
  card.append(header, open);
  const comparisons = progressComparison(ctx.get(child.id, '2026-S1'), record);
  const compact = compactPortfolio(record);
  if (compact) {
    card.className += ' untouched-portfolio';
    card.append(el('p', 'No domains rated yet', 'compact-empty'));
  }
  const noComparison = comparisons.every(item => item.change === null);
  if (ctx.semester === '2026-S2' && noComparison) {
    card.append(el('p', 'No comparison', 'compact-no-comparison'));
  }
  const list = el('ul', undefined, 'indicators class-domain-list');
  for (const domain of DOMAINS) {
    const row = domainRow(ctx, child, record, domain, comparisons, noComparison);
    list.append(row);
  }
  card.append(list);
  return card;
}

function domainRow(ctx, child, record, domain, comparisons, noComparison) {
  const dot = domainDot(record.domains[domain.id]);
  const row = el('li', undefined, 'class-domain-row');
  const label = el('span', domain.label, 'class-domain-label');
  const short = el('span', ['EN', 'ZH', 'MA', 'SE'][DOMAINS.indexOf(domain)],
    'compact-domain-label');
  short.setAttribute('aria-hidden', 'true');
  const rating = ratingChip(record.domains[domain.id].rating);
  rating.title = dot.state;
  row.append(short, label, rating, el('span', dot.state, 'class-domain-readiness'));
  if (ctx.semester === '2026-S2') {
    const change = comparisons.find(c => c.domain === domain.id).change;
    const comparison = el('span', change === null ? 'No comparison'
      : `Change: ${change > 0 ? '+' : ''}${change}`, 'class-domain-change');
    if (change > 0) comparison.className += ' positive';
    const arrow = el('span', listComparison(change), 'compact-domain-change');
    arrow.setAttribute('aria-hidden', 'true');
    if (noComparison) arrow.className += ' redundant-comparison';
    row.append(arrow, comparison);
  }
  const rejection = ctx.rejections.get(`${child.id}:${ctx.semester}:${domain.id}`);
  if (rejection) row.append(rejectedState(`${domain.label}: ${rejection}`));
  return row;
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
    // Counts live on the filters rather than in a second status-chip block.
    actions.refresh();
    listing.refresh();
  };
  const unsubscribe = ctx.subscribe(refresh);
  root.dispose = () => {
    unsubscribe();
    provider.dispose();
    disposeLayout();
  };
  const controls = el('div', undefined, 'classes-controls');
  controls.append(listing.filters, summary, actions.root);
  root.append(provider, listing.tools, actions.continueAction, controls,
    listing.grid, listing.count, el('p',
      'Fictional demonstration only. Not an approved school system. '
      + 'Printed portfolios contain teacher-reviewable drafts, not assessments.',
      'classes-disclaimer'));
  const disposeLayout = bindListLayout(root, provider, listing.tools, summary, controls, actions, ctx);
  refresh();
  return root;
}

function bindListLayout(root, provider, tools, summary, controls, actions, ctx) {
  const media = globalThis.matchMedia?.('(min-width: 1024px)');
  if (!media) return () => {};
  const print = actions.root.querySelector('a');
  const update = () => {
    provider.querySelector('details').open = ctx.provider.id !== 'mock';
    actions.root.open = media.matches;
    if (media.matches) {
      root.insertBefore(summary, controls);
      actions.root.append(actions.continueAction);
      tools.append(print);
    } else {
      controls.insertBefore(summary, actions.root);
      root.insertBefore(actions.continueAction, controls);
      actions.root.append(print);
    }
  };
  update();
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
}

function childListing(ctx, initialFilter = 'all') {
  const tools = el('div', undefined, 'toolbar classes-tools');
  const label = el('label');
  label.append(el('span', 'Search children', 'field-label'));
  const search = el('input');
  search.type = 'search';
  search.placeholder = 'Search children';
  label.append(search);
  tools.append(label);
  const filters = el('div', undefined, 'chips classes-filters');
  filters.setAttribute('aria-label', 'Filter portfolios');
  const grid = el('div', undefined, 'grid classes-grid');
  const count = el('p', undefined, 'classes-count');
  count.setAttribute('role', 'status');
  let filter = initialFilter;
  const refresh = () => {
    const model = classesModel(ctx, { query: search.value, filter });
    updateFilterChips(filters, portfolioFilters(ctx.children, ctx.records,
      ctx.semester, search.value), filter);
    grid.replaceChildren(...model.children.map(child => childCard(ctx, child)));
    count.textContent = `Showing ${model.children.length} of ${ctx.children.length} children`;
    if (!model.children.length) grid.append(emptyState('No children match this search.',
      button('Clear search', () => {
        search.value = '';
        filter = 'all';
        refresh();
        search.focus();
      })));
  };
  for (const [value, text] of Object.entries(FILTER_LABELS)) {
    const control = button(text, () => {
      filter = value;
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
  const root = el('details', undefined, 'classes-actions');
  root.append(el('summary', 'Class actions'));
  root.append(domainKey());
  const continueAction = button('Continue with next unfinished child', () => {
    const id = nextChildNeedingWork(ctx.children, ctx.records, ctx.semester);
    if (id) ctx.go(id);
    else ctx.announce('Class complete');
  }, true);
  continueAction.className += ' classes-continue';
  const batch = button('', async () => {
    await ctx.runDraft(() => draftReadyChildren(ctx, classesModel(ctx).ready));
    refreshCards();
  });
  root.append(batch, link('Print class report', buildRoute('print-class', {
    semester: ctx.semester
  })), resetSampleButton(ctx, refreshCards));
  const refresh = () => {
    const ready = classesModel(ctx).ready;
    continueAction.disabled = ctx.busy;
    batch.textContent = `Draft narratives for all ready children (${ready.length})`;
    batch.disabled = ctx.busy || !ready.length
      || (ctx.provider.id !== 'mock' && ctx.isOffline());
    for (const node of root.querySelectorAll('button')) {
      if (node !== batch) node.disabled = ctx.busy;
    }
  };
  return { root, continueAction, refresh };
}
