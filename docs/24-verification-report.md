# 24 — Verification and Delivery Report

**Verification:** 2026-10-14–15  
**Scope:** completed fictional-only static PWA implementation on `complete-pwa-standard`; local integration only, no push of this change set.  
**Contract:** owner's KB-MCP `pwa:product-standard` v1.0.0; see [the acceptance contract](25-pwa-standard.md).

## Ready to test

`npm start` builds and serves only `dist/` at `http://localhost:4173/`. The earlier static demo was deployed to GitHub Pages; these new PWA commits are not yet published. The owner must manually push local `main`, wait for **Static checks and Pages deployment**, and repeat acceptance at the actual deployment URL. Native installation and physical iOS system chrome remain separate, unperformed checks—not inferred PASS results.

The final ordinary local build is **`1173d9b8c45e21ab`**. GitHub Actions adds its real commit prefix to the same runtime-source fingerprint. Synthetic `GITHUB_SHA` prefixes used for local update fixtures were not repository commits; the ordinary build was restored after testing.

## Exercised PWA acceptance

| Gate / check | Result | Observed evidence |
|---|---|---|
| Syntax, tests and static build | PASS | `npm run check`; 43/43 Node tests, zero failures; dependency-free `npm run build` |
| Root quickstart and repository subpath | PASS locally | Actual `npm start` app at `http://localhost:4173/`; built artifact also served under `http://127.0.0.1:4186/PWA-AI-Preschool/` |
| Manifest and install assets | PASS | Chrome `Page.getAppManifest` returned no errors; relative identity/start/scope, standalone display, 192/512 PNG and maskable icon; install action appeared |
| Native installed-window launch | NOT TESTED | Isolated Chrome protocol did not provide `PWA.install`; visible install affordance and valid manifest are not installation proof |
| Cold offline launch | PASS | Preview served `Cache-Control: no-store`; persistent browser network emulation reported `navigator.onLine === false`; root reload restored the controlled static shell and offline-ready status |
| Offline portfolio journey | PASS | Explicit Mock generated; summary edited; educator checkbox saved local review; real print-media PDF contained revised text, six own-student IDs, simulated/fictional labels and unauthenticated review disclosure |
| Cloud behavior offline | PASS | Cloud button disabled; settings retained explicit Mock choice; no silent provider substitution |
| Waiting release and postponement | PASS | N+1 downloaded without activation; update warning disclosed all session resets; cancel retained the existing simulated draft |
| Confirmed activation and version handoff | PASS | Explicit confirmation reloaded to N+1 and reset the draft; final CSS-changing release also updated to `1173d9b8c45e21ab` |
| Genuine two-tab behavior | PASS | Independent native Chrome targets: confirming tab reached C while peer remained on B with **Reload updated app**; peer changed only after its own confirmation |
| Loader and duplicate guard | PASS | Deliberately blocked activation messaging in the disposable browser: visible branded loader and disabled repeated action; no production source alteration |
| Bounded activation failure and recovery | PASS | 15-second timeout displayed session-preserving retry guidance; restoring messaging and retrying completed activation |
| Busy generation and cloud failure | PASS | Delayed injected HTTP 503 kept generation in flight; update refused with **Generation is still running**; build unchanged; failed cloud call created no draft or replacement Mock |
| Incomplete release installation | PASS | Disposable preview returned 503 for required icon; visible cache-setup error, no waiting worker or partial release cache; previous build remained available after offline cold reload |
| Cache and persistence boundaries | PASS | Exactly 15 query-free static routes in app Cache Storage; query and POST attempts rejected offline and did not add entries; localStorage/sessionStorage empty |
| System theme and reduced motion | PASS | Foreground light/dark media changes settled matching body colors, theme metadata and manifest links; reduced-motion scroll behavior `auto`; portfolio paper retained light print surface |
| Responsive and touch/input checks | PASS | No document-width overflow at 320/390/430/768/1440; exact 390×844, 430×932, 768×1024 and 1440×900 exercised; Generate/Review/Print 44px high, Change 64×44, password input 16px |
| Long-screen navigation | PASS | Contextual return-to-top visible on long scrolled content; mobile footer notices separated into their own rows |
| Smart hide/reveal topbar | N/A | Current topbar is not persistent; required only if the shell changes to a persistent bar |
| Physical iOS/Safari status bars, safe areas, keyboard and home-screen lifecycle | NOT TESTED | Desktop Chrome viewport emulation is not real-device/system-chrome evidence |
| New PWA Actions deployment and hosted-origin acceptance | NOT TESTED | No push of this change set; owner-managed publication and actual HTTPS smoke still required |

Initial local commands used **Node v23.10.0 / npm 10.9.2**; an additional actual **Node v24.20.0** run passed the same syntax checks, 43 tests and build, matching CI's Node 24 major. Actual PWA browser verification used isolated **Chrome 155.0.8059.40** on desktop. Phone/tablet dimensions are emulation, not physical mobile testing. The temporary activation/fetch/asset faults were restored or removed; no fault hooks are shipped.

### Current screenshots and PDF evidence

- [PWA desktop shell, 1440×900](qa-pwa-desktop.png)
- [Actual offline Mock surface, 390×844](qa-pwa-mobile-390.png)

The offline reviewed PDF was read from `/tmp/pwa-offline-reviewed.pdf`: one portfolio page, edited fictional summary, complete domain/evidence references, **SIMULATED OUTPUT — NO AI CALL**, and **Local review is not authenticated approval**. It is temporary local evidence, not a hosted download service.

## Earlier static-demo baseline, retained separately

The preceding 27-test delivery exercised all five fictional portfolios, educator roster filtering, session-added observation isolation and draft invalidation, text-only hostile-looking observation rendering, seven-field review, invalid citation rejection, evidence focus, BYOK acknowledgement/masking/cleanup, refresh reset, injected OpenAI/Gemini 401/429, neutral config branding and print behavior. This release adds 16 PWA behavioral regressions without changing the school/backend boundary.

Historical screenshots: [desktop](qa-desktop.png), [390px phone](qa-mobile-390.png), [430px reviewed crop](qa-mobile-430.png), [print media](qa-print.png). They are earlier-release evidence, not replacement proof for the PWA checks above.

### Gateway evidence, not current live-provider certification

On 2026-10-13, HTTP requests using the intended Pages Origin `https://yapweijun1996.github.io` observed:

| Request | Observed result |
|---|---|
| OPTIONS `/demo/session` | 204; exact Origin allowed |
| POST `/demo/session`, project `github-pages` | 201; expected token/type/expiry/model fields |
| POST `/demo/v1/responses`, model `demo-auto` | 200; portfolio validation accepted five domains and six own-student IDs |

Tokens were transient and never included in source or this report. Earlier localhost browser access failed CORS and correctly displayed an error without substitute output. The current PWA smoke used deliberate 503 failure injection; it does not establish current live Gateway, OpenAI/Gemini, quota, spending, expiry or replay behavior. Hosted provider checks remain separate from Offline Mock.

## Security and completion boundary

- No actual school/tenant authorization, encrypted persistent records, vector RAG, verified reviewer identity, parent delivery, AV/biometrics, transfer, commerce or future private API/SQL is implemented; those documents explicitly describe future work.
- Citation validation establishes membership/domain attribution, not factual entailment or model accuracy. Educator fact-checking remains mandatory.
- BYOK remains page-memory-only and visible to browser scripts/extensions/network tooling. Use disposable restricted keys and fictional records only.
- CSP, exact static caching and scope-specific cleanup are defense in depth, not secure client-side custody or tenant authorization. No live Gateway policy or credentials were changed.
- The browser-verified implementation is ready for testing; do not label the entire PWA standard certified until native installation, physical iOS and newly hosted-origin gates are actually exercised.

## Owner acceptance after manual push

1. Ensure Pages source is **GitHub Actions**, manually push local `main`, and wait for successful check/build/deploy jobs.
2. Open the actual deployment URL and confirm its build identity and **Ready · offline shell available**.
3. Generate explicitly with Mock, inspect sources, edit, approve locally and Print → Save as PDF.
4. Disconnect and cold-reload; repeat the local journey. Cloud must be unavailable, not replaced automatically.
5. Install through Chrome or iOS Safari/home-screen UI; inspect real status bars, safe areas, keyboard sheets and resume behavior.
6. With a later release and two tabs, cancel/confirm updates and verify session warnings, loader, newest version and no silent peer refresh.
7. Record hosted/device/provider results separately. Successful demo operation never authorizes real child data.
