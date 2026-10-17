import { DOMAINS } from '../portfolio-model.js';

export async function draftReadyChildren(ctx, children) {
  const semester = ctx.semester;
  let count = 0;
  let attention = 0;
  for (const [index, child] of children.entries()) {
    ctx.provider.status = `drafting: ${index + 1} of ${children.length}`;
    ctx.notify();
    try {
      const rejected = await ctx.draft(child, ctx.current(child.id, semester),
        DOMAINS.map(domain => domain.id));
      const size = Object.keys(rejected).length;
      attention += size;
      if (!size) count++;
    } catch (error) {
      throw new Error(`Stopped at ${index + 1} of ${children.length}; ${count} children drafted; `
        + `${attention} domains need attention. ${error.message}`);
    }
  }
  ctx.announce(`${count} of ${children.length} children fully drafted; `
    + `${attention} domains need attention.`);
  return { count, attention };
}
