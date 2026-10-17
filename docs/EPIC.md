# Product epics

## Purpose and present boundary

AI Preschool Studio explores reducing educator portfolio-writing work while preserving spelling, facts, child attribution, completeness and required formatting. The public product is a fictional-data browser studio, not a school records service. The root `index.html` is the studio; `class.html` redirects. Current capabilities and source/test evidence are classified in [TASK.md](TASK.md); milestones and release decisions are in [ROADMAP.md](ROADMAP.md).

This document describes outcomes and proposed work, not contractual targets. Current local command evidence is recorded in [CHANGELOG](CHANGELOG.md); no live provider calls were made for this task.

## Outcomes versus assumptions

### Intended outcomes

1. Educators can assemble evidence and obtain a near-final draft that remains editable and requires educator approval before release.
2. Every material claim is attributable to the correct child's recorded evidence; missing evidence stays visibly missing rather than becoming an invented developmental achievement.
3. Total educator time, including verification, correction and formatting, decreases relative to an observed manual baseline without lowering correctness or increasing privacy risk.
4. Approved portfolio structure and language are usable for educators and recipients; planned interface locales are `en`, `ms` and `zh-Hans`.
5. Any future real-data service demonstrably enforces authorization, controlled disclosure and data lifecycle obligations.

### Assumptions and proposed thresholds — not agreed results

- Preparation may take several hours per child, but no representative baseline has been measured. The six-hour / 150-student calculation in `docs/01-vision.md:5` is illustrative only.
- Educators want near-final teacher-approved drafts, not merely fluent first-pass text. This is a product hypothesis to validate through approved template and review studies.
- Less than approximately 10% editing effort is a **proposed, unagreed** target. Before adopting it, define whether effort means time, changed characters, changed fields or another denominator; count verification and formatting time separately.
- Faster generation alone does not demonstrate reduced educator workload. Functional test coverage does not establish factual quality, savings or adoption.
- Provider terms, locations, availability and costs require current evidence. Neither a browser disclosure nor `store:false` establishes complete retention or training policy.

## E1 — Evidence preparation and portfolio continuity

**User outcome:** An educator can find the relevant fictional child and semester, enter ratings and observations, attach fictional illustrations and see missing evidence before drafting.

**Present implementation:** Four fixed domains, bounded records, 20 fictional children, 40 sample semester records, status/search/evidence/profile views, browser-local save, child renaming and JSON import/export. Evidence: `src/portfolio-model.js`, `src/portfolio-seed.js`, `src/portfolio-store.js`, `src/studio/context.js`, `src/studio/models/`; `tests/portfolio-model.test.js`, `tests/portfolio-seed.test.js`, `tests/child-name.test.js`, `tests/studio-pages-model.test.js`.

**Acceptance:** Demo evidence must demonstrate semester isolation, correct identity after rename, missing-evidence display, storage-failure visibility and import validation. Future private continuity additionally requires scoped durable storage, concurrency and restore evidence, not localStorage.

**Work packages:** D2–D3 now; P2–P3 for private records. **Boundary:** No actual school roster management, cross-device continuity or classroom tracking is implied.

## E2 — Grounded drafting with explicit human control

**User outcome:** An educator receives a useful draft based on recorded evidence, can identify the source/provider, correct rejected work and retain existing work after a failure.

**Present implementation:** Default deterministic mock templates; optional Gateway and disposable-test-key OpenAI/Gemini transports; bounded JSON parsing, per-request masking, conservative grounding, accepted/rejected domains, batch progress and explicit retry. Evidence: `src/narrative.js`, `src/privacy-mask.js`, `src/providers.js`, `src/studio/bulk-draft.js`, `src/studio/context.js:196-280`; `tests/narrative.test.js`, `tests/narrative-ai.test.js`, `tests/studio-stage3-model.test.js`.

**Acceptance:** Demonstrate no silent remote-to-mock substitution, preservation of unrelated/previous text, visible missing evidence and provider provenance. Evaluate spelling, facts, attribution, completeness and format against educator-approved templates; include incorrect child names, unsupported quantities, absent prior evidence and false photo claims. Guards are not a factual-accuracy benchmark and may conservatively reject acceptable language.

**Work packages:** D3, P4, P7. **Boundary:** No vector RAG or autonomous developmental assessment. Photos stay local; text/photo-count evidence must not be described as image understanding.

## E3 — Review and controlled release

**User outcome:** An educator can review the full portfolio and release only the correct approved version to an authorized recipient.

**Present implementation:** Editable narratives, local reviewed state and child/class browser-print reports with a fictional-data/educator-review disclaimer. Evidence: `src/studio/narrative-controls.js`, `src/studio/context.js:122-135`, `src/report-model.js`, `src/report-view.js`; `tests/report-model.test.js`, `tests/studio-stage3-model.test.js`.

**Acceptance:** Demo reports preserve absent evidence and disclaimers. Private release must bind authenticated reviewer identity to an immutable approved version, invalidate approval after material changes, and enforce recipient/purpose checks with negative disclosure tests.

**Work packages:** D2–D3, P5. **Boundary:** Local review is PARTIAL business approval; print/JSON export is not guardian authorization, authenticated finalisation or inter-school transfer.

## E4 — Trustworthy access, operations and privacy

**User outcome:** A future operator can demonstrate who may access which records, how records are retained/deleted and how incidents are handled before processing real information.

**Present implementation:** Fictional-data warnings, memory-only test credentials, minimized masked requests, safe local errors and an allowlisted static offline shell. Evidence: `src/studio/pages/about.js`, `src/providers.js:27-48`, `src/studio/models/settings-model.js`, `sw.js`; `tests/studio-privacy-dom.test.js`, `tests/privacy-mask.test.js`, `tests/pwa.test.js`. These are limited demo safeguards, not production compliance.

**Acceptance:** P1 resolves PDPA/DPIA, contracts, current upstream processing terms and actual operational logging. P2–P3 establish identity, tenant RLS, durable lifecycle/audit and restore. R1 requires independent security and operational acceptance. Production authentication, tenant RLS and production data hosting are **NOT IMPLEMENTED**. `schema/future-postgres.sql` and `spec/future-api.openapi.yaml` are proposed design only.

**Work packages:** P1–P3, R1. **Boundary:** Never introduce real records in the public checkout. Masking is not anonymisation, and browser BYOK cannot keep a test key secret.

## E5 — Usability, language and measured benefit

**User outcome:** Educators can finish a correct, formatted portfolio efficiently across the intended devices and languages, with measurable total effort rather than unsupported productivity claims.

**Present implementation:** English UI, multilingual name/input handling, Chinese-domain narrative support, responsive module pages and a build-time offline/update mechanism. Evidence: `src/child-name.js`, `src/narrative.js`, `src/pwa.js`, `sw.js`; `tests/child-name.test.js`, `tests/narrative-ai.test.js`, `tests/pwa.test.js`. Full interface i18n and outcome measurement are **NOT IMPLEMENTED**.

**Acceptance:** Hosted/device/accessibility/print journeys are evidenced separately from Node tests. Full `en`/`ms`/`zh-Hans` localisation requires reviewed catalogues and locale regression tests. A controlled study reports manual versus assisted total minutes, review/correction time, proposed edit metric, correctness failures, costs and uncertainty; quality thresholds are agreed before observing outcomes.

**Work packages:** D3, P6–P7. **Boundary:** Multilingual identity support and a Chinese narrative domain do not equal a translated interface.

## Explicit exclusions

Classroom tracking, classroom AV/voice capture, biometric identification, automated teacher ranking, automatic family messaging, inter-school transfer, vector RAG and commerce remain **NOT IMPLEMENTED**. None is an incidental extension of these epics. Any proposal requires separate necessity, scope, privacy and acceptance decisions.
