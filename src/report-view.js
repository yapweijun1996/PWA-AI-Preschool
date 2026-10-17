import { RATINGS } from './portfolio-model.js';
import { avatar, photoFigure } from './studio/ui.js';
import { ILLUSTRATION_CAPTION } from './demo-media.js';
import { translateText } from './i18n/index.js';

function createElement(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function language(node, chinese) {
  if (chinese || /\p{Script=Han}/u.test(node.textContent)) node.lang = 'zh-Hans';
  return node;
}

export function renderReport(report) {
  const translate = text => translateText(text, report.language ?? 'en');
  const el = (tag, text, className) => createElement(tag,
    text === undefined ? undefined : translate(text), className);
  const article = el('article', undefined, 'portfolio-report');
  article.lang = report.language ?? 'en';
  const header = el('header');
  header.append(createElement('p', report.header.productName), el('h1', report.header.title));
  if (report.header.organizationName) header.append(createElement('p', report.header.organizationName));
  const identity = el('div', undefined, 'report-child-identity');
  const name = language(createElement('h2', report.childName));
  name.dataset.i18n = 'off';
  identity.append(avatar({ id: report.childId, name: report.childName,
    initials: report.childInitials || '?' }, 'avatar', report.language ?? 'en'), name);
  article.append(header, identity, el('p', ILLUSTRATION_CAPTION, 'demo-image-notice'),
    el('p', report.semesterLabel));
  for (const [label, value] of [['Class', report.className], ['Teacher', report.teacherName], ['Generated on', report.generatedOn]]) {
    if (!value) continue;
    const row = el('p'), detail = language(createElement('span', value));
    detail.dataset.i18n = 'off';
    row.append(el('span', label), createElement('span', ': '), detail);
    article.append(row);
  }
  if (!report.status.complete) {
    const warning = el('aside', undefined, 'report-incomplete');
    warning.append(el('strong', 'INCOMPLETE'));
    const list = el('ul');
    for (const text of report.status.warnings) list.append(el('li', text));
    warning.append(list);
    article.append(warning);
  }
  for (const row of report.domains) {
    const section = el('section', undefined, 'report-domain');
    section.append(el('h2', row.label));
    const scale = el('div', undefined, 'report-rating');
    scale.setAttribute('aria-label', translate(`Rating: ${row.ratingLabel}`));
    for (const rating of RATINGS) {
      const selected = rating.value === row.ratingValue;
      const segment = el('span', `${rating.label}${selected ? ' (selected)' : ''}`,
        selected ? 'selected' : '');
      if (selected) segment.dataset.rating = rating.label.toLowerCase();
      scale.append(segment);
    }
    const comment = row.comment ? createElement('p', row.comment, 'report-text')
      : el('p', 'No comment recorded.', 'report-text');
    if (row.comment) comment.dataset.i18n = 'off';
    language(comment);
    section.append(scale, el('p', `Rating: ${row.ratingLabel}`), comment);
    if (row.narrative) {
      const text = el('p', undefined, 'report-text');
      text.textContent = row.narrative.text;
      text.lang = row.narrative.language ?? (row.id === 'chinese' ? 'zh-Hans' : 'en');
      section.append(el('p', row.narrative.sourceLabel, 'report-source'), text);
    }
    else section.append(el('p', 'Narrative not drafted.'));
    const photos = el('div', undefined, 'report-photos');
    for (const photo of row.photos) {
      const figure = photoFigure(photo, 'photo', report.language ?? 'en');
      language(figure.querySelector('figcaption').querySelector('span'));
      photos.append(figure);
    }
    section.append(photos);
    article.append(section);
  }
  if (report.domains.some(row => row.previous)) {
    const table = el('table', undefined, 'report-progress');
    table.append(el('caption', 'Semester 1 -> Semester 2'));
    const head = el('thead'), headings = el('tr');
    for (const text of ['Domain', 'Semester 1', 'Semester 2', 'Change']) {
      const cell = el('th', text);
      cell.scope = 'col';
      headings.append(cell);
    }
    head.append(headings);
    const body = el('tbody');
    for (const row of report.domains) {
      const tr = el('tr'), heading = el('th', row.label);
      heading.scope = 'row';
      tr.append(heading);
      for (const text of [row.previous.ratingLabel, row.ratingLabel, row.changeText]) tr.append(el('td', text));
      body.append(tr);
    }
    table.append(head, body);
    article.append(table);
  }
  article.append(el('footer', report.disclaimer));
  return article;
}

export function renderReportControls(backHref) {
  const controls = createElement('nav', undefined, 'report-controls toolbar');
  const print = createElement('button', 'Print / Save as PDF');
  print.type = 'button';
  print.addEventListener('click', () => window.print());
  const back = createElement('a', 'Back');
  back.href = backHref;
  controls.append(print, back);
  return controls;
}
