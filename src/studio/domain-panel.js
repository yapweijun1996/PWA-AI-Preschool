import { RATINGS } from '../portfolio-model.js';
import { comparisonText, editorModel } from './editor-model.js';
import { el } from './ui.js';
import { photoControls } from './photo-controls.js';
import { narrativeControls } from './narrative-controls.js';

export function domainPanel(ctx, child, record, domain) {
  const root = el('section', undefined, 'domain');
  root.append(el('h2', domain.label));
  const key = `${child.id}:${record.semester}:${domain.id}`;
  const entry = record.domains[domain.id];
  const comparison = el('p', undefined, 'comparison');
  const update = () => {
    if (record.semester === '2026-S2') {
      comparison.textContent = comparisonText(editorModel(record,
        ctx.get(child.id, '2026-S1')).comparisons.find(item => item.domain === domain.id));
    }
  };
  const change = () => {
    if (record.narratives[domain.id]) ctx.stale.add(key);
    ctx.change(record);
    update();
  };
  root.append(ratingControl(entry, domain.id, change));
  const label = el('label', 'Teacher comment');
  const comment = el('textarea');
  comment.maxLength = 1000;
  comment.value = entry.comment;
  label.append(comment);
  const count = el('p', `${comment.value.length} / 1000`, 'hint');
  comment.addEventListener('input', () => {
    entry.comment = comment.value;
    count.textContent = `${comment.value.length} / 1000`;
    change();
  });
  const photos = photoControls(ctx, record, domain.id);
  const narrative = narrativeControls(ctx, child, record, domain.id);
  root.append(label, count, comparison, photos, narrative);
  const unsubscribe = ctx.subscribe(() => {
    comment.disabled = ctx.busy;
    root.querySelector('fieldset').disabled = ctx.busy;
  });
  root.dispose = () => {
    photos.dispose();
    narrative.dispose();
    unsubscribe();
  };
  update();
  return root;
}

function ratingControl(entry, id, change) {
  const fieldset = el('fieldset');
  fieldset.append(el('legend', 'Rating'));
  for (const rating of RATINGS) {
    const label = el('label', undefined, 'rating-choice');
    label.dataset.rating = rating.label.toLowerCase();
    const input = el('input');
    input.type = 'radio';
    input.name = `rating-${id}`;
    input.value = String(rating.value);
    input.checked = entry.rating === rating.value;
    input.addEventListener('change', () => {
      entry.rating = rating.value;
      change();
    });
    label.append(input, el('span', rating.label));
    fieldset.append(label);
  }
  return fieldset;
}
