function matches(override, context) {
  return (override.width === undefined || override.width === context.width)
    && (override.height === undefined || override.height === context.height)
    && (override.minWidth === undefined || context.width >= override.minWidth)
    && (override.maxWidth === undefined || context.width <= override.maxWidth)
    && (override.route === undefined || override.route === context.route)
    && (override.scheme === undefined || override.scheme === context.scheme);
}

function readMetric(metrics, path) {
  return path.split('.').reduce((value, key) => value?.[key], metrics);
}

function fontMeasurement(metrics, rule) {
  if (!Array.isArray(metrics.smallText)) return {actual: null, offenders: []};
  const chips = rule.id === 'chipFontSize';
  const offenders = metrics.smallText.filter((item) => Boolean(item.isChip) === chips);
  const minimum = metrics.minFontSize;
  const actual = offenders.length ? Math.min(...offenders.map((item) => item.fontSize))
    : Math.max(Number.isFinite(minimum) ? minimum : rule.min, rule.min);
  return {actual, offenders};
}

function measurement(metrics, rule) {
  if (['bodyFontSize', 'chipFontSize'].includes(rule.id)) return fontMeasurement(metrics, rule);
  const value = readMetric(metrics, rule.metric);
  if (Array.isArray(value)) return {actual: value.length, offenders: value};
  let offenders = [];
  if (rule.id === 'horizontalOverflow') offenders = metrics.overflowElements || [];
  if (rule.id === 'headerHeight' && metrics.header) offenders = [metrics.header];
  if (rule.id === 'noticeHeight' && metrics.notice) offenders = [metrics.notice];
  return {actual: value ?? null, offenders};
}

function comparison(actual, rule, context) {
  if ('equalsContext' in rule) {
    const limit = context[rule.equalsContext];
    return {limit, passed: actual === limit && actual !== null};
  }
  if ('equals' in rule) return {limit: rule.equals, passed: actual === rule.equals};
  const finite = typeof actual === 'number' && Number.isFinite(actual);
  if (rule.min !== undefined && rule.min !== null) {
    return {limit: rule.min, passed: finite && actual >= rule.min};
  }
  return {limit: rule.max, passed: finite && actual <= rule.max};
}

export function evaluateBudgets(metrics, context, budgets) {
  const rows = [];
  for (const configured of budgets.budgets) {
    let rule = {...configured};
    for (const override of configured.overrides || []) {
      if (matches(override, context)) rule = {...rule, ...override};
    }
    if (rule.max === null && rule.min == null && !('equals' in rule)
      && !('equalsContext' in rule)) continue;
    if (rule.id === 'firstScreen' && metrics.firstScreen?.skipped) {
      rows.push({budget: rule.id, severity: 'warn', passed: false, skipped: true,
        actual: null, limit: rule.max, offenders: [], reason: metrics.firstScreen.reason});
      continue;
    }
    const {actual, offenders} = measurement(metrics, rule);
    const {limit, passed} = comparison(actual, rule, context);
    rows.push({budget: rule.id, severity: rule.severity, passed, actual, limit,
      offenders: passed ? [] : offenders});
  }
  return rows;
}
