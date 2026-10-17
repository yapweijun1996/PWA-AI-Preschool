import {
  DOMAINS, computeStatus, adjacentChildId, nextChildNeedingWork
} from '../../portfolio-model.js';
import { el, button, link, statusChip, progressBar, errorState } from '../ui.js';
import { buildRoute } from '../router.js';
import { editorModel } from '../editor-model.js';
import { domainPanel } from '../domain-panel.js';
import { narrativeControls } from '../narrative-controls.js';

export function render(ctx, route) {
  const child = ctx.children.find(child => child.id === route.childId);
  if (!child) {
    const missing = el('section');
    missing.append(el('h1', 'Child not found'),
      errorState('Choose a fictional child from the class.'), link('Back to class', '#/classes'));
    return missing;
  }
  const record = ctx.current(child.id);
  const root = el('section');
  const header = childHeader(ctx, child, record);
  const tabs = editorTabs(ctx, child, record, route.domain);
  const draft = button('Draft all four', async () => {
    await ctx.runDraft(() => ctx.draft(child, record, DOMAINS.map(domain => domain.id)));
    tabs.refresh();
  });
  const unsubscribe = ctx.subscribe(() => {
    draft.disabled = ctx.busy || (ctx.provider.id !== 'mock' && ctx.isOffline());
  });
  draft.disabled = ctx.provider.id !== 'mock' && ctx.isOffline();
  header.root.append(draft, tabs.tabs);
  root.append(header.root, el('p',
    'Keyboard: Alt+ArrowRight / Alt+ArrowLeft moves to the next / previous child.'), tabs.panel);
  root.dispose = () => {
    header.dispose();
    tabs.dispose();
    unsubscribe();
  };
  return root;
}

function childHeader(ctx, child, record) {
  const root = el('header', undefined, 'child-header');
  const status = statusChip(computeStatus(record));
  const save = el('span');
  save.setAttribute('role', 'status');
  const progress = el('div');
  const nav = el('div', undefined, 'toolbar');
  const move = direction => ctx.go(adjacentChildId(ctx.children, child.id, direction));
  nav.append(button('Previous child', () => move('previous')),
    el('span', `${ctx.children.indexOf(child) + 1} / ${ctx.children.length}`),
    button('Next child', () => move('next')),
    link('Print / PDF', buildRoute('print', { childId: child.id, semester: ctx.semester })),
    link('Back to class', '#/classes'));
  const refresh = () => {
    const model = editorModel(record, ctx.get(child.id, '2026-S1'));
    progress.replaceChildren(progressBar(model.ready, 4, `${model.ready} / 4 domains ready`));
    status.textContent = statusChip(computeStatus(record)).textContent;
    status.dataset.status = computeStatus(record);
    save.textContent = ctx.saveStatus;
    for (const node of nav.querySelectorAll('button')) node.disabled = ctx.busy;
  };
  const shortcut = event => {
    if (!ctx.busy && event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 'next' : 'previous');
    }
  };
  document.addEventListener('keydown', shortcut);
  const unsubscribe = ctx.subscribe(refresh);
  root.append(el('h1', child.name), el('p', `${child.id} · Class A (Sample)`),
    nav, status, save, progress);
  refresh();
  return { root, dispose() {
    unsubscribe();
    document.removeEventListener('keydown', shortcut);
  } };
}

function editorTabs(ctx, child, record, initialDomain) {
  const tabs = el('div', undefined, 'domain-tabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Portfolio domains and narrative review');
  const panel = el('div');
  panel.id = 'editor-panel';
  panel.setAttribute('role', 'tabpanel');
  let selected = DOMAINS.some(domain => domain.id === initialDomain)
    ? initialDomain : DOMAINS[0].id;
  let content = null;
  let disposed = false;
  const show = (focus = false) => {
    if (disposed) return;
    content?.dispose?.();
    const model = editorModel(record, ctx.get(child.id, '2026-S1'), selected);
    tabs.replaceChildren();
    for (const tab of model.tabs) {
      const select = id => {
        selected = id;
        show(true);
      };
      const control = button(tab.label, () => select(tab.id));
      control.id = `tab-${tab.id}`;
      control.setAttribute('role', 'tab');
      control.setAttribute('aria-selected', String(tab.selected));
      control.setAttribute('aria-controls', panel.id);
      control.tabIndex = tab.selected ? 0 : -1;
      control.addEventListener('keydown', event => tabKey(event, tab.id, model.tabs, select));
      tabs.append(control);
    }
    content = selected === 'review' ? reviewPanel(ctx, child, record)
      : domainPanel(ctx, child, record, DOMAINS.find(domain => domain.id === selected));
    panel.replaceChildren(content);
    panel.setAttribute('aria-labelledby', `tab-${selected}`);
    if (focus) tabs.querySelector('[aria-selected="true"]').focus();
  };
  show();
  return { tabs, panel, refresh: show, dispose() {
    disposed = true;
    content?.dispose?.();
  } };
}

function tabKey(event, id, tabs, select) {
  const index = tabs.findIndex(tab => tab.id === id);
  let target;
  if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
  if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
  if (event.key === 'Home') target = 0;
  if (event.key === 'End') target = tabs.length - 1;
  if (target !== undefined) {
    event.preventDefault();
    select(tabs[target].id);
  }
}

function reviewPanel(ctx, child, record) {
  const root = el('section', undefined, 'domain');
  root.append(el('h2', 'Review narratives'));
  const list = el('div');
  const addNarratives = () => {
    list.replaceChildren();
    return DOMAINS.map(domain => {
      const panel = narrativeControls(ctx, child, record, domain.id);
      list.append(el('h3', domain.label), panel);
      return panel;
    });
  };
  const narratives = addNarratives();
  const review = button('Mark reviewed and go to next child', () => {
    ctx.markReviewed(record);
    ctx.go(nextChildNeedingWork(ctx.children, ctx.records, ctx.semester, child.id));
  }, true);
  const update = () => {
    review.disabled = ctx.busy || !editorModel(record, ctx.get(child.id, '2026-S1')).canReview;
  };
  const unsubscribe = ctx.subscribe(update);
  root.dispose = () => {
    unsubscribe();
    for (const panel of narratives) panel.dispose();
  };
  root.append(list, review);
  update();
  return root;
}
