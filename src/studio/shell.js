import { NAV_ITEMS, buildRoute, parentModule } from './router.js';
import { PROVIDER_LABELS } from '../class-view.js';
import { el, button, link, chip } from './ui.js';

export function navigationModel(name) {
  const parent = parentModule(name);
  return NAV_ITEMS.map(item => ({ ...item, active: item.name === parent }));
}

export function mountShell(ctx) {
  const root = el('div', undefined, 'app-shell');
  const nav = navigation();
  const content = el('div', undefined, 'app-content');
  const top = topbar(ctx);
  const notice = el('aside',
    'Fictional demo data | Stored only in this browser | '
    + 'NOT IMPLEMENTED: real login / server / database', 'notice');
  const save = el('p');
  save.setAttribute('role', 'status');
  const live = el('p');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  const main = el('main');
  main.id = 'main';
  content.append(top.root, notice, save, live, main, nav.more, nav.tabs);
  root.append(nav.sidebar, content);
  ctx.subscribe(() => {
    save.textContent = ctx.saveStatus;
    live.textContent = ctx.message;
  });
  const update = route => {
    nav.update(route);
    top.update(route);
    root.classList.toggle('print-mode', ['print', 'print-class'].includes(route.name));
    ctx.notify();
  };
  return { root, main, update };
}

function topbar(ctx) {
  const root = el('header', undefined, 'topbar');
  const breadcrumb = el('span');
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
  const pwa = el('div');
  pwa.id = 'pwa-controls-host';
  root.append(breadcrumb, label, provider, chip('Fictional demo data'), pwa);
  ctx.subscribe(() => {
    provider.textContent = `${PROVIDER_LABELS[ctx.provider.id]} · ${ctx.provider.status}`;
    semester.disabled = ctx.busy;
  });
  const update = route => {
    const parent = NAV_ITEMS.find(item => item.name === parentModule(route.name));
    const child = ctx.children.find(child => child.id === route.childId);
    breadcrumb.textContent = `${parent?.label ?? 'Reports'}${child ? ` / ${child.name}` : ''}`;
    semester.value = ctx.semester;
  };
  return { root, update };
}

function navigation() {
  const sidebar = el('nav', undefined, 'sidebar');
  sidebar.setAttribute('aria-label', 'Main navigation');
  const tabs = el('nav', undefined, 'mobile-tabs');
  tabs.setAttribute('aria-label', 'Mobile navigation');
  const more = el('nav', undefined, 'more-menu');
  more.setAttribute('aria-label', 'More destinations');
  more.hidden = true;
  const moreButton = button('More', () => {
    more.hidden = !more.hidden;
    moreButton.setAttribute('aria-expanded', String(!more.hidden));
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
      if (item.tab === 'More') more.append(link(item.label, buildRoute(item.name)));
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
  if (item.active) destination.setAttribute('aria-current', 'page');
  return destination;
}
