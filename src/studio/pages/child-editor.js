import {
  DOMAINS, computeStatus, adjacentChildId, nextChildNeedingWork
} from '../../portfolio-model.js';
import { el, button, link, statusChip, progressBar, errorState, icon, avatar } from '../ui.js';
import { buildRoute } from '../router.js';
import { editorModel } from '../editor-model.js';
import { domainPanel } from '../domain-panel.js';
import { narrativeControls } from '../narrative-controls.js';
import { PROVIDER_LABELS } from '../../class-view.js';
import { privacyDisclosure } from '../privacy-disclosure.js';
import { normalizeChildName } from '../../child-name.js';

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
  const provider = compactProvider(ctx, child, record);
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
  root.append(navigation, provider.root, tabs.panel);
  const disposeLayout = responsiveLayout(root, header, navigation, provider, tabs);
  refresh();
  root.dispose = () => {
    header.dispose();
    disposeLayout();
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
  const identity = childIdentity(ctx, child);
  const move = direction => ctx.go(adjacentChildId(ctx.children, child.id, direction));
  const nav = childNavigation(ctx, child, move);
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
    refreshSave(ctx, save);
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
  const extras = el('div', undefined, 'editor-extras');
  return { root, progress, status, print, feedback, extras, dispose() {
    unsubscribe();
    identity.dispose();
    document.removeEventListener('keydown', shortcut);
  } };
}

function responsiveLayout(root, header, navigation, provider, tabs) {
  const compact = matchMedia('(max-width: 1023px)');
  const arrange = () => {
    if (compact.matches) {
      header.extras.append(header.status, header.print, header.progress);
      root.append(header.extras, provider.root);
    } else if (header.extras.children.length) {
      header.feedback.prepend(header.status);
      header.root.append(header.print);
      navigation.insertBefore(header.progress, tabs.tabs);
      root.insertBefore(provider.root, tabs.panel);
      header.extras.remove();
    }
  };
  compact.addEventListener('change', arrange);
  arrange();
  return () => compact.removeEventListener('change', arrange);
}

function childIdentity(ctx, child) {
  const identity = el('div', undefined, 'editor-identity');
  const picture = el('div', undefined, 'editor-avatar-holder');
  const name = el('div', undefined, 'editor-name');
  const heading = el('h1', child.name);
  const disclosure = el('details', undefined, 'editor-name-disclosure');
  disclosure.open = false;
  disclosure.append(el('summary', 'Edit child name'));
  const form = el('form', undefined, 'editor-name-form');
  form.noValidate = true;
  const label = el('label', 'Child name');
  const input = el('input');
  input.type = 'text';
  input.id = `child-name-${child.id}`;
  input.value = child.name;
  input.required = true;
  input.autocomplete = 'off';
  input.setAttribute('aria-describedby', `${input.id}-hint ${input.id}-feedback`);
  label.htmlFor = input.id;
  label.append(input);
  const hint = el('p', 'Fictional names only. 1–60 characters; duplicate names are allowed.', 'hint');
  hint.id = `${input.id}-hint`;
  const feedback = el('p', '', 'editor-name-feedback');
  feedback.id = `${input.id}-feedback`;
  feedback.setAttribute('role', 'status');
  const save = button('Save name', () => {});
  save.type = 'submit';
  const clearError = () => {
    input.setCustomValidity('');
    input.setAttribute('aria-invalid', 'false');
    feedback.textContent = '';
  };
  input.addEventListener('input', clearError);
  input.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    input.value = child.name;
    clearError();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const value = normalizeChildName(input.value);
      const result = ctx.renameChild(child.id, value);
      input.value = result.name;
      input.setCustomValidity('');
      input.setAttribute('aria-invalid', 'false');
      feedback.textContent = result.duplicate
        ? 'Another child has this name. Name updated as a separate child; use the child ID to distinguish records.'
        : 'Child name updated. Existing narrative text is unchanged; review names before sharing.';
    } catch (error) {
      input.setCustomValidity(error.message);
      input.setAttribute('aria-invalid', 'true');
      feedback.textContent = error.message;
      input.reportValidity();
    }
  });
  let displayed = null;
  const refresh = () => {
    if (displayed !== child.name) {
      heading.textContent = child.name;
      picture.replaceChildren(avatar(child, 'avatar editor-avatar'));
      input.value = child.name;
      displayed = child.name;
    }
    input.disabled = ctx.busy;
    save.disabled = ctx.busy;
  };
  const unsubscribe = ctx.subscribe(refresh);
  identity.dispose = unsubscribe;
  form.append(label, save, hint, feedback);
  disclosure.append(form);
  name.append(heading, el('p', `${child.id} · Class A (Sample)`), disclosure);
  identity.append(picture, name);
  refresh();
  return identity;
}

function childNavigation(ctx, child, move) {
  const nav = el('nav', undefined, 'editor-child-nav');
  nav.setAttribute('aria-label', 'Move between children');
  nav.title = 'Alt+ArrowLeft: previous child. Alt+ArrowRight: next child.';
  const previous = button('Previous child', () => move('previous'));
  const next = button('Next child', () => move('next'));
  previous.setAttribute('aria-label', 'Previous child');
  next.setAttribute('aria-label', 'Next child');
  previous.append(el('span', '‹', 'editor-nav-short'));
  next.append(el('span', '›', 'editor-nav-short'));
  nav.append(previous, el('strong', `${ctx.children.indexOf(child) + 1} / ${ctx.children.length}`),
    next);
  return nav;
}

function refreshSave(ctx, save) {
  const failed = ctx.saveStatus.startsWith('Not saved');
  save.dataset.state = failed ? 'unsaved' : ctx.saveStatus === 'Saving…' ? 'loading' : 'saved';
  const message = failed
    ? 'Not saved: storage unavailable. Your edits remain on this screen.' : ctx.saveStatus;
  save.title = message;
  save.setAttribute('aria-label', message);
  save.replaceChildren(icon(failed ? 'warning' : 'check'),
    el('span', message, 'editor-save-full'),
    el('span', failed ? 'Unsaved' : ctx.saveStatus === 'Saving…' ? 'Saving' : 'Saved',
      'editor-save-short'));
  if (failed) save.append(button('Retry save', ctx.retrySave));
}

function compactProvider(ctx, child, record) {
  const root = el('div', undefined, 'editor-provider-line');
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Narrative drafting tools');
  const settings = link('', '#/settings/ai');
  settings.className = 'editor-provider-settings';
  const status = el('span', undefined, 'editor-provider-status');
  status.setAttribute('role', 'status');
  const disclosure = privacyDisclosure(ctx, { child, record });
  ctx.privacyPreviewChildId = child.id;
  root.append(settings, status, disclosure);
  const refresh = () => {
    settings.textContent = `Provider: ${PROVIDER_LABELS[ctx.provider.id]}`;
    status.textContent = ctx.provider.status;
  };
  const unsubscribe = ctx.subscribe(refresh);
  refresh();
  return { root, dispose() { unsubscribe(); disclosure.dispose(); } };
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
        history.replaceState(null, '', buildRoute('child-editor', {
          childId: child.id, semester: ctx.semester, domain: id
        }));
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
    globalThis.requestAnimationFrame?.(() => {
      if (!disposed) tabs.querySelector('[aria-selected="true"]')
        .scrollIntoView({ block: 'nearest', inline: 'start' });
    });
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
  const hint = el('p', undefined, 'hint editor-review-hint');
  const update = () => {
    const model = editorModel(record, ctx.get(child.id, '2026-S1'));
    review.disabled = ctx.busy || !model.canReview;
    hint.textContent = model.reviewHint;
    hint.hidden = model.canReview;
  };
  const unsubscribe = ctx.subscribe(update);
  root.dispose = () => {
    unsubscribe();
    for (const panel of narratives) panel.dispose();
  };
  root.append(list, hint, review);
  update();
  return root;
}
