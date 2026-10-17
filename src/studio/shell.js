import { NAV_ITEMS, buildRoute, parentModule } from './router.js';
import { PROVIDER_LABELS } from '../class-view.js';
import { el, button, link, chip, pwaStatusChip, icon,
  offlineState, errorState, loadingState } from './ui.js';

export function navigationModel(name) {
  const parent = parentModule(name);
  return NAV_ITEMS.map(item => ({ ...item, active: item.name === parent }));
}

export function mountShell(ctx) {
  const root = el('div', undefined, 'app-shell');
  const nav = navigation();
  const content = el('div', undefined, 'app-content');
  const top = topbar(ctx);
  const notice = el('aside', undefined, 'notice');
  notice.append(icon('warning'));
  for (const text of ['Fictional demo data', 'Stored only in this browser',
    'NOT IMPLEMENTED: real login / server / database']) {
    notice.append(el('span', text));
  }
  const feedback = el('div', undefined, 'session-feedback');
  const live = el('p', undefined, 'visually-hidden');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  const main = el('main');
  main.id = 'main';
  main.append(loadingState());
  content.append(top.root, notice, feedback, live, main, top.pwa, nav.more, nav.tabs);
  root.append(nav.sidebar, content);
  ctx.subscribe(() => {
    feedback.replaceChildren();
    if (ctx.isOffline()) feedback.append(offlineState());
    if (ctx.draftError) {
      const retry = button('Retry draft', () => ctx.retryDraft?.());
      retry.disabled = ctx.busy || (ctx.provider.id !== 'mock' && ctx.isOffline());
      feedback.append(errorState(ctx.draftError, retry));
    }
    live.textContent = ctx.message;
  });
  const update = route => {
    top.pwa.hidden = route.name !== 'about';
    nav.update(route);
    top.update(route);
    root.classList.toggle('print-mode', ['print', 'print-class'].includes(route.name));
    ctx.notify();
  };
  return { root, main, update };
}

function topbar(ctx) {
  const root = el('header', undefined, 'topbar');
  const breadcrumb = el('nav', undefined, 'breadcrumb');
  breadcrumb.setAttribute('aria-label', 'Breadcrumb');
  const label = el('label', 'Semester');
  const semester = el('select');
  for (const value of ['2026-S1', '2026-S2']) {
    const option = el('option', value);
    option.value = value;
    semester.append(option);
  }
  label.append(semester);
  semester.addEventListener('change', () => ctx.setSemester(semester.value));
  const provider = link('', '#/settings/ai');
  provider.className = 'chip';
  const pwaChip = el('span');
  const chips = el('div', undefined, 'status-chips');
  chips.append(provider, chip('Fictional demo data'), pwaChip);
  const pwa = el('details', undefined, 'pwa-details');
  const host = el('div');
  host.id = 'pwa-controls-host';
  pwa.append(el('summary', 'Offline and installation details'), host);
  root.append(el('strong', 'AI Preschool Studio', 'mobile-brand'), breadcrumb, label, chips);
  ctx.subscribe(() => {
    provider.replaceChildren(icon('settings'),
      el('span', `${PROVIDER_LABELS[ctx.provider.id]} · ${ctx.provider.status}`), icon('chevron'));
    pwaChip.replaceChildren(pwaStatusChip(ctx.pwa));
    semester.value = ctx.semester;
    semester.disabled = ctx.busy;
  });
  const update = route => {
    const parent = NAV_ITEMS.find(item => item.name === parentModule(route.name));
    const child = ctx.children.find(child => child.id === route.childId);
    breadcrumb.replaceChildren(icon('home'), el('span', 'Home'));
    if (parent?.name !== 'home') {
      breadcrumb.append(icon('chevron'), el('span', parent?.label ?? 'Reports'));
    }
    if (child) breadcrumb.append(icon('chevron'), el('span', child.name));
    semester.value = ctx.semester;
  };
  return { root, update, pwa };
}

function navigation() {
  const sidebar = el('nav', undefined, 'sidebar');
  sidebar.setAttribute('aria-label', 'Main navigation');
  const tabs = el('nav', undefined, 'mobile-tabs');
  tabs.setAttribute('aria-label', 'Mobile navigation');
  const more = el('nav', undefined, 'more-menu');
  more.setAttribute('aria-label', 'More destinations');
  more.id = 'more-destinations';
  more.hidden = true;
  const moreButton = button('More', () => {
    more.hidden = !more.hidden;
    moreButton.setAttribute('aria-expanded', String(!more.hidden));
    if (!more.hidden) more.querySelector('a')?.focus();
  });
  moreButton.replaceChildren(icon('more'), el('span', 'More'));
  moreButton.setAttribute('aria-controls', more.id);
  more.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    more.hidden = true;
    moreButton.setAttribute('aria-expanded', 'false');
    moreButton.focus();
  });
  const update = route => {
    const model = navigationModel(route.name);
    sidebar.replaceChildren(el('strong', 'AI Preschool Studio'));
    more.replaceChildren();
    tabs.replaceChildren();
    for (const item of model) {
      const destination = navLink(item);
      if (item.name === 'ai-settings') destination.className = 'nav-divider';
      sidebar.append(destination);
      if (item.tab === 'More') more.append(navLink(item));
    }
    for (const tab of ['Home', 'Classes', 'Students', 'Drafts']) {
      const item = model.find(item => item.tab === tab);
      tabs.append(navLink({ ...item, label: tab }));
    }
    moreButton.setAttribute('aria-current', model.some(i => i.active && i.tab === 'More')
      ? 'page' : 'false');
    tabs.append(moreButton);
    more.hidden = true;
    moreButton.setAttribute('aria-expanded', 'false');
  };
  return { sidebar, tabs, more, update };
}

function navLink(item) {
  const destination = link(item.label, buildRoute(item.name));
  destination.replaceChildren(icon(item.icon), el('span', item.label));
  if (item.active) destination.setAttribute('aria-current', 'page');
  return destination;
}
