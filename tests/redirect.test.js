import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/redirect.js', import.meta.url), 'utf8');
for (const hash of ['', '#/classes', '#/students/student-1?tab=evidence']) {
  test(`legacy entry replaces history and preserves route ${hash || '(root)'}`, () => {
    const destinations = [];
    vm.runInNewContext(source, {location: {hash, replace(value) { destinations.push(value); }}});
    assert.deepEqual(destinations, ['./' + hash]);
  });
}
