import { DOMAINS, computeStatus } from '../../portfolio-model.js';
import { narrativeChip } from '../../class-view.js';
import { buildRoute } from '../router.js';

export function draftsModel(ctx) {
  const ready = [];
  const queue = [];
  const rejected = [];
  for (const child of ctx.children) {
    const record = ctx.get(child.id);
    if (computeStatus(record) === 'ready-for-draft') ready.push(child);
    const narratives = DOMAINS.flatMap(domain => {
      const narrative = record.narratives[domain.id];
      return narrative?.text.trim() ? [{ domain: domain.label,
        source: narrativeChip(narrative) }] : [];
    });
    if (!record.reviewed && narratives.length) queue.push({ child, narratives,
      href: buildRoute('child-editor', {
        childId: child.id, semester: ctx.semester, domain: 'review'
      }) });
    for (const domain of DOMAINS) {
      const reason = ctx.rejections.get(`${child.id}:${ctx.semester}:${domain.id}`);
      if (reason) rejected.push({ child, domain, reason,
        href: buildRoute('child-editor', {
          childId: child.id, semester: ctx.semester, domain: domain.id
        }) });
    }
  }
  return { ready, queue, rejected };
}
