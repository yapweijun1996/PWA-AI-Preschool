// Full audit: node scripts/ui-audit.mjs (built dist required).
// Defaults cover every key route, en/ms/zh-Hans, all viewports and both schemes.
// Narrow example: --viewports=320x720,390x844 --locales=en,ms,zh-Hans
import { readFile, mkdir } from 'node:fs/promises';
import { parseArgs, auditMatrix } from './ui-audit/options.mjs';
import { startServer } from './ui-audit/server.mjs';
import { launchChrome } from './ui-audit/cdp.mjs';
import { capture } from './ui-audit/capture.mjs';
import { evaluateBudgets } from './ui-audit/budgets.mjs';
import { writeReport } from './ui-audit/report.mjs';

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const budgets = JSON.parse(await readFile(new URL('./ui-audit.budgets.json', import.meta.url)));
  await mkdir(options.out, { recursive: true });
  let server;
  let chrome;
  try {
    if (!options.url) server = await startServer('dist');
    chrome = await launchChrome();
    const results = [];
    for (const context of auditMatrix(options)) {
      const origin = options.url || server.url;
      const base = new URL(origin);
      const row = await capture(chrome.endpoint, base.href, context, options);
      row.budgets = evaluateBudgets(row.metrics, context, budgets);
      results.push(row);
      const failed = row.budgets.filter(b => !b.passed && b.severity === 'fail');
      console.log(`${failed.length ? 'FAIL' : 'PASS'} ${context.route} `
        + `${context.width}x${context.height} ${context.scheme} ${context.locale}: `
        + failed.map(b => b.budget).join(', '));
    }
    const failures = await writeReport(options.out, results);
    console.log(`Summary: ${options.out}/summary.md (${failures}/${results.length} failed)`);
    if (failures) process.exitCode = 1;
  } finally {
    await chrome?.close();
    await server?.close();
  }
}

main().catch(error => {
  console.error(`UI audit failed: ${error.stack || error}`);
  process.exitCode = 1;
});
