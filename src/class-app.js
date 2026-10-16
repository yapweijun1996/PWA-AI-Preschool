import {
  DOMAINS, RATINGS, emptyRecord, computeStatus, adjacentChildId, nextChildNeedingWork,
  progressComparison, narrativeInputFor, validateRecord
} from './portfolio-model.js';
import { CHILDREN, seedRecords, placeholderPhoto } from './portfolio-seed.js';
import { createStore } from './portfolio-store.js';
import { mockNarrative, validateNarrativeText } from './narrative.js';
import { fileToDataUri } from './photo.js';
import { filterChildren, domainDot, classSummary, routeParse, routeBuild } from './class-view.js';

const label = value => RATINGS.find(r => r.value === value)?.label ?? 'Not rated';

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(text, action, primary = false) {
  const node = el('button', text, primary ? 'primary' : '');
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function link(text, href) {
  const node = el('a', text);
  node.href = href;
  return node;
}

// Generation is injected; provider errors are reported, never replaced with mock output.
export function startClassApp({ generateNarrative = mockNarrative } = {}) {
  const main = document.getElementById('main'), live = document.getElementById('status'),
    saveStatus = document.getElementById('save-status');
  let storage = null;
  try {
    storage = window.localStorage;
  } catch {/* The store reports unavailable storage below. */}
  const store = createStore(storage);
  let records = store.load(), semester = '2026-S2', query = '', filter = 'all',
    timer = null, dirty = false, route, epoch = 0;
  const stale = new Set();
  let initialError = store.lastError;

  function announce(text) {
    live.textContent = text;
  }

  function persist() {
    clearTimeout(timer);
    if (!dirty) return;
    const result = store.save(records);
    dirty = false;
    saveStatus.dataset.error = String(!result.ok);
    saveStatus.textContent = result.ok
      ? 'Saved in this browser' : `Not saved: storage unavailable - ${result.error}`;
    if (!result.ok) announce(saveStatus.textContent);
  }

  function change(record) {
    record.reviewed = false;
    record.status = computeStatus(record);
    dirty = true;
    saveStatus.textContent = 'Saving…';
    clearTimeout(timer);
    timer = setTimeout(persist, 250);
  }

  if (!records.length) {
    records = seedRecords();
    dirty = true;
    persist();
  }
  if (initialError) {
    saveStatus.dataset.error = 'true';
    saveStatus.textContent = `Not saved: storage unavailable - ${initialError}`;
  }

  function get(id, sem) {
    return records.find(r => r.childId === id && r.semester === sem) ?? emptyRecord(id, sem);
  }

  function current(id, sem) {
    let record = records.find(r => r.childId === id && r.semester === sem);
    if (!record) {
      record = emptyRecord(id, sem);
      records.push(record);
    }
    return record;
  }

  function go(id, sem = semester) {
    persist();
    const hash = routeBuild(id
      ? { page: 'child', childId: id, semester: sem } : { page: 'overview' });
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function guard(action) {
    return async () => {
      try {
        await action();
      } catch (error) {
        announce(error.message);
      }
    };
  }

  async function draft(child, record, ids) {
    const inputs = narrativeInputFor(child, record,
      record.semester.endsWith('S2') ? get(child.id, '2026-S1') : null);
    // Stage all requested results before changing any domain on provider failure.
    const drafts = await Promise.all(ids.map(async id => {
      const result = await generateNarrative(inputs.domains[id], {
        previousRating: inputs.domains[id].previousRating
      });
      return [id, { ...result, text: validateNarrativeText(result.text) }];
    }));
    const candidate = {
      ...record, narratives: { ...record.narratives, ...Object.fromEntries(drafts) }
    };
    validateRecord(candidate);
    for (const [id, value] of drafts) {
      record.narratives[id] = value;
      stale.delete(`${child.id}:${record.semester}:${id}`);
    }
    change(record);
    persist();
  }

  function overview() {
    main.append(el('h1', 'Class portfolios'));
    const tools = el('div', undefined, 'toolbar');
    const semesterLabel = el('label', 'Semester'), select = el('select');
    for (const sem of ['2026-S1', '2026-S2']) {
      const option = el('option', sem);
      option.value = sem;
      select.append(option);
    }
    select.value = semester;
    select.addEventListener('change', () => {
      semester = select.value;
      render(false);
    });
    semesterLabel.append(select);
    tools.append(semesterLabel);
    const searchLabel = el('label', 'Search children'), search = el('input');
    search.type = 'search';
    search.value = query;
    searchLabel.append(search);
    tools.append(searchLabel);
    main.append(tools);
    const summary = classSummary(CHILDREN, records, semester),
      panel = el('section', undefined, 'summary');
    panel.append(el('h2', `${summary.statuses.reviewed} / ${CHILDREN.length} reviewed`));
    for (const [status, count] of Object.entries(summary.statuses))
      panel.append(el('span', `${status}: ${count}`, 'chip'));
    const progress = el('progress');
    progress.max = CHILDREN.length;
    progress.value = summary.statuses.reviewed;
    progress.setAttribute('aria-label',
      `${summary.statuses.reviewed} of ${CHILDREN.length} children reviewed`);
    panel.append(progress);
    main.append(panel);
    const chips = el('div', undefined, 'chips');
    for (const value of ['all', 'needs-work', 'ready-for-draft', 'drafted', 'reviewed']) {
      const chip = button(value, () => {
        filter = value;
        render(false);
      });
      chip.setAttribute('aria-pressed', String(filter === value));
      chips.append(chip);
    }
    main.append(chips);
    const actions = el('div', undefined, 'toolbar');
    actions.append(button('Continue with next unfinished child', () => {
      const id = nextChildNeedingWork(CHILDREN, records, semester);
      if (id) go(id);
      else announce('Class complete');
    }, true));
    const ready = CHILDREN.filter(c => computeStatus(get(c.id, semester)) === 'ready-for-draft');
    const batch = button(`Draft narratives for all ready children (${ready.length})`, guard(async () => {
      batch.disabled = true;
      let count = 0;
      try {
        for (const child of ready) {
          await draft(child, current(child.id, semester), DOMAINS.map(d => d.id));
          count++;
        }
        render(false);
        announce(`Drafted narratives for ${count} children.`);
      } catch (error) {
        render(false);
        throw new Error(`Drafted ${count} children. ${error.message}`);
      }
    }));
    batch.disabled = !ready.length;
    actions.append(batch, button('Reset sample data', () => {
      if (window.confirm('Replace all browser portfolios with fictional sample data?')) {
        records = seedRecords();
        stale.clear();
        dirty = true;
        persist();
        render(false);
        announce('Sample data restored.');
      }
    }));
    main.append(actions);
    const grid = el('div', undefined, 'grid');
    main.append(grid);

    function cards() {
      grid.replaceChildren();
      for (const child of filterChildren(CHILDREN, records, semester, { query, filter })) {
        const record = get(child.id, semester), card = el('article', undefined, 'card');
        card.append(el('span', child.initials, 'avatar'), el('h2', child.name),
          el('span', computeStatus(record), 'chip'));
        const list = el('ul', undefined, 'indicators'),
          comparisons = progressComparison(get(child.id, '2026-S1'), record);
        for (const { id, label: domainLabel } of DOMAINS) {
          const dot = domainDot(record.domains[id]), item = el('li');
          item.dataset.state = dot.state;
          item.append(el('span', '', 'dot'),
            el('span', `${domainLabel}: ${dot.ratingLabel} · ${dot.state}`));
          if (semester === '2026-S2') {
            const change = comparisons.find(c => c.domain === id).change;
            item.append(el('span', change === null ? ' · No comparison' : ` · ${change>0?'↑':change<0?'↓':'→'} ${change>0?'+':''}${change}`));
          }
          list.append(item);
        }
        card.append(list,
          link('Open portfolio', routeBuild({ page: 'child', childId: child.id, semester })));
        grid.append(card);
      }
      if (!grid.children.length) grid.append(el('p', 'No children match this search.'));
    }

    search.addEventListener('input', () => {
      query = search.value;
      cards();
    });
    cards();
  }

  function editor(child) {
    const record = current(child.id, semester), heading = el('h1', child.name);
    main.append(heading, el('p', `${CHILDREN.indexOf(child)+1} / ${CHILDREN.length} · ${semester}`));
    const nav = el('div', undefined, 'toolbar');
    nav.append(
      button('Previous', () => go(adjacentChildId(CHILDREN, child.id, 'previous'))),
      button('Next', () => go(adjacentChildId(CHILDREN, child.id, 'next'))),
      button('Back to class', () => go(null)),
      button('Draft all four', guard(async () => {
        await draft(child, record, DOMAINS.map(d => d.id));
        render(false);
        announce('Four narratives drafted.');
      })));
    main.append(nav,
      el('p', 'Keyboard: Alt+ArrowRight / Alt+ArrowLeft moves to the next / previous child.', 'hint'));
    const review = button('Mark reviewed and go to next child', () => {
      record.reviewed = true;
      record.status = computeStatus(record);
      dirty = true;
      persist();
      const next = nextChildNeedingWork(CHILDREN, records, semester, child.id);
      go(next);
      if (!next) announce('Class complete');
    }, true);
    const updateReview = () => {
      review.disabled = !DOMAINS.every(d => record.narratives[d.id]?.text.trim());
    };
    for (const { id, label: domainLabel } of DOMAINS) {
      const entry = record.domains[id], section = el('section', undefined, 'domain'),
        title = el('h2', domainLabel);
      title.id = `heading-${id}`;
      section.setAttribute('aria-labelledby', title.id);
      section.append(title);
      const key = `${child.id}:${semester}:${id}`;
      const hint = el('p', 'Narrative may be out of date', 'stale');
      hint.hidden = !stale.has(key);
      const comparison = el('p', undefined, 'comparison');

      function updateComparison() {
        const c = progressComparison(get(child.id, '2026-S1'), record).find(c => c.domain === id);
        comparison.textContent = `Semester 1: ${label(c.previous)} -> now: ${label(c.current)} (${c.change===null?'no comparison':c.change>0?`+${c.change}`:c.change})`;
      }

      function inputChanged() {
        if (record.narratives[id]) {
          stale.add(key);
          hint.hidden = false;
        }
        change(record);
        updateComparison();
      }

      const fieldset = el('fieldset'), legend = el('legend', 'Rating');
      fieldset.append(legend);
      for (const rating of RATINGS) {
        const choice = el('label'), input = el('input');
        input.type = 'radio';
        input.name = `rating-${id}`;
        input.value = String(rating.value);
        input.checked = entry.rating === rating.value;
        input.addEventListener('change', () => {
          entry.rating = rating.value;
          inputChanged();
        });
        choice.append(input, el('span', rating.label));
        fieldset.append(choice);
      }
      section.append(fieldset);
      const commentLabel = el('label', 'Teacher comment'), comment = el('textarea');
      comment.id = `comment-${id}`;
      commentLabel.htmlFor = comment.id;
      comment.maxLength = 1000;
      comment.value = entry.comment;
      const counter = el('p', `${comment.value.length} / 1000`, 'hint');
      comment.setAttribute('aria-describedby', `count-${id}`);
      counter.id = `count-${id}`;
      comment.addEventListener('input', () => {
        entry.comment = comment.value;
        counter.textContent = `${comment.value.length} / 1000`;
        inputChanged();
      });
      section.append(commentLabel, comment, counter);
      if (semester === '2026-S2') {
        updateComparison();
        section.append(comparison);
      }
      const photos = el('div', undefined, 'photos');
      section.append(photos);
      const fileLabel = el('label', 'Choose a local fictional image'), file = el('input');
      file.type = 'file';
      file.accept = 'image/*';
      file.id = `photo-${id}`;
      fileLabel.htmlFor = file.id;
      section.append(fileLabel, file);
      const sample = button('Add sample placeholder photo', () => addPending(
        placeholderPhoto(`${child.id}-${id}-${Date.now()}`, 'Fictional sample placeholder')));
      section.append(sample);
      let pending = false;

      function photoControls() {
        file.disabled = sample.disabled = pending || entry.photos.length >= 6;
      }

      function showPhotos() {
        photos.replaceChildren();
        for (const photo of entry.photos) {
          const figure = el('figure', undefined, 'photo'), image = el('img');
          image.src = photo.src;
          image.alt = photo.alt;
          const altLabel = el('label', 'Photo alt text'), alt = el('input');
          alt.value = photo.alt;
          alt.required = true;
          altLabel.append(alt);
          alt.addEventListener('change', () => {
            if (!alt.value.trim()) {
              alt.setCustomValidity('Alt text is required.');
              alt.reportValidity();
              return;
            }
            alt.setCustomValidity('');
            photo.alt = alt.value.trim();
            change(record);
          });
          figure.append(image, altLabel, button('Remove photo', () => {
            entry.photos = entry.photos.filter(p => p.id !== photo.id);
            change(record);
            showPhotos();
          }));
          photos.append(figure);
        }
        photoControls();
      }

      function addPending(src) {
        if (entry.photos.length >= 6 || pending) return;
        pending = true;
        photoControls();
        const figure = el('figure', undefined, 'photo'), image = el('img');
        image.src = src;
        image.alt = 'Unsaved image preview';
        const altLabel = el('label', 'Required alt text before saving'), alt = el('input');
        alt.required = true;
        altLabel.append(alt);
        const save = button('Save photo', () => {
          if (!alt.value.trim()) {
            alt.reportValidity();
            return;
          }
          entry.photos.push({ id: crypto.randomUUID(), src, alt: alt.value.trim() });
          pending = false;
          change(record);
          showPhotos();
        });
        figure.append(image, altLabel, save, button('Cancel image', () => {
          pending = false;
          showPhotos();
        }));
        photos.append(figure);
        alt.focus();
        announce('Image not saved until alt text is entered and Save photo is selected.');
      }

      file.addEventListener('change', guard(async () => {
        const chosen = file.files[0], version = epoch;
        if (!chosen) return;
        file.disabled = true;
        try {
          const src = await fileToDataUri(chosen);
          if (version === epoch) addPending(src);
        } finally {
          file.value = '';
          photoControls();
        }
      }));
      showPhotos();
      const source = el('p', undefined, 'chip'),
        narrativeLabel = el('label', 'Narrative (teacher editable)'), narrative = el('textarea');
      narrative.id = `narrative-${id}`;
      narrativeLabel.htmlFor = narrative.id;
      narrative.maxLength = 2000;
      narrative.value = record.narratives[id]?.text ?? '';
      const baseline = narrative.value;

      function sourceLabel() {
        const n = record.narratives[id];
        source.textContent = !n ? 'No narrative'
          : n.edited || n.source === 'teacher' ? 'EDITED BY TEACHER'
          : n.source === 'mock' ? 'MOCK DRAFT (offline, not AI)' : 'AI DRAFT';
      }

      sourceLabel();
      narrative.addEventListener('input', () => {
        const old = record.narratives[id];
        record.narratives[id] = {
          text: narrative.value, source: old?.source ?? 'teacher',
          edited: old?.edited === true || narrative.value !== baseline
        };
        change(record);
        sourceLabel();
        updateReview();
      });
      section.append(button('Draft narrative', guard(async () => {
        await draft(child, record, [id]);
        render(false);
        announce(`${domainLabel} narrative drafted.`);
      })), source, hint, narrativeLabel, narrative);
      main.append(section);
    }
    updateReview();
    main.append(review);
  }

  function render(focus = true) {
    persist();
    epoch++;
    route = routeParse(location.hash, CHILDREN);
    main.replaceChildren();
    if (route.message) announce(route.message);
    if (route.page === 'child') {
      const child = CHILDREN.find(c => c.id === route.childId);
      if (child) {
        semester = route.semester;
        editor(child);
      } else {
        announce('Child not found.');
        overview();
      }
    } else overview();
    if (focus) {
      const heading = main.querySelector('h1');
      heading.tabIndex = -1;
      heading.focus();
    }
  }

  window.addEventListener('hashchange', () => render());
  window.addEventListener('pagehide', persist);
  document.addEventListener('keydown', event => {
    if (!event.altKey || route.page !== 'child' ||
      !['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    go(adjacentChildId(CHILDREN, route.childId, event.key === 'ArrowRight' ? 'next' : 'previous'));
  });
  render();
  // Reuse the release cache without triggering any provider or other network requests.
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .catch(error => announce(`Offline cache unavailable: ${error.message}`));
}

startClassApp();
