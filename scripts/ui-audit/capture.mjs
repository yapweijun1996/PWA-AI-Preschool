import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { connect, evaluate } from './cdp.mjs';
import { collectMetrics } from './metrics.mjs';
import { captureName } from './options.mjs';
import { readFile } from 'node:fs/promises';
import {setLocale, translateText} from '../../src/i18n/index.js';

const { firstScreenSelectors } = JSON.parse(await readFile(
  new URL('../ui-audit.budgets.json', import.meta.url), 'utf8'
));

async function ready(cdp) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (await evaluate(cdp, '!!document.querySelector("h1")')) {
      await evaluate(cdp, 'document.fonts.ready.then(() => true)');
      await delay(200);
      return;
    }
    await delay(100);
  }
  throw new Error('Navigation did not render an h1 within 15 seconds');
}

async function screenshot(cdp, directory, name, clip) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: Boolean(clip), ...(clip ? { clip } : {})
  });
  const buffer = Buffer.from(result.data, 'base64');
  await writeFile(join(directory, name), buffer);
  return { file: name, width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function screenshots(cdp, directory, width, height, documentHeight) {
  const images = [];
  images.push(await screenshot(cdp, directory, 'full.png', {
    x: 0, y: 0, width, height: documentHeight, scale: 1
  }));
  const steps = Math.min(8, Math.max(1, Math.ceil(documentHeight / height)));
  for (let index = 0; index < steps; index++) {
    const y = steps === 1 ? 0 : Math.round((documentHeight - height) * index / (steps - 1));
    await evaluate(cdp, `scrollTo(0, ${Math.max(0, y)}); true`);
    await delay(60);
    images.push(await screenshot(cdp, directory, `viewport-${index + 1}.png`));
  }
  for (const image of images) {
    if (image.width !== width * 2) {
      throw new Error(`Screenshot width self-check failed: ${image.width} != ${width * 2}`);
    }
    if (!image.file.startsWith('full') && image.height !== height * 2) {
      throw new Error(`Viewport PNG height self-check failed: ${image.height} != ${height * 2}`);
    }
  }
  return images;
}

export async function capture(endpoint, base, context, options) {
  const { route, width, height, scheme } = context;
  const name = captureName(context);
  const directory = join(options.out, name);
  await mkdir(directory, { recursive: true });
  const target = await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' })
    .then(response => response.json());
  let cdp;
  try {
    cdp = await connect(target.webSocketDebuggerUrl);
    const errors = [];
    cdp.on(message => {
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params);
      if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        errors.push(message.params.entry);
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        errors.push(message.params);
      }
    });
    await prepare(cdp, base, context);
    await cdp.send('Page.navigate', { url: `${base.replace(/#.*$/, '')}${route}` });
    await ready(cdp);
    const metrics = await evaluate(cdp,
      `(${collectMetrics.toString()})(${JSON.stringify(localizedSelectors(context.locale))})`);
    if (metrics.innerWidth !== width) {
      throw new Error(`Emulation self-check failed: innerWidth ${metrics.innerWidth} != ${width}`);
    }
    metrics.locale = await evaluate(cdp, 'document.documentElement.lang');
    if (metrics.locale !== context.locale) {
      throw new Error(`Locale self-check failed: ${metrics.locale} != ${context.locale}`);
    }
    metrics.consoleErrors = errors.length;
    metrics.errors = errors;
    const images = options.screenshots
      ? await screenshots(cdp, directory, width, height, metrics.documentHeight) : [];
    await writeFile(join(directory, 'metrics.json'), JSON.stringify({
      ...context, ...metrics, screenshots: images
    }, null, 2));
    return { ...context, directory: name, metrics, screenshots: images };
  } finally {
    cdp?.close();
    await fetch(`${endpoint}/json/close/${target.id}`).catch(() => {});
  }
}

export async function prepare(cdp, base, { width, height, scheme, locale }) {
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 2, mobile: width <= 600
  });
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: scheme }]
  });
  await cdp.send('Storage.clearDataForOrigin', {
    origin: new URL(base).origin, storageTypes: 'all'
  });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: localeInitialization(base, locale)
  });
}

export function localeInitialization(base, locale) {
  return `if (location.origin === ${JSON.stringify(new URL(base).origin)}) {
    localStorage.setItem('ai-preschool-ui-language', ${JSON.stringify(locale)});
  }`;
}

export function localizedSelectors(locale) {
  setLocale(locale);
  return Object.fromEntries(Object.entries(firstScreenSelectors).map(([route, selectors]) =>
    [route, selectors.map(selector => ({
      ...selector, ...(selector.text ? {text: translateText(selector.text)} : {})
    }))]));
}
