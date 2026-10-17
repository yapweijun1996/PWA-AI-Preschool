export function horizontalScroller(node, ctx) {
  for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
    if (ancestor === document.body || ancestor === document.documentElement) break;
    if (['auto', 'scroll', 'overlay'].includes(ctx.style(ancestor).overflowX)
      && ancestor.scrollWidth > ancestor.clientWidth + 1) return ancestor;
  }
  return null;
}

export function measureOverflow(ctx) {
  const root = document.documentElement;
  const scrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
  const overflowElements = ctx.nodes.filter(node => {
    const box = node.getBoundingClientRect();
    return overflowOffender(box, innerWidth, Boolean(horizontalScroller(node, ctx)));
  }).map(ctx.describe);
  return { innerWidth, innerHeight, scrollWidth, clientWidth: root.clientWidth,
    horizontalOverflow: Math.max(0, scrollWidth - root.clientWidth), overflowElements,
    documentHeight: Math.max(innerHeight, root.scrollHeight, document.body.scrollHeight) };
}

export function measureLandmarks(ctx) {
  const landmark = query => {
    const node = [...document.querySelectorAll(query)].find(ctx.visible);
    return node ? { ...ctx.describe(node), height: ctx.rect(node).height,
      position: ctx.style(node).position } : null;
  };
  const header = landmark('header');
  const notice = landmark('.app-content > .notice');
  const bottomBar = landmark('.mobile-tabs');
  return { header, headerHeight: header?.height ?? 0, notice,
    noticeHeight: notice?.height ?? 0, bottomBar };
}

export function measureTargets(ctx) {
  const inlineLinks = [];
  const smallTapTargets = [];
  for (const node of ctx.nodes.filter(node => node.matches(ctx.interactive))) {
    const target = labelledTarget(node, ctx);
    const box = ctx.rect(target);
    const record = { ...ctx.describe(target), width: box.width, height: box.height };
    const prose = node.closest('p,li,dd,dt,figcaption,blockquote,td,th,label');
    const surrounding = prose ? ctx.text(prose).replace(ctx.text(node), '').trim() : '';
    const inline = node.matches('a[href]') && ctx.style(node).display === 'inline'
      && Boolean(surrounding) && !node.closest('nav,[role="navigation"]');
    if (inline) inlineLinks.push(record);
    else if (box.width < 44 || box.height < 44) smallTapTargets.push(record);
  }
  return { smallTapTargets, inlineLinks };
}

export function measureOverlaps(ctx) {
  const targets = ctx.nodes.filter(node => {
    if (!node.matches(ctx.interactive)) return false;
    const box = node.getBoundingClientRect();
    return box.right > 0 && box.left < innerWidth && box.bottom > 0 && box.top < innerHeight;
  });
  const overlaps = [];
  for (let first = 0; first < targets.length; first += 1) {
    for (let second = first + 1; second < targets.length; second += 1) {
      const a = targets[first];
      const b = targets[second];
      if (exemptOverlap(a.contains(b) || b.contains(a), ownLabelPair(a, b),
        Boolean(fixedAncestor(a, ctx) || fixedAncestor(b, ctx)))) continue;
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const area = Math.max(0, Math.min(ar.right, br.right) - Math.max(ar.left, br.left))
        * Math.max(0, Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top));
      if (area > 16) overlaps.push({ selector: ctx.selector(a), otherSelector: ctx.selector(b),
        area: Math.round(area * 100) / 100, rect: ctx.rect(a), otherRect: ctx.rect(b) });
    }
  }
  return { overlaps };
}

export function fixedAncestor(node, ctx) {
  for (let current = node; current && current !== document.body; current = current.parentElement) {
    if (ctx.style(current).position === 'fixed') return current;
  }
  return null;
}

export function endCoverage(ctx) {
  const bars = ctx.nodes.filter(node => {
    const box = node.getBoundingClientRect();
    return ctx.style(node).position === 'fixed' && box.top < innerHeight
      && box.bottom >= innerHeight - 1 && box.right > 0 && box.left < innerWidth;
  });
  const main = document.querySelector('main') || document.body;
  const content = ctx.nodes.filter(node => main.contains(node) && !fixedAncestor(node, ctx)
    && (node.matches(ctx.interactive) || [...node.childNodes]
      .some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim())));
  const lastBottom = Math.max(0, ...content.map(node => node.getBoundingClientRect().bottom));
  const last = content.filter(node => node.getBoundingClientRect().bottom >= lastBottom - 1);
  const offenders = [];
  for (const node of last) {
    const box = node.getBoundingClientRect();
    for (const bar of bars) {
      const cover = bar.getBoundingClientRect();
      const x = (Math.max(box.left, cover.left) + Math.min(box.right, cover.right)) / 2;
      const y = (Math.max(box.top, cover.top) + Math.min(box.bottom, cover.bottom)) / 2;
      if (Math.min(box.right, cover.right) <= Math.max(box.left, cover.left)
        || Math.min(box.bottom, cover.bottom) <= Math.max(box.top, cover.top)) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit && bar.contains(hit)) offenders.push({ ...ctx.describe(node),
        bar: ctx.selector(bar), barRect: ctx.rect(bar), text: ctx.text(node) });
    }
  }
  return { covered: offenders.length > 0, offenders, scrollY,
    bars: bars.map(ctx.describe), lastContent: last.map(ctx.describe) };
}
