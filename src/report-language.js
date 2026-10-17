// Report language is independent of UI locale and never inferred from the browser.
export const REPORT_LANGUAGE_STORAGE_KEY = 'ai-preschool-report-language';
export const REPORT_LANGUAGES = Object.freeze([
  { id: 'en', label: 'English' },
  { id: 'ms', label: 'Bahasa Melayu' },
  { id: 'zh-Hans', label: '简体中文' }
].map(Object.freeze));
export const normalizeReportLanguage = value => REPORT_LANGUAGES.some(item => item.id === value) ? value : 'en';
export const narrativeLanguage = (id, language) => id === 'chinese' ? 'zh-Hans' : normalizeReportLanguage(language);
export function loadReportLanguage(storage) {
  try { return normalizeReportLanguage(storage?.getItem(REPORT_LANGUAGE_STORAGE_KEY)); }
  catch { return 'en'; }
}
export function saveReportLanguage(storage, value) {
  const language = normalizeReportLanguage(value);
  try {
    if (!storage) return false;
    storage.setItem(REPORT_LANGUAGE_STORAGE_KEY, language);
    return true;
  } catch { return false; }
}
