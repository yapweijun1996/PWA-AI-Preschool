import {
  DOMAINS, computeStatus, nextChildNeedingWork, progressComparison
} from '../../portfolio-model.js';
import { filterChildren, domainDot, classSummary, FILTER_LABELS } from '../../class-view.js';
import { el, button, link, statusChip, ratingChip, progressBar } from '../ui.js';
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
  const card = el('article', undefined, 'card');
  card.append(el('span', child.initials, 'avatar'), el('h2', child.name),
    statusChip(computeStatus(record)));
  const comparisons = progressComparison(ctx.get(child.id, '2026-S1'), record);
  const list = el('ul', undefined, 'indicators');
  for (const domain of DOMAINS) {
    const dot = domainDot(record.domains[domain.id]);
    const row = el('li', `${domain.label}: ${dot.state} `);
    row.append(ratingChip(record.domains[domain.id].rating));
    if (ctx.semester === '2026-S2') {
      const change = comparisons.find(c => c.domain === domain.id).change;
      row.append(el('span', change === null ? 'No comparison'
        : `Change: ${change > 0 ? '+' : ''}${change}`));
    }
    const rejection = ctx.rejections.get(`${child.id}:${ctx.semester}:${domain.id}`);
    if (rejection) row.append(el('p', `${domain.label}: ${rejection}`, 'provider-warning'));
    list.append(row);
  }
  card.append(list, link('Open portfolio', buildRoute('child-editor', {
    childId: child.id, semester: ctx.semester
  })));
  return card;
}

export function render(ctx) {
  const root = el('section');
  root.append(el('h1', 'Class portfolios'),
    el('p', 'Review learning progress across 20 fictional children.'));
  const provider = providerCard(ctx);
  const listing = childListing(ctx);
  const summary = el('section', undefined, 'summary');
  const actions = classActions(ctx, listing.refresh);
  const refresh = () => {
    const model = classesModel(ctx);
    summary.replaceChildren(progressBar(model.summary.statuses.reviewed, ctx.children.length,
      `${model.summary.statuses.reviewed} / ${ctx.children.length} reviewed`));
    for (const [status, value] of Object.entries(model.summary.statuses)) {
      const node = statusChip(status);
      node.append(`: ${value}`);
      summary.append(node);
    }
    actions.refresh();
  };
  const unsubscribe = ctx.subscribe(refresh);
  root.dispose = () => {
    unsubscribe();
    provider.dispose();
  };
  root.append(provider, listing.tools, summary, listing.filters, actions.root,
    listing.count, listing.grid, el('p',
      'Fictional demonstration only. Not an approved school system. '
      + 'Printed portfolios contain teacher-reviewable drafts, not assessments.'));
  refresh();
  return root;
}

function childListing(ctx) {
  const tools = el('div', undefined, 'toolbar');
  const label = el('label', 'Search children');
  const search = el('input');
  search.type = 'search';
  label.append(search);
  tools.append(label, link('Print class report', buildRoute('print-class', {
    semester: ctx.semester
  })));
  const filters = el('div', undefined, 'chips');
  const grid = el('div', undefined, 'grid');
  const count = el('p');
  count.setAttribute('role', 'status');
  let filter = 'all';
  const refresh = () => {
    const model = classesModel(ctx, { query: search.value, filter });
    grid.replaceChildren(...model.children.map(child => childCard(ctx, child)));
    count.textContent = `Showing ${model.children.length} of ${ctx.children.length} children`;
    if (!model.children.length) grid.append(el('p', 'No children match this search.'),
      button('Clear search', () => {
        search.value = '';
        refresh();
        search.focus();
      }));
  };
  for (const [value, text] of Object.entries(FILTER_LABELS)) {
    const control = button(text, () => {
      filter = value;
      for (const node of filters.children) {
        node.setAttribute('aria-pressed', String(node === control));
      }
      refresh();
    });
    control.setAttribute('aria-pressed', String(value === filter));
    filters.append(control);
  }
  search.addEventListener('input', refresh);
  refresh();
  return { tools, filters, grid, count, refresh };
}

function classActions(ctx, refreshCards) {
  const root = el('div', undefined, 'toolbar');
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
