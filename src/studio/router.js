export const NAV_ITEMS = Object.freeze([
  { name: 'home', label: 'Home', icon: 'home', tab: 'Home', path: '/' },
  { name: 'classes', label: 'Class portfolios', icon: 'folders', tab: 'Classes', path: '/classes' },
  { name: 'students', label: 'Students', icon: 'users', tab: 'Students', path: '/students' },
  { name: 'evidence', label: 'Evidence library', icon: 'image', tab: 'More', path: '/evidence' },
  { name: 'drafts', label: 'AI drafts', icon: 'pencil', tab: 'Drafts', path: '/drafts' },
  { name: 'reports', label: 'Reports', icon: 'file', tab: 'More', path: '/reports' },
  { name: 'ai-settings', label: 'AI provider settings', icon: 'settings', tab: 'More',
    path: '/settings/ai' },
  { name: 'about', label: 'About and privacy', icon: 'info', tab: 'More', path: '/about' }
]);

export function buildRoute(name, params = {}) {
  const { childId, semester = '2026-S2', domain } = params;
  const item = NAV_ITEMS.find(item => item.name === name);
  if (name === 'classes' && params.filter === 'ready-for-draft') {
    return '#/classes?filter=ready-for-draft';
  }
  if (name === 'reports' && params.semester && ['2026-S1', '2026-S2'].includes(semester)) {
    const query = new URLSearchParams({ sem: semester });
    if (childId) query.set('child', childId);
    return `#/reports?${query}`;
  }
  if (item) return `#${item.path}`;
  if (!['2026-S1', '2026-S2'].includes(semester)) return '#/';
  if (name === 'print-class') return `#/print-class?sem=${semester}`;
  if (typeof childId !== 'string' || !childId.trim()) return '#/';
  let id;
  try {
    id = encodeURIComponent(childId);
  } catch {
    return '#/';
  }
  if (name === 'student-profile') return `#/students/${id}`;
  const path = name === 'child-editor' ? `/classes/class-a/children/${id}`
    : name === 'print' ? `/print/${id}` : null;
  const tab = ['english', 'chinese', 'mathematics', 'social-emotional', 'review'].includes(domain)
    && name === 'child-editor' ? `&domain=${domain}` : '';
  return path ? `#${path}?sem=${semester}${tab}` : '#/';
}

export function legacyRedirect(hash) {
  const match = /^#\/child\/([^/?#]+)(\?sem=2026-S[12])?$/.exec(hash ?? '');
  if (!match) return null;
  return `#/classes/class-a/children/${match[1]}${match[2] ?? '?sem=2026-S2'}`;
}

export function parseRoute(hash) {
  const source = legacyRedirect(hash) ?? hash;
  if (!source || source === '#') return { name: 'home' };
  if (source === '#/classes?filter=ready-for-draft') {
    return { name: 'classes', filter: 'ready-for-draft' };
  }
  const reports = /^#\/reports\?sem=(2026-S[12])(?:&child=([^&#]+))?$/.exec(source);
  if (reports) {
    try {
      return { name: 'reports', semester: reports[1],
        ...(reports[2] ? { childId: decodeURIComponent(reports[2]) } : {}) };
    } catch { return { name: 'home', unknown: true, message: 'Unknown route. Home is shown.' }; }
  }
  const tab = /&domain=(english|chinese|mathematics|social-emotional|review)$/.exec(source);
  if (tab && source.startsWith('#/classes/class-a/children/')) {
    const route = parseRoute(source.slice(0, tab.index));
    if (route.name === 'child-editor') return { ...route, domain: tab[1] };
  }
  const item = NAV_ITEMS.find(item => `#${item.path}` === source);
  if (item) return { name: item.name };
  const childPath = /^#\/(classes\/class-a\/children|students|print)\/([^/?#]+)(?:\?sem=(2026-S[12]))?$/;
  const match = childPath.exec(source);
  const batch = /^#\/print-class(?:\?sem=(2026-S[12]))?$/.exec(source);
  if (batch) return { name: 'print-class', semester: batch[1] ?? '2026-S2' };
  if (match) {
    try {
      const childId = decodeURIComponent(match[2]);
      if (!childId.trim()) throw new Error('Empty child');
      const name = match[1] === 'students' ? 'student-profile'
        : match[1] === 'print' ? 'print' : 'child-editor';
      if (name === 'student-profile') {
        if (match[3]) throw new Error('Profile uses the shared semester');
        return { name, childId };
      }
      return { name, childId, semester: match[3] ?? '2026-S2' };
    } catch { /* Malformed paths resolve to a visible Home notice. */ }
  }
  return { name: 'home', unknown: true, message: 'Unknown route. Home is shown.' };
}

export function parentModule(name) {
  if (name === 'child-editor') return 'classes';
  if (name === 'student-profile') return 'students';
  if (name === 'print' || name === 'print-class') return 'reports';
  return name;
}
