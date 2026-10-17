import { t } from './i18n/index.js';

export const ILLUSTRATION_CAPTION = t('ui.demo.illustration', {}, 'en');
export const UPLOAD_CAPTION = t('ui.demo.upload', {}, 'en');
export const STORED_DEMO_CAPTION = t('ui.demo.storedImage', {}, 'en');

const sceneDescriptionKeys = [
  'ui.media.sceneOne',
  'ui.media.sceneTwo',
  'ui.media.sceneThree',
  'ui.media.sceneFour',
  'ui.media.sceneFive',
  'ui.media.sceneSix',
  'ui.media.sceneSeven',
  'ui.media.sceneEight',
  'ui.media.sceneNine',
  'ui.media.sceneTen',
  'ui.media.sceneEleven',
  'ui.media.sceneTwelve'
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
  const index = hash % sceneDescriptionKeys.length;
  return {
    src: `assets/demo/scene-${String(index + 1).padStart(2, '0')}.webp`,
    alt: t(sceneDescriptionKeys[index], {}, 'en')
  };
}

export function samplePhotoDescriptionKey(photo) {
  const match = /^assets\/demo\/scene-(\d{2})\.webp$/.exec(photo.src);
  const key = match && sceneDescriptionKeys[Number(match[1]) - 1];
  // An edited description is teacher evidence, not interface copy.
  return key && photo.alt === t(key, {}, 'en') ? key : null;
}

export function photoProvenance(src, language = 'en') {
  const key = src.startsWith('data:image/svg+xml,') ? 'ui.demo.storedImage'
    : /^assets\/demo\/scene-\d{2}\.webp$/.test(src) ? 'ui.demo.illustration' : 'ui.demo.upload';
  return t(key, {}, language);
}
