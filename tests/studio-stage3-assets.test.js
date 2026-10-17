import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

async function runtimeFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...await runtimeFiles(url));
    else files.push(url);
  }
  return files;
}

test('no studio runtime ships an under-construction page', async () => {
  const directory = new URL('../src/studio/', import.meta.url);
  for (const url of await runtimeFiles(directory)) {
    assert.doesNotMatch(await readFile(url, 'utf8'), /Page under construction/, url.pathname);
  }
});

test('the offline build ships every studio runtime file', async () => {
  const root = new URL('../', import.meta.url);
  const build = await readFile(new URL('scripts/build.mjs', root), 'utf8');
  for (const url of await runtimeFiles(new URL('src/studio/', root))) {
    const relative = url.pathname.slice(root.pathname.length);
    assert.ok(build.includes(`'${relative}'`), `Missing precache asset: ${relative}`);
  }
});
