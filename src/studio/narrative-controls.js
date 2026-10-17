import { narrativeChip } from '../class-view.js';
import { el, button, offlineState, rejectedState } from './ui.js';

export function narrativeControls(ctx, child, record, id) {
  const root = el('section', undefined, 'narrative-box');
  const key = `${child.id}:${record.semester}:${id}`;
  const source = el('p', undefined, 'chip narrative-source');
  const stale = el('p', 'Narrative may be out of date', 'stale');
  const rejected = el('div');
  const label = el('label', 'Narrative (teacher editable)', 'editor-narrative-label');
  const narrative = el('textarea');
  narrative.maxLength = 2000;
  narrative.value = record.narratives[id]?.text ?? '';
  narrative.placeholder = 'No narrative yet';
  label.append(narrative);
  const baseline = narrative.value;
  const count = el('p', `${narrative.value.length} / 2000`, 'hint editor-character-count');
  narrative.addEventListener('input', () => {
    const old = record.narratives[id];
    record.narratives[id] = { ...old, text: narrative.value,
      source: old?.source ?? 'teacher',
      edited: old?.edited === true || narrative.value !== baseline };
    ctx.rejections.delete(key);
    ctx.change(record);
    count.textContent = `${narrative.value.length} / 2000`;
  });
  const draft = button('Draft narrative', async () => {
    await ctx.runDraft(() => ctx.draft(child, record, [id]));
    narrative.value = record.narratives[id]?.text ?? '';
    count.textContent = `${narrative.value.length} / 2000`;
  }, true);
  const offline = offlineState();
  const update = () => {
    source.textContent = record.narratives[id]?.text.trim()
      ? narrativeChip(record.narratives[id]) : 'No narrative';
    stale.hidden = !ctx.stale.has(key);
    const reason = ctx.rejections.get(key);
    rejected.replaceChildren();
    if (reason) rejected.append(rejectedState(reason, button('Write it yourself', () => {
      narrative.focus();
    })));
    rejected.hidden = !reason;
    draft.disabled = ctx.busy || (ctx.provider.id !== 'mock' && ctx.isOffline());
    offline.hidden = ctx.provider.id === 'mock' || !ctx.isOffline();
    narrative.disabled = ctx.busy;
  };
  root.dispose = ctx.subscribe(update);
  draft.className = 'primary editor-draft-narrative';
  root.append(stale, rejected, offline, label, count, source, draft);
  update();
  return root;
}
