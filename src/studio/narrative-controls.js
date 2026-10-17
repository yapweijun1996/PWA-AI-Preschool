import { narrativeChip } from '../class-view.js';
import { el, button } from './ui.js';

export function narrativeControls(ctx, child, record, id) {
  const root = el('section', undefined, 'narrative-box');
  const key = `${child.id}:${record.semester}:${id}`;
  const source = el('p', narrativeChip(record.narratives[id]), 'chip');
  const stale = el('p', 'Narrative may be out of date', 'stale');
  const rejected = el('p', '', 'provider-warning');
  rejected.setAttribute('role', 'status');
  const label = el('label', 'Narrative (teacher editable)');
  const narrative = el('textarea');
  narrative.maxLength = 2000;
  narrative.value = record.narratives[id]?.text ?? '';
  narrative.placeholder = 'No narrative yet';
  label.append(narrative);
  const baseline = narrative.value;
  const count = el('p', `${narrative.value.length} / 2000`, 'hint');
  narrative.addEventListener('input', () => {
    const old = record.narratives[id];
    record.narratives[id] = { ...old, text: narrative.value,
      source: old?.source ?? 'teacher',
      edited: old?.edited === true || narrative.value !== baseline };
    ctx.change(record);
    source.textContent = narrativeChip(record.narratives[id]);
    count.textContent = `${narrative.value.length} / 2000`;
  });
  const draft = button('Draft narrative', async () => {
    await ctx.runDraft(() => ctx.draft(child, record, [id]));
    narrative.value = record.narratives[id]?.text ?? '';
    source.textContent = narrativeChip(record.narratives[id]);
    count.textContent = `${narrative.value.length} / 2000`;
  }, true);
  const offline = el('p',
    'Offline: select Offline mock or reconnect before remote drafting.', 'provider-warning');
  const update = () => {
    stale.hidden = !ctx.stale.has(key);
    rejected.textContent = ctx.rejections.get(key) ?? '';
    rejected.hidden = !rejected.textContent;
    draft.disabled = ctx.busy || (ctx.provider.id !== 'mock' && ctx.isOffline());
    offline.hidden = ctx.provider.id === 'mock' || !ctx.isOffline();
    narrative.disabled = ctx.busy;
  };
  root.dispose = ctx.subscribe(update);
  root.append(source, stale, rejected, offline, label, count, draft);
  update();
  return root;
}
