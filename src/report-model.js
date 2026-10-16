import { STUDIO_CONFIG } from './config.js';
import { DOMAINS, RATINGS, parseSemester, validateRecord } from './portfolio-model.js';
import { narrativeChip } from './class-view.js';

export const REPORT_DISCLAIMER = 'Fictional demonstration data. AI-assisted drafts must be reviewed and approved by an educator before release.';
const ratingLabel = value => RATINGS.find(rating => rating.value === value)?.label ?? 'Not rated';

export function buildReport({ child, record, previousRecord, className = '', teacherName = '', generatedOn = '' }) {
  const current = validateRecord(record);
  if (current.childId !== child.id) throw new Error('Report child does not match record');
  const { year, half } = parseSemester(current.semester);
  const previous = half === 2 && previousRecord ? validateRecord(previousRecord) : null;
  if (previous && (previous.childId !== child.id || previous.semester !== `${year}-S1`))
    throw new Error('Previous report must be the same child in Semester 1');
  const warnings = [];
  const domains = DOMAINS.map(({ id, label }) => {
    const entry = current.domains[id], draft = current.narratives[id];
    if (entry.rating === null) warnings.push(`${label}: rating not recorded`);
    if (!entry.comment.trim()) warnings.push(`${label}: comment not recorded`);
    if (!draft?.text.trim()) warnings.push(`${label}: narrative not drafted`);
    const prior = previous?.domains[id].rating ?? null;
    let changeText = '';
    if (half === 2) {
      if (prior === null) changeText = 'Not rated in Semester 1';
      else if (entry.rating === null) changeText = 'Not rated in Semester 2';
      else if (prior === entry.rating) changeText = 'No change';
      else {
        const delta = entry.rating - prior;
        changeText = `${ratingLabel(prior)} -> ${ratingLabel(entry.rating)} (${delta > 0 ? '+' : ''}${delta})`;
      }
    }
    return { id, label, ratingValue: entry.rating, ratingLabel: ratingLabel(entry.rating),
      comment: entry.comment,
      narrative: draft?.text.trim() ? { text: draft.text, sourceLabel: narrativeChip(draft) } : null,
      photos: entry.photos.map(({ src, alt }) => ({ src, alt })),
      previous: half === 2 ? { ratingLabel: ratingLabel(prior) } : null, changeText };
  });
  return {
    header: { productName: STUDIO_CONFIG.productName,
      ...(STUDIO_CONFIG.organizationName.trim() ? { organizationName: STUDIO_CONFIG.organizationName } : {}),
      title: STUDIO_CONFIG.portfolioTitle },
    childName: child.name, className, teacherName, generatedOn,
    semesterLabel: `Semester ${half}, ${year} (${half === 2 ? 'Jul-Dec' : 'Jan-Jun'})`,
    domains, status: { complete: warnings.length === 0, warnings }, disclaimer: REPORT_DISCLAIMER
  };
}
