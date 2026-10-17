const controls = /[\p{Cc}\p{Cf}]/u;
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

export function normalizeChildName(value) {
  if (typeof value !== 'string' || controls.test(value))
    throw new Error('Use a child name without control characters.');
  const name = value.normalize('NFC').trim();
  if (Array.from(name).length < 1 || Array.from(name).length > 60)
    throw new Error('Use a child name between 1 and 60 characters.');
  return name;
}

export function childInitials(value) {
  const parts = String(value).normalize('NFC').trim().split(/\s+/u).filter(Boolean);
  const first = part => segmenter.segment(part)[Symbol.iterator]().next().value?.segment ?? '';
  return (parts.length > 1 ? first(parts[0]) + first(parts.at(-1)) : first(parts[0] ?? ''))
    .toLocaleUpperCase('en');
}
