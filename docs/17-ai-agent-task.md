# 17 — Ready-to-Paste Coding Agent Implementation Task

## Role

You are the lead full-stack engineer and security-aware reviewer building a **company-neutral, browser-first AI Preschool Studio**. Develop from the included source and docs. Never assume this prototype is ready for real child data.

## Mission

Turn the existing static GitHub Pages demo into a polished reviewer-ready showcase. Implement source-backed preschool portfolio drafting with five fictional pupils, an 18-month illustrative evidence timeline, teacher review, a printable report, default short-lived GPT Demo Gateway sessions, test-only OpenAI/Gemini BYOK modes, and labelled Offline Mock. Maintain **white-label** design with `organizationName:''` by default. No school/company name in code, docs, assets or UI. Do not hardcode credentials.

## Constraints

1. English for code, comments, file names, labels and primary docs; Mandarin quickstart permitted.
2. No actual children’s records, faces, voices, school logos, materials or secrets.
3. Frontend demo role switch must be explicitly labelled **simulation only**; no claims of tenant isolation.
4. No calls to private gateway `/v1` with bundled static key; use supported public `/demo/session` followed by `/demo/v1/responses` after validating live policy.
5. Never silently switch from failed AI call to simulated success.
6. Implement HTML display using `textContent`/safe DOM APIs; validate provider JSON and evidence IDs.
7. Real access control and RAG/vector retrieval require a separate authenticated server and formal privacy review.
8. Add automated tests, run them and record evidence. Browser E2E required before claiming browser compatibility.
9. Preserve the Git worktree; work on a named branch. **Do not push/merge/deploy or alter live Gateway settings without the owner's explicit approval.**
10. No company-specific brand strings, credentials or legal claims in public commits.

## Proposed tasks

- Inspect `README.md`, `src/config.js`, `src/data.js`, `src/providers.js`, `src/app.js` and `docs/`.
- Add accessible provider-mode UX and connection status with sanitized errors.
- Verify Gateway session token response shape, temporary expiration, project ID, model, CORS and per-origin quota *read-only* before changing client protocol.
- Add robust data validation and per-claim evidence linking, plus regression tests for source-mix hallucinations.
- Test viewport sizes 390×844, 430×932 and 1440×900; test print/PDF preview.
- Optional static build checks, Pages instructions and CI tests.

## Deliverables

- Source branch and commit hashes (if commits allowed by owner), changed-file manifest, test summary with proof, browser screenshots and list of known limitations.
- A reviewer-friendly demo route with explicit fictional data warning.
- An architecture note separating v1 static demo from v2 private, tenant-aware platform.
- A security report on BYOK, prompt injection, Gateway quota and missing production controls.

## Acceptance

`npm run check`, `npm test`, no hardcoded school names, no bundled provider credentials, no real child data. Browser and gateway connectivity statuses must be reported as **passed, failed, or not tested** separately. If GitHub Pages publishing is not authorized or tool-accessible, deliver ZIP and exact manual publishing instructions, not an invented live URL.
