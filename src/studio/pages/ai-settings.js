import { el, link } from '../ui.js';
export function render() {
  const root = el('section');
  root.append(el('h1', 'AI provider settings'), el('p', 'Page under construction'),
    el('p', 'For this stage, select the narrative provider on Class portfolios.'),
    link('Open class portfolios', '#/classes'));
  return root;
}
