# Specification — fictional-data studio

Current implementation is the authority; [capability matrix](TASK.md) separates IMPLEMENTED, PARTIAL, MOCK and NOT IMPLEMENTED. [Design](DESIGN.md) owns architecture; [design index](../design/README.md) owns page intent. Tests below are executable evidence locations, not claims of a live-provider or physical-device pass.

## Assumptions to confirm

The school wants a per-child development portfolio. Teachers may currently spend several hours per child manually: **unmeasured**. Near-final AI drafts edited and approved by staff are a proposed outcome. Under approximately 10% teacher edit effort is an example proposed metric, not an agreed target or measured result. Spelling, factual accuracy, student attribution, completeness and format require staff checks before release. Child confidentiality must prevent disclosure of identifiable records to third-party AI tools; masking reduces risk but does not prove this requirement for real records. Central monitoring, notifications, scheduling and primary-school transfer are unvalidated ideas. Teacher surveillance, automated ratings and face/voice recognition are excluded.

## Functional rules and acceptance evidence

| ID | Requirement / boundary | Acceptance evidence |
| --- | --- | --- |
| F01 | Four exact domains: `english`, `chinese`, `mathematics`, `social-emotional`; labels English, Chinese, Mathematics, Social-Emotional Development. Ratings null (Not rated) or integer 1 Emerging, 2 Developing, 3 Secure, 4 Extending; invalid/missing/extra domain keys rejected. | [portfolio model tests](../tests/portfolio-model.test.js) |
| F02 | S1 Jan–Jun, S2 Jul–Dec; validate real ISO calendar dates. S2 compares same-year S1 ratings; S1 has no previous-semester comparison. UI currently selects 2026-S1/S2, although model parses four-digit years. | [model tests](../tests/portfolio-model.test.js), [editor tests](../tests/studio-model.test.js) |
| F03 | A domain is ready only with rating and nonblank comment; photos alone are partial. All four narratives yield drafted, and local reviewed=true yields reviewed. This is not secure approval. | [model tests](../tests/portfolio-model.test.js), [DOM workflow](../tests/studio-dom.test.js) |
| F04 | Persist validated fictional records; import replaces rather than merges, rejects duplicate child/semester identities; failed writes do not commit store state. Reset is explicit. | [store tests](../tests/portfolio-store.test.js) |
| F05 | Fictional names: trim and NFC-normalise, 1–60 Unicode code points, no controls. Any script allowed; duplicate names warn but IDs remain distinct. Pure rename preserves prose/review/freshness; explicit old-name replacement preserves teacher prose and requires human review of its result. | [name tests](../tests/child-name.test.js), [DOM workflow](../tests/studio-dom.test.js) |
| F06 | Draft JSON has exactly four nonempty string keys, at most 2000 characters each. Prompt asks 2–4 warm factual third-person sentences (not a general sentence-count guarantee), using the independent report/narrative preference (`en`, `ms`, `zh-Hans`) except the Chinese domain always uses Simplified Chinese. Copy supplied first-name script/spelling, not translation. Existing stored draft language survives preference changes. | [narrative tests](../tests/narrative.test.js), [AI tests](../tests/narrative-ai.test.js) |
| F07 | Ground only in supplied rating/comment/previous rating; compare only supported differing ratings. No invented quantities, names, gendered pronouns or photo claims; no-evidence output is the fixed one-sentence message. Pattern checks are bounded, not a general fact checker. | [AI tests](../tests/narrative-ai.test.js) |
| F08 | Mask known identity/context and common identifiers before every remote draft; never send photos or reverse map. Preview is exact model text, not credentials/envelope. Validate before and after local restoration; privacy failure sends nothing. | [mask tests](../tests/privacy-mask.test.js), [privacy DOM](../tests/studio-privacy-dom.test.js), [AI tests](../tests/narrative-ai.test.js) |
| F09 | Offline mock is visibly simulated. Provider/validation failures remain visible, never silently become mock; rejected domains preserve existing text, explicit retries may recover. Provenance distinguishes AI/mock/teacher edits. | [AI tests](../tests/narrative-ai.test.js), [stage-three DOM](../tests/studio-stage3-dom.test.js) |
| F10 | Child/class browser print includes disclaimer and missing-data indications, without application navigation. No server PDF or verified staff release workflow. | [report tests](../tests/report-model.test.js), [class view tests](../tests/class-view.test.js) |
| F11 | Uploaded fictional images remain browser-local; bundled cartoons retain generated-watermark identity; upload errors are visible. | [photo tests](../tests/photo.test.js), [media tests](../tests/demo-media.test.js) |

## Routes

[Router](../src/studio/router.js) and [route tests](../tests/studio-router.test.js) define exact parsing, not arbitrary query-string equivalence:

- `#/`, `#/classes`, `#/students`, `#/evidence`, `#/drafts`, `#/reports`, `#/settings/ai`, `#/about`.
- `#/classes/class-a/children/:id?sem=2026-S2` (or S1), optional final `&domain=english|chinese|mathematics|social-emotional|review`.
- `#/students/:id` uses shared semester; semester query on profiles is rejected.
- `#/print/:id?sem=2026-S2`, `#/print-class?sem=2026-S2`; omitted print/editor semester defaults to S2.
- Classes accepts `?filter=ready-for-draft`; Reports accepts `?sem=2026-S1|2026-S2` then optional `&child=:id`.
- Old `#/child/:id` links map to the editor. Malformed encoding/unknown routes show Home with notice; missing child is handled visibly. [Redirect tests](../tests/redirect.test.js) cover the compatibility entry.

## Browser storage contract

[Store](../src/portfolio-store.js) uses localStorage key `ai-preschool-portfolios-v2`: `{version:2,savedAt,records,childNames,childNameHistory}`. `savedAt` is a parseable timestamp; name maps use known C-01 through C-20 identities, history arrays deduplicated after name normalisation. No backend migration/sync is implied.

Records: `{childId,semester,domains,narratives,status,reviewed?}`; status is recomputed. Each domain: `{rating,comment,photos}` with comment at most 1000 characters and up to six `{id,alt,src}` photos. Sources are image data URIs or allowlisted bundled scene paths. Each narrative is null or `{text,source,edited,provider?,model?}`; source ai/mock/teacher, provider gateway/openai/gemini, optional nonempty model at most 101 characters. Validation drops unsupported record fields. Keys/session tokens and rejection history remain transient; restored fictional narrative text and name history persist locally. [Store tests](../tests/portfolio-store.test.js) and [name tests](../tests/child-name.test.js) cover malformed/version/duplicate/write-failure cases. Browser storage remains readable to same-origin scripts; no encrypted child-record custody is implemented.

## Provider interface after masking

[Prompt builder](../src/narrative.js) serialises only `{firstName,domains}` after masking. Domain prompt fields: label, ratingLabel, masked comment, previousRating, previousRatingLabel, noEvidence; Chinese additionally ratingLabelZh/previousRatingLabelZh. Semester, photo pixels/count metadata, identity dictionary and reverse map are not outgoing evidence. Four domains enter each request even on a one-domain retry. Teacher comments are untrusted data, not instructions. Exact placeholder vocabulary is implementation-owned by the [masker](../src/privacy-mask.js).

[Transport](../src/providers.js):

- Gateway session body `{project_id}`; response must contain a usable token. Response request Authorization Bearer temporary token; body `{model,input:[{role:'user',content:[{type:'input_text',text:maskedPrompt}]}],stream:false}`. No provider key in browser.
- Direct OpenAI Responses uses the same input structure and `store:false`; selected/default model with page-memory disposable key in Authorization.
- Direct Gemini generateContent uses `{contents:[{role:'user',parts:[{text:maskedPrompt}]}],generationConfig:{responseMimeType:'application/json'}}`, test key in `x-goog-api-key`. Model names are validated.
- Each HTTP call has a 30-second abort deadline and no-store cache mode; error bodies are not displayed. Invalid JSON/envelopes/empty output fail visibly. [AI transport tests](../tests/narrative-ai.test.js), [probe tests](../tests/provider-probe.test.js).

Owner-supplied gateway source inspection (2026-10-17, not independently repeated here) establishes 15-minute origin-bound `dmo_*` sessions stored hashed, router OFF, env single-provider OpenAI `gpt-5.4-mini`; gateway forces upstream `store:false`. The gateway does not store prompt text: 17 migrations have no prompt/response-content columns; documented logs exclude content/credentials/upstream error bodies and retain bounded operational metadata. Per-IP limits, daily project budget reset at midnight Asia/Singapore and unknown-field rejection apply. Gateway supports images generally; the studio sends none. **Not verified:** vendor retention/training/abuse-monitoring policy, processing location, proxy/Cloudflare logs and actual runtime logs. No demo DPA/contract exists. See [full privacy notes](28-privacy-masking.md). The browser alias/default configuration is not proof of live upstream model identity or availability.

## Non-functional requirements and risk gates

| ID | Constraint | Evidence / acceptance |
| --- | --- | --- |
| N01 | Neutral English UI/code, fictional records only; no embedded credentials. | [configuration tests](../tests/configuration.test.js), `npm run check`; human content/privacy review still required |
| N02 | Strict external-script/style CSP; no inline style attributes or untrusted HTML interpolation; provider allowlist only. | [AI tests](../tests/narrative-ai.test.js), `npm run check` |
| N03 | Token colours, light/dark, 44px tap targets, responsive overflow/sticky/first-screen budgets. | `npm run ui:audit -- --quick` and `npm run ui:audit`; [audit workflow](27-ui-audit.md). Automated budgets do not prove all accessibility/device journeys. |
| N04 | Zero-build ES-module source, dependency-free static build and Pages path portability. | `npm run check && npm test && npm run build`; [PWA tests](../tests/pwa.test.js) |
| N05 | Offline readiness requires successful initial caching; failures/update state visible; never cache provider requests as application assets. | [PWA tests](../tests/pwa.test.js); current browser/device offline acceptance remains separate |
| N06 | Staff approval before real release, confidentiality, completeness/spelling/factual/attribution/format review. | Local review/print only PARTIAL; no authenticated release, comprehensive spelling/fact checker or real-data acceptance exists. Private pilot blocked pending backend/legal controls. |
| N07 | UI catalogs cover `en`, `ms` and `zh-Hans`; native-name selectors in desktop top bar/mobile More default to English without autodetection and persist explicit choices with guarded `localStorage`. Pure `t` uses named parameters; `Intl` formats locale-sensitive values. Report/narrative preference is independent; printed labels follow it, Chinese-domain output stays `zh-Hans`, and stored drafts/evidence are not translated. | Machine-translated **UNREVIEWED**; About discloses native-speaker review still required. `npm run i18n:review-sheet` exports `artifacts/i18n-review-sheet.csv` for review. Locale/browser/print acceptance and native review remain gates, not production/security/privacy approval. |

### Singapore PDPA/PDPC alignment notes

[Privacy masking](28-privacy-masking.md) separates legal sources, regulator guidance and bounded engineering choices; no compliance/certification is claimed. DPIA, lawful basis/consent and notices, DPA/vendor retention and transfer review, deletion schedules and incident exercises are planned gates, not implemented services. Production authentication, tenant RLS, vector RAG, classroom tracking and inter-school transfer are **NOT IMPLEMENTED**. Implemented en/ms/zh-Hans UI catalogs remain machine-translated **UNREVIEWED**, requiring native-speaker review; teacher-time-saving measurement remains planned.
