import { RATINGS } from '../portfolio-model.js';
import { STATUS_LABELS } from '../class-view.js';
import { avatarSource, ILLUSTRATION_CAPTION, photoProvenance } from '../demo-media.js';
import { translateText } from '../i18n/index.js';

export function avatar(child, className = 'avatar', language) {
  const label = text => language ? translateText(text, language) : text;
  const root = el('span', '', avatarClass(child.initials || '?', className));
  const fallback = el('span', child.initials || '?', 'avatar-initials');
  fallback.setAttribute('aria-hidden', 'true');
  fallback.hidden = true;
  root.append(fallback);
  const src = avatarSource(child.id);
  if (src) {
    root.dataset.imageState = 'loading';
    const image = el('img');
    image.alt = label(`${child.name}: ${ILLUSTRATION_CAPTION}`);
    image.width = image.height = 48;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('load', () => {
      root.dataset.imageState = 'loaded';
      image.hidden = false;
      fallback.hidden = true;
      root.removeAttribute('aria-label');
    });
    image.addEventListener('error', () => {
      image.hidden = true;
      root.dataset.imageState = 'error';
      fallback.hidden = false;
      root.setAttribute('aria-label', label(`${child.name} initials: ${child.initials || '?'}`));
    });
    root.append(image);
    image.src = src;
  } else {
    fallback.hidden = false;
    root.setAttribute('aria-label', label(`${child.name} initials: ${child.initials || '?'}`));
  }
  return root;
}

export function photoFigure(photo, className = 'photo') {
  const figure = el('figure', undefined, className);
  const image = el('img');
  image.alt = photo.alt;
  image.dataset.i18n = 'off';
  image.width = 720;
  image.height = 480;
  image.loading = 'lazy';
  image.decoding = 'async';
  const picture = el('span', undefined, 'photo-picture');
  picture.dataset.imageState = 'loading';
  image.addEventListener('load', () => { picture.dataset.imageState = 'loaded'; });
  image.addEventListener('error', () => { picture.dataset.imageState = 'error'; });
  picture.append(image);
  image.src = photo.src;
  const caption = el('figcaption');
  caption.append(el('span', photo.alt, 'photo-description'),
    el('span', photoProvenance(photo.src), 'photo-provenance'));
  figure.dataset.provenance = photoProvenance(photo.src) === ILLUSTRATION_CAPTION
    ? 'illustration' : photo.src.startsWith('data:image/svg+xml,') ? 'stored-demo' : 'browser-upload';
  figure.append(picture, caption);
  return figure;
}

export function avatarClass(initials, className = 'avatar') {
  return Array.from(initials).length >= 3 ? `${className} avatar-compact` : className;
}

export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) {
    node.className = className.split(/\s+/).includes('avatar')
      ? avatarClass(text, className) : className;
  }
  return node;
}

export function button(text, action, primary = false) {
  const node = el('button', text, primary ? 'primary' : '');
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

export function link(text, href) {
  const node = el('a', text, /^(Print|Back to|Provider settings|Open |View profile)/.test(text)
    ? 'button-link' : '');
  node.href = href;
  if (node.className === 'button-link') {
    const name = text.startsWith('Print') ? 'print' : text.startsWith('Provider')
      ? 'settings' : 'arrow';
    node.replaceChildren(icon(name), el('span', text));
  }
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
    'Offline: select Offline mock or reconnect before remote drafting. '
    + 'Local work remains available.',
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
    : state.online === false ? 'Offline · readiness not verified'
      : 'Offline readiness not verified';
  return chip(label);
}

const ICON_PATHS = {
  home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  folders: 'M3 7V4h6l3 3h9v14H3Z',
  users: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-3a8 6 0 0 1 16 0v3Z',
  image: 'M3 3h18v18H3ZM3 17l6-6 4 4 3-3 5 5M16 7h.01',
  pencil: 'M14 3H4v18h16V11M14 7l3-4 4 4-4 4M19 1v4M17 3h4',
  file: 'M5 21V3h14v18ZM8 17V12M12 17V8M16 17V5',
  settings: 'm9 3-1 3-3 1-2 4 2 2v3l3 2 1 3h6l1-3 3-2v-3l2-2-2-4-3-1-1-3Z'
    + 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  info: 'M12 8h.01M12 11v6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  chevron: 'm9 5 7 7-7 7',
  warning: 'm12 3 10 18H2ZM12 9v5M12 17h.01',
  print: 'M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6ZM17 12h.01',
  check: 'm5 12 4 4L19 6',
  arrow: 'M4 12h16m-6-6 6 6-6 6'
};

export function icon(name) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('viewBox', '0 0 24 24');
  node.setAttribute('aria-hidden', 'true');
  node.setAttribute('class', 'icon');
  node.setAttribute('fill', 'none');
  node.setAttribute('stroke', 'currentColor');
  node.setAttribute('stroke-width', '1.8');
  node.setAttribute('stroke-linecap', 'round');
  node.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICON_PATHS[name] ?? ICON_PATHS.arrow);
  node.append(path);
  return node;
}
