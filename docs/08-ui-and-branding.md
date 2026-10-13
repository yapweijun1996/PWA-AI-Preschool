# 08 — UI/UX, White-labeling and Accessibility

## Navigation / information architecture

Dashboard → Student directory → Evidence library → AI Portfolio → Teacher review → Print/PDF. Provider Settings opens as a modal so demos do not interrupt the learning flow.

## Design guidelines

- Clean professional, education-neutral design; no customer logos, school names, internal materials or bespoke colour palettes.
- English-first text and label naming; future i18n extension points for school-specific language needs.
- Laptop and mobile browser support; review at 390×844, 430×932 and 1440×900.
- Keyboard focus visible; all icon buttons labelled; ARIA-live status for model calls; dialog trap/escape behavior tested in browser.
- Review mode visually separates **AI Draft**, **Simulated Draft**, and **Educator Reviewed** states. Edits clear the approval checkbox; saving requires valid section citations. Local review metadata is unauthenticated and is retained on the printout.
- Each observed domain includes inline [EVIDENCE-ID] citations. The evidence index links to the selected student's full fictional timeline, including session-added observations. Citation membership does not establish factual entailment.
- Do not represent estimated productivity or edit targets as achieved customer outcomes.

## White-label configuration

Modify `src/config.js` for `productName`, optional `organizationName` and `logoUrl` (both blank by default), `portfolioTitle`, and public demo routing. A configured public logo appears in both the sidebar and portfolio heading; use an authorized asset URL in a private branded fork. Relative URLs must refer to published files; new bundled assets require an entry in the build allowlist. Never special-case an organization in application logic. Production branding must load from an authenticated tenant configuration.

### Config examples

```js
productName: 'AI Preschool Studio',
organizationName: '', // No operator by default
logoUrl: '', // Optional public asset URL, e.g. './favicon.svg'
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
- BYOK acknowledgement is required before applying a test key; keys are masked on reopening and the input is cleared after closing the dialog. The active test key remains in memory until another provider is applied or the page is refreshed.
- No splash marketing graphics prevent portfolio functionality on smaller devices.
- Print/PDF excludes admin controls and retains demo disclaimer.
