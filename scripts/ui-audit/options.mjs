const editor = '#/classes/class-a/children/C-05?sem=2026-S2';

export const DEFAULT_ROUTES = Object.freeze([
  '#/', '#/classes', editor,
  ...['chinese', 'mathematics', 'social-emotional', 'review']
    .map((domain) => `${editor}&domain=${domain}`),
  '#/students', '#/students/C-05', '#/evidence', '#/drafts', '#/reports',
  '#/print/C-05?sem=2026-S2', '#/settings/ai', '#/about'
]);
export const DEFAULT_VIEWPORTS = Object.freeze([
  {width: 320, height: 720}, {width: 390, height: 844}, {width: 430, height: 932},
  {width: 768, height: 1024}, {width: 1440, height: 900}
].map(Object.freeze));
export const DEFAULT_SCHEMES = Object.freeze(['light', 'dark']);
export const DEFAULT_LOCALES = Object.freeze(['en', 'ms', 'zh-Hans']);
const quickViewports = [DEFAULT_VIEWPORTS[1], DEFAULT_VIEWPORTS[4]];
const valueFlags = new Set(['routes', 'viewports', 'schemes', 'locales', 'out', 'url']);

function splitValues(value, flag) {
  const values = value.split(',').map((part) => part.trim());
  if (values.some((part) => !part)) throw new Error(`--${flag} contains an empty value`);
  return [...new Set(values)];
}

function parseViewports(value) {
  return splitValues(value, 'viewports').map((size) => {
    const match = /^(\d+)x(\d+)$/i.exec(size);
    const width = Number(match?.[1]);
    const height = Number(match?.[2]);
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
      throw new Error(`Invalid viewport: ${size}; expected positive WIDTHxHEIGHT`);
    }
    return {width, height};
  });
}

function parseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('--url must be an absolute HTTP(S) URL');
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname
    || url.username || url.password) {
    throw new Error('--url requires an HTTP(S) host without credentials');
  }
  return url.href;
}

function assignValue(options, flag, value) {
  if (flag === 'viewports') options.viewports = parseViewports(value);
  else if (flag === 'url') options.url = parseUrl(value);
  else if (flag === 'out') options.out = value;
  else {
    const values = splitValues(value, flag);
    if (flag === 'schemes' && values.some((scheme) => !DEFAULT_SCHEMES.includes(scheme))) {
      throw new Error('--schemes accepts only light and dark');
    }
    if (flag === 'locales' && values.some((locale) => !DEFAULT_LOCALES.includes(locale))) {
      throw new Error('--locales accepts only en, ms and zh-Hans');
    }
    if (flag === 'routes' && values.some((route) => !route.startsWith('#/'))) {
      throw new Error('--routes requires hash routes beginning with #/');
    }
    options[flag] = values;
  }
}

export function parseArgs(argv = []) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const options = {
    routes: [...DEFAULT_ROUTES], viewports: DEFAULT_VIEWPORTS.map((size) => ({...size})),
    schemes: [...DEFAULT_SCHEMES], out: `artifacts/ui-audit/${timestamp}`,
    locales: [...DEFAULT_LOCALES],
    url: null, quick: false, screenshots: true
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--quick') options.quick = true;
    else if (argument === '--no-screenshots') options.screenshots = false;
    else {
      const match = /^--([^=]+)(?:=(.*))?$/.exec(argument);
      if (!match || !valueFlags.has(match[1])) throw new Error(`Unknown argument: ${argument}`);
      const value = match[2] ?? argv[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${match[1]}`);
      assignValue(options, match[1], value);
    }
  }
  if (options.quick) {
    options.viewports = quickViewports.map((size) => ({...size}));
    options.schemes = [...DEFAULT_SCHEMES];
  }
  return options;
}

export function routeSlug(route) {
  const slug = route.replace(/^#\//, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'home';
}

export function auditMatrix(options) {
  return options.routes.flatMap((route) => options.viewports.flatMap((viewport) =>
    options.schemes.flatMap((scheme) => options.locales.map((locale) =>
      ({route, ...viewport, scheme, locale})))));
}

export function captureName({route, width, height, scheme, locale}) {
  return `${routeSlug(route)}__${width}x${height}__${scheme}__${locale}`;
}
