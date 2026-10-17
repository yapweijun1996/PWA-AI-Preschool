import { createContext } from './context.js';
import { parseRoute, buildRoute, legacyRedirect } from './router.js';
import { mountShell } from './shell.js';
import { initPwa } from '../pwa.js';
import * as home from './pages/home.js';
import * as classes from './pages/classes.js';
import * as editor from './pages/child-editor.js';
import * as students from './pages/students.js';
import * as profile from './pages/student-profile.js';
import * as evidence from './pages/evidence.js';
import * as drafts from './pages/drafts.js';
import * as reports from './pages/reports.js';
import * as print from './pages/print.js';
import * as settings from './pages/ai-settings.js';
import * as about from './pages/about.js';

const pages = { home, classes, 'child-editor': editor, students, 'student-profile': profile,
  evidence, drafts, reports, print, 'print-class': print, 'ai-settings': settings, about };

export function startStudio() {
  let storage = null;
  try { storage = window.localStorage; } catch { /* Visible store status handles denial. */ }
  const ctx = createContext({ storage, isOffline: () => navigator.onLine === false });
  ctx.confirm = text => window.confirm(text);
  const shell = mountShell(ctx);
  document.getElementById('app').replaceChildren(shell.root);
  shell.main.tabIndex = -1;
  document.querySelector('.skip').addEventListener('click', event => {
    event.preventDefault();
    shell.main.focus();
  });
  let current = null;
  ctx.go = (childId, semester = ctx.semester) => {
    ctx.persist();
    location.hash = childId ? buildRoute('child-editor', { childId, semester }) : '#/classes';
  };
  ctx.setSemester = semester => {
    ctx.persist();
    ctx.semester = semester;
    const route = parseRoute(location.hash);
    if (['child-editor', 'print', 'print-class'].includes(route.name)) {
      location.hash = buildRoute(route.name, { childId: route.childId, semester });
    } else render();
  };
  function render() {
    ctx.persist();
    current?.dispose?.();
    const redirect = legacyRedirect(location.hash);
    if (redirect) history.replaceState(null, '', redirect);
    const route = parseRoute(location.hash);
    if (route.semester) ctx.semester = route.semester;
    shell.update(route);
    current = pages[route.name].render(ctx, route);
    shell.main.replaceChildren(current);
    const heading = shell.main.querySelector('h1');
    focusHeading(heading);
    ctx.announce(route.message ?? heading?.textContent ?? 'Page opened');
  }
  window.addEventListener('hashchange', render);
  window.addEventListener('pagehide', ctx.persist);
  window.addEventListener('beforeunload', ctx.persist);
  for (const event of ['online', 'offline']) window.addEventListener(event, ctx.notify);
  render();
  initPwa({ isBusy: () => ctx.busy, updateWarning:
    'Updating reloads AI Preschool Studio and clears memory-only provider keys. '
    + 'Saved fictional portfolios remain in this browser. Continue?' });
  return ctx;
}

startStudio();

function focusHeading(heading) {
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus();
}
