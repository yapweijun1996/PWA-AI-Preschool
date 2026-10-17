import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {mkdtemp, mkdir, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  parseArgs, routeSlug, DEFAULT_ROUTES, DEFAULT_VIEWPORTS, DEFAULT_SCHEMES
} from '../scripts/ui-audit/options.mjs';
import {startServer} from '../scripts/ui-audit/server.mjs';
import {evaluateBudgets} from '../scripts/ui-audit/budgets.mjs';
import {relativeLuminance, contrastRatio} from '../scripts/ui-audit/metrics.mjs';

const budgets = JSON.parse(await readFile(
  new URL('../scripts/ui-audit.budgets.json', import.meta.url), 'utf8'
));
const context = {route: '#/classes', width: 390, height: 844, scheme: 'light'};
const baseline = () => ({
  innerWidth: 390, horizontalOverflow: 0, overflowElements: [], headerHeight: 130,
  noticeHeight: 90, minFontSize: 12, smallText: [], smallTapTargets: [], inlineLinks: [],
  contrastFailures: [], unknownContrast: [], clippedText: [], overlaps: [], unnamedControls: [],
  h1Count: 1, focusOnH1: true, documentHeight: 5000, consoleErrors: 0
});
const evaluate = (metrics, target = context, config = budgets) =>
  evaluateBudgets(metrics, target, config);
const row = (rows, name) => rows.find((item) => item.budget === name);

function fetchRaw(url, path, method = 'GET') {
  const base = new URL(url);
  return new Promise((accept, reject) => {
    const req = request({hostname: base.hostname, port: base.port, path, method}, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => accept({
        status: response.statusCode, headers: response.headers, body
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function serverFixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'ui-audit-test-'));
  const root = join(directory, 'public');
  await mkdir(root);
  await writeFile(join(root, 'index.html'), '<h1>Audit fixture</h1>');
  await writeFile(join(root, 'file with spaces.css'), 'body { color: black; }');
  await writeFile(join(directory, 'secret.txt'), 'never expose this');
  await symlink(join(directory, 'secret.txt'), join(root, 'escape.txt'));
  const server = await startServer(root);
  t.after(async () => {
    await server.close();
    await rm(directory, {recursive: true, force: true});
  });
  return server;
}

test('audit defaults cover routes, editor domains, viewports and schemes', () => {
  const options = parseArgs([]);
  assert.deepEqual(options.routes, DEFAULT_ROUTES);
  assert.equal(options.routes.length, 15);
  for (const domain of ['chinese', 'mathematics', 'social-emotional', 'review']) {
    assert.ok(options.routes.some((route) => route.endsWith(`&domain=${domain}`)));
  }
  assert.deepEqual(options.viewports, DEFAULT_VIEWPORTS);
  assert.deepEqual(options.schemes, DEFAULT_SCHEMES);
  assert.match(options.out, /^artifacts\/ui-audit\/\d{4}-\d\d-\d\dT[\d-]+Z$/);
  assert.equal(options.url, null);
  assert.equal(options.screenshots, true);
  options.viewports[0].width = 1;
  assert.equal(parseArgs([]).viewports[0].width, 320);
});

test('audit arguments support lists, equals syntax and explicit output/remote URLs', () => {
  const options = parseArgs([
    '--routes', '#/,#/classes,#/', '--viewports=390x844,1440x900', '--schemes=dark',
    '--out', '/tmp/audit results', '--url', 'https://example.com/demo/', '--no-screenshots'
  ]);
  assert.deepEqual(options.routes, ['#/', '#/classes']);
  assert.deepEqual(options.viewports, [{width: 390, height: 844}, {width: 1440, height: 900}]);
  assert.deepEqual(options.schemes, ['dark']);
  assert.equal(options.out, '/tmp/audit results');
  assert.equal(options.url, 'https://example.com/demo/');
  assert.equal(options.screenshots, false);
});

test('quick always uses the two specified viewports and both schemes', () => {
  const options = parseArgs(['--quick', '--viewports=1x2', '--schemes=dark']);
  assert.equal(options.quick, true);
  assert.deepEqual(options.viewports, [{width: 390, height: 844}, {width: 1440, height: 900}]);
  assert.deepEqual(options.schemes, ['light', 'dark']);
});

test('audit arguments reject missing, malformed and unsafe values', () => {
  const invalid = [
    ['--unknown'], ['--out'], ['--out='], ['--routes', '#/,'], ['--routes=/external'],
    ['--viewports=0x800'], ['--viewports=390'], ['--viewports=3.5x8'],
    ['--viewports=9007199254740992x8'], ['--schemes=sepia'], ['--quick=yes'],
    ['--url=file:///tmp/app'], ['--url=javascript:alert(1)'], ['--url=//example.com'],
    ['--url=https://name:secret@example.com'], ['--url=http://user@example.com']
  ];
  for (const args of invalid) assert.throws(() => parseArgs(args), Error, args.join(' '));
  assert.equal(parseArgs(['--url=http://localhost:4173']).url, 'http://localhost:4173/');
});

test('route slugs are readable, safe and distinguish editor tabs', () => {
  assert.equal(routeSlug('#/'), 'home');
  assert.equal(routeSlug('#/students/C-05'), 'students-c-05');
  const slugs = DEFAULT_ROUTES.map(routeSlug);
  assert.equal(new Set(slugs).size, DEFAULT_ROUTES.length);
  assert.ok(slugs.every((slug) => /^[a-z0-9-]+$/.test(slug)));
  assert.equal(routeSlug('#/../../odd?x=1&domain=review'), 'odd-x-1-domain-review');
});

test('luminance and WCAG contrast match known colour pairs', () => {
  assert.equal(relativeLuminance([0, 0, 0]), 0);
  assert.equal(relativeLuminance([255, 255, 255]), 1);
  assert.ok(Math.abs(relativeLuminance([255, 0, 0]) - 0.2126) < 1e-10);
  assert.ok(Math.abs(relativeLuminance([128, 128, 128]) - 0.2158605) < 1e-7);
  assert.equal(contrastRatio([0, 0, 0], [255, 255, 255]), 21);
  assert.equal(contrastRatio([255, 255, 255], [0, 0, 0]), 21);
  assert.equal(contrastRatio([100, 100, 100], [100, 100, 100]), 1);
  assert.ok(Math.abs(contrastRatio([119, 119, 119], [255, 255, 255]) - 4.4781) < 0.0001);
});

test('budget evaluation passes exact boundaries without mutating inputs', () => {
  const metrics = baseline();
  const before = structuredClone({metrics, context, budgets});
  const rows = evaluate(metrics);
  assert.ok(rows.length > 10);
  assert.ok(rows.every((item) => item.passed));
  assert.deepEqual({metrics, context, budgets}, before);
  assert.deepEqual(Object.keys(rows[0]), ['budget', 'severity', 'passed', 'actual', 'limit',
    'offenders']);
});

test('body text and chip font failures have separate severities', () => {
  const metrics = baseline();
  metrics.minFontSize = 10;
  metrics.smallText = [{selector: '.chip', fontSize: 10, isChip: true}];
  let rows = evaluate(metrics);
  assert.equal(row(rows, 'bodyFontSize').passed, true);
  assert.equal(row(rows, 'chipFontSize').severity, 'warn');
  assert.equal(row(rows, 'chipFontSize').passed, false);
  metrics.smallText.push({selector: 'p', fontSize: 11, isChip: false});
  rows = evaluate(metrics);
  assert.equal(row(rows, 'bodyFontSize').severity, 'fail');
  assert.equal(row(rows, 'bodyFontSize').actual, 11);
  assert.deepEqual(row(rows, 'bodyFontSize').offenders, [metrics.smallText[1]]);
});

test('unknown contrast and navigation focus warn without making fail rows fail', () => {
  const metrics = baseline();
  metrics.unknownContrast = [{selector: '.gradient', reason: 'gradient'}];
  metrics.focusOnH1 = false;
  metrics.inlineLinks = [{selector: 'p a', width: 20, height: 16}];
  const rows = evaluate(metrics);
  assert.equal(row(rows, 'unknownContrast').severity, 'warn');
  assert.equal(row(rows, 'unknownContrast').passed, false);
  assert.equal(row(rows, 'focusOnH1').passed, false);
  assert.ok(rows.filter((item) => item.severity === 'fail').every((item) => item.passed));
});

test('all required failure arrays produce selector-bearing failures', () => {
  const names = {
    smallTapTargets: 'tapTargets', contrastFailures: 'contrast', clippedText: 'clippedText',
    overlaps: 'overlaps', unnamedControls: 'controlNames'
  };
  for (const [metric, budget] of Object.entries(names)) {
    const offender = {selector: '#bad-control'};
    const result = row(evaluate({...baseline(), [metric]: [offender]}), budget);
    assert.equal(result.passed, false, budget);
    assert.equal(result.severity, 'fail', budget);
    assert.equal(result.actual, 1, budget);
    assert.deepEqual(result.offenders, [offender], budget);
  }
});

test('numeric budgets reject overflow, mismatched emulation, headings and console errors', () => {
  const cases = [
    ['horizontalOverflow', 1, 'horizontalOverflow'], ['innerWidth', 500, 'viewportWidth'],
    ['headerHeight', 131, 'headerHeight'], ['h1Count', 0, 'h1Count'],
    ['h1Count', 2, 'h1Count'], ['consoleErrors', 1, 'consoleErrors']
  ];
  for (const [metric, value, budget] of cases) {
    assert.equal(row(evaluate({...baseline(), [metric]: value}), budget).passed, false, budget);
  }
  assert.equal(row(evaluate({...baseline(), noticeHeight: 91}), 'noticeHeight').severity, 'warn');
  assert.equal(row(evaluate({...baseline(), noticeHeight: 91}), 'noticeHeight').passed, false);
  assert.equal(row(evaluate({...baseline(), consoleErrors: undefined}), 'consoleErrors').passed,
    false);
});

test('viewport and route overrides apply only to their exact scopes', () => {
  const desktop = {...context, width: 1440, height: 900};
  assert.equal(row(evaluate(baseline(), desktop), 'headerHeight'), undefined);
  assert.equal(row(evaluate(baseline(), {...context, width: 600}), 'headerHeight').limit, 130);
  assert.equal(row(evaluate(baseline(), {...context, width: 601}), 'headerHeight'), undefined);
  assert.equal(row(evaluate({...baseline(), documentHeight: 5001}),
    'documentHeight').passed, false);
  for (const [route, limit] of [['#/classes', 5000], ['#/students', 4500], ['#/evidence', 5500]]) {
    assert.equal(row(evaluate(baseline(), {...context, route}), 'documentHeight').limit, limit);
  }
  assert.equal(row(evaluate(baseline(), {...context, route: '#/about'}),
    'documentHeight'), undefined);
  assert.equal(row(evaluate(baseline(), {...context, width: 430}), 'documentHeight'), undefined);
  const custom = {budgets: [{id: 'custom', metric: 'documentHeight', max: 100, severity: 'fail',
    overrides: [{width: 390, max: 6000, severity: 'warn'}]}]};
  assert.equal(evaluate(baseline(), context, custom)[0].severity, 'warn');
  assert.equal(evaluate(baseline(), context, custom)[0].passed, true);
});

test('static audit server serves files, HEAD and encoded names without caching', async (t) => {
  const server = await serverFixture(t);
  const index = await fetchRaw(server.url, '/?ignored=true');
  assert.equal(index.status, 200);
  assert.equal(index.body, '<h1>Audit fixture</h1>');
  assert.match(index.headers['content-type'], /^text\/html/);
  assert.equal(index.headers['cache-control'], 'no-store');
  const head = await fetchRaw(server.url, '/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.equal(Number(head.headers['content-length']), Buffer.byteLength(index.body));
  const css = await fetchRaw(server.url, '/file%20with%20spaces.css');
  assert.equal(css.status, 200);
  assert.match(css.headers['content-type'], /^text\/css/);
  assert.equal((await fetchRaw(server.url, '/missing')).status, 404);
  assert.equal((await fetchRaw(server.url, '/', 'POST')).status, 405);
});

test('static server rejects traversal, encoded traversal and escaping symlinks', async (t) => {
  const server = await serverFixture(t);
  const paths = [
    '/../secret.txt', '/%2e%2e/secret.txt', '/%2E%2E%2Fsecret.txt',
    '/..%5csecret.txt', '/%00index.html', '/%ZZ', '//outside/secret.txt'
  ];
  for (const path of paths) {
    const response = await fetchRaw(server.url, path);
    assert.equal(response.status, 400, path);
    assert.ok(!response.body.includes('never expose'), path);
  }
  assert.equal((await fetchRaw(server.url, '/%252e%252e/secret.txt')).status, 404);
  assert.equal((await fetchRaw(server.url, '/escape.txt')).status, 403);
});
