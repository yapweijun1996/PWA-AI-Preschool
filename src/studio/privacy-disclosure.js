import { buildNarrativePrompt } from '../narrative.js';
import { privacyNotice } from '../privacy-mask.js';
import { el } from './ui.js';

// The preview uses the generation prompt builder, never a parallel summary template.
export function privacyDisclosure(ctx, { child, record, provider = () => ctx.provider.id,
  noticeInDetails = false } = {}) {
  const root = el('section', undefined, 'privacy-disclosure');
  const notice = el('p', privacyNotice, 'hint');
  const details = el('details');
  details.append(el('summary', 'What is sent?'));
  if (noticeInDetails) details.append(notice);
  else root.append(notice);
  const mode = el('p', undefined, 'hint');
  const error = el('p');
  error.setAttribute('role', 'alert');
  let selectedId = child?.id ?? ctx.privacyPreviewChildId ?? ctx.children[0]?.id;
  const select = child ? null : el('select');
  if (select) {
    const label = el('label', 'Preview child (browser only)');
    for (const member of ctx.children) {
      const option = el('option', member.name);
      option.value = member.id;
      select.append(option);
    }
    select.value = selectedId;
    select.addEventListener('change', () => {
      selectedId = select.value;
      ctx.privacyPreviewChildId = selectedId;
      refresh();
    });
    label.append(select);
    details.append(label);
  }
  const prompt = el('pre', undefined, 'privacy-prompt');
  prompt.setAttribute('aria-label', 'Exact masked model prompt');
  details.append(mode, error, prompt);
  root.append(details);
  const refresh = () => {
    if (select) select.disabled = ctx.busy;
    const selected = child ?? ctx.children.find(member => member.id === selectedId);
    mode.textContent = provider() === 'mock'
      ? 'Offline mock uses the same masked evidence locally. No model request is sent. '
        + 'The preview below is the exact prompt used when a remote provider is selected.'
      : 'Exact text sent to the selected external AI service for this child and semester. '
        + 'Every draft request includes all four domains; a class batch sends one request per child. '
        + 'Provider routing and model settings wrap this prompt; credentials and the private map are not shown.';
    error.textContent = '';
    error.hidden = true;
    try {
      if (!selected) throw new Error('No child selected');
      prompt.textContent = buildNarrativePrompt(ctx.narrativeInput(selected,
        record ?? ctx.get(selected.id)));
    } catch {
      prompt.textContent = '';
      error.textContent = 'Privacy preview unavailable. No identifying text is displayed. '
        + 'Remove identifying or sensitive details before drafting.';
      error.hidden = false;
    }
  };
  const unsubscribe = ctx.subscribe(refresh);
  root.dispose = unsubscribe;
  root.refresh = refresh;
  refresh();
  return root;
}
