import {
  DOMAINS, emptyRecord, narrativeInputFor, validateRecord
} from './portfolio-model.js';
import { mockNarrative } from './narrative.js';

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
  initials: index < 6
    ? ['LYN', 'CXH', 'HYA', 'WYQ', 'LMC', 'ZKX'][index]
    : name.split(/\s+/).map(part => part[0]).join('')
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
    [
      '需要老师示范和提示，才能跟着说出图片中的物品名称。',
      '在老师陪伴下尝试用华文问好，仍需要逐句提示。',
      '听故事时需要老师指着图片，才能回答简单的问题。',
      '参加儿歌活动时需要老师带领，才愿意跟着说词语。'
    ],
    [
      '能自己用华文向同伴问好，表达需要时仍需老师提示。',
      '能说出熟悉物品的名称，描述用途时还需要图片提示。',
      '能独自跟唱熟悉的儿歌，遇到新的词语时需要示范。',
      '能听懂熟悉的华文指令，回答故事问题时偶尔需要提示。'
    ],
    [
      '能独立用华文说出自己的需要，并清楚回应同伴的提问。',
      '能独立说出图片中的物品名称，并用短句描述其用途。',
      '听完熟悉的故事后，能独立用华文说出主要情节。',
      '能独立听懂华文活动指令，并用完整短句分享自己的想法。'
    ],
    [
      '能用华文描述故事情节，还主动提出不同的故事结尾。',
      '能用完整短句描述物品，还主动比较它们的相同和不同。',
      '能熟练朗读熟悉的儿歌，还尝试替换词语编出新的句子。',
      '能清楚用华文分享想法，还主动追问同伴并说明自己的理由。'
    ]
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
        const previous = semester === '2026-S2'
          ? records[childIndex].domains[domain.id].rating : null;
        // Occasional gains of two and one possible dip; otherwise steady progress.
        const change = childIndex % 5 === 0 && domainIndex === 0 ? 2
          : childIndex % 4 === 3 && domainIndex === 1 ? -1
          : Math.floor(random() * 2);
        const baseline = 1 + Math.floor(random() * 4);
        const rating = previous === null
          ? childIndex % 5 === 0 && domainIndex === 0
            ? Math.min(2, baseline) : baseline
          : Math.max(1, Math.min(4, previous + change));
        const observation = domain.id === 'chinese' ? ''
          : comments[domain.id][rating === 1 ? 3
            : rating === 2 ? 0 : rating === 3 ? 1 : 2];
        record.domains[domain.id].rating = rating;
        record.domains[domain.id].comment = observation;
        if (childIndex % 4 === 0 && domainIndex === 0) {
          const photoCount = childIndex % 8 === 0 ? 2 : 1;
          record.domains[domain.id].photos = Array.from({ length: photoCount }, (_, index) => {
            const id = `${child.id}-${semester}-${domain.id}-${index + 1}`;
            const alt = `Fictional sample activity ${index + 1}`;
            return { id, alt, src: placeholderPhoto(id, alt) };
          });
        }
      }
      // Add Chinese observations only where the domain already has a rating.
      const chinese = record.domains.chinese;
      if (semester === '2026-S1') chinese.rating = 1 + childIndex % 4;
      if (chinese.rating !== null) {
        const pool = comments.chinese[chinese.rating - 1];
        chinese.comment = pool[Math.floor(childIndex / 4) % pool.length];
      }
      if (semester === '2026-S1' && childIndex < 5) {
        const input = narrativeInputFor(child, record);
        for (const { id } of DOMAINS) {
          record.narratives[id] = mockNarrative(input.domains[id]);
        }
      }
      records.push(validateRecord(record));
    }
  }
  return records;
}
