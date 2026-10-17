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
  const label = el('p', text);
  label.setAttribute('role', 'status');
  node.append(label, progress);
  return node;
}

export function stateCard(kind, text, action) {
  const node = el('section', undefined, `state-card ${kind}-state`);
  node.dataset.state = kind;
  node.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  const titles = { empty: 'Empty', error: 'Error', loading: 'Loading',
    rejected: 'Rejected draft', offline: 'Offline', saved: 'Saved', unsaved: 'Not saved' };
  node.append(el('strong', titles[kind] ?? kind), el('p', text));
  if (action) node.append(action);
  if (kind === 'loading') node.setAttribute('aria-busy', 'true');
  return node;
}

export function emptyState(text, action) { return stateCard('empty', text, action); }
export function errorState(text, action) { return stateCard('error', text, action); }
export function loadingState(text = 'Loading portfolios…') {
  return stateCard('loading', text);
}

export function rejectedState(text, action) { return stateCard('rejected', text, action); }
export function offlineState() {
  return stateCard('offline',
    'Offline: select Offline mock or reconnect before remote drafting. Local work remains available.',
    link('Provider settings', '#/settings/ai'));
}

export function saveState(status, retry) {
  const failed = status.startsWith('Not saved');
  if (status === 'Saving…') return loadingState(status);
  return stateCard(failed ? 'unsaved' : 'saved', failed
    ? 'Not saved: storage unavailable. Your edits remain on this screen.' : status,
  failed && retry ? button('Retry save', retry) : null);
}

export function pwaStatusChip(state = {}) {
  const label = state.updateAvailable ? 'Update available' : state.cacheReady ? 'Offline ready'
    : state.online === false ? 'Offline · readiness not verified' : 'Offline readiness not verified';
  return chip(label);
}
