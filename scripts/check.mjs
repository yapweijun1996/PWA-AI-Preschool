import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

async function scripts(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await scripts(path));
    else if (/\.(?:js|mjs)$/.test(entry.name)) result.push(path);
  }
  return result;
}

for (const file of ['sw.js', ...await scripts('src'), ...await scripts('scripts')]) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
