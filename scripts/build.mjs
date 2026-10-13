import { copyFile, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const assets = [
  'index.html',
  'styles.css',
  'favicon.svg',
  'src/app.js',
  'src/config.js',
  'src/data.js',
  'src/providers.js',
];

// Validate the complete public allowlist before replacing the previous build.
for (const asset of assets) {
  const source = path.join(root, asset);
  if (!(await stat(source)).isFile()) throw new Error(`Missing runtime file: ${asset}`);
}

// This destination is fixed relative to this script, never supplied by a caller.
await rm(output, { recursive: true, force: true });
for (const asset of assets) {
  const destination = path.join(output, asset);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(root, asset), destination);
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Built ${assets.length} runtime files and .nojekyll in dist/`);
