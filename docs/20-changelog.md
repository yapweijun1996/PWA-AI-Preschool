# 20 — Documentation and Project Changelog

## Request-local privacy masking — 2026-10-17

- Added browser-only request masking before narrative-provider calls and the Offline mock path, with local selected-child restoration, residual-identifier rejection and visible failure rather than silent mock fallback.
- Studio generation supplies all available child/record identities plus class, teacher, configured organisation and derived first-name variants as local-only masking metadata.
- Replaced first-name transmission claims with the shared fictional-demo/pseudonymisation notice; class, child, drafts and provider settings disclose the exact masked prompt using the generation prompt builder. Settings distinguish the exact direct-provider connection probe from Gateway session creation.
- Added UI coverage for preview refresh and selection, preview-to-network equality, excluded private metadata/images, nested aliases/guardians, offline masking and fail-closed visibility.
- Added [privacy masking boundaries](28-privacy-masking.md), separating LAW, regulator GUIDANCE and implementation choices. Pseudonymisation is not anonymisation; gateway retention/training/processing locations and real-deployment legal arrangements remain unverified. Existing fictional portfolio persistence remains unchanged.
- Verification: `npm run check && npm test && npm run build` passed with 212/212 tests and 57 precached routes. `npm run ui:audit -- --quick` reported 0/60 failed combinations; full `npm run ui:audit` reported 0/150 failed combinations. Reports: `artifacts/ui-audit/2026-10-17T10-29-24-919Z/summary.md` and `artifacts/ui-audit/2026-10-17T10-30-49-461Z/summary.md`. Heuristic warnings are not screen-reader or physical-device acceptance.
- Actual local Chromium QA verified settings/editor masked previews, masked contacts, local child-name restoration, visible sensitive-input failure preserving the existing narrative, mobile external-provider notice expansion, and a fully visible first class card at 320×720. Live Gateway/OpenAI/Gemini availability, provider policies and legal acceptance were not tested.

## Root studio cutover — 2026-10-17

- Made the studio the sole root product; `class.html` is a small redirect preserving hash routes, including child/editor and print destinations.
- Removed the old five-record long-scroll runtime and its exclusive schema/example, tests and documentation/evidence. Historical context belongs to `legacy-demo-v1`; shared studio provider, portfolio, report and PWA code remains in use.
- Updated the short root README, documentation index, current behavior/security/deployment/PWA guidance, intentional Chinese quickstart and design route/file mappings. Retained intentional submission/UI-audit documents and clearly labelled production proposals.
- Main-agent cutover verification: `npm run check && npm test && npm run build` passed, with 189/189 tests and 55 precached routes. Browser checks rendered the root, preserved `class.html#/classes` as root `#/classes`, and exercised the offline redirect after worker fragment normalization; no browser errors were reported. Relative Markdown scan: 42 documents, 118 links, zero broken. These supplied results are local cutover evidence, not deployment, physical-device or live-provider acceptance.
- Root UI audits passed: `npm run ui:audit` covered 150 combinations with zero failed rows (`artifacts/ui-audit/2026-10-17T10-00-46-543Z/summary.md`); `npm run ui:audit -- --quick` covered 60 with zero failed rows (`artifacts/ui-audit/2026-10-17T10-03-19-358Z/summary.md`). No live Gateway/provider request or physical-device acceptance was performed.

## B4 mobile utility pages — 2026-10-17

- Home puts Continue before metrics on phones, preserves whole metric values, and groups
  queue identity/status, tasks and full-width actions without duplicating completion copy.
- Phone screen reports use 2×2 ratings and labelled stacked comparison rows; A4 print CSS
  and Simplified Chinese report generation are unchanged. Back has a 44×44 minimum target.
- Profile evidence groups every comment/photo by semester and domain with one editor link;
  tablet comparisons use cards. About links the public main-branch write-up and retains the
  shared confirmed sample reset and legacy entry point.
- Empty rejection/failure queues are summaries; Reports puts printing before the collapsible
  preview. Tablet utility pages stack. Phone provider descriptions are disclosed separately
  so all four choices remain visible, with no reduction in control or text sizes.
- Browser interaction QA confirmed an empty focused OpenAI key field at 390×844:
  bottom 628.58px, bottom-tab top 777px, autocomplete off and 90px scroll padding.
  No key was entered and no provider request was made. Reports opened from its collapsed
  preview state; About exposed the configured write-up URL.
- Verification: `npm run check && npm test && npm run build && npm run ui:audit`
  passed: 205 tests, 150 device/scheme/route combinations, zero fail-level violations.
  Evidence: `artifacts/ui-audit/2026-10-17T09-21-21-559Z/summary.json`.
  Viewed `full.png` for Home, Print, Profile, Drafts, Reports, Settings and About at
  320/390/768 light and 390 dark. Final caption-corrected audit:
  `artifacts/ui-audit/2026-10-17T09-25-09-388Z/summary.json`, also zero failures;
  re-viewed all four Print captures. Print is 2108px (was 1854px), deliberately taller
  on phones to preserve whole rating and semester labels rather than compressing columns.
- Against the original 08:07 audit, 390px light heights changed: Home 2155→1571,
  Profile 5149→3759, Drafts 1625→1414, Reports 2140→1366, Settings 1414→1158.
  About is 2213px (was 2212px), retaining all disclosures and adding the working write-up link.
  Earlier shell/list/editor batch improvements are included in this baseline comparison.
  Physical iPhone keyboard and actual A4/PDF pagination remain unverified; Gateway was not
  exercised. The separate interaction-browser screenshot timed out; audit PNGs were available.

## Development UI audit harness — 2026-10-17

- Added a dependency-free CDP runner with real mobile metrics, light/dark captures,
  geometry/accessibility candidates and configurable fail/warn budgets.
- Added pure helper tests and [audit workflow documentation](27-ui-audit.md).
- Audit artifacts remain ignored and outside the shipped static build; no app UI changes.

## Page-per-module studio and design SSOT — 2026-10-17

- Fixed ≤600 px Classes/Students cards and Evidence rows; final measured 390 px heights 4,884 / 4,358 / 5,241 px; retained desktop layouts and refreshed verification evidence.
- Studio avatars reuse fictional-seed Latin initials with compact, non-wrapping typography and minimum 40 px circles; responsive DOM QA confirmed containment, while mobile header DOM QA measured 109 px with no route overflow; screenshot capture timed out, leaving visual and physical-iPhone verification unverified.
- Replaced the class prototype with the routed `class.html` studio: shared desktop sidebar,
  topbar, amber safety notice, mobile chip row and five bottom tabs; print routes hide chrome.
- Added Home, class/editor, students/profile, evidence, drafts, reports, provider settings and
  privacy destinations; legacy child links redirect and unknown hashes show a Home notice.
- Runtime modules live in `src/studio/`, with `studio.css` and the copied design tokens.
  Removed `src/class-app.js` and `class.css`; the original `index.html` demo is unchanged.
- Design SSOT contains 12 page specs and 24 WebP wireframes generated with Codex CLI image
  generation. Specs own copy/behavior, images visual intent and tokens enforceable values.
- Updated the README and submission walkthrough/evidence with supplied responsive,
  mock/edit/review, key-failure and two-page child-PDF QA.
- Deployment verified on `main` at `0c30b26`: Actions run `39002277394` check/test/build and Pages jobs succeeded; live assets returned HTTP 200; deployed build `0c30b2667ac4-310aad36f9f29889` matched the local source snapshot. All 14 deployed route checks passed; active service worker/cache held 56 entries; Gateway C-02 / 2026-S2 accepted 3 of 4 domains with English visibly rejected. True offline reload remains untested; previous stable rollback commit `108c80f`.
- Documentation-update verification: `npm run check` passed; `npm test` confirmed 177 passed / 0 failed. Build, deployment and browser observations are supplied evidence, not rerun here.
- Real login, server/database, tenant isolation, server PDF, vector RAG and audit log remain
  NOT IMPLEMENTED. No code, tests, design files or workflows changed in this documentation stage.

## Page-per-module visual refinement — 2026-10-17

- Added token-based sidebar icons, soft-green navigation selection, five equal mobile tabs,
  an icon list sheet, responsive safety notice and button-style navigation actions.
- Removed the duplicate visible route announcement and global save card. Save/retry feedback
  remains in the editor; announcements remain available to assistive technology.
- Limited Home's needing-work queue to three children and linked the full class roster.
  Added compact class cards, three-column domain editing and responsive module layouts.
- Moved real offline/install/update controls to the About page. Provider credentials remain
  memory-only; the settings password field starts empty and is disabled for keyless providers.
- Preserved the legacy demo and print route behavior. Design files were not modified.
- Verification: syntax/CSP checks, 174 Node tests and static build passed. Browser review used
  light-mode 1440 × 900 and 390 × 844 screenshots for all routed modules and both print outputs;
  layout measurements additionally covered 430 px. No live Gateway/provider call was made.
- Specs take precedence over image deviations: actual filtered roster counts, blue Developing
  selection, visible mobile provider/PWA status and warning-colored NOT IMPLEMENTED sections.
  Real missing evidence remains visible in previews rather than matching a complete sample image.

## Class portfolio printable reports — 2026-10-16

- Added child Print / PDF and overview Print class report routes, with explicit Print / Save as PDF activation; reports do not invoke providers.
- Added validated, deterministic report projection, four labelled rating segments, source-labelled narratives, photo captions, Semester 1-to-2 progress and printed INCOMPLETE warnings.
- Added A4 portrait print styling, page breaks between children, Simplified Chinese language markers and a local system-font stack. Long comments, narratives or photo collections may require extra pages; content is not truncated to force a single sheet.
- Supplied verification evidence records passing syntax checks, 129 passing tests and build; headless Chrome child PDF: 2 A4 pages with embedded PingFang SC, and class PDF: 40 pages for 20 children. Chinese name/comment/narrative rendering and suppressed print focus outlines were checked. Other operating systems and CJK fonts remain untested; see [the submission evidence](26-submission-writeup.md).

## Class portfolio AI drafting — 2026-10-16

- Added reusable raw-text Gateway/OpenAI/Gemini transport while retaining the original portfolio validation path and public Demo Session flow.
- Added first-name-only, four-domain narrative prompts, strict JSON parsing, conservative grounding guards and Simplified Chinese/no-evidence constraints.
- Wired overview/editor provider controls, memory-only disposable keys, connection feedback, offline blocking, sequential bulk drafting and teacher-review provenance. Grounded domains are accepted independently; rejected domains retain existing text and show retry/manual-edit guidance. Malformed responses and request failures change no narratives and never substitute mock output.
- Preserved AI provider/model metadata through local record validation and teacher edits; restricted class CSP connections to the existing three provider origins.
- Added transport/controller and grounding coverage, including gendered-pronoun rejection, exact-first-name prompting, localized Chinese ratings and non-numeric Chinese compound handling. Supplied browser QA covers mock/review, disposable-key non-persistence and sanitized fake-key failure. The live Gateway Node-harness sample accepted 30 of 32 domains with 2 visible retryable rejections and 0 gendered pronouns in accepted drafts; this is not a quality benchmark or deployed-browser proof. Live OpenAI/Gemini test-key calls remain untested.

## Submission documentation — 2026-10-16

- Reworked the submission write-up into the team's requested tech stack, semester storage, hosting/security and future-feature answers, with retained SQL/design appendix and measured evidence replacing the placeholder. Updated README provider, Simplified Chinese seed, partial acceptance and print-report status; restored seed evidence distinguishes empty not-started records from in-progress records. Production proposals remain NOT IMPLEMENTED. Deployment verification remains pending. Documentation-only revision: no commands, tests, browser QA, Gateway calls, commit or deployment performed; results are attributed to supplied evidence.

## v0.3.0 — PWA completion — 2026-10-14

- Applied the owner's KB-MCP `pwa:product-standard` v1.0.0 within the fictional-only static scope.
- Added version-local atomic shell caching, scope-specific cache cleanup, explicit waiting-worker updates, reset confirmation, branded loader, multi-tab handoff and bounded failure recovery.
- Added generated theme manifests, 192/512 PNG and maskable icons, release metadata and a built-artifact `npm start`; GitHub Actions continues publishing only `dist/`.
- Added system-theme metadata, opaque iOS status-bar settings, safe-area/visual-viewport layout, 44px controls, 16px inputs, reduced motion and contextual return-to-top. Corrected concatenated mobile footer notices.
- Added 16 behavioral PWA regressions; all 43 tests, syntax checks and build passed. Exercised cold offline Mock/edit/review/PDF, version updates, busy/duplicate protection, activation timeout recovery, incomplete-install recovery and real two-tab behavior.
- Updated acceptance, deployment/rollback, security, quickstart and QA evidence. Physical iOS/Safari/native installation and this new hosted PWA remain explicitly untested.


## Static demo completion — 2026-10-13

- Fixed the provider-settings crash by adding the missing BYOK acknowledgement; added modal feedback, key masking/cleanup and accessible review labels.
- Replaced silent schema/evidence repairs with strict rejection, bounded content and same-student/domain inline citation validation.
- Added deterministic cited mocks, full evidence chronology, coverage counts and linked source records.
- Protected generation from context changes; saved edits are revalidated, editing resets signoff, and printouts disclose local review status.
- Added config-only public logo support; defaults remain neutral, with no logo or organization configured.
- Added dependency-free runtime-only `dist/` build and checked GitHub Actions Pages deployment; PRs never deploy.
- Removed the stale ZIP packaging `MANIFEST.json`; its hashes and unverified status no longer describe the repository.
- Recorded 27 passing tests, browser journeys at the required viewports, print/PDF proof, injected failures, and live Gateway HTTP session/response smoke in the historical delivery report (retired with the old demo; see `legacy-demo-v1`).
- Removed external font fetching; the static UI and Offline Mock require no external service after assets load.

## v0.2 — 2026-10-13

- Produced neutral, company-agnostic README and comprehensive documentation bundle.
- Added `src/config.js` with empty `organizationName` and editable product/portfolio labels.
- Removed original company/interview references and fixed sample product brand names from the public showcase.
- Preserved static source/demo behavior and default Gateway + BYOK + Offline Mock adapters.
- Added backend/API, security, Singapore regulatory, student RAG and school transition planning docs.
- Added supplemental schemas, machine-readable future API outline, and AI coding agent brief.
- Verified source syntax and baseline Node unit tests; browser E2E and live Gateway are explicitly **not verified** by this documentation build.

## Historical deferred items (pre-cutover)

- Owner push and publication of the new PWA release; earlier static Pages deployment is separate evidence.
- Integration E2E tests against live gateway and OpenAI/Gemini in a real browser.
- Backend tenant isolation, identity, secure RAG and approval workflows.
