import { DOMAINS } from '../portfolio-model.js';
import { NarrativeDraftError } from '../narrative.js';

export async function draftReadyChildren(ctx, children) {
  const semester = ctx.semester;
  let count = 0;
  let attention = 0;
  ctx.batch = { completed: 0, total: children.length, semester };
  ctx.notify();
  for (const [index, child] of children.entries()) {
    ctx.provider.status = `drafting: ${index + 1} of ${children.length}`;
    ctx.notify();
    try {
      const rejected = await ctx.draft(child, ctx.current(child.id, semester),
        DOMAINS.map(domain => domain.id));
      const size = Object.keys(rejected).length;
      attention += size;
      if (!size) count++;
      ctx.batch.completed = index + 1;
      ctx.notify();
    } catch (error) {
      const reason = error instanceof NarrativeDraftError ? error.message
        : 'AI request failed. Check the connection, model, permissions or quota, then retry. '
          + 'No narratives were changed.';
      throw new NarrativeDraftError(
        `Stopped at ${index + 1} of ${children.length}; ${count} children drafted; `
        + `${attention} domains need attention. ${reason}`);
    }
  }
  ctx.announce(`${count} of ${children.length} children fully drafted; `
    + `${attention} domains need attention.`);
  return { count, attention };
}
