# 24 — Verification and Delivery Report

**Verification:** 2026-10-13–14  
**Scope:** reviewer-ready fictional-only static demo; local branch `finish-static-demo`; no push or deployment performed.

## Ready to test

The completed demo builds without dependencies or a backend. The owner must select **Settings → Pages → Build and deployment → Source → GitHub Actions**, push local `main`, and wait for **Static checks and Pages deployment** to finish before testing the actual deployment URL. An expected URL is not deployment evidence. Start with **Offline Mock Demo**; cloud-provider availability is separate.

## Exercised verification

| Check | Result | Observed evidence |
|---|---|---|
| `npm run check` | PASS | All four browser modules and the static builder parse |
| `npm test` | PASS | 27 tests, zero failures; schema/citation boundaries, provider errors, credential handling and fresh sessions |
| `npm run build` | PASS | Seven runtime files plus `.nojekyll` staged in `dist/`; no npm install required |
| Workflow YAML | PARSE PASS | Ruby Psych parsed `check` and `deploy`; official Pages action versions checked against GitHub documentation |
| Repository-subpath browser load | PASS | Built artifact served at `http://127.0.0.1:4174/PWA-AI-Preschool/`; modules, CSS and favicon loaded |
| Static publication boundary | PASS | All eight staged routes returned 200; `/PWA-AI-Preschool/docs/README.md` returned 404 |
| Five fictional portfolios | PASS | All five generated complete simulated portfolios with seven sections, six own-student source IDs and complete timelines |
| Offline generation | PASS | Chrome network disabled after asset load; simulated draft generated without a provider |
| Educator role switching | PASS | Mr. Lee displayed ST-004/ST-005; switching back restored the in-session draft; UI discloses simulation |
| Observation lifecycle | PASS | Added fictional text produced seven visible records, retained oldest E01, invalidated the draft and did not appear for another student |
| Safe text rendering | PASS | Fictional `<img ... onerror=...>` observation remained text; no image node or handler execution |
| Review/edit/signoff | PASS | All seven fields edited and saved; change estimate updated; explicit local review recorded; later edits cleared approval |
| Invalid review citation | PASS | Other-student citation rejected in the open dialog without changing the saved reviewed draft |
| Evidence navigation | PASS | Clicking E01 source focused the matching observation in the full chronology |
| Provider settings | PASS | Missing-checkbox crash fixed; acknowledgement required; key masked on reopening and input cleared on close; Escape and native dialog focus containment exercised |
| Refresh reset | PASS | Draft/observations reset; BYOK input empty; localStorage/sessionStorage empty |
| OpenAI/Gemini failure injection | PASS | Browser-injected 401/429 showed sanitized guidance; previous simulated draft unchanged; no new mock substitution or echoed key/body |
| Required layouts | PASS | Chrome at 390×844, 430×932 and 1440×900; no document-width overflow at the phone widths; screenshots below |
| Print/PDF | PASS | Print button emitted `beforeprint`; built-artifact PDF extracted as one portfolio page, retaining simulated/fictional labels, source IDs and unauthenticated local-review disclosure, without dashboard controls |
| Config-only branding | PASS | Temporary intercepted config changed product/operator/title; neutral `./favicon.svg` loaded as sidebar and portfolio logos; repository defaults remain blank organization/logo |
| Credential/persistence scan | PASS | No bundled provider-secret patterns, browser-storage writes or unsafe `innerHTML` paths in runtime source |

Local command verification used **Node v23.10.0 / npm 10.9.2**. CI is configured for Node 24; GitHub execution has not occurred. Browser journeys used managed Chromium 150 and isolated Chrome 155 on desktop, including phone viewport emulation—not physical mobile-device or Safari testing.

### Browser screenshots

- [Desktop, 1440×900](qa-desktop.png)
- [Phone, 390×844](qa-mobile-390.png)
- [Reviewed portfolio crop, viewport 430×932](qa-mobile-430.png)
- [Print-media portfolio](qa-print.png)

PDF output was inspected from `/tmp/ai-preschool-pages-reviewed.pdf`; it is temporary local evidence, not a deployed download endpoint.

## Gateway evidence, separately reported

On 2026-10-13, HTTP requests using the intended Pages Origin `https://yapweijun1996.github.io` observed:

| Request | Result |
|---|---|
| OPTIONS `/demo/session` | 204; exact Origin allowed |
| POST `/demo/session`, project `github-pages` | 201; `token`, `token_type`, `expires_in`, `expires_at`, `model` fields |
| POST `/demo/v1/responses`, model `demo-auto` | 200; visible Responses text; strict portfolio validation accepted five domains and six own-student IDs |

Tokens were transient and were not saved or included in this report. The client now follows the observed `token`/Responses contract, not guessed legacy token aliases or Chat Completions envelopes.

**Local browser Gateway: FAILED connection.** Localhost was not CORS-allowed; the browser displayed actionable failure with no substitute output. This does not prove the hosted browser path. **Actual GitHub Pages browser Gateway: NOT TESTED**, because the owner has not pushed/deployed. HTTP protocol success is not a promise of future availability.

## Security boundary and remaining external checks

- **NOT TESTED:** actual GitHub Actions run/Pages publication, hosted-origin walkthrough, real OpenAI/Gemini test-key calls, Safari/Firefox and physical mobile devices, token expiry/replay, actual Gateway quotas/spending controls. Injected errors are not live quota evidence.
- **NOT IMPLEMENTED by design:** authenticated school/tenant authorization, encrypted persistent records, vector RAG, verified reviewer identity, parent delivery, classroom AV/biometrics, cross-school transfer, payments and the future private API/SQL proposals.
- Inline validation proves citation membership and same-domain attribution, **not factual entailment, completeness of every sentence's references or AI accuracy**. Educator fact-checking remains mandatory.
- BYOK keys are visible to browser scripts/extensions/network tooling and live in page memory; use disposable restricted keys and fictional data only. No production keys or real records belong in this demo.
- Generation errors never read/display raw provider error bodies, retry another provider, or silently create simulated content. Previous drafts stay visibly labelled.
- No live Gateway policy or credentials were changed. Owner-managed CORS, access and spending controls remain mandatory.

## Change manifest

- Runtime: `index.html`, `styles.css`, `src/app.js`, `src/config.js`, `src/data.js`, `src/providers.js`.
- Build/CI: `.github/workflows/pages.yml`, `scripts/build.mjs`, `.gitignore`, `package.json`.
- Consumer contracts: three `tests/*.test.js` files, portfolio schema and sample JSON.
- Documentation: README, affected requirements/provider/UI/deployment/testing/quickstart/changelog pages, config example, this report and four QA screenshots.
- Removed obsolete ZIP `MANIFEST.json`; its package hashes and old verification labels were stale.

## Owner acceptance after manual push

1. Select **GitHub Actions** as the Pages source, then manually push local `main`.
2. Wait for successful checks, build and `github-pages` deployment; open the URL shown by GitHub.
3. Select Offline Mock, choose a fictional student, generate, inspect source links, edit, approve and Print → Save as PDF.
4. Repeat on a phone; optionally test Gateway from that actual origin. Use disposable keys only for BYOK.
5. Record hosted results separately. Do not interpret static demo success as authorization to use real child data.
