# Design brief — page-per-module wireframes (SSOT inputs)

Historical input brief (2026-10-17). The result is implemented; see README.md.
Product: **AI Preschool Studio** — a fictional-data static PWA for preschool teachers: class portfolios with four learning domains (English, Chinese, Mathematics, Social-Emotional Development), ratings (Emerging, Developing, Secure, Extending), comments, photos, AI-drafted narratives that the teacher reviews and edits, semesters S1 (Jan-Jun) and S2 (Jul-Dec) where S2 shows S1 ratings, printable A4 reports with Simplified Chinese.

## Problem to solve
Today the main page (`index.html`) is ONE long scrolling page: hero + metrics + student directory + evidence + AI portfolio. The menu items Overview / Students / AI Portfolio / Evidence library only scroll to different spots of that page. "AI provider settings" is a modal dialog. `class.html` is a separate mini-app with a different look and no shared navigation. There is no single source of truth (SSOT) for layout, navigation, components or states.

Goal: design a **page-per-module** application. Every menu item is its own page (own route, own wireframe, own spec), all sharing ONE shell (navigation, topbar, notices) and ONE design system. The wireframes plus the page specs become the SSOT that implementers follow.

Current screenshots (real, for reference, in `design/current/`): `01-index-desktop.png`, `02-index-mobile.png`, `03-class-overview-desktop.png`, `04-class-overview-mobile.png`, `05-child-editor-desktop.png`, `06-child-editor-mobile.png`, `07-print-child.png`.

## Hard constraints
- Fictional data only: made-up child names (mix of English names and Simplified Chinese names), abstract placeholder pictures (shapes, illustrations), NO real people, faces, photos, logos, company or school names. Product name is exactly "AI Preschool Studio".
- Visual direction (already chosen by the project owner): warm professional ivory + forest green, calm and trustworthy, generous whitespace, optional tiny hand-painted leaf/still-life accent used sparingly. Palette to start from: ivory `#f8f8f4`, surface white `#ffffff`, soft green surface `#eef3ed`, ink `#233b32`, muted `#5a6b63`, line `#dbe2d9`, primary forest green `#244e43`, positive `#315f4c`, focus `#387552`, warning bg `#f6eddf` / ink `#6e512e`, error bg `#fff0eb` / ink `#903d2d`. Provide light and dark variants of the tokens in `tokens.css` (dark base `#10272f`, surface `#1b3339`, ink `#edf0e5`).
- Accessibility: contrast AA, controls at least 44x44 px, visible focus ring, state never by colour alone (text or icon too), keyboard reachable, respects reduced motion.
- Responsive: desktop 1440x900 (sidebar layout) and mobile 390x844 (bottom tab bar). No horizontal scrolling.
- Static site, no framework required; specs must be implementable with vanilla JS ES modules + hand-written CSS + hash routing (`#/route`).
- Honest labelling must stay visible: "Fictional demo data", "Stored only in this browser", "MOCK DRAFT (offline, not AI)" vs "AI DRAFT (...) - teacher must review", "NOT IMPLEMENTED: real login / server / database".
- English UI copy. Chinese only where a Chinese sample name/comment is shown.
- Images are mid-fidelity wireframes/mockups, not final art. Use short, real, legible English labels (no lorem ipsum). Image text can be unreliable: the page spec `.md` is the authoritative copy; if image and spec differ, the spec wins.

## Information architecture (fixed — do not invent other top-level pages)
Shell: left sidebar on desktop; bottom tab bar on mobile with 5 tabs (Home, Classes, Students, Drafts, More); "More" opens a list: Evidence library, Reports, AI provider settings, About and privacy. Topbar: breadcrumb, semester switch (2026-S1 / 2026-S2), AI provider status chip, "Fictional demo data" chip, PWA status (offline ready / update available). Demo notice strip below topbar.

| ID | Page | Route | Desktop menu item |
|---|---|---|---|
| P01 | Home (dashboard) | `#/` | Home |
| P02 | Class portfolios (class overview, 20 children) | `#/classes` | Class portfolios |
| P03 | Child portfolio editor (domain tabs) | `#/classes/class-a/children/C-05?sem=2026-S2` | (child of Class portfolios) |
| P04 | Students directory | `#/students` | Students |
| P05 | Student profile (S1 vs S2 progress timeline) | `#/students/C-05` | (child of Students) |
| P06 | Evidence library (comments + photos by child/domain) | `#/evidence` | Evidence library |
| P07 | AI drafts (run, review queue, rejected drafts) | `#/drafts` | AI drafts |
| P08 | Reports (choose child/class + semester, preview, Print / Save as PDF) | `#/reports` | Reports |
| P09 | Report print layout (A4 portrait: child report, with S2 progress table) | `#/print/C-05?sem=2026-S2` | (output of Reports) |
| P10 | AI provider settings (full page, replaces the modal) | `#/settings/ai` | AI provider settings |
| P11 | About and privacy (fictional data, NOT IMPLEMENTED list, shortcuts, limitations) | `#/about` | About and privacy |
| P12 | System states sheet (empty, loading, error, rejected draft, offline, update available, saved/not saved) | (reference sheet, not a route) | — |

Child editor (P03) must NOT be one long scroll: sticky child header (name, "5 / 20", previous/next, save status), a progress strip, and **domain tabs** (English | Chinese | Mathematics | Social-Emotional) so only one domain panel is shown at a time on both desktop and mobile, plus a final "Review narratives" step. S2 shows each domain's S1 rating and change inside the domain panel.

## Deliverable layout (all paths relative to repo root, inside `design/`)
- `design/wireframes/00-sitemap.webp` — information-architecture map (pages, shell, how users move).
- `design/wireframes/01-design-system.webp` — components sheet: buttons, chips/status, rating control, tabs, cards, form fields, photo tile, narrative box with source label, toast, dialog, nav (sidebar + bottom bar), empty/error states.
- `design/wireframes/P01-home-desktop.webp`, `P01-home-mobile.webp` ... one desktop and one mobile image per page P01-P08, P10, P11; P09 has one A4 portrait image only; P12 one desktop image only.
- `design/pages/P01-home.md` ... one spec per page (template below), `design/00-information-architecture.md`, `design/01-design-system.md`, `design/tokens.css`, and finally `design/README.md` (SSOT index) — the index is written by the last job only.

## Page spec template (`design/pages/Pxx-name.md`, at most ~70 lines)
```
# Pxx — Name
Route / menu item / who uses it / purpose (2 lines)
## Wireframes
![desktop](../wireframes/Pxx-name-desktop.webp) ![mobile](../wireframes/Pxx-name-mobile.webp)
## Regions (top to bottom, left to right; numbered)
1. ... (component names from the design system, exact visible copy in quotes)
## Data shown (fields, from which existing module/function)
## Actions and navigation (what each control does, where it goes)
## States (empty, loading, error, offline, long content, 20 children)
## Responsive behaviour (what changes at 390 px)
## Accessibility notes
## Implementation mapping (existing files/functions to reuse; new files proposed; hash route)
## Acceptance checks (5-8 testable bullets)
```
Existing code to read for real capabilities: `index.html`, `src/app.js`, `src/data.js`, `src/providers.js`, `class.html`, `src/class-app.js`, `src/class-view.js`, `src/portfolio-model.js`, `src/narrative.js`, `src/report-model.js`, `src/report-view.js`, `src/pwa.js`, `docs/26-submission-writeup.md`.
