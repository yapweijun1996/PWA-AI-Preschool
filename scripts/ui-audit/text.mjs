export function renderedText(ctx) {
  return ctx.nodes.filter(node => {
    if (node.matches('script,style,noscript,option,svg *,svg')) return false;
    if (node.matches('input,textarea,select')) return true;
    return [...node.childNodes].some(child => {
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return false;
      const range = document.createRange();
      range.selectNodeContents(child);
      return [...range.getClientRects()].some(box => box.width > 1 && box.height > 1);
    });
  });
}

export function measureFonts(ctx, texts) {
  let minFontSize = null;
  const smallText = [];
  for (const node of texts) {
    const fontSize = Number.parseFloat(ctx.style(node).fontSize);
    if (!(fontSize > 0)) continue;
    minFontSize = minFontSize === null ? fontSize : Math.min(minFontSize, fontSize);
    if (fontSize < 12) smallText.push({ selector: ctx.selector(node), text: ctx.text(node),
      fontSize, isChip: Boolean(node.closest('.chip,[class~="chips"] .chip')) });
  }
  return { minFontSize, smallText };
}

export function parseColor(value) {
  const match = value.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;
  const parts = match[1].split(/[\s,\/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const channels = parts.slice(0, 3).map(channel => channel.endsWith('%')
    ? Number.parseFloat(channel) * 2.55 : Number(channel));
  const alpha = parts[3]?.endsWith('%') ? Number.parseFloat(parts[3]) / 100
    : Number(parts[3] ?? 1);
  return [...channels, alpha].every(Number.isFinite) ? [...channels, alpha] : null;
}

export function compositeColor(front, back) {
  const alpha = front[3] + back[3] * (1 - front[3]);
  if (alpha === 0) return [0, 0, 0, 0];
  const rgb = front.slice(0, 3).map((channel, index) =>
    (channel * front[3] + back[index] * back[3] * (1 - front[3])) / alpha);
  return [...rgb, alpha];
}

export function textBackground(node, ctx) {
  let background = [0, 0, 0, 0];
  for (let current = node; current; current = current.parentElement) {
    const style = ctx.style(current);
    if (Number(style.opacity) < 1 || style.mixBlendMode !== 'normal'
      || style.filter !== 'none') return { reason: 'Opacity, blending or filter' };
    if (background[3] >= 0.999) continue;
    if (style.backgroundImage !== 'none') return { reason: 'Gradient or background image' };
    const color = parseColor(style.backgroundColor);
    if (!color) return { reason: 'Unsupported background color' };
    background = compositeColor(background, color);
  }
  return background[3] >= 0.999 ? { color: background }
    : { reason: 'No opaque ancestor background' };
}

export function measureContrast(ctx, texts, ratio) {
  const contrastFailures = [];
  const unknownContrast = [];
  let contrastChecked = 0;
  for (const node of texts) {
    const style = ctx.style(node);
    const background = textBackground(node, ctx);
    const foreground = parseColor(style.color);
    const record = { selector: ctx.selector(node), text: ctx.text(node) };
    if (!background.color || !foreground) {
      unknownContrast.push({ ...record, reason: background.reason || 'Unsupported text color' });
      continue;
    }
    const fontSize = Number.parseFloat(style.fontSize);
    const bold = Number.parseInt(style.fontWeight, 10) >= 700;
    const minimum = fontSize >= 24 || (fontSize >= 18.66 && bold) ? 3 : 4.5;
    const actual = ratio(compositeColor(foreground, background.color), background.color);
    contrastChecked += 1;
    if (actual < minimum) contrastFailures.push({ ...record, ratio: actual, minimum, fontSize,
      foreground: style.color, background: background.color });
  }
  return { contrastFailures, unknownContrast, contrastChecked };
}

export function measureClipping(ctx, texts) {
  const clippedText = [];
  const seen = new Set();
  for (const node of texts) {
    for (let current = node; current && current !== document.body;
      current = current.parentElement) {
      if (seen.has(current)) continue;
      const style = ctx.style(current);
      if (intentionalClip(style, current.getBoundingClientRect())) break;
      const x = ['hidden', 'clip'].includes(style.overflowX)
        && current.scrollWidth > current.clientWidth + 1;
      const y = ['hidden', 'clip'].includes(style.overflowY)
        && current.scrollHeight > current.clientHeight + 1;
      const ellipsis = style.textOverflow === 'ellipsis'
        && current.scrollWidth > current.clientWidth + 1;
      if (!x && !y && !ellipsis) continue;
      seen.add(current);
      clippedText.push({ ...ctx.describe(current), text: ctx.text(current),
        scrollWidth: current.scrollWidth, clientWidth: current.clientWidth,
        scrollHeight: current.scrollHeight, clientHeight: current.clientHeight,
        ellipsis, axes: [x ? 'x' : '', y ? 'y' : ''].filter(Boolean) });
    }
  }
  return { clippedText };
}
