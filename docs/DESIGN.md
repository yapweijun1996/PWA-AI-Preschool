# Design — current implementation

Source order: code → tests/runtime evidence → Git history → explicit decisions → older prose. Status vocabulary and capability matrix: [TASK](TASK.md). Requirements: [SPEC](SPEC.md). This is a fictional-data static demonstration, not a private school system.

## Architecture and boundaries

- [index.html](../index.html) hosts the only app; [class.html](../class.html) and [redirect module](../src/redirect.js) preserve old hash entry links. No application server or database is bundled.
- [App dispatcher](../src/studio/app.js), [router](../src/studio/router.js) and [shell](../src/studio/shell.js) own navigation, focus, shared notices and page lifecycle. Page modules own DOM rendering; models derive lists and counts. [Design index](../design/README.md) records page contracts, wireframes and known image deviations; screenshots are not runtime proof.
- [Context](../src/studio/context.js) coordinates selected semester, in-memory provider credentials, persistence, edits, drafting and visible errors. [Portfolio model](../src/portfolio-model.js) owns four-domain validation, progress and semester comparison; [store](../src/portfolio-store.js) owns validated browser-local envelopes. [Seed](../src/portfolio-seed.js) provides 20 fictional children.
- [Narrative module](../src/narrative.js) owns prompt construction, response parsing, grounding checks and provenance. [Privacy masker](../src/privacy-mask.js) owns request-local minimisation/restoration. [Providers](../src/providers.js) own HTTP envelopes, deadlines and safe errors; they do not render UI.
- [Report model](../src/report-model.js) and [view](../src/report-view.js) produce browser print output, not server PDFs. [PWA](../src/pwa.js) handles install/update/offline state; [build](../scripts/build.mjs) stages static assets and scoped service-worker resources without dependencies.

## Data flow and privacy masking

Teacher input → validated four-domain record → local browser persistence. A draft derives minimal evidence plus local masking context → request-local identity dictionary and pattern scanning → exact masked prompt preview → selected transport → JSON/grounding validation against masked evidence → selected-child name restoration → original-evidence validation → accepted domain narratives and provenance → browser persistence → teacher edits/local review → print.

The reverse map is disposed in `finally`; it is not stored, logged or transmitted. Known identities and common contact/date/address tokens are masked; sensitive categories can block transmission. Unknown names and indirect identifying facts can survive. Pseudonymisation is not anonymisation. Photos, avatars and image metadata never enter model evidence. All four domains enter each remote request even for one-domain retry; class batches send separate child requests. Failures remain visible, preserve rejected-domain text and never silently substitute mock output. Offline mock uses masked evidence locally and is labelled simulated.

### Gateway boundary: evidence and limits

Owner-supplied external source inspection dated 2026-10-17, not a new inspection or live probe in this checkout: `POST /demo/session` issues a 15-minute origin-bound `dmo_*` token, stored server-side only as SHA-256 hash; `POST /demo/v1/responses` forwards the prompt. No provider key enters the browser. Inspected configuration: `DEMO_ENABLED=true`, `DEMO_ROUTER_ENABLED=false`, `DEMO_PROVIDER_SOURCE=env`; current single-provider upstream is OpenAI `gpt-5.4-mini`. Browser routing configuration is not proof of the upstream model. Enabling the router could introduce OpenAI/Groq/Gemini routes and requires a new disclosure review.

The gateway does not store prompt text: 17 inspected migrations contain no prompt/response-content column, only hashed sessions, projects/origins, usage/token ledgers, route metadata and bounded error codes. Its documentation excludes prompt content, credentials and upstream error bodies from logs/returned errors; documented errors contain request ID/route/SQLSTATE. It forces upstream `store: false`, requesting no persisted OpenAI response object. Per-IP limits, daily per-project token budgets (midnight Asia/Singapore) and unknown-field rejection apply. Gateway image support is not used by this studio.

**Unverified:** upstream retention, current training/abuse-monitoring terms, processing location, reverse-proxy/Cloudflare logs and actual runtime log contents. No demo contract/DPA exists. These facts do not authorize real child data. Direct disposable-key OpenAI/Gemini modes bypass the gateway; OpenAI sends `store:false`, without proving vendor-wide deletion. See [privacy masking](28-privacy-masking.md).

## UX/page model

Eight primary destinations: Home, Class portfolios, Students, Evidence library, AI drafts, Reports, AI provider settings, About and privacy. Child editor/profile are child routes; child/class print routes omit app navigation but retain the disclaimer. Mobile uses Home/Classes/Students/Drafts/More. Shared semester state, persistent fictional-data/browser-storage notices, labelled draft provenance and visible save/failure state prevent local simulation being presented as authenticated workflow. Colours use runtime tokens with light/dark variants; 44px tap targets and audit budgets are constraints, not a certification of accessibility.

## Decisions and REJECTED alternatives

- Current root studio replaces the old five-record long-scroll demo; keeping two active applications is REJECTED. The historical tag `legacy-demo-v1` preserves the removed version.
- Static ES modules and a browser store demonstrate workflow without infrastructure. Production security inferred from browser-only role selection or local review is REJECTED.
- Text-only minimum evidence plus local restoration is chosen over sending names or photos. Claiming regex masking guarantees anonymity is REJECTED.
- Explicit provider failure and explicit Offline mock selection are chosen over silent mock fallback (REJECTED).
- Page-memory disposable BYOK is a demo option; bundled keys or claims of browser secrecy are REJECTED.
- Automated ratings, teacher-performance surveillance and face/voice recognition are deliberately out of scope, not pending implementation commitments.

## Known limitations and alignment

No measured teacher time saving or edit percentage; factual/spelling/completeness checks still require staff review. Local review is not authenticated release approval. Browser storage is neither encrypted private records storage nor a backup. Full i18n en/ms/zh-Hans, private backend and operational/legal readiness are planned, not delivered. Production authentication, tenant RLS, vector RAG, classroom tracking and inter-school transfer are **NOT IMPLEMENTED**.

### Singapore PDPA/PDPC alignment notes

Minimisation, visible purpose/transfer notices and local masking are engineering measures, not compliance/certification. [Privacy masking notes](28-privacy-masking.md) distinguish law, guidance, implementation and source limitations. Before a real-data pilot: deployment-specific DPIA, legal basis/parent notices, vendor contracts/DPA, retention/deletion, overseas transfer assessment, access controls and incident procedures must be independently approved. No such approval is claimed here.
