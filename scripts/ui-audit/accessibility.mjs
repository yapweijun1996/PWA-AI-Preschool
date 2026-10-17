export function accessibleName(node, ctx, visited = new Set()) {
  if (visited.has(node)) return '';
  visited.add(node);
  const labelled = (node.getAttribute('aria-labelledby') || '').trim().split(/\s+/)
    .map(id => document.getElementById(id)).filter(Boolean);
  if (labelled.length) return labelled.map(label => label.textContent.trim()).join(' ').trim();
  const ariaLabel = node.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;
  const labels = [...(node.labels || [])].map(label => label.textContent.trim()).join(' ').trim();
  if (labels) return labels;
  if (node.matches('input[type="image"]')) {
    return node.getAttribute('alt')?.trim() || node.title.trim();
  }
  if (node.matches('input[type="button"],input[type="submit"],input[type="reset"]')) {
    return node.value.trim() || (node.type === 'submit' ? 'Submit' : node.type === 'reset'
      ? 'Reset' : '') || node.title.trim();
  }
  if (!node.matches('input,select,textarea')) {
    const content = namedContents(node, ctx);
    if (content) return content;
  }
  return node.getAttribute('title')?.trim() || '';
}

export function namedContents(node, ctx) {
  const parts = [];
  const walk = current => {
    if (current.nodeType === Node.TEXT_NODE) {
      parts.push(current.textContent);
      return;
    }
    if (current.nodeType !== Node.ELEMENT_NODE || current.getAttribute('aria-hidden') === 'true'
      || current.hidden || ctx.style(current).display === 'none') return;
    if (current.matches('img')) parts.push(current.getAttribute('alt') || '');
    else if (current !== node && current.hasAttribute('aria-label')) {
      parts.push(current.getAttribute('aria-label'));
    } else for (const child of current.childNodes) walk(child);
  };
  walk(node);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function measureHeadings(ctx) {
  const headings = ctx.nodes.filter(node => node.matches('h1,h2,h3,h4,h5,h6,[role="heading"]'));
  const headingSkips = [];
  let previous = 0;
  for (const node of headings) {
    const level = node.getAttribute('role') === 'heading'
      ? Number(node.getAttribute('aria-level')) || 2 : Number(node.localName.slice(1));
    if (level > previous + 1) headingSkips.push({ selector: ctx.selector(node),
      text: ctx.text(node), previousLevel: previous, level });
    previous = level;
  }
  const h1s = ctx.nodes.filter(node => node.matches('h1'));
  const active = document.activeElement;
  return { h1Count: h1s.length, headingSkips,
    focusOnH1: h1s.length === 1 && active === h1s[0],
    activeElement: active ? ctx.selector(active) : null,
    lang: document.documentElement.getAttribute('lang')?.trim() || '' };
}

export function measureAccessibility(ctx) {
  const unnamedControls = ctx.nodes.filter(node => node.matches(ctx.interactive)
    && !accessibleName(node, ctx)).map(ctx.describe);
  const imagesWithoutAlt = ctx.nodes.filter(node => node.matches('img')
    && !node.hasAttribute('alt')).map(ctx.describe);
  const decorativeSvg = ctx.nodes.filter(node => {
    if (!node.matches('svg') || node.closest('[aria-hidden="true"]')) return false;
    const labelled = node.hasAttribute('aria-label') || node.hasAttribute('aria-labelledby')
      || Boolean(node.querySelector('title')?.textContent.trim());
    return !labelled;
  }).map(ctx.describe);
  return { unnamedControls, imagesWithoutAlt, decorativeSvg, ...measureHeadings(ctx) };
}
