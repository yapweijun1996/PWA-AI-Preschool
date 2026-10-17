import { STUDIO_CONFIG } from '../../config.js';
import { el, link } from '../ui.js';

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
    ? `${repository}/blob/HEAD/docs/26-submission-writeup.md` : null;
}

export function render() {
  const root = el('section');
  root.append(el('h1', 'About and privacy'),
    el('p', 'A fictional-data prototype for educator review.'),
    panel('Fictional demo data', [
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
  root.append(href ? link('Read the submission write-up', href)
    : el('p', 'Read the submission write-up: docs/26-submission-writeup.md '
      + '(repository URL not configured).'),
  link('Open the legacy demo', './index.html'));
  return root;
}

function panel(title, paragraphs, className = 'card') {
  const root = el('section', undefined, className);
  root.append(el('h2', title));
  const list = el('ul');
  for (const text of paragraphs) list.append(el('li', text));
  root.append(list);
  return root;
}
