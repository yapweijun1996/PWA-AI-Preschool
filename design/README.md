# AI Preschool Studio design SSOT

## Purpose

This directory is the design handoff for the fictional-data, static AI Preschool Studio. It defines a page-per-module target that can replace the current long-scroll home and separate class mini-app. The routes below are proposed target routes; they are not all implemented in the current application.

The current product is documented in screenshots such as [the original desktop index](current/01-index-desktop.png), [the class overview](current/03-class-overview-desktop.png) and [the print report](current/07-print-child.png). The constraints and target behavior are in [`BRIEF.md`](BRIEF.md) and [`00-information-architecture.md`](00-information-architecture.md).

## How the SSOT works

- A wireframe image records visual intent: page hierarchy, layout, responsive composition and component placement.
- The matching `.md` page spec is authoritative for exact copy, data, behavior, states, accessibility and acceptance checks. If image text differs, follow the spec and record the discrepancy for correction.
- [`tokens.css`](tokens.css) contains enforceable color, spacing, type, radius, shadow, breakpoint and focus values for implementation.
- [`01-design-system.md`](01-design-system.md) names the shared shell and components; [`00-information-architecture.md`](00-information-architecture.md) owns routes and user journeys.

## Deliverable inventory

All 12 page specs and all 24 expected wireframe PNGs are present: sitemap, design-system sheet, desktop/mobile pairs for P01–P08 and P10–P11, one A4 portrait P09 image, and one desktop P12 state sheet. No wireframe was regenerated during this index review. Desktop frames are 1586 × 992 px and the A4 frame is 1054 × 1492 px; mobile frames are portrait but vary in aspect ratio, so responsive behavior and the 390 × 844 target in each spec remain authoritative.

## Menu and routes (canonical)

Every page spec's `Route:` line was checked against this table; all 12 match. The fixed desktop menu order is Home, Class portfolios, Students, Evidence library, AI drafts, Reports, AI provider settings, About and privacy. Child pages keep their parent menu item active.

| ID | Page | Canonical route | Desktop menu / active parent | Mobile destination | Spec route | Wireframes |
| --- | --- | --- | --- | --- | --- | --- |
| P01 | Home | `#/` | Home | Home | Match | [Desktop](wireframes/P01-home-desktop.webp) · [Mobile](wireframes/P01-home-mobile.webp) |
| P02 | Class portfolios | `#/classes` | Class portfolios | Classes | Match | [Desktop](wireframes/P02-class-overview-desktop.webp) · [Mobile](wireframes/P02-class-overview-mobile.webp) |
| P03 | Child portfolio editor | `#/classes/class-a/children/C-05?sem=2026-S2` | Class portfolios (parent active) | Classes (parent active) | Match | [Desktop](wireframes/P03-child-editor-desktop.webp) · [Mobile](wireframes/P03-child-editor-mobile.webp) |
| P04 | Students directory | `#/students` | Students | Students | Match | [Desktop](wireframes/P04-students-desktop.webp) · [Mobile](wireframes/P04-students-mobile.webp) |
| P05 | Student profile | `#/students/C-05` | Students (parent active) | Students (parent active) | Match | [Desktop](wireframes/P05-student-profile-desktop.webp) · [Mobile](wireframes/P05-student-profile-mobile.webp) |
| P06 | Evidence library | `#/evidence` | Evidence library | More → Evidence library | Match | [Desktop](wireframes/P06-evidence-library-desktop.webp) · [Mobile](wireframes/P06-evidence-library-mobile.webp) |
| P07 | AI drafts | `#/drafts` | AI drafts | Drafts | Match | [Desktop](wireframes/P07-ai-drafts-desktop.webp) · [Mobile](wireframes/P07-ai-drafts-mobile.webp) |
| P08 | Reports | `#/reports` | Reports | More → Reports | Match | [Desktop](wireframes/P08-reports-desktop.webp) · [Mobile](wireframes/P08-reports-mobile.webp) |
| P09 | Report print layout | `#/print/C-05?sem=2026-S2` | Reports output (no active page route) | Print document, no app tabs | Match | [A4 portrait](wireframes/P09-report-print-a4.webp) · no mobile image |
| P10 | AI provider settings | `#/settings/ai` | AI provider settings | More → AI provider settings | Match | [Desktop](wireframes/P10-ai-settings-desktop.webp) · [Mobile](wireframes/P10-ai-settings-mobile.webp) |
| P11 | About and privacy | `#/about` | About and privacy | More → About and privacy | Match | [Desktop](wireframes/P11-about-desktop.webp) · [Mobile](wireframes/P11-about-mobile.webp) |
| P12 | System states | Reference only; no route | None | None | Match | [Desktop reference](wireframes/P12-system-states-desktop.webp) · no mobile image |

Supporting references: [sitemap](wireframes/00-sitemap.webp), [design-system wireframe](wireframes/01-design-system.webp), [design-system component contract](01-design-system.md).

## Shared shell

Desktop uses `AppShell` with `SidebarNav`, `TopBar` and `DemoNotice`. The fixed sidebar order is Home, Class portfolios, Students, Evidence library, AI drafts, Reports, AI provider settings, About and privacy. The top bar carries the breadcrumb, 2026-S1 / 2026-S2 switch, provider status, Fictional demo data chip and PWA status. The persistent notice shows “Fictional demo data”, “Stored only in this browser” and “NOT IMPLEMENTED: real login / server / database”.

At mobile width, the sidebar becomes the five-tab `MobileTabBar`: Home, Classes, Students, Drafts, More. Child pages highlight their parent tab; More opens Evidence library, Reports, AI provider settings and About and privacy. P09 is a print document without app navigation and retains its report disclaimer. P12 is a reference sheet, not a product route.

The IA is a design target. The current `index.html` / `src/app.js` experience remains a long-scroll demo; `class.html` / `src/class-app.js` is separate and currently uses `#/`, `#/child/:id`, `#/print/:id` and `#/print-class`. Real login, server/database, authenticated approval, vector RAG and production AI hosting remain NOT IMPLEMENTED.

## Build order recommendation

1. Build the shared `AppShell`, `tokens.css`, focus/accessibility foundations and shared components.
2. Implement P02 class portfolios, then P03 child editor; these establish the class data and completion workflow.
3. Add P04 students and P05 student profile, then P06 evidence library.
4. Add P07 AI drafts and provider provenance/recovery states.
5. Add P08 report selection and completeness, then P09 print layout.
6. Add P10 provider settings and P11 About and privacy.
7. Build P01 Home from the verified class/draft aggregates; keep P12 alongside shared-state implementation as the review sheet.

## Naming conventions

- Shared reference documents use numeric prefixes: `00-information-architecture.md`, `01-design-system.md`, and `tokens.css`.
- Page specs use `pages/Pxx-name.md`; IDs follow the fixed P01–P12 map.
- Standard page images use `wireframes/Pxx-name-desktop.webp` and `wireframes/Pxx-name-mobile.webp`.
- P09 uses the single `P09-report-print-a4.webp` portrait image. P12 uses `P12-system-states-desktop.webp` only. Sitemap and component sheet use `00-sitemap.webp` and `01-design-system.webp`.

## Changing a page

1. Update the page spec first: exact copy, regions, behavior, states and accessibility must be settled before the visual.
2. Regenerate only that page's image from the updated spec, preserving the shared shell, palette and image naming convention.
3. Confirm image dimensions and review the whole image for shell, labels, fictional content and abstract-only artwork.
4. Update this index if route, menu, spec or image paths change. Re-run the relative-link check and refresh the consistency review.

## Consistency review

Review is based on a fresh visual check of all 24 images in `wireframes/`, the page specs and the fixed IA. P09 has no application shell by design; P12 has no mobile deliverable.

| Check | Surfaces | Result | Note |
| --- | --- | --- | --- |
| Desktop sidebar order | P01–P11, P12 reference | PASS | Application sidebars show Home, Class portfolios, Students, Evidence library, AI drafts, Reports, AI provider settings and About and privacy in the required order; P09 correctly has no shell. |
| Navigation component sheet | 01-design-system | PASS | Shows the complete desktop sidebar in canonical order and the five mobile tabs with “Classes”. |
| Child-page active parent | P03, P05 | PASS | P03 highlights Class portfolios / Classes and P05 highlights Students in both desktop and mobile views. |
| Mobile bottom tabs | P01–P08, P10–P11 | PASS | Product mobile views use Home, Classes, Students, Drafts, More in that order, with the relevant tab selected. |
| Mobile provider and PWA status | P01–P11 mobile | ISSUE | P04, P05 and P06 omit the provider and PWA status shown in the other mobile shells and required by their specs. |
| Status palette | Design-system sheet; P01–P12 | ISSUE | The component sheet follows the canonical status and rating colors. P03 desktop still highlights the selected Developing control in forest green while mobile uses blue. |
| Rating palette | P02–P05, P09 | PASS | Emerging is amber, Developing blue, Secure light green, Extending green and Not rated grey in the product-page examples. |
| Domain labels | P01–P09 | PASS | The page examples use English, Chinese, Mathematics and Social-Emotional Development; no alternate domain names are visible. |
| List counts | P02, P04 | ISSUE | P02 says 4 of 20 on desktop and 3 of 20 on mobile; P04 says 2 of 20 on desktop and 3 of 20 on mobile, while its spec calls for 2. |
| Narrative provenance | P03, P05, P07, P09 | PASS | Visible drafts identify mock output or the GPT Demo Gateway and retain the teacher-review wording; P03 labels the empty state “No narrative”. |
| Safety copy and print disclaimer | P01–P12 | PASS | Required safety statements are visible across chips/notices, and P09 has a separate print disclaimer. |
| Provider key field | P10 desktop/mobile | PASS | Both images show Offline mock selected and the empty disposable-key field with the placeholder “Paste a disposable test key”. |

## Known image deviations

The page specs and canonical tokens take precedence over these wireframe details. This list contains only deviations still visible after the requested image updates.

- P03 desktop highlights the selected Developing control in forest green while mobile uses blue.
- P02 list footers disagree across breakpoints: desktop says “Showing 4 of 20 children” and mobile says “Showing 3 of 20 children”. P04 desktop says “Showing 2 of 20 students” as specified, while mobile says “Showing 3 of 20 students”.
- P04, P05 and P06 mobile shells omit provider and PWA status indicators required by their page specs and the shared TopBar contract.
- P11 desktop and mobile use a rose/red icon for “NOT IMPLEMENTED”; reserve red/rose for error states and use a neutral or warning treatment for this informational section.

## Current implementation references

The existing implementation boundaries and reusable functions are mapped in each page spec. Key sources include `src/portfolio-model.js` for the four domains/statuses/comparisons, `src/portfolio-seed.js` for 20 fictional children and abstract photos, `src/portfolio-store.js` for local browser persistence, `src/narrative.js` / `src/providers.js` for validated mock and remote drafts, `src/report-model.js` / `src/report-view.js` for local print reports, and `src/pwa.js` for actual offline/update state.
