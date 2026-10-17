import { el } from '../ui.js';
export function render() {
  const root = el('section');
  root.append(el('h1', 'Students'), el('p', 'Page under construction'));
  return root;
}
