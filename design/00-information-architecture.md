# Information architecture — AI Preschool Studio

## Product and scope

The page-per-module fictional-data static PWA is implemented in `class.html`. Non-print pages share navigation, semester context, provider status and a persistent demo notice; print routes hide app chrome. `index.html` remains the unchanged legacy long-scroll demo.

The educator's primary job is to complete four-domain portfolios, review generated text against teacher evidence, and print a child or class report. The only people represented in data are fictional children and the simulated educator.

## Shared shell

- Desktop: fixed-width left SidebarNav with Home, Class portfolios, Students, Evidence library, AI drafts, Reports, AI provider settings and About and privacy; TopBar with breadcrumb, semester switch, provider status, fictional-data chip and PWA status; DemoNotice directly below.
- Mobile at 390 px: content-first page, TopBar, DemoNotice and a fixed five-item MobileTabBar: Home, Classes, Students, Drafts, More. More opens Evidence library, Reports, AI provider settings and About and privacy.
- Persistent safety copy: “Fictional demo data”, “Stored only in this browser”, and “NOT IMPLEMENTED: real login / server / database”.
- Shell state is factual: show “Offline ready” only after the service worker confirms its cache; distinguish Offline mock from remote AI and show save errors beside local-save status.
- All routes use the same shell except the printer's browser print chrome; P09 keeps the demo-data disclaimer on the A4 page.

## Page map

| ID | Page and route | Desktop navigation | Main responsibility |
| --- | --- | --- | --- |
| P01 | Home · #/ | Home | Class progress, work queue, drafts awaiting review and quick actions |
| P02 | Class portfolios · #/classes | Class portfolios | Search, filter and open 20 fictional child portfolios |
| P03 | Child portfolio editor · #/classes/class-a/children/C-05?sem=2026-S2 | Child of Class portfolios | Edit one selected domain at a time, compare S1/S2, review narratives |
| P04 | Students directory · #/students | Students | Find and open a fictional child |
| P05 | Student profile · #/students/C-05 | Child of Students | Show a child's learning timeline and semester change |
| P06 | Evidence library · #/evidence | Evidence library | Browse comments and abstract placeholder photos by child/domain |
| P07 | AI drafts · #/drafts | AI drafts | Show draft queue, status, rejected domains and review entry points |
| P08 | Reports · #/reports | Reports | Choose child/class and semester, then preview |
| P09 | Report print layout · #/print/C-05?sem=2026-S2 | Output of Reports | A4 portrait report with S2-to-S1 comparison and print/PDF action |
| P10 | AI provider settings · #/settings/ai | AI provider settings | Select Offline Mock, public demo session or disposable test-key provider |
| P11 | About and privacy · #/about | About and privacy | Explain fictional data, limitations, shortcuts and NOT IMPLEMENTED features |
| P12 | System states · reference, no route | None | Inventory loading, empty, error, rejected, offline, update and save states |

No additional top-level routes are introduced. P03 uses a sticky child header, progress strip, four domain tabs and a final Review narratives step; it is not one long form.

## Primary journeys

1. **Finish a class:** P01 class progress → P02 filter/search or Continue with next unfinished child → P03 rate and comment by domain → draft narratives using the selected provider → review/edit each source-labelled narrative → mark reviewed and continue → P02 completion summary.
2. **Review AI drafts:** P01 Drafts awaiting review → P07 open a draft or rejected domain → P03 Review narratives → compare every claim with linked evidence and edit → explicitly mark reviewed. Drafts are proposals; local review is not authenticated approval.
3. **Print a report:** P01 or P02 Print class report / P03 Print / PDF → P08 choose child or class and semester → inspect P09 preview and any INCOMPLETE warnings → Print / Save as PDF.

## Current implementation mapping and limits

- Studio host/entry: `class.html`, `src/studio/app.js`; routing: `src/studio/router.js`; shell: `src/studio/shell.js`; shared state: `src/studio/context.js`. Page renderers and view-models live in `src/studio/pages/` and `src/studio/models/`, with `src/studio/editor-model.js` for the editor.
- Canonical routes above and `#/print-class?sem=2026-S2` are implemented. `legacyRedirect()` preserves old child-editor hashes; unknown routes resolve to Home with a visible notice. The studio reuses the portfolio model, seed and browser store.
- Existing index.html and src/app.js contain a different five-record, long-scroll showcase and session-only portfolio/review state. Do not mix its sample counts or session-only records into the class dashboard.
- src/providers.js and src/narrative.js validate remote responses and surface request/rejection errors; they do not silently fall back to mock. Photos are not sent to providers.
- `src/pwa.js` supplies PWA controls integrated by the studio entry and shell. Update consent remains explicit; offline readiness must reflect actual cache state, not the wireframe example.
- Real login, authorization, tenant isolation, server/database/object storage, audit log, finalisation, vector RAG and production AI are NOT IMPLEMENTED.
