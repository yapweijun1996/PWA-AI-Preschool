import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASS, CHILDREN, placeholderPhoto, seedRecords } from '../src/portfolio-seed.js';
import { DOMAINS, RATINGS, recordProgress, validateRecord } from '../src/portfolio-model.js';

function stateCounts(records, semester) {
  const counts = {};
  for (const record of records.filter(item => item.semester === semester)) {
    const { status } = recordProgress(record);
    counts[status] = (counts[status] || 0) + 1;
  }
  return counts;
}

test('the sample class has twenty unique fictional identities and six Chinese names', () => {
  assert.deepEqual(CLASS, { id: 'class-a', name: 'Class A (Sample)', teacher: 'Sample Teacher' });
  assert.equal(CHILDREN.length, 20);
  assert.deepEqual(CHILDREN.map(child => child.id), Array.from({ length: 20 }, (_, index) => `C-${String(index + 1).padStart(2, '0')}`));
  assert.equal(new Set(CHILDREN.map(child => child.id)).size, 20);
  assert.equal(new Set(CHILDREN.map(child => child.name)).size, 20);
  assert.equal(CHILDREN.filter(child => /\p{Script=Han}/u.test(child.name)).length, 6);
  assert.ok(CHILDREN.every(child => typeof child.initials === 'string' && /^[A-Z]+$/.test(child.initials)));
});

test('seed calls are deterministic, customizable, and independently mutable', () => {
  const first = seedRecords();
  assert.deepEqual(first, seedRecords());
  assert.deepEqual(seedRecords('repeatable'), seedRecords('repeatable'));
  assert.notDeepEqual(seedRecords('repeatable'), seedRecords('different'));
  first[0].domains.english.comment = 'Changed only in this returned copy.';
  first[0].domains.english.photos[0].alt = 'Changed label';
  first[0].narratives.english.text = 'Changed narrative';
  const fresh = seedRecords();
  assert.notEqual(first[0].domains.english.comment, fresh[0].domains.english.comment);
  assert.notEqual(first[0].domains.english.photos[0].alt, fresh[0].domains.english.photos[0].alt);
  assert.notEqual(first[0].narratives.english.text, fresh[0].narratives.english.text);
});

test('all forty seed records are normalized and cover both semesters for every child', () => {
  const records = seedRecords();
  assert.equal(records.length, 40);
  assert.equal(new Set(records.map(record => `${record.childId}/${record.semester}`)).size, 40);
  for (const child of CHILDREN) {
    assert.deepEqual(records.filter(record => record.childId === child.id).map(record => record.semester), ['2026-S1', '2026-S2']);
  }
  for (const record of records) assert.deepEqual(validateRecord(record), record);
});

test('all Chinese seed observations are varied, bounded Simplified Chinese', () => {
  const byRating = new Map([1, 2, 3, 4].map(rating => [rating, new Set()]));
  const traditional = /[學習認語說讀寫數與為這個們會來時體發現觀錄證據評穩華簡單親師進從於畫圖樂歡獨讓點動實練舉]/u;
  for (const record of seedRecords()) {
    const { rating, comment } = record.domains.chinese;
    if (comment) {
      assert.match(comment, /\p{Script=Han}/u);
      assert.doesNotMatch(comment, traditional);
      assert.ok(Array.from(comment).length >= 15);
      assert.ok(Array.from(comment).length <= 60);
      byRating.get(rating).add(comment);
    }
    for (const { id } of DOMAINS.filter(domain => domain.id !== 'chinese')) {
      assert.doesNotMatch(record.domains[id].comment, /\p{Script=Han}/u);
    }
  }
  for (const comments of byRating.values()) assert.ok(comments.size >= 4);
});

test('semester one is complete with five fully mock-drafted children and a photo subset', () => {
  const records = seedRecords().filter(record => record.semester === '2026-S1');
  assert.deepEqual(stateCounts(records, '2026-S1'), { drafted: 5, 'ready-for-draft': 15 });
  const drafted = records.filter(record => record.status === 'drafted');
  assert.equal(drafted.length, 5);
  let photoDomains = 0;
  const observedComments = new Set();
  for (const record of records) {
    for (const domain of DOMAINS) {
      const entry = record.domains[domain.id];
      assert.ok(Number.isInteger(entry.rating) && entry.rating >= 1 && entry.rating <= 4);
      assert.ok(entry.comment.trim().length > 0);
      observedComments.add(entry.comment);
      if (entry.photos.length) {
        photoDomains++;
        assert.ok(entry.photos.length === 1 || entry.photos.length === 2);
      }
      if (drafted.includes(record)) {
        assert.equal(record.narratives[domain.id].source, 'mock');
        assert.equal(record.narratives[domain.id].edited, false);
        const text = record.narratives[domain.id].text;
        assert.equal(text.split(entry.comment).length - 1, 1);
        if (domain.id === 'chinese') {
          assert.match(text, /\p{Script=Han}/u);
          assert.doesNotMatch(text, /\p{Script=Latin}/u);
          assert.ok(text.includes([null, '起步', '发展中', '熟练', '拓展'][entry.rating]));
        } else {
          assert.doesNotMatch(text, /\p{Script=Han}/u);
          assert.equal(text.split(RATINGS[entry.rating - 1].label).length - 1, 1);
        }
      } else {
        assert.equal(record.narratives[domain.id], null);
      }
    }
  }
  assert.ok(observedComments.size > DOMAINS.length);
  assert.ok(photoDomains > 0 && photoDomains < records.length);
});

test('semester two has three ready, five partial and twelve completely unstarted records', () => {
  const records = seedRecords().filter(record => record.semester === '2026-S2');
  assert.deepEqual(stateCounts(records, '2026-S2'), {
    'ready-for-draft': 3,
    'in-progress': 5,
    'not-started': 12
  });
  const partial = records.filter(record => recordProgress(record).status === 'in-progress');
  assert.ok(partial.filter(record => record.domains.chinese.comment !== '').length >= 2);
  for (const record of partial) {
    const { readyCount } = recordProgress(record);
    assert.ok(readyCount > 0 && readyCount < DOMAINS.length);
  }
  for (const record of records) {
    assert.ok(Object.values(record.narratives).every(value => value === null));
    if (recordProgress(record).status === 'not-started') {
      for (const { id } of DOMAINS) {
        const entry = record.domains[id];
        assert.equal(entry.rating, null);
        assert.equal(entry.comment, '');
        assert.deepEqual(entry.photos, []);
      }
    }
  }
});

test('semester progress is mostly steady with bounded gains and isolated dips', () => {
  for (const seed of ['portfolio-phase-1', 'repeatable', 'different']) {
    const records = seedRecords(seed);
    let pairs = 0;
    let steady = 0;
    let largeGains = 0;
    for (const child of CHILDREN) {
      const previous = records.find(record =>
        record.childId === child.id && record.semester === '2026-S1');
      const current = records.find(record =>
        record.childId === child.id && record.semester === '2026-S2');
      let decreases = 0;
      let childLargeGains = 0;
      for (const { id } of DOMAINS) {
        const before = previous.domains[id].rating;
        const after = current.domains[id].rating;
        if (before === null || after === null) continue;
        const change = after - before;
        assert.ok(change >= -1 && change <= 2);
        assert.ok(after >= 1 && after <= 4);
        if (change < 0) decreases++;
        if (change === 2) childLargeGains++;
        if (change === 0 || change === 1) steady++;
        pairs++;
      }
      assert.ok(decreases <= 1);
      assert.ok(childLargeGains <= 1);
      largeGains += childLargeGains;
    }
    assert.ok(steady > pairs / 2);
    assert.equal(largeGains, 2);
  }
});

test('placeholder photos are deterministic, small, self-contained escaped SVG images', () => {
  const label = '<script>"A&B\'s"</script>';
  const uri = placeholderPhoto('same', label);
  assert.equal(uri, placeholderPhoto('same', label));
  assert.notEqual(uri, placeholderPhoto('other', label));
  assert.match(uri, /^data:image\/svg\+xml,/);
  assert.ok(Buffer.byteLength(uri, 'utf8') < 2048);
  const svg = decodeURIComponent(uri.slice(uri.indexOf(',') + 1));
  assert.ok(svg.includes('&lt;script&gt;&quot;A&amp;B&apos;s&quot;&lt;/script&gt;'));
  assert.ok(!svg.includes('<script>'));
  assert.doesNotMatch(svg, /(?:href=|<image|<foreignObject|<script|url\()/i);
  assert.match(svg, /<rect/);
  assert.match(svg, /<circle/);
  assert.match(svg, /<path/);
  assert.ok(Buffer.byteLength(placeholderPhoto('long', '😀<&"'.repeat(1000)), 'utf8') < 2048);
  for (const record of seedRecords()) {
    for (const entry of Object.values(record.domains)) {
      for (const photo of entry.photos) {
        assert.match(photo.src, /^data:image\/svg\+xml,/);
        assert.ok(Buffer.byteLength(photo.src, 'utf8') < 2048);
        assert.ok(photo.id && photo.alt);
      }
    }
  }
});
