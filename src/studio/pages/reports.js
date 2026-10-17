import { el, link, errorState } from '../ui.js';
import { buildRoute } from '../router.js';

export function render(ctx, route) {
  const root = el('section');
  root.append(el('h1', 'Reports'));
  const child = route.childId ? ctx.children.find(c => c.id === route.childId) : null;
  if (route.childId && !child) {
    root.append(errorState('Student not found.'), link('Choose a student', '#/students'));
    return root;
  }
  const semester = route.semester ?? ctx.semester;
  root.append(el('p', `${child?.name ?? 'Class A (Sample)'} · ${semester}`),
    link('Preview report / Print / Save as PDF', buildRoute(child ? 'print' : 'print-class', {
      childId: child?.id, semester
    })));
  return root;
}
