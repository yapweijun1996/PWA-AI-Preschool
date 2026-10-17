import { relativeLuminance, contrastRatio } from './colors.mjs';
import { createContext } from './context.mjs';
import * as geometry from './geometry.mjs';
import * as text from './text.mjs';
import * as accessibility from './accessibility.mjs';

export { relativeLuminance, luminance, contrastRatio } from './colors.mjs';

const helpers = [relativeLuminance, contrastRatio, createContext,
  ...Object.values(geometry), ...Object.values(text), ...Object.values(accessibility)];

// Embed every helper so CDP can execute collectMetrics.toString() without browser imports.
export const collectMetrics = new Function(`return async function collectMetrics() {
  ${helpers.map(helper => helper.toString()).join('\n')}
  await document.fonts?.ready;
  const initialScroll = { x: scrollX, y: scrollY };
  const ctx = createContext();
  const texts = renderedText(ctx);
  const metrics = {
    ...measureOverflow(ctx),
    ...measureLandmarks(ctx),
    ...measureFonts(ctx, texts),
    ...measureTargets(ctx),
    ...measureContrast(ctx, texts, contrastRatio),
    ...measureClipping(ctx, texts),
    ...measureOverlaps(ctx),
    ...measureAccessibility(ctx),
    initialScroll
  };
  try {
    scrollTo({ left: initialScroll.x, top: document.documentElement.scrollHeight,
      behavior: 'instant' });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    metrics.bottomCoverage = endCoverage(createContext());
  } finally {
    scrollTo({ left: initialScroll.x, top: initialScroll.y, behavior: 'instant' });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
  return metrics;
}`)();
