import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function writeReport(out, results) {
  const failed = results.filter(row => row.budgets.some(b => !b.passed && b.severity === 'fail'));
  const lines = ['# UI audit', '',
    'Geometry and contrast heuristics are candidates; no screen reader or real-device run;',
    'gradients/images unknown contrast. Fresh synthetic seed state only.',
    'Gateway not exercised.', '',
    '| Route | Viewport | Scheme | Result | Violated budgets | Screenshots |',
    '| --- | --- | --- | --- | --- | --- |'];
  for (const row of results) {
    const violations = row.budgets.filter(b => !b.passed);
    const status = violations.some(b => b.severity === 'fail') ? 'FAIL'
      : violations.length ? 'WARN' : 'PASS';
    const links = row.screenshots.map(image =>
      `[${image.file}](${row.directory}/${image.file})`).join(' ');
    lines.push(`| ${row.route} | ${row.width}x${row.height} | ${row.scheme} | ${status} | `
      + `${violations.map(b => `${b.severity}: ${b.budget}`
        + (b.skipped ? ` SKIPPED (${b.reason})` : ` (${b.actual} / ${b.limit})`))
        .join('; ')} | ${links} |`);
  }
  lines.push('', '## Top offenders', '');
  const offenders = new Map();
  for (const row of results) {
    for (const budget of row.budgets.filter(b => !b.passed)) {
      for (const item of (budget.offenders || []).slice(0, 20)) {
        const selector = typeof item === 'string' ? item : item.selector || JSON.stringify(item);
        const key = `${budget.budget}: ${selector}`;
        offenders.set(key, (offenders.get(key) || 0) + 1);
      }
    }
  }
  for (const [key, count] of [...offenders].sort((a, b) => b[1] - a[1]).slice(0, 40)) {
    lines.push(`- ${count} combinations: ${key.replaceAll('\n', ' ')}`);
  }
  await writeFile(join(out, 'summary.json'), JSON.stringify({
    combinations: results.length, failed: failed.length, results
  }, null, 2));
  await writeFile(join(out, 'summary.md'), `${lines.join('\n')}\n`);
  return failed.length;
}
