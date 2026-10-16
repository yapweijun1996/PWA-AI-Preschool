# 20 — Documentation and Project Changelog

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
- Recorded 27 passing tests, browser journeys at the required viewports, print/PDF proof, injected failures, and live Gateway HTTP session/response smoke in [the delivery report](24-verification-report.md).
- Removed external font fetching; the static UI and Offline Mock require no external service after assets load.

## v0.2 — 2026-10-13

- Produced neutral, company-agnostic README and comprehensive documentation bundle.
- Added `src/config.js` with empty `organizationName` and editable product/portfolio labels.
- Removed original company/interview references and fixed sample product brand names from the public showcase.
- Preserved static source/demo behavior and default Gateway + BYOK + Offline Mock adapters.
- Added backend/API, security, Singapore regulatory, student RAG and school transition planning docs.
- Added supplemental schemas, machine-readable future API outline, and AI coding agent brief.
- Verified source syntax and baseline Node unit tests; browser E2E and live Gateway are explicitly **not verified** by this documentation build.

## Deferred

- Owner push and publication of the new PWA release; earlier static Pages deployment is separate evidence.
- Integration E2E tests against live gateway and OpenAI/Gemini in a real browser.
- Backend tenant isolation, identity, secure RAG and approval workflows.
