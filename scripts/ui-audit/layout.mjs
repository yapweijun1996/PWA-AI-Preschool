export function countLines(rects) {
  const tops = [];
  for (const rect of rects) {
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (!tops.some(top => Math.abs(top - rect.top) <= 1)) tops.push(rect.top);
  }
  return tops.length;
}

export function unionHeight(intervals) {
  const sorted = intervals.filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
  let end = -Infinity;
  let height = 0;
  for (const [top, bottom] of sorted) {
    height += Math.max(0, bottom - Math.max(top, end));
    end = Math.max(end, bottom);
  }
  return height;
}

export function hasWordBreakOpportunity(value, locale = 'en') {
  const words = [...new Intl.Segmenter(locale, { granularity: 'word' }).segment(value)];
  return words.length > 1;
}

export function measureBrokenWords(ctx, texts) {
  const brokenWords = [];
  const canvas = document.createElement('canvas');
  const painter = canvas.getContext('2d');
  for (const node of texts) {
    const value = ctx.text(node);
    if (!value || /\s/.test(value) || hasWordBreakOpportunity(value, document.documentElement.lang)
      || node.matches('input,textarea,select')) continue;
    const style = ctx.style(node);
    if (intentionalClip(style, node.getBoundingClientRect())) continue;
    painter.font = style.font;
    const available = node.clientWidth - parseFloat(style.paddingLeft)
      - parseFloat(style.paddingRight);
    if (painter.measureText(value).width > available + 1) continue;
    const rects = [...node.childNodes].filter(child => child.nodeType === Node.TEXT_NODE)
      .flatMap(child => {
        const range = document.createRange();
        range.selectNodeContents(child);
        return [...range.getClientRects()];
      });
    if (countLines(rects) > 1) brokenWords.push({ ...ctx.describe(node), text: value });
  }
  return { brokenWords };
}

export function measureLabels(ctx) {
  return { labelOverflow: ctx.nodes.filter(node =>
    node.matches('button,a[href],[role="tab"],.chip')
    && node.scrollWidth > node.clientWidth + 1).map(ctx.describe) };
}

export function measureTabletColumns(ctx) {
  const tabletColumns = [];
  if (innerWidth < 601 || innerWidth > 1023) return { tabletColumns };
  for (const parent of ctx.nodes) {
    const style = ctx.style(parent);
    if (!['grid', 'flex'].includes(style.display)) continue;
    const cards = [...parent.children].filter(node => ctx.visible(node)
      && node.matches('article,section,tr,.card,label:has(input[type="radio"])'));
    for (const card of cards) {
      const box = card.getBoundingClientRect();
      const beside = cards.some(other => other !== card
        && Math.min(box.bottom, other.getBoundingClientRect().bottom)
          > Math.max(box.top, other.getBoundingClientRect().top)
        && other.getBoundingClientRect().left >= box.right - 1);
      const besideLeft = cards.some(other => other !== card
        && Math.abs(other.getBoundingClientRect().top - box.top) <= 1);
      if ((beside || besideLeft) && box.width < 280 && ctx.text(card)) {
        tabletColumns.push({ ...ctx.describe(card), width: box.width });
      }
    }
  }
  return { tabletColumns };
}

export function measureStickyTop(ctx) {
  const regions = ctx.nodes.filter(node => {
    const style = ctx.style(node);
    const box = node.getBoundingClientRect();
    const top = parseFloat(style.top);
    return ['sticky', 'fixed'].includes(style.position) && Number.isFinite(top)
      && box.top <= top + 1 && box.bottom > 0 && box.top < innerHeight
      && !node.matches('.mobile-tabs') && box.width > 0;
  });
  return { stickyTopHeight: unionHeight(regions.map(node => {
    const box = node.getBoundingClientRect();
    return [Math.max(0, box.top), Math.min(innerHeight, box.bottom)];
  })), stickyTopRegions: regions.map(ctx.describe) };
}

export function insideFirstScreen(box, width, bottom) {
  return box.left >= 0 && box.right <= width && box.top >= 0 && box.bottom <= bottom;
}

export function measureFirstScreen(ctx, map) {
  const route = location.hash.split('?')[0];
  const key = Object.keys(map).find(key => route === key || (key.endsWith('/')
    && key !== '#/' && route.startsWith(key)));
  if (!key) return { firstScreen: { skipped: true, reason: 'No route selector configured' } };
  const bottom = Math.min(innerHeight, ...ctx.nodes.filter(node =>
    ctx.style(node).position === 'fixed' && node.getBoundingClientRect().bottom >= innerHeight)
    .map(node => node.getBoundingClientRect().top).filter(top => top > 0));
  const alternatives = map[key].map(group => {
    const nodes = [...document.querySelectorAll(group.selector)].filter(ctx.visible)
      .filter(node => !group.text || ctx.text(node).includes(group.text));
    const selected = group.all ? nodes : nodes.slice(0, 1);
    const resolved = selected.length >= (group.count || 1);
    const offenders = selected.filter(node =>
      !insideFirstScreen(node.getBoundingClientRect(), innerWidth, bottom)).map(ctx.describe);
    return { resolved, offenders };
  });
  if (alternatives.some(group => group.resolved && !group.offenders.length)) {
    return { firstScreen: { skipped: false, offenders: [] } };
  }
  const resolved = alternatives.filter(group => group.resolved);
  return { firstScreen: resolved.length
    ? { skipped: false, offenders: resolved.flatMap(group => group.offenders) }
    : { skipped: true, reason: 'Route selectors unresolved', selectors: map[key] } };
}
