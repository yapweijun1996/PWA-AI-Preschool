import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { avatarSource, samplePhoto, photoProvenance, ILLUSTRATION_CAPTION, UPLOAD_CAPTION } from '../src/demo-media.js';
import { avatar, photoFigure } from '../src/studio/ui.js';
import { emptyRecord, validateRecord } from '../src/portfolio-model.js';
import { photoControls } from '../src/studio/photo-controls.js';
import { buildReport } from '../src/report-model.js';
import { renderReport } from '../src/report-view.js';
import { CHILDREN, seedRecords } from '../src/portfolio-seed.js';

class Node {
  constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; this.dataset = {}; this.events = new Map(); }
  set textContent(value) { this.text = value; this.children = []; }
  get textContent() { return (this.text || '') + this.children.map(node => node.textContent || '').join(''); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(key, fn) { this.events.set(key, fn); }
  querySelectorAll(tag) { return this.children.flatMap(node => [...(node.tag === tag ? [node] : []), ...node.querySelectorAll(tag)]); }
  querySelector(tag) { return this.querySelectorAll(tag)[0]; }
}
function dom(t) {
  const old = globalThis.document;
  globalThis.document = { createElement: tag => new Node(tag) };
  t.after(() => { if (old) globalThis.document = old; else delete globalThis.document; });
}

test('every seeded child has a distinct bounded avatar; failed images expose initials', t => {
  dom(t);
  for (let index = 1; index <= 20; index++) {
    const id = `C-${String(index).padStart(2, '0')}`;
    assert.equal(avatarSource(id), `assets/demo/avatar-${String(index).padStart(2, '0')}.webp`);
  }
  const root = avatar({ id: 'C-01', name: 'Sample Learner', initials: 'SL' });
  const image = root.querySelector('img');
  assert.equal(image.alt, `Sample Learner: ${ILLUSTRATION_CAPTION}`);
  assert.equal(image.loading, 'lazy');
  assert.equal(image.width, 48);
  assert.equal(image.height, 48);
  assert.equal(root.dataset.imageState, 'loading');
  assert.equal(root.querySelector('span').hidden, true);
  assert.equal(root.attributes['aria-label'], undefined);
  image.events.get('error')();
  assert.equal(image.hidden, true);
  assert.equal(root.dataset.imageState, 'error');
  assert.equal(root.querySelector('span').hidden, false);
  assert.match(root.attributes['aria-label'], /Sample Learner initials: SL/);
  assert.equal(root.querySelector('span').textContent, 'SL');
  const unknown = avatar({ id: 'unknown', name: 'Unknown', initials: 'U' });
  assert.equal(unknown.querySelector('img'), undefined);
  assert.equal(unknown.querySelector('span').hidden, false);
  assert.equal(unknown.attributes['aria-label'], 'Unknown initials: U');
});

test('successful avatar loads never reveal initials, including after an earlier failure', t => {
  dom(t);
  const root = avatar({ id: 'C-02', name: 'Fictional Learner', initials: 'FL' });
  const image = root.querySelector('img');
  const initials = root.querySelector('span');
  assert.equal(initials.hidden, true);
  image.events.get('load')();
  assert.equal(root.dataset.imageState, 'loaded');
  assert.equal(initials.hidden, true);
  assert.equal(image.hidden, false);
  assert.equal(root.attributes['aria-label'], undefined);
  image.events.get('error')();
  assert.equal(initials.hidden, false);
  image.events.get('load')();
  assert.equal(initials.hidden, true);
  assert.equal(image.hidden, false);
  assert.equal(root.attributes['aria-label'], undefined);
  assert.equal(image.width, 48);
  assert.equal(image.height, 48);
  assert.equal(image.loading, 'lazy');
});

test('scene figures and browser uploads have visible, distinct provenance and explicit dimensions', t => {
  dom(t);
  for (const [photo, marker, caption] of [
    [samplePhoto('evidence'), 'illustration', ILLUSTRATION_CAPTION],
    [{ src: 'data:image/png;base64,AA==', alt: 'Fictional test drawing' }, 'browser-upload', UPLOAD_CAPTION],
    [{ src: 'data:image/svg+xml,%3Csvg%3E', alt: 'Legacy fictional shapes' },
      'stored-demo', 'Demo image stored in this browser']
  ]) {
    const figure = photoFigure(photo);
    assert.equal(figure.dataset.provenance, marker);
    assert.ok(figure.querySelector('figcaption').textContent.includes(caption));
    assert.equal(photoProvenance(photo.src), caption);
    const image = figure.querySelector('img');
    assert.equal(image.alt, photo.alt);
    assert.equal(image.loading, 'lazy');
    assert.equal(image.width, 720);
    assert.equal(image.height, 480);
    const picture = figure.children[0];
    assert.equal(picture.className, 'photo-picture');
    assert.equal(picture.dataset.imageState, 'loading');
    assert.equal(picture.textContent, '');
    image.events.get('load')();
    assert.equal(picture.dataset.imageState, 'loaded');
    image.events.get('error')();
    assert.equal(picture.dataset.imageState, 'error');
    assert.equal(image.width, 720);
    assert.equal(image.height, 480);
    assert.equal(image.loading, 'lazy');
    assert.ok(figure.querySelector('figcaption').textContent.includes(caption));
  }
});

test('upload chooser explains demo-only use and browser storage before selection', t => {
  dom(t);
  const oldMatchMedia = globalThis.matchMedia;
  globalThis.matchMedia = () => ({ matches: false });
  t.after(() => { if (oldMatchMedia) globalThis.matchMedia = oldMatchMedia; else delete globalThis.matchMedia; });
  const record = emptyRecord('C-01', '2026-S1');
  const root = photoControls({ busy: false, subscribe: () => () => {}, change() {} }, record, 'english');
  assert.match(root.textContent, /Demo only: do not upload real children's photos/);
  assert.match(root.textContent, /Images are stored only in this browser, not on a server/);
  assert.ok(root.querySelectorAll('input').some(node => node.type === 'file'));
  root.dispose();
});

test('bundled scene validation allows only the twelve exact relative asset paths', () => {
  const record = emptyRecord('C-01', '2026-S1');
  for (const src of ['assets/demo/scene-01.webp', 'assets/demo/scene-12.webp']) {
    record.domains.english.photos = [{ id: 'p', alt: 'Fictional activity', src }];
    assert.equal(validateRecord(record).domains.english.photos[0].src, src);
  }
  for (const src of ['assets/demo/scene-00.webp', 'assets/demo/scene-13.webp', '../assets/demo/scene-01.webp', 'https://example.test/scene-01.webp', 'assets/demo/scene-01.webp?tracking']) {
    record.domains.english.photos[0].src = src;
    assert.throws(() => validateRecord(record), /photo src/);
  }
});

test('all 32 bundled WebPs fit the offline media budget with local-only image sources', async () => {
  const paths = [
    ...Array.from({ length: 20 }, (_, index) => avatarSource(`C-${String(index + 1).padStart(2, '0')}`)),
    ...Array.from({ length: 12 }, (_, index) => `assets/demo/scene-${String(index + 1).padStart(2, '0')}.webp`)
  ];
  let bytes = 0;
  for (const path of paths) {
    const url = new URL(`../${path}`, import.meta.url);
    const size = (await stat(url)).size;
    const header = await readFile(url);
    assert.equal(header.toString('ascii', 0, 4), 'RIFF');
    assert.equal(header.toString('ascii', 8, 12), 'WEBP');
    assert.ok(size < (path.includes('avatar') ? 32_000 : 100_000), path);
    bytes += size;
  }
  assert.ok(bytes < 1_500_000, `Demo media exceeds 1.5 MB: ${bytes}`);
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /img-src 'self' data: blob:;/);
  assert.doesNotMatch(html, /unsafe-inline|unsafe-eval/);
});

test('print reports retain the child avatar, scene descriptions and visible illustration caption', t => {
  dom(t);
  const child = CHILDREN[0];
  const record = seedRecords().find(item => item.childId === child.id && item.semester === '2026-S1');
  const report = renderReport(buildReport({ child, record }));
  const images = report.querySelectorAll('img');
  assert.equal(images[0].src, 'assets/demo/avatar-01.webp');
  assert.ok(images.some(image => image.src.startsWith('assets/demo/scene-')));
  assert.ok(images.every(image => image.alt && image.width && image.height && image.loading === 'lazy'));
  assert.ok(report.textContent.includes(ILLUSTRATION_CAPTION));
  assert.ok(report.querySelectorAll('figcaption').every(caption => caption.textContent.includes(ILLUSTRATION_CAPTION)));
});
