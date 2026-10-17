export function largeTarget(box) {
  return box.width >= 44 && box.height >= 44;
}

export function labelledTarget(node, ctx) {
  if (!node.matches('input[type="radio"],input[type="checkbox"]')) return node;
  // Native toggles inherit their effective hit area from an associated, large label.
  return [...(node.labels || [])].find(label => largeTarget(ctx.rect(label))) || node;
}

export function ownLabelPair(a, b) {
  return [...(a.labels || [])].includes(b) || [...(b.labels || [])].includes(a);
}

export function exemptOverlap(contains, ownLabel, fixed) {
  // Fixed navigation temporarily occludes scrolling content; endCoverage checks reachability.
  return contains || ownLabel || fixed;
}

export function intentionalClip(style, box) {
  // Screen-reader-only 1px clips and explicit line-clamp ellipses are deliberate.
  const hidden = box.width <= 1 && box.height <= 1
    && ((style.clip && style.clip !== 'auto')
      || (style.clipPath && style.clipPath !== 'none'));
  return Boolean(hidden || Number.parseInt(style.webkitLineClamp, 10) > 0);
}

export function overflowOffender(box, width, scrollable) {
  // A local horizontal scroller owns its overflow; it is not page overflow.
  return !scrollable && (box.right > width + 1 || box.left < -1);
}
