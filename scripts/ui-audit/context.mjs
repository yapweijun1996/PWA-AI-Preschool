export function createContext() {
  const nodes = [...document.querySelectorAll('body *')];
  const styles = new WeakMap();
  const style = node => {
    if (!styles.has(node)) styles.set(node, getComputedStyle(node));
    return styles.get(node);
  };
  const rect = node => {
    const box = node.getBoundingClientRect();
    return Object.fromEntries(['x', 'y', 'top', 'right', 'bottom', 'left', 'width', 'height']
      .map(key => [key, Math.round(box[key] * 100) / 100]));
  };
  const selector = node => {
    if (node.id) return `#${CSS.escape(node.id)}`;
    const parts = [];
    for (let current = node; current && current !== document.body;
      current = current.parentElement) {
      const tag = current.localName;
      const classes = [...current.classList].slice(0, 2).map(value => `.${CSS.escape(value)}`);
      const siblings = current.parentElement ? [...current.parentElement.children] : [];
      const index = siblings.filter(child => child.localName === tag).indexOf(current) + 1;
      parts.unshift(`${tag}${classes.join('')}:nth-of-type(${index})`);
      if (current.parentElement?.id) {
        parts.unshift(`#${CSS.escape(current.parentElement.id)}`);
        break;
      }
    }
    return parts.join(' > ') || 'body';
  };
  const visible = node => {
    const box = node.getBoundingClientRect();
    if (!node.getClientRects().length || box.width <= 1 || box.height <= 1) return false;
    if (node.checkVisibility && !node.checkVisibility({
      checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true
    })) return false;
    return style(node).visibility === 'visible' && style(node).display !== 'none';
  };
  const text = node => (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180);
  const describe = node => ({ selector: selector(node), rect: rect(node) });
  const interactive = 'a[href],button,input:not([type="hidden"]),select,textarea,'
    + '[role="tab"],summary';
  return { nodes: nodes.filter(visible), style, rect, selector, visible,
    text, describe, interactive };
}
