# Delivery roadmap and release gates

## Planning contract

Sequence: **fictional public demo → private real-backend pilot → production gates**. This is dependency-based planning, not a dated delivery promise. Implementation status comes from [TASK.md](TASK.md), intended outcomes and unvalidated assumptions from [EPIC.md](EPIC.md). Current local command evidence is recorded in [CHANGELOG](CHANGELOG.md); hosted/device/live-provider acceptance remains separate.

The current checkout implements the static studio, not a private school backend. `index.html` is the entry point; `class.html` is a redirect. New permanent security/data capabilities belong in a separately governed private service before any real data is permitted.

## M0 — Fictional public demo

**Purpose:** Demonstrate evidence editing, explicit mock/optional remote drafting, educator correction and printable reports without representing a production school workflow.

**Included:** Fixed 20-child fictional roster, two sample semesters, four domains, browser-local save, editable names, evidence browsing, labelled illustration/upload provenance, draft queue, batch/retry, local review, reports and build-time offline/update behavior. Source: `src/portfolio-seed.js`, `src/portfolio-store.js`, `src/studio/context.js`, `src/providers.js`, `src/report-model.js`, `sw.js`.

**Work:** D1 → D2 → D3.

**Exit gates:**

- Capability wording and all privacy disclosures match current source; no real identities, credentials or real classroom material.
- Integration owner records exact revision and actual results of repository checks/tests/build/UI audit. Existing test names in TASK are evidence pointers, not execution receipts.
- Hosted root and project-subpath navigation, hash-preserving redirect, install/offline cache, explicit update/reload and failure recovery are observed. Offline UI must not imply a successful network transaction.
- Keyboard/screen-reader, physical-device, cross-browser and Chinese print/pagination results are recorded with known failures, not inferred from DOM tests.
- Gateway session issuance and actual generation are tested separately using fictional evidence. Disposable BYOK results are recorded per provider; failed calls visibly retain work, with no silent mock fallback.
- Mock output is visibly simulated, remote output remains draft text, and print retains the fictional-data/educator-review disclaimer.

**Blocks:** Missing hosted/device/provider evidence blocks the corresponding acceptance claim, not a request to process real data. Production login, tenant RLS, vector RAG, classroom tracking and inter-school transfer remain **NOT IMPLEMENTED** after this milestone.

## M1 — Private real-backend pilot

**Purpose:** Validate secure evidence-to-approved-portfolio work and educator benefit in a controlled private service. This is not an expansion of public browser storage into real records.

**Entry gate:** M0 evidence accepted for the demo; pilot scope, participants, templates, data categories, purposes and governance explicitly approved. P1 must close before any real-data use. A synthetic private-service environment can be developed without authorising real records.

| Sequence | Scope | Required release proof |
|---|---|---|
| P1 | PDPA/DPIA decision, contracts and processing inventory | Current provider terms/location/retention/training, DPA and subprocessors, actual proxy/runtime log practices, retention/deletion and incident responsibilities reviewed by accountable privacy owner |
| P2 after P1 | Identity, roles, assignments and tenant RLS | Server-enforced deny-by-default access, same-tenant integrity, non-bypass DB role; independent cross-tenant/role/spoofing/assignment-expiry tests |
| P3 after P2 | Durable database/media, revisions, lifecycle and audit | Scoped object access, concurrency/version handling, retention/deletion verification, content-minimised operational audit, backup and restore evidence |
| P4 after P1–P3 | Server-side drafting and educator-approved templates | Secrets isolated from browser; approved evidence projection, child attribution, unsupported-claim/failure cases; template/version provenance and cost/latency evaluation |
| P5 after P3–P4 | Authenticated finalisation and recipient-controlled release | Approved version bound to reviewer identity; edits invalidate approval; wrong-recipient/tenant/consent denial and disclosure audit evidence |
| P6 after P4 | Native-speaker localisation review and acceptance of implemented interface catalogs | Machine-translated **UNREVIEWED** `en`, `ms`, `zh-Hans` catalogs require native-speaker terminology/copy decisions from `artifacts/i18n-review-sheet.csv`, plus locale/fallback/date/rating tests and accessibility/print acceptance; implemented coverage is not production/security/privacy acceptance |
| P7 after P4–P6 | Educator outcome study | Agreed protocol, baseline/cohort, manual and assisted total minutes, verification/correction effort, correctness rubric, costs, uncertainty and stopping criteria |

**Pilot exit gates:** All above controls exercised in the private environment; no unresolved attribution, authorization or disclosure defect; educator review and privacy owners accept results. The teacher study must assess spelling, facts, attribution, completeness and required formatting, not fluency alone. Savings, quality and <~10% edit effort are not claimed without measurements and an agreed edit denominator. Several-hours-per-child preparation remains an unmeasured hypothesis until that study.

**Blocks:** No operational private backend/authentication/RLS exists in this checkout. `schema/future-postgres.sql:1-3,77-80` explicitly marks a proposed sketch lacking RLS; `spec/future-api.openapi.yaml` is not a deployed contract. Browser-local review and JSON import/export do not satisfy P3 or P5.

## M2 — Production readiness and controlled release

**Purpose:** Release only after private-pilot evidence demonstrates useful, correct and governable operation.

**Entry gate:** P1–P7 accepted. R1 is a decision package, not an implied implementation or automatic promotion.

**Required production evidence:**

1. Independent authorization/security review and closure of release-blocking findings; tenant boundaries and recipient controls tested against realistic abuse.
2. Current privacy/contract approvals, incident and breach procedures, deletion/retention controls, provider-processing evidence and change-review responsibilities.
3. Tested backup/restore and rollback drills; monitored availability, latency, failure rate and per-portfolio cost with agreed budgets and accountable operators.
4. Educator-approved output rubric and templates, representative quality study, human sign-off/release controls and safe failure handling. Conservative string guards alone are insufficient.
5. Accepted accessibility, device, locale and print evidence; support process and training accurately distinguish draft, approved and released versions.
6. Explicit product, engineering, security and privacy release decisions tied to the same version and evidence pack. Unresolved critical authorization, attribution or disclosure failures are no-go conditions.

**Next action:** Complete the TASK dependency chain, review evidence and only then establish a production release date. No production readiness or legal-compliance claim follows from this roadmap.

## Gateway evidence boundary

Source-inspection facts supplied for 2026-10-17 describe an origin-bound hashed `dmo` token with a 15-minute lifetime, `/demo/session` followed by `/demo/v1/responses`, router OFF with OpenAI `gpt-5.4-mini`, forced `store:false`, no prompt/response schema columns and a documented policy of no content/credential/upstream-error-body logging, only bounded operational metadata. These are supplied source/configuration facts, **not runtime verification performed here**.

Current browser source independently shows the session/generation path in `src/providers.js:91-97`, direct OpenAI `store:false` in `src/providers.js:99-102`, unread upstream error bodies in `src/providers.js:37-38`, and session-only Gateway connection probing in `src/providers.js:118-124`. Direct BYOK defaults to `gpt-5-mini` (`src/providers.js:8`), not the separately configured Gateway model.

Current upstream retention/training terms and processing locations, actual proxy/runtime logs and a DPA remain unverified/absent evidence. Token expiry, masking, empty content columns and `store:false` do not resolve those questions. Never test these claims with real data in the public demo.

## Separate future decisions

Vector RAG, classroom tracking, AV/voice assistance, biometrics, inter-school transfer and commerce remain **NOT IMPLEMENTED** and outside the milestone commitment. Their own approved necessity/scope, PDPA/DPIA, data-flow and acceptance decisions are prerequisites to any future implementation. Existing local evidence filters are not retrieval infrastructure; printable output is not authorized transfer.
