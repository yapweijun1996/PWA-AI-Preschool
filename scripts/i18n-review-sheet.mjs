import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import en from '../src/i18n/en.js';
import ms from '../src/i18n/ms.js';
import zhHans from '../src/i18n/zh-Hans.js';

// Quote every field for RFC 4180 and neutralise spreadsheet formula prefixes.
export function csvCell(value) {
  const text = String(value);
  const safe = /^[\s]*[=+\-@]/u.test(text) || /^[\t\r]/u.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function reviewSheetCsv() {
  const rows = [['key', 'en', 'ms', 'zh-Hans', 'status']];
  for (const key of Object.keys(en).sort()) {
    rows.push([key, en[key], ms[key], zhHans[key], 'machine-translated-unreviewed']);
  }
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const destination = process.argv[2] ?? 'artifacts/i18n-review-sheet.csv';
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, reviewSheetCsv(), 'utf8');
  console.log(`Wrote ${Object.keys(en).length} unreviewed translations to ${destination}`);
}
