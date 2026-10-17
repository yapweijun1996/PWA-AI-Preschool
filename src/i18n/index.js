import en from './en.js';
import ms from './ms.js';
import zhHans from './zh-Hans.js';

export const LOCALE_STORAGE_KEY = 'ai-preschool-ui-language';
export const LANGUAGES = Object.freeze([
  ['en', 'English'], ['ms', 'Bahasa Melayu'], ['zh-Hans', '简体中文']
]);
const catalogs = { en, ms, 'zh-Hans': zhHans };
let locale = 'en';
const listeners = new Set();
const missing = new Set();
const parameters = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
const exact = new Map(Object.entries(en).map(([key, text]) => [text, key]));
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.entries(en).filter(([, text]) => parameters(text).length).map(([key, text]) => {
  const names = parameters(text);
  const parts = text.split(/\{\w+\}/g).map(escape);
  return { key, names, pattern: new RegExp(`^${parts.join('(.+?)')}$`, 'u'), specificity: parts.join('').length };
}).sort((a, b) => b.specificity - a.specificity);

export function getLocale() { return locale; }
export function setLocale(value, storage) {
  if (!Object.hasOwn(catalogs, value)) throw new RangeError('Unsupported interface language');
  try { (storage ?? globalThis.localStorage)?.setItem(LOCALE_STORAGE_KEY, value); } catch { /* Selection still works without storage. */ }
  locale = value;
  if (globalThis.document?.documentElement) document.documentElement.lang = locale;
  for (const listener of listeners) listener(locale);
}
export function initializeLocale(storage) {
  let saved;
  try { saved = (storage ?? globalThis.localStorage)?.getItem(LOCALE_STORAGE_KEY); } catch { /* English is the unconditional default. */ }
  setLocale(Object.hasOwn(catalogs, saved) ? saved : 'en', storage);
}
export function subscribeLocale(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function t(key, params = {}, requestedLocale = locale) {
  if (!Object.hasOwn(en, key)) {
    missing.add(key);
    if (globalThis.location?.hostname === 'localhost' || globalThis.location?.hostname === '127.0.0.1') {
      console.warn(`Missing interface translation key: ${key}`);
    }
    return key;
  }
  if (Object.hasOwn(params, 'count') && Number.isFinite(Number(params.count))) {
    const category = new Intl.PluralRules(requestedLocale).select(Number(params.count));
    if (Object.hasOwn(en, `${key}.${category}`)) key = `${key}.${category}`;
  }
  return (catalogs[requestedLocale]?.[key] ?? en[key]).replace(/\{(\w+)\}/g, (placeholder, name) => {
    if (!Object.hasOwn(params, name)) return placeholder;
    return typeof params[name] === 'number'
      ? new Intl.NumberFormat(requestedLocale).format(params[name]) : String(params[name]);
  });
}
export function missingTranslationKeys() { return [...missing]; }
export function translateText(text, requestedLocale = locale, depth = 0) {
  if (typeof text !== 'string' || !text.trim()) return text;
  const prefix = text.match(/^\s*/)[0], suffix = text.match(/\s*$/)[0];
  const source = text.trim();
  if (exact.has(source)) return prefix + t(exact.get(source), {}, requestedLocale) + suffix;
  for (const { key, names, pattern } of templates) {
    const match = source.match(pattern);
    if (match) {
      const params = Object.fromEntries(names.map((name, index) => {
        let value = match[index + 1];
        // These slots contain locally authored status text, never names or teacher prose.
        if (depth < 4 && ['reason', 'message', 'reasons'].includes(name)) {
          value = name === 'reasons'
            ? value.split('; ').map(reason => translateText(reason, requestedLocale, depth + 1)).join('; ')
            : translateText(value, requestedLocale, depth + 1);
        }
        return [name, value];
      }));
      return prefix + t(key, params, requestedLocale) + suffix;
    }
  }
  return text;
}
export function formatNumber(value, options, requestedLocale = locale) {
  return new Intl.NumberFormat(requestedLocale, options).format(value);
}
export function formatDate(value, options, requestedLocale = locale) {
  return new Intl.DateTimeFormat(requestedLocale, options).format(value);
}
export function plural(value, forms) {
  const category = new Intl.PluralRules(locale).select(value);
  return (forms[category] ?? forms.other).replaceAll('{count}', formatNumber(value));
}

// Translate presentation only. Inputs, evidence, names and narrative prose are never translated.
// Remember source text per node so switching languages never translates a translation.
export function localizeDocument(root = document.body) {
  const textSources = new WeakMap(), attributeSources = new WeakMap();
  const excluded = 'script, style, textarea, input, [data-i18n="off"], .identity-text, .narrative-text, .evidence-text, .photo-description, .avatar-initials, .privacy-prompt, [lang]:not(html)';
  const attributes = ['aria-label', 'aria-valuetext', 'title', 'placeholder', 'alt', 'data-label'];
  function translateNode(node) {
    if (node.nodeType === 3) {
      if (node.parentElement?.closest(excluded)) return;
      const saved = textSources.get(node);
      const source = saved && node.nodeValue === saved.output ? saved.source : node.nodeValue;
      const output = translateText(source);
      textSources.set(node, { source, output });
      if (node.nodeValue !== output) node.nodeValue = output;
      return;
    }
    if (node.nodeType !== 1 || node.matches('script, style')
      || node.closest('[lang]:not(html), [data-i18n="off"]')) return;
    const saved = attributeSources.get(node) ?? {};
    for (const name of attributes) {
      if (!node.hasAttribute(name)) continue;
      const current = node.getAttribute(name);
      const source = saved[name] && current === saved[name].output ? saved[name].source : current;
      const output = translateText(source);
      saved[name] = { source, output };
      if (current !== output) node.setAttribute(name, output);
    }
    attributeSources.set(node, saved);
    for (const child of node.childNodes) translateNode(child);
  }
  const observer = new MutationObserver(records => {
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'childList') for (const node of record.addedNodes) translateNode(node);
      else translateNode(record.target);
    }
    observe();
  });
  const observe = () => observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  const refresh = () => {
    observer.disconnect();
    translateNode(root);
    observe();
  };
  const unsubscribe = subscribeLocale(refresh);
  refresh();
  return () => { observer.disconnect(); unsubscribe(); };
}
