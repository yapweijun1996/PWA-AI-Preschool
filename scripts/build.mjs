import { copyFile, mkdir, rm, stat, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { STUDIO_CONFIG } from '../src/config.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const assets = [
  'index.html', 'styles.css', 'favicon.svg',
  'class.html', 'class.css', 'src/class-app.js', 'src/class-view.js',
  'src/report-model.js', 'src/report-view.js',
  'src/narrative.js', 'src/photo.js', 'src/portfolio-model.js', 'src/portfolio-seed.js', 'src/portfolio-store.js',
  'src/app.js', 'src/config.js', 'src/data.js', 'src/providers.js', 'src/pwa.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
];
const inputs = [...assets, 'sw.js'];
const hash = createHash('sha256');
for (const asset of inputs) {
  const source = path.join(root, asset);
  if (!(await stat(source)).isFile()) throw new Error(`Missing runtime file: ${asset}`);
  hash.update(asset).update('\0').update(await readFile(source)).update('\0');
}
const snapshot = hash.digest('hex');
const commit = process.env.GITHUB_SHA || '';
if (commit && !/^[a-f0-9]{40,64}$/i.test(commit)) throw new Error('Invalid CI commit identity.');
const buildId = `${commit ? commit.slice(0,12)+'-' : ''}${snapshot.slice(0,16)}`;
const generated = ['manifest.webmanifest', 'manifest-dark.webmanifest', 'build-info.json'];
const precache = ['./', ...assets.map(p=>`./${p}`), ...generated.map(p=>`./${p}`)];

await rm(output, { recursive: true, force: true });
for (const asset of assets) {
  const destination = path.join(output, asset);
  await mkdir(path.dirname(destination), { recursive: true });
  if (asset.endsWith('.html')) {
    const html = await readFile(path.join(root, asset), 'utf8');
    if (!html.includes('__BUILD_ID__')) throw new Error('HTML is missing its build identity.');
    await writeFile(destination, html.replaceAll('__BUILD_ID__', buildId));
  } else await copyFile(path.join(root, asset), destination);
}
const manifest = {
  id: './', name: STUDIO_CONFIG.organizationName || STUDIO_CONFIG.productName,
  short_name: STUDIO_CONFIG.productName, description: 'Fictional-data preschool portfolio demonstration.',
  lang: 'en', start_url: './', scope: './', display: 'standalone',
  theme_color: '#f8f8f4', background_color: '#f8f8f4',
  icons: [
    {src:'./icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'./icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
    {src:'./icons/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'},
  ],
};
await writeFile(path.join(output, generated[0]), JSON.stringify(manifest,null,2)+'\n');
await writeFile(path.join(output, generated[1]), JSON.stringify({...manifest,theme_color:'#10272f',background_color:'#10272f'},null,2)+'\n');
await writeFile(path.join(output, 'build-info.json'), JSON.stringify({buildId,sourceSnapshot:snapshot})+'\n');
const worker = await readFile(path.join(root,'sw.js'),'utf8');
if (!worker.includes('__BUILD_ID__') || !worker.includes('__PRECACHE__')) throw new Error('Worker build contract is missing.');
await writeFile(path.join(output,'sw.js'), worker.replaceAll('__BUILD_ID__',buildId).replaceAll('__PRECACHE__',JSON.stringify(precache)));
await writeFile(path.join(output,'.nojekyll'),'');
console.log(`Built static PWA ${buildId} in dist/ (${precache.length} precached routes).`);
