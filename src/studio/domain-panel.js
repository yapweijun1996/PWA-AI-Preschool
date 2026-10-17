import { RATINGS } from '../portfolio-model.js';
import { comparisonText, editorModel } from './editor-model.js';
import { el, ratingChip } from './ui.js';
import { photoControls } from './photo-controls.js';
import { narrativeControls } from './narrative-controls.js';

export function domainPanel(ctx, child, record, domain) {
  const root = el('section', undefined, 'domain editor-domain');
  const heading = el('header', undefined, 'editor-domain-heading');
  const symbol = el('span', { english: 'EN', chinese: 'ZH', mathematics: '123',
    'social-emotional': 'SE' }[domain.id], 'editor-domain-symbol');
  symbol.setAttribute('aria-hidden', 'true');
  const description = {
    english: 'Listening, speaking, vocabulary and early literacy',
    chinese: 'Listening, speaking and early Chinese literacy',
    mathematics: 'Numbers, patterns, shapes and problem solving',
    'social-emotional': 'Relationships, self-awareness and emotional development'
  };
  const title = el('div');
  title.append(el('h2', domain.label), el('p', description[domain.id]));
  heading.append(symbol, title);
  const columns = el('div', undefined, 'editor-domain-columns');
  const evidence = el('div', undefined, 'editor-evidence');
  root.append(heading, columns);
  const key = `${child.id}:${record.semester}:${domain.id}`;
  const entry = record.domains[domain.id];
  const comparison = el('section', undefined, 'editor-comparison');
  comparison.hidden = record.semester !== '2026-S2';
  const update = () => {
    if (record.semester === '2026-S2') {
      const row = editorModel(record, ctx.get(child.id, '2026-S1'))
        .comparisons.find(item => item.domain === domain.id);
      comparison.setAttribute('aria-label', comparisonText(row));
      const before = el('div');
      before.append(el('span', 'Semester 1'), row.previous === null
        ? el('span', 'Not rated in Semester 1', 'chip') : ratingChip(row.previous));
      const after = el('div');
      after.append(el('span', 'Semester 2'), row.current === null
        ? el('span', 'Not rated in Semester 2', 'chip') : ratingChip(row.current));
      const change = row.change === null ? 'No comparison'
        : row.change > 0 ? `+${row.change}` : String(row.change);
      const track = el('div', undefined, 'editor-comparison-track');
      track.append(before, el('span', '→', 'editor-comparison-arrow'), after,
        el('strong', change, 'editor-comparison-change'));
      comparison.replaceChildren(el('h3', 'Change from previous semester'), track);
    }
  };
  const change = () => {
    if (record.narratives[domain.id]) ctx.stale.add(key);
    ctx.change(record);
    update();
  };
  evidence.append(ratingControl(entry, domain.id, change));
  const label = el('label', 'Teacher comment', 'editor-comment-label');
  const comment = el('textarea');
  comment.maxLength = 1000;
  comment.value = entry.comment;
  label.append(comment);
  const count = el('p', `${comment.value.length} / 1000`, 'hint editor-character-count');
  comment.addEventListener('input', () => {
    entry.comment = comment.value;
    count.textContent = `${comment.value.length} / 1000`;
    change();
  });
  const photos = photoControls(ctx, record, domain.id);
  const narrative = narrativeControls(ctx, child, record, domain.id);
  evidence.append(label, count, comparison);
  columns.append(evidence, photos, narrative);
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
  const fieldset = el('fieldset', undefined, 'editor-rating-control');
  fieldset.append(el('legend', 'Current rating'));
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
