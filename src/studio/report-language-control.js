import { el } from './ui.js';
import { REPORT_LANGUAGES } from '../report-language.js';

export function reportLanguageControl(ctx) {
  const root = el('section', undefined, 'card report-language-settings');
  const label = el('label', 'Report and narrative language');
  const select = el('select');
  select.name = 'report-language';
  for (const language of REPORT_LANGUAGES) {
    const option = el('option', language.label);
    option.value = language.id;
    option.lang = language.id;
    select.append(option);
  }
  select.addEventListener('change', () => ctx.setReportLanguage(select.value));
  label.append(select);
  const status = el('p', undefined, 'hint');
  root.append(label,
    el('p', 'Independent of the interface language. Chinese-domain narratives always use Simplified Chinese. Existing drafts keep their language until re-drafted.', 'hint'),
    el('p', 'Offline mock uses translated rating templates and keeps teacher comments unchanged. Machine translations are unreviewed; educator review is required.', 'hint'), status);
  const refresh = () => {
    select.value = ctx.reportLanguage;
    select.disabled = ctx.busy;
    status.textContent = ctx.reportLanguageSaved
      ? '' : 'Language preference could not be saved. It applies for this session only.';
    status.hidden = ctx.reportLanguageSaved;
  };
  const unsubscribe = ctx.subscribe(refresh);
  root.dispose = unsubscribe;
  refresh();
  return root;
}
