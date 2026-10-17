import { RATINGS } from './portfolio-model.js';
import { avatar, photoFigure } from './studio/ui.js';
import { ILLUSTRATION_CAPTION } from './demo-media.js';

function el(tag, text, className) {
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
  const article = el('article', undefined, 'portfolio-report');
  const header = el('header');
  header.append(el('p', report.header.productName), el('h1', report.header.title));
  if (report.header.organizationName) header.append(el('p', report.header.organizationName));
  const identity = el('div', undefined, 'report-child-identity');
  identity.append(avatar({ id: report.childId, name: report.childName,
    initials: report.childInitials || '?' }), language(el('h2', report.childName)));
  article.append(header, identity, el('p', ILLUSTRATION_CAPTION, 'demo-image-notice'),
    el('p', report.semesterLabel));
  for (const [label, value] of [['Class', report.className], ['Teacher', report.teacherName], ['Generated on', report.generatedOn]])
    if (value) article.append(language(el('p', `${label}: ${value}`)));
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
    section.append(language(el('h2', row.label), row.id === 'chinese'));
    const scale = el('div', undefined, 'report-rating');
    scale.setAttribute('aria-label', `Rating: ${row.ratingLabel}`);
    for (const rating of RATINGS) {
      const selected = rating.value === row.ratingValue;
      const segment = el('span', `${rating.label}${selected ? ' (selected)' : ''}`,
        selected ? 'selected' : '');
      if (selected) segment.dataset.rating = rating.label.toLowerCase();
      scale.append(segment);
    }
    section.append(scale, el('p', `Rating: ${row.ratingLabel}`),
      language(el('p', row.comment || 'No comment recorded.', 'report-text'), row.id === 'chinese'));
    if (row.narrative) section.append(el('p', row.narrative.sourceLabel, 'report-source'),
      language(el('p', row.narrative.text, 'report-text'), row.id === 'chinese'));
    else section.append(el('p', 'Narrative not drafted.'));
    const photos = el('div', undefined, 'report-photos');
    for (const photo of row.photos) {
      const figure = photoFigure(photo);
      language(figure.querySelector('figcaption'));
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
      const tr = el('tr'), heading = language(el('th', row.label), row.id === 'chinese');
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
  const controls = el('nav', undefined, 'report-controls toolbar');
  const print = el('button', 'Print / Save as PDF');
  print.type = 'button';
  print.addEventListener('click', () => window.print());
  const back = el('a', 'Back');
  back.href = backHref;
  controls.append(print, back);
  return controls;
}
