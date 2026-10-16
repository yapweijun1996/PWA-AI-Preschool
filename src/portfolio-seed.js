import { DOMAINS, emptyRecord, validateRecord } from './portfolio-model.js';

export const CLASS = Object.freeze({
  id: 'class-a',
  name: 'Class A (Sample)',
  teacher: 'Sample Teacher'
});

const names = [
  '林悦宁', '陈星禾', '黄以安', '吴语晴', '李沐辰', '周可欣',
  'Avery W.', 'Briar P.', 'Cleo T.', 'Dorian M.', 'Elowen B.', 'Finnley R.',
  'Greer L.', 'Hollis N.', 'Indie S.', 'Juniper K.', 'Kit V.', 'Larkin D.',
  'Marlowe J.', 'Nova F.'
];

// All identities and observations in this module are fictional sample data.
export const CHILDREN = Object.freeze(names.map((name, index) => Object.freeze({
  id: `C-${String(index + 1).padStart(2, '0')}`,
  name,
  initials: index < 6 ? ['LYN', 'CXH', 'HYA', 'WYQ', 'LMC', 'ZKX'][index] : name.split(/\s+/).map(part => part[0]).join('')
})));

function hashSeed(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  }
  return hash;
}

function randomSource(seed) {
  let state = hashSeed(seed);
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function escapeXml(text) {
  return text.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);
}

export function placeholderPhoto(seed, label) {
  const random = randomSource(seed);
  const hue = Math.floor(random() * 360);
  const circleX = 35 + Math.floor(random() * 80);
  // Bound the visible label so even multibyte text remains a tiny inline image.
  const caption = escapeXml(Array.from(String(label)).slice(0, 48).join(''));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160"><rect width="240" height="160" rx="12" fill="hsl(${hue},45%,90%)"/><circle cx="${circleX}" cy="55" r="23" fill="hsl(${hue},45%,60%)"/><path d="M120 100l32-50 40 50z" fill="hsl(${(hue + 70) % 360},45%,65%)"/><text x="12" y="140" font-size="12" fill="#243444">${caption}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const comments = {
  english: [
    'Retells a familiar picture-book event using short sentences and points to supporting illustrations.',
    'Recognizes the first sound in familiar names and joins in with repeated story phrases.',
    'Uses new vocabulary during pretend play and listens while a partner shares an idea.',
    'Needs a gentle prompt to answer story questions, then shares an idea with the small group.'
  ],
  chinese: [
    'Joins familiar Mandarin songs and matches several spoken words to picture cards.',
    'Uses short Mandarin greetings independently and repeats new words during story time.',
    'Names familiar objects in Mandarin with picture support and enjoys taking a turn in word games.',
    'Listens attentively to a Mandarin story and responds to simple instructions with a little prompting.'
  ],
  mathematics: [
    'Counts a small collection with one-to-one correspondence and checks the total by counting again.',
    'Sorts blocks by shape and explains a repeating pattern using the classroom materials.',
    'Compares two groups using more and fewer and explores ways to make the groups equal.',
    'Recognizes common shapes and needs a reminder to touch each object once when counting.'
  ],
  'social-emotional': [
    'Invites a peer to join block play and negotiates a shared plan with occasional adult support.',
    'Names a feeling and uses a familiar calming strategy before returning to the group activity.',
    'Waits for a turn during a small-group game and offers encouragement to a classmate.',
    'Seeks help during a disagreement and is practicing expressing a need in a calm voice.'
  ]
};

export function seedRecords(seed = 'portfolio-phase-1') {
  const random = randomSource(seed);
  const records = [];
  for (const semester of ['2026-S1', '2026-S2']) {
    for (const [childIndex, child] of CHILDREN.entries()) {
      const record = emptyRecord(child.id, semester);
      const full = semester === '2026-S1' || childIndex < 3;
      const partial = semester === '2026-S2' && childIndex >= 3 && childIndex < 8;
      const filledCount = full ? DOMAINS.length : partial ? 1 + childIndex % 3 : 0;
      for (const [domainIndex, domain] of DOMAINS.entries()) {
        if (domainIndex >= filledCount) continue;
        const observation = comments[domain.id][Math.floor(random() * comments[domain.id].length)];
        record.domains[domain.id].rating = 1 + Math.floor(random() * 4);
        record.domains[domain.id].comment = observation;
        if (childIndex % 4 === 0 && domainIndex === 0) {
          const photoCount = childIndex % 8 === 0 ? 2 : 1;
          record.domains[domain.id].photos = Array.from({ length: photoCount }, (_, index) => {
            const id = `${child.id}-${semester}-${domain.id}-${index + 1}`;
            const alt = `Fictional sample activity ${index + 1}`;
            return { id, alt, src: placeholderPhoto(id, alt) };
          });
        }
        if (semester === '2026-S1' && childIndex < 5) {
          record.narratives[domain.id] = {
            text: `Mock draft — fictional sample only. ${observation} Next, offer another supported opportunity to practice this skill in a small group.`,
            source: 'mock',
            edited: false
          };
        }
      }
      records.push(validateRecord(record));
    }
  }
  return records;
}
