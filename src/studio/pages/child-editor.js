import {
  DOMAINS, computeStatus, adjacentChildId, nextChildNeedingWork
} from '../../portfolio-model.js';
import { el, button, link, statusChip, progressBar, errorState, icon } from '../ui.js';
import { buildRoute } from '../router.js';
import { editorModel } from '../editor-model.js';
import { domainPanel } from '../domain-panel.js';
import { narrativeControls } from '../narrative-controls.js';
import { PROVIDER_LABELS } from '../../class-view.js';

export function render(ctx, route) {
  const child = ctx.children.find(child => child.id === route.childId);
  if (!child) {
    const missing = el('section');
    missing.append(el('h1', 'Child not found'),
      errorState('Choose a fictional child from the class.'), link('Back to class', '#/classes'));
    return missing;
  }
  const record = ctx.current(child.id);
  const root = el('section', undefined, 'child-editor');
  const header = childHeader(ctx, child, record);
  const provider = compactProvider(ctx);
  const tabs = editorTabs(ctx, child, record, route.domain);
  const draft = button('Draft all four', async () => {
    await ctx.runDraft(() => ctx.draft(child, record, DOMAINS.map(domain => domain.id)));
    tabs.refresh();
  });
  draft.className = 'editor-batch-draft';
  provider.root.append(draft);
  const refresh = () => {
    draft.disabled = ctx.busy || (ctx.provider.id !== 'mock' && ctx.isOffline());
  };
  const unsubscribe = ctx.subscribe(refresh);
  const navigation = el('div', undefined, 'editor-navigation');
  navigation.append(header.root, header.progress, tabs.tabs);
  root.append(provider.root, navigation, tabs.panel);
  refresh();
  root.dispose = () => {
    header.dispose();
    tabs.dispose();
    unsubscribe();
    provider.dispose();
  };
  return root;
}

function childHeader(ctx, child, record) {
  const root = el('header', undefined, 'child-header');
  const status = statusChip(computeStatus(record));
  const save = el('div', undefined, 'editor-save');
  save.setAttribute('role', 'status');
  const progress = el('section', undefined, 'editor-progress');
  progress.setAttribute('aria-label', 'Portfolio completion');
  const identity = el('div', undefined, 'editor-identity');
  const avatar = el('span', child.name.trim().split(/\s+/).map(part => [...part][0])
    .join('').slice(0, 2), 'avatar editor-avatar');
  avatar.setAttribute('aria-hidden', 'true');
  const name = el('div');
  name.append(el('h1', child.name), el('p', `${child.id} · Class A (Sample)`));
  identity.append(avatar, name);
  const nav = el('nav', undefined, 'editor-child-nav');
  nav.setAttribute('aria-label', 'Move between children');
  nav.title = 'Alt+ArrowLeft: previous child. Alt+ArrowRight: next child.';
  const move = direction => ctx.go(adjacentChildId(ctx.children, child.id, direction));
  nav.append(button('Previous child', () => move('previous')),
    el('strong', `${ctx.children.indexOf(child) + 1} / ${ctx.children.length}`),
    button('Next child', () => move('next')));
  const feedback = el('div', undefined, 'editor-feedback');
  feedback.append(status, save);
  const print = link('Print / PDF',
    buildRoute('print', { childId: child.id, semester: ctx.semester }));
  print.className = 'editor-print';
  const refresh = () => {
    const model = editorModel(record, ctx.get(child.id, '2026-S1'));
    progress.replaceChildren(progressBar(model.ready, 4, `${model.ready} / 4 domains ready`));
    status.textContent = statusChip(computeStatus(record)).textContent;
    status.dataset.status = computeStatus(record);
    const failed = ctx.saveStatus.startsWith('Not saved');
    save.dataset.state = failed ? 'unsaved' : ctx.saveStatus === 'Saving…' ? 'loading' : 'saved';
    save.replaceChildren(icon(failed ? 'warning' : 'check'), el('span', failed
      ? 'Not saved: storage unavailable. Your edits remain on this screen.' : ctx.saveStatus));
    if (failed) save.append(button('Retry save', ctx.retrySave));
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
  root.append(identity, nav, feedback, print);
  refresh();
  return { root, progress, dispose() {
    unsubscribe();
    document.removeEventListener('keydown', shortcut);
  } };
}

function compactProvider(ctx) {
  const root = el('div', undefined, 'editor-provider-line');
  const label = el('label', 'Narrative provider');
  const select = el('select');
  for (const [id, text] of Object.entries(PROVIDER_LABELS)) {
    const option = el('option', text);
    option.value = id;
    select.append(option);
  }
  label.append(select);
  select.addEventListener('change', () => {
    ctx.provider.id = select.value;
    ctx.provider.key = '';
    ctx.provider.status = 'not tested';
    ctx.notify();
  });
  const status = el('span', undefined, 'editor-provider-status');
  status.setAttribute('role', 'status');
  const disclosure = el('span', 'Photos are never sent.', 'editor-provider-disclosure');
  disclosure.title = "Only the child's first name, ratings and comments "
    + 'are sent to the selected provider.';
  root.append(label, status, disclosure, link('Provider settings', '#/settings/ai'),
    link('Back to class', '#/classes'));
  const refresh = () => {
    select.value = ctx.provider.id;
    select.disabled = ctx.busy;
    status.textContent = ctx.provider.status;
  };
  const unsubscribe = ctx.subscribe(refresh);
  refresh();
  return { root, dispose: unsubscribe };
}

function editorTabs(ctx, child, record, initialDomain) {
  const tabs = el('div', undefined, 'domain-tabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Portfolio domains and narrative review');
  const panel = el('div', undefined, 'editor-panel');
  panel.id = 'editor-panel';
  panel.setAttribute('role', 'tabpanel');
  let selected = [...DOMAINS.map(domain => domain.id), 'review'].includes(initialDomain)
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
  const root = el('section', undefined, 'domain editor-review');
  root.append(el('h2', 'Review narratives'));
  root.append(el('p', 'Local review is not authenticated approval or report release.', 'notice'));
  const list = el('div', undefined, 'editor-review-grid');
  const addNarratives = () => {
    list.replaceChildren();
    return DOMAINS.map(domain => {
      const panel = narrativeControls(ctx, child, record, domain.id);
      const item = el('article', undefined, 'editor-review-item');
      item.append(el('h3', domain.label), panel);
      list.append(item);
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
