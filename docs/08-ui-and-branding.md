# 08 — UI/UX, White-labeling and Accessibility

## Navigation / information architecture

Dashboard → Student directory → Evidence library → AI Portfolio → Teacher review → Print/PDF. Provider Settings opens as a modal so demos do not interrupt the learning flow.

## Design guidelines

- Clean professional, education-neutral design; no customer logos, school names, internal materials or bespoke colour palettes.
- English-first text and label naming; future i18n extension points for school-specific language needs.
- Laptop and mobile browser support; review at 390×844, 430×932 and 1440×900.
- Keyboard focus visible; all icon buttons labelled; ARIA-live status for model calls; dialog trap/escape behavior tested in browser.
- Review mode visually separates **AI Draft**, **Simulated Draft**, and **Educator Approved** states.
- Display source evidence IDs near statements, with future click-through to approved records.
- Do not represent estimated productivity or edit targets as achieved customer outcomes.

## White-label configuration

Modify `src/config.js` for `productName`, optional `organizationName` (blank by default), `portfolioTitle`, and public demo routing; replace favicon/assets in a future branded copy if rights permit. Never change the code to special-case a particular organization. For multi-school production, branding and templates should load from the authenticated tenant configuration, with strict validation and separation.

### Config examples

```js
productName: 'AI Preschool Studio',
organizationName: '', // No operator by default
portfolioTitle: 'Learning & Development Portfolio',
metrics: { illustrativeHoursPerPortfolio: 6, hypotheticalEditingTargetPercent: 10 }
```

The HTML is a static fallback using the neutral name; script applies the config on boot. A user-provided organization name should be treated as text (never inserted using `innerHTML`).

## Future customization objects

`TenantBranding {displayName, logoAssetId, accentColor}`; `PortfolioTemplate {version, locale, sections[], pageLayout}`; `CurriculumMap {framework, version, domains[]}`; `EvidencePolicy {allowedTypes, retentionPeriod}`. All future values must come from a trusted configuration backend for real deployments.

## Browser QA checklist

- No horizontal scrolling at 390 px.
- Page and dialogs use sensible tab order; Escape closes modal.
- Generation errors remain visible, don't remove the selected student.
- Password key field shows/hides only on explicit click; clears when provider changes.
- No splash marketing graphics prevent portfolio functionality on smaller devices.
- Print/PDF excludes admin controls and retains demo disclaimer.
