import { el, link } from '../ui.js';
export function render() {
  const root = el('section');
  root.append(el('h1', 'Home'), el('p', 'Page under construction'),
    link('Open class portfolios', '#/classes'));
  return root;
}
