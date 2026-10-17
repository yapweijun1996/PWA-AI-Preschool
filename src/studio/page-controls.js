import { el, button, link } from './ui.js';
import { buildRoute } from './router.js';

export function selectField(label, options, value, change) {
  const root = el('label', label);
  const select = el('select');
  for (const [id, text] of options) {
    const option = el('option', text);
    option.value = id;
    select.append(option);
  }
  select.value = value;
  select.addEventListener('change', () => change(select.value));
  root.append(select);
  return root;
}

export function searchField(label, change) {
  const root = el('label', label);
  const input = el('input');
  input.type = 'search';
  input.addEventListener('input', () => change(input.value));
  root.append(input);
  return { root, input };
}

export function filterChips(options, selected, change) {
  const root = el('div', undefined, 'chips');
  for (const [value, label] of options) {
    const control = button(label, () => {
      for (const node of root.children) node.setAttribute('aria-pressed', 'false');
      control.setAttribute('aria-pressed', 'true');
      change(value);
    });
    control.setAttribute('aria-pressed', String(value === selected));
    root.append(control);
  }
  return root;
}

export function editorLink(text, item) {
  const href = buildRoute('child-editor', {
    childId: item.childId, semester: item.semester, domain: item.domain
  });
  return link(text, href);
}

export function evidenceCard(item) {
  const card = el('article', undefined, 'card');
  card.append(el('h3', `${item.childName} · ${item.semester}`), el('p', item.domainLabel));
  if (item.type === 'photo') {
    const figure = el('figure', undefined, 'photo');
    const image = el('img');
    image.src = item.src;
    image.alt = item.text;
    figure.append(image, el('figcaption', item.text));
    card.append(figure);
  } else card.append(el('p', item.text, 'evidence-text'));
  const action = editorLink('Open in editor', item);
  action.setAttribute('aria-label', `Open ${item.childName} ${item.domainLabel} in editor`);
  card.append(action);
  return card;
}
