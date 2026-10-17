import { STUDIO_CONFIG } from '../../config.js';
import { el, link, icon } from '../ui.js';
import { resetSampleButton } from '../page-controls.js';

export const NOT_IMPLEMENTED = Object.freeze([
  'Real login, roles or tenant isolation',
  'Server, database or object storage',
  'Authenticated approval/finalisation',
  'Audit log',
  'Vector RAG',
  'Production AI hosting',
  'Cross-device sync'
]);

export function writeupHref(config = STUDIO_CONFIG) {
  const repository = config.repositoryUrl?.replace(/\.git\/?$/, '').replace(/\/$/, '');
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(repository ?? '')
    ? `${repository}/blob/main/docs/26-submission-writeup.md` : null;
}

export function render(ctx) {
  const root = el('section', undefined, 'about-page');
  const heading = el('header', undefined, 'page-header');
  heading.append(el('h1', 'About and privacy'),
    el('p', 'A fictional-data prototype for educator review.'));
  const cards = el('div', undefined, 'about-grid');
  cards.append(panel('Fictional demo data', [
      'Use fictional records only. Do not enter real child, family or staff information.'
    ]),
    panel('Stored only in this browser', [
      'Class records use this browser’s localStorage. They are not shared or backed up.',
      'Clearing browser data removes saved records. Test keys and rejection reasons stay in '
        + 'session memory only; test keys are never stored with records.'
    ]),
    panel('NOT IMPLEMENTED', NOT_IMPLEMENTED, 'card not-implemented'),
    panel('Known limitations', [
      'AI output can be wrong or conservatively rejected. Educator review is required.',
      'Local review is not authenticated approval or report release.',
      'Provider availability and quotas vary. A failed AI call never silently becomes mock output.',
      'Local storage is not secure storage or a backup. '
        + 'Browser memory cannot keep test keys secret.',
      'Print pagination and CJK fonts vary by browser.'
    ]),
    panel('Keyboard shortcuts', [
      'Alt + ArrowLeft — previous child',
      'Alt + ArrowRight — next child',
      'Shortcuts work only while the child portfolio editor is active.'
    ]));
  const href = writeupHref();
  const writeup = panel('Submission write-up', [
    'Read about the project goals, scope and design decisions.'
  ]);
  if (href) {
    const action = link('Read the submission write-up', href);
    action.className = 'button-link';
    writeup.append(action);
  } else {
    writeup.append(el('p', 'Read the submission write-up: docs/26-submission-writeup.md '
      + '(repository URL not configured).', 'hint'));
  }
  cards.append(writeup);
  const actions = el('div', undefined, 'toolbar about-actions');
  actions.append(link('Open the legacy demo', './index.html'), resetSampleButton(ctx));
  root.append(heading, cards, actions);
  return root;
}

function panel(title, paragraphs, className = 'card') {
  const root = el('section', undefined, `${className} about-card`);
  const symbols = {
    'Fictional demo data': 'warning', 'Stored only in this browser': 'folders',
    'NOT IMPLEMENTED': 'info', 'Known limitations': 'file',
    'Keyboard shortcuts': 'settings', 'Submission write-up': 'arrow'
  };
  const visual = el('span', undefined, 'about-card-icon');
  visual.append(icon(symbols[title]));
  root.append(visual, el('h2', title));
  const list = el('ul');
  for (const text of paragraphs) list.append(el('li', text));
  root.append(list);
  return root;
}
