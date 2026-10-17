import { RATINGS } from '../portfolio-model.js';
import { STATUS_LABELS } from '../class-view.js';

export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function button(text, action, primary = false) {
  const node = el('button', text, primary ? 'primary' : '');
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

export function link(text, href) {
  const node = el('a', text);
  node.href = href;
  return node;
}

export function chip(text) { return el('span', text, 'chip'); }

export function statusChip(status) {
  const node = chip(STATUS_LABELS[status] ?? status);
  node.dataset.status = status;
  return node;
}

export function ratingChip(value) {
  const rating = RATINGS.find(r => r.value === value);
  const node = chip(rating?.label ?? 'Not rated');
  node.dataset.rating = rating?.label.toLowerCase() ?? 'none';
  return node;
}

export function progressBar(value, max, text) {
  const node = el('div', undefined, 'progress');
  const progress = el('progress');
  progress.value = value;
  progress.max = max;
  progress.setAttribute('aria-label', text);
  node.append(el('p', text), progress);
  return node;
}

export function emptyState(text) { return el('p', text, 'empty-state'); }
export function errorState(text) {
  const node = el('p', text, 'error-state');
  node.setAttribute('role', 'alert');
  return node;
}
export function loadingState(text = 'Loading records…') {
  const node = el('p', text, 'loading-state');
  node.setAttribute('aria-busy', 'true');
  return node;
}
