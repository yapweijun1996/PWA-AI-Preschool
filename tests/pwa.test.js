import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {initPwa} from '../src/pwa.js';

const workerSource = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const paths = ['./', './index.html', './class.html', './styles.css', './src/app.js', './src/pwa.js', './manifest.webmanifest', './icons/icon-192.png'];
const scope = 'https://example.test/studio/';
const cacheName = (base, version) => `ai-preschool-studio:${encodeURIComponent(base)}:${version}`;

function cacheStorage() {
  const stores = new Map();
  return {
    stores,
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async put(key, response) { entries.set(typeof key === 'string' ? key : key.url, response.clone()); },
        async match(key) { return entries.get(typeof key === 'string' ? key : key.url)?.clone(); }
      };
    }
  };
}
function worker({version = 'release-one', base = scope, caches = cacheStorage(), fetcher} = {}) {
  const listeners = new Map();
  const requests = [];
  let skips = 0;
  let claims = 0;
  const self = {
    registration: {scope: base},
    clients: {async claim() { claims++; }},
    async skipWaiting() { skips++; },
    addEventListener(type, listener) { listeners.set(type, listener); }
  };
  vm.runInNewContext(workerSource.replace('__BUILD_ID__', version).replace('__PRECACHE__', JSON.stringify(paths)), {
    self, caches, URL, Request, Response,
    async fetch(request) {
      requests.push(request);
      return fetcher ? fetcher(request) : new Response(`release:${version}:${new URL(request.url).pathname}`);
    }
  });
  return {
    caches, requests,
    get skips() { return skips; },
    get claims() { return claims; },
    async event(type, properties = {}) {
      let completion;
      let response;
      listeners.get(type)({...properties, waitUntil(promise) { completion = promise; }, respondWith(promise) { response = promise; }});
      if (completion) await completion;
      return response ? await response : undefined;
    }
  };
}

test('install caches a complete release with no implicit activation; navigation and assets stay version-local', async () => {
  const runtime = worker();
  await runtime.event('install');
  assert.equal(runtime.skips, 0);
  assert.equal(runtime.requests.length, paths.length);
  assert.ok(runtime.requests.every(request => request.credentials === 'omit' && request.cache === 'reload' && request.redirect === 'error'));
  const root = await runtime.event('fetch', {request: {url: scope, method: 'GET', mode: 'navigate'}});
  const index = await runtime.event('fetch', {request: {url: `${scope}index.html`, method: 'GET', mode: 'navigate'}});
  assert.equal(await root.text(), 'release:release-one:/studio/index.html');
  assert.equal(await index.text(), 'release:release-one:/studio/index.html');
  const classPage = await runtime.event('fetch', {request: {url: `${scope}class.html`, method: 'GET', mode: 'navigate'}});
  assert.equal(await classPage.text(), 'release:release-one:/studio/class.html');
  const asset = await runtime.event('fetch', {request: new Request(`${scope}src/app.js`)});
  assert.equal(await asset.text(), 'release:release-one:/studio/src/app.js');
  assert.equal(runtime.requests.length, paths.length, 'cached fetches never ask the mutable network');
});

test('reinstalling an intact immutable release never overwrites it with mutable network content', async () => {
  const caches = cacheStorage();
  await worker({caches}).event('install');
  const reinstall = worker({caches, fetcher: () => { throw new Error('network must not replace this release'); }});
  await reinstall.event('install');
  assert.equal(reinstall.requests.length, 0);
  const response = await reinstall.event('fetch', {request: new Request(`${scope}styles.css`)});
  assert.equal(await response.text(), 'release:release-one:/studio/styles.css');
});

test('redirected shell responses are rejected rather than caching unrelated login or provider content', async () => {
  const runtime = worker({fetcher: () => {
    const response = new Response('Login page');
    Object.defineProperty(response, 'redirected', {value: true});
    return response;
  }});
  await assert.rejects(runtime.event('install'), /complete offline release/);
  assert.deepEqual(await runtime.caches.keys(), []);
});

test('failed installation leaves no partial release and preserves the previous offline shell', async () => {
  const caches = cacheStorage();
  const previous = worker({caches});
  await previous.event('install');
  const failing = worker({version: 'release-two', caches, fetcher: request => request.url.endsWith('styles.css') ? new Response('Unavailable', {status: 503}) : new Response('new asset')});
  await assert.rejects(failing.event('install'), /complete offline release/);
  assert.deepEqual(await caches.keys(), [cacheName(scope, 'release-one')]);
  const response = await previous.event('fetch', {request: new Request(`${scope}src/app.js`)});
  assert.match(await response.text(), /release-one/);
});

test('a failed cache write removes the entire incomplete new version', async () => {
  const caches = cacheStorage();
  const open = caches.open.bind(caches);
  caches.open = async name => {
    const cache = await open(name);
    const put = cache.put.bind(cache);
    cache.put = async (key, response) => {
      if (key.endsWith('styles.css')) throw new Error('quota exceeded');
      await put(key, response);
    };
    return cache;
  };
  await assert.rejects(worker({caches}).event('install'), /quota/);
  assert.deepEqual(await caches.keys(), []);
});

test('activation cleans only obsolete versions of this exact registration scope', async () => {
  const caches = cacheStorage();
  const otherScope = 'https://example.test/other-studio/';
  for (const name of [cacheName(scope, 'old'), cacheName(otherScope, 'old'), 'another-app:old']) await caches.open(name);
  const runtime = worker({version: 'new', caches});
  await runtime.event('install');
  await runtime.event('activate');
  assert.deepEqual(new Set(await caches.keys()), new Set([cacheName(scope, 'new'), cacheName(otherScope, 'old'), 'another-app:old']));
  assert.equal(runtime.claims, 1);
});

test('provider, session, generated, unknown, cross-origin and query requests are never intercepted or cached', async () => {
  const runtime = worker();
  await runtime.event('install');
  const before = [...runtime.caches.stores.get(cacheName(scope, 'release-one')).keys()];
  const requests = [
    new Request('https://api.openai.com/v1/responses'),
    new Request('https://generativelanguage.googleapis.com/v1/models'),
    new Request(`${scope}api/generate`),
    new Request(`${scope}sessions/current`),
    new Request(`${scope}generated/portfolio.json`),
    new Request(`${scope}index.html?token=private`),
    new Request(`${scope}styles.css?v=unrelated`),
    new Request('https://example.test/other-studio/index.html'),
    new Request(`${scope}src/app.js`, {method: 'POST', body: 'private'}),
    {url: `${scope}unknown-page`, method: 'GET', mode: 'navigate'}
  ];
  for (const request of requests) assert.equal(await runtime.event('fetch', {request}), undefined, request.url);
  assert.deepEqual([...runtime.caches.stores.get(cacheName(scope, 'release-one')).keys()], before);
  assert.equal(runtime.requests.length, paths.length);
});

test('missing shell assets fail visibly without mixing in a different network release', async () => {
  const runtime = worker();
  await runtime.event('install');
  runtime.caches.stores.get(cacheName(scope, 'release-one')).delete(`${scope}src/app.js`);
  const response = await runtime.event('fetch', {request: new Request(`${scope}src/app.js`)});
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Offline release unavailable/);
  assert.equal(runtime.requests.length, paths.length);
});

test('version message reports cache readiness and activation requires an explicit message', async () => {
  const runtime = worker();
  await runtime.event('install');
  let reply;
  const ports = [{postMessage(value) { reply = value; }}];
  await runtime.event('message', {data: {type: 'GET_VERSION'}, ports});
  assert.deepEqual(JSON.parse(JSON.stringify(reply)), {type: 'VERSION', buildId: 'release-one', cacheReady: true});
  runtime.caches.stores.get(cacheName(scope, 'release-one')).delete(`${scope}index.html`);
  await runtime.event('message', {data: {type: 'GET_VERSION'}, ports});
  assert.equal(reply.cacheReady, false);
  await runtime.event('message', {data: {type: 'UNKNOWN'}});
  assert.equal(runtime.skips, 0);
  await runtime.event('message', {data: {type: 'SKIP_WAITING'}});
  assert.equal(runtime.skips, 1);
});

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  emit(type, event = {}) { for (const listener of this.listeners.get(type) || []) listener(event); }
}
class Element extends Events {
  constructor(tag) { super(); this.tagName = tag; this.children = []; this.attributes = {}; this.hidden = false; this.open = false; this.textContent = ''; }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(key, value) { this.attributes[key] = value; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
  remove() { this.removed = true; }
  click() { if (!this.disabled && !this.hidden) this.emit('click'); }
}
function fakeWorker(version) {
  const result = new Events();
  result.state = 'activated';
  result.skips = 0;
  result.postMessage = (data, ports) => {
    if (data.type === 'GET_VERSION') queueMicrotask(() => ports[0].postMessage({type: 'VERSION', buildId: version, cacheReady: true}));
    if (data.type === 'SKIP_WAITING') result.skips++;
  };
  return result;
}
function browserEnvironment({controlled = true, waiting = true, buildId = 'release-one', supported = true, registrationError = false} = {}) {
  const body = new Element('body');
  body.dataset = {buildId};
  const find = (id, node = body) => node.id === id ? node : node.children.map(child => find(id, child)).find(Boolean);
  const document = {body, createElement: tag => new Element(tag), getElementById: id => find(id)};
  const serviceWorker = new Events();
  serviceWorker.controller = controlled ? fakeWorker('release-one') : null;
  const registration = new Events();
  registration.waiting = waiting ? fakeWorker('release-two') : null;
  registration.active = serviceWorker.controller;
  registration.installing = null;
  registration.update = async () => {};
  const registrations = [];
  serviceWorker.register = async (url, options) => {
    registrations.push({url, options});
    if (registrationError) throw new Error('registration unavailable');
    return registration;
  };
  const navigator = {onLine: true, userAgent: 'Test browser'};
  if (supported) navigator.serviceWorker = serviceWorker;
  const window = new Events();
  window.reloads = 0;
  window.location = {reload() { window.reloads++; }};
  window.matchMedia = () => ({matches: false});
  const timers = new Map();
  let nextTimer = 0;
  class Channel {
    constructor() {
      this.port1 = {close() {}, onmessage: null};
      this.port2 = {postMessage: data => this.port1.onmessage?.({data})};
    }
  }
  const globals = {document, navigator, window, MessageChannel: Channel, setTimeout: (callback, delay) => { timers.set(++nextTimer, {callback, delay}); return nextTimer; }, clearTimeout: id => timers.delete(id)};
  const descriptors = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, {configurable: true, writable: true, value});
  return {
    document, navigator, window, registration, serviceWorker, registrations,
    byId: find,
    fireTimeout(delay) { for (const [id, timer] of timers) if (timer.delay === delay) { timers.delete(id); timer.callback(); } },
    restore() {
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  };
}
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

// Runtime scenarios are sequential: each owns the browser globals for its complete lifecycle.
test('a confirmed update shows a loader immediately, rejects duplicate actions, and reloads only after controllerchange', async () => {
  const browser = browserEnvironment();
  try {
    initPwa();
    await settle();
    assert.equal(browser.registrations[0].options.updateViaCache, 'none');
    assert.match(browser.registrations[0].url.pathname, /\/sw\.js$/);
    assert.match(browser.byId('pwa-status').textContent, /Build release-one.*Ready/);
    browser.byId('pwa-update-button').click();
    assert.equal(browser.byId('pwa-update-dialog').open, true);
    assert.match(browser.byId('pwa-update-warning').textContent, /drafts.*observations.*API keys.*reset/);
    const next = browser.registration.waiting;
    browser.byId('pwa-confirm-update').click();
    browser.byId('pwa-confirm-update').click();
    assert.equal(browser.byId('pwa-update-loader').open, true);
    assert.equal(next.skips, 1);
    assert.equal(browser.window.reloads, 0);
    browser.registration.waiting = null;
    browser.serviceWorker.controller = next;
    browser.serviceWorker.emit('controllerchange');
    assert.equal(browser.window.reloads, 1);
    browser.serviceWorker.emit('controllerchange');
    assert.equal(browser.window.reloads, 1);
  } finally { browser.restore(); }
});

test('another tab activation never reloads this tab until its own warning is confirmed, even after waiting disappears', async () => {
  const browser = browserEnvironment();
  try {
    initPwa();
    await settle();
    const next = browser.registration.waiting;
    browser.registration.waiting = null;
    browser.serviceWorker.controller = next;
    browser.serviceWorker.emit('controllerchange');
    await settle();
    assert.equal(browser.window.reloads, 0);
    assert.equal(browser.byId('pwa-update-button').hidden, false);
    assert.equal(browser.byId('pwa-update-button').textContent, 'Reload updated app');
    browser.byId('pwa-update-button').click();
    browser.byId('pwa-confirm-update').click();
    await settle();
    assert.equal(browser.window.reloads, 1);
    assert.equal(next.skips, 0);
  } finally { browser.restore(); }
});

test('initial claim does not reset the session, and busy generation blocks update confirmation', async () => {
  const browser = browserEnvironment({controlled: false, waiting: false});
  let busy = true;
  try {
    initPwa({isBusy: () => busy});
    await settle();
    browser.serviceWorker.controller = fakeWorker('release-one');
    browser.serviceWorker.emit('controllerchange');
    await settle();
    assert.equal(browser.window.reloads, 0);
    assert.equal(browser.byId('pwa-update-button').hidden, true);
    browser.registration.waiting = fakeWorker('release-two');
    browser.registration.installing = browser.registration.waiting;
    browser.registration.installing.state = 'installed';
    browser.registration.emit('updatefound');
    browser.byId('pwa-update-button').click();
    browser.byId('pwa-confirm-update').click();
    assert.match(browser.byId('pwa-update-message').textContent, /Generation is still running/);
    assert.equal(browser.registration.waiting.skips, 0);
    assert.equal(browser.byId('pwa-update-loader').open, false);
    busy = false;
    browser.byId('pwa-confirm-update').click();
    assert.equal(browser.registration.waiting.skips, 1);
  } finally { browser.restore(); }
});

test('update timeout preserves the session and permits an explicit retry without a late surprise reload', async () => {
  const browser = browserEnvironment();
  try {
    initPwa();
    await settle();
    browser.byId('pwa-update-button').click();
    browser.byId('pwa-confirm-update').click();
    browser.fireTimeout(15000);
    assert.equal(browser.byId('pwa-update-loader').open, false);
    assert.equal(browser.byId('pwa-update-dialog').open, true);
    assert.match(browser.byId('pwa-update-message').textContent, /did not finish in time.*not been reset/);
    const next = browser.registration.waiting;
    browser.registration.waiting = null;
    browser.serviceWorker.controller = next;
    browser.serviceWorker.emit('controllerchange');
    await settle();
    assert.equal(browser.window.reloads, 0);
    browser.byId('pwa-confirm-update').click();
    await settle();
    assert.equal(browser.window.reloads, 1);
  } finally { browser.restore(); }
});

test('unsupported browsers, source previews and registration failures have visible honest status', async () => {
  for (const [options, expected] of [
    [{supported: false}, /not supported/],
    [{buildId: '__BUILD_ID__'}, /Run npm run build and serve dist/],
    [{registrationError: true}, /registration failed/]
  ]) {
    const browser = browserEnvironment(options);
    try {
      initPwa();
      await settle();
      assert.match(browser.byId('pwa-status').textContent, expected);
      assert.equal(browser.window.reloads, 0);
      if (options.buildId || options.supported === false) assert.equal(browser.registrations.length, 0);
    } finally { browser.restore(); }
  }
});

test('offline status only changes availability, never reports a generated or saved transaction', async () => {
  const browser = browserEnvironment({waiting: false});
  try {
    initPwa();
    await settle();
    browser.navigator.onLine = false;
    browser.window.emit('offline');
    assert.match(browser.byId('pwa-status').textContent, /^Offline.*Remote AI is unavailable/);
    assert.doesNotMatch(browser.byId('pwa-status').textContent, /draft ready|saved|generated successfully/i);
    assert.equal(browser.window.reloads, 0);
  } finally { browser.restore(); }
});

test('an uncontrolled tab that explicitly opts into a waiting update reloads on that worker’s first claim', async () => {
  const browser = browserEnvironment({controlled: false});
  try {
    initPwa();
    await settle();
    const next = browser.registration.waiting;
    browser.byId('pwa-update-button').click();
    browser.byId('pwa-confirm-update').click();
    assert.equal(browser.window.reloads, 0);
    browser.registration.waiting = null;
    browser.serviceWorker.controller = next;
    browser.serviceWorker.emit('controllerchange');
    assert.equal(browser.window.reloads, 1);
  } finally { browser.restore(); }
});
