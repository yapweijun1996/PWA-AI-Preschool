export const ILLUSTRATION_CAPTION = 'AI-generated illustration, not a real child';
export const UPLOAD_CAPTION = 'Uploaded in this browser';
export const STORED_DEMO_CAPTION = 'Demo image stored in this browser';

const sceneDescriptions = [
  'Fictional children building a tower with wooden blocks',
  'A fictional teacher reading a picture book with children',
  'Fictional children threading colourful beads at a table',
  'Fictional children painting flowers and a tree together',
  'Fictional children sharing fruit and snacks at a table',
  'Fictional children building sandcastles outdoors',
  'Fictional children playing musical instruments in a circle',
  'Fictional children sorting colourful shapes into trays',
  'Fictional children planting seedlings in flowerpots',
  'Fictional children assembling a large woodland puzzle',
  'Fictional children playing with a ball in a playground',
  'Fictional children drawing wavy lines on a classroom board'
];

export function avatarSource(childId) {
  const match = /^C-(\d{2})$/.exec(childId ?? '');
  const index = match ? Number(match[1]) : 0;
  return index >= 1 && index <= 20 ? `assets/demo/avatar-${match[1]}.webp` : '';
}

export function samplePhoto(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  }
  const index = hash % sceneDescriptions.length;
  return {
    src: `assets/demo/scene-${String(index + 1).padStart(2, '0')}.webp`,
    alt: sceneDescriptions[index]
  };
}

export function photoProvenance(src) {
  if (src.startsWith('data:image/svg+xml,')) return STORED_DEMO_CAPTION;
  return /^assets\/demo\/scene-\d{2}\.webp$/.test(src)
    ? ILLUSTRATION_CAPTION : UPLOAD_CAPTION;
}
