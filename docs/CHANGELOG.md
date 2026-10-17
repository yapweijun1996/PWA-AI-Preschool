# Changelog

Historical entries below are Git-based history, not a list of production releases; current unreleased changes record their local verification separately. Dates and abbreviated commits in the historical sections came from checkout history inspected on 2026-10-17 through `12bf3a0`. `package.json` reports `0.3.0`; this document does not infer release tags from that value. The [numbered changelog](20-changelog.md) retains detailed historical QA claims and must be read at the revision each entry describes.

## Unreleased — P10 wireframe alignment and one-row desktop top bar

- AI provider settings: provider cards show their descriptions and the Default marker at every width (the duplicate collapsed "Provider descriptions" block is removed); cards at 601px and above gain the wireframe icon badges (image, squares-and-dot, hexagon, triangle) with the radio on the right. Radios are custom-drawn so unselected state is visible on dark surfaces.
- The disposable-key panel gains a title, an eye toggle that switches the field between masked and plain text (`aria-pressed`, "Show key"/"Hide key" in all three languages) and an amber warning notice with icon. Keys remain page-memory only; nothing is stored.
- The data disclosure is now a shield-icon card (its previously unapplied `.provider-data-disclosure` styles are used). The text is still the pseudonymisation notice, not the wireframe's "Sends only the child's first name…" line, which would overstate the privacy model.
- Top status chips share one pill shape with `data-tone` ready/warn/neutral; the Connection status chip gains a dot.
- At 1280px and wider the top bar stays on one row: the breadcrumb takes leftover space, chips use their short labels (full labels from 1680px) and the language selector stays inline. Below 1280px the previous wrapping is unchanged.
- Verification: `npm run check && npm test` passed (273 tests after merging the Malay grounding commit). Local Chromium at 1280, 1440 and 1680px in English, Malay and Simplified Chinese measured a single-row top bar and no page overflow on six routes; 390px layout checked and unchanged. Provider cards, key toggle, disclosure and connection card were inspected at 390 and 1440px in light mode.
- Not run or not verified: `npm run ui:audit`, dark-mode visual review (the Gateway/Gemini icon colours are fixed hues), widths between 1024 and 1279px (top bar still wraps to two rows), live Gateway/OpenAI/Gemini, physical devices.

## Unreleased — Malay narrative grounding and original-language evidence

- Allow bounded Malay curriculum/rating vocabulary and common sentence starts in Malay narratives only; retain name, quantity, photo and Chinese-script guards. Provider prompts require fully Malay sentences rather than English sentences spliced with Malay rating labels.
- Malay offline mock drafts separate the Malay rating sentence from a quoted verbatim teacher comment, explicitly marked as shown in its original language. Existing saved narratives are not translated or rewritten.
- Capitalisation rejections identify the safe category (sentence-start word or name/mid-sentence word) in all three interface languages, never echoing potentially identifying provider words.
- Sample illustration alt text and captions reuse the three language catalogs, including print report language and live interface switching; teacher-edited and uploaded descriptions remain verbatim.
- Local Chromium smoke: Malay interface and report language, C-05 English-domain offline drafting; observed the fully Malay comparison sentence, original English comment marker/quote, mock provenance, and translated planting-scene caption and alt. Live Gateway/provider and deployed-site behavior were not exercised.
- `npm run check && npm test && npm run build` passed: **273 tests**, zero failures/cancelled/skipped/todo, **97 precached routes**, build `b023853069b64b34`. `npm run ui:audit -- --quick`: **0/180 failed**, report `artifacts/ui-audit/2026-10-17T13-03-39-133Z/summary.md`.
- Full `npm run ui:audit`: **0/450 failed**, report `artifacts/ui-audit/2026-10-17T13-04-23-138Z/summary.md`.

## Unreleased — internationalisation foundation

- Add implemented `en`/`ms`/`zh-Hans` UI catalogs with named-parameter `t`, English fallback, development missing-key detection and `Intl` date/number/plural formatting. Native-name selectors live in the desktop top bar/mobile More; English is the default without autodetection, and guarded `localStorage` remembers explicit choices.
- Add an independent report/narrative language preference for printed document labels and new drafts. Chinese-domain output remains `zh-Hans`; stored drafts keep their language, and supplied evidence remains verbatim.
- Mark catalog translations machine-translated **UNREVIEWED** in About; native-speaker review remains required. `npm run i18n:review-sheet` exports 816 catalog keys to `artifacts/i18n-review-sheet.csv`. This does not establish production/security/privacy readiness.
- Expand the UI audit matrix to 450 combinations (`15 routes × 5 sizes × 2 schemes × 3 locales`), quick 180; add `--locales` and locale-suffixed artifacts. Budgets remain unchanged; `Intl.Segmenter` distinguishes natural Chinese wrapping from split Latin words.
- Local browser smoke exercised native-name language selection and reload persistence, an English default with a Malay browser locale, a Chinese interface with Malay report labels and mock narratives, preservation of a fictional name matching the `English` UI label, and the visible unreviewed-translations disclosure. Teacher evidence remained unchanged; Chinese-domain prose retained its own `lang`.
- Final gate: `npm run check && npm test && npm run build` passed with **265 tests passed**, zero failed/cancelled/skipped/todo, and **97 precached routes**; build `0de9b4c64b526970`. `npm run i18n:review-sheet` wrote all **816** unreviewed catalog rows.
- `npm run ui:audit`: **0/450 failed** — `artifacts/ui-audit/2026-10-17T12-00-07-844Z/summary.md`. `npm run ui:audit -- --quick`: **0/180 failed** — `artifacts/ui-audit/2026-10-17T12-11-34-690Z/summary.md`. The final 320px Malay class list and Simplified Chinese editor viewport images were visually inspected; complete copy remains readable, the first class card clears the bottom tabs, and short Chinese tabs retain 44px targets.
- Native-speaker translation review, live Gateway/provider health, deployed-origin behavior, physical-device/screen-reader acceptance and actual print pagination remain unverified. The local browser smoke and automated layout budgets do not establish these.

## Unreleased — documentation sync, 2026-10-17

- Establish the standard [DESIGN](DESIGN.md), [SPEC](SPEC.md), [EPIC](EPIC.md), [ROADMAP](ROADMAP.md), [TASK](TASK.md) and CHANGELOG set; refresh the root README and documentation index against source and Git history.
- Separate current fictional-data browser behavior and implemented, unreviewed multilingual UI from proposed production services, measurement and PDPA/DPIA work. Unmeasured workload assumptions and a proposed edit-effort target are not validated outcomes or agreed acceptance thresholds.
- Published-site availability, live-provider behavior, deployment, physical-device/accessibility and print pagination acceptance were not reverified in this task.
- `npm run check && npm test && npm run build` passed with **237 tests passed**, zero failed/cancelled/skipped/todo, and **91 precached routes**. Existing shared privacy-notice/transmission tests exercised the corrected disclosure without adding brittle copy assertions.
- `npm run ui:audit -- --quick`: **0/60 failed**; `npm run ui:audit`: **0/150 failed**. Reports: `artifacts/ui-audit/2026-10-17T11-17-46-631Z/summary.md` and `artifacts/ui-audit/2026-10-17T11-19-09-988Z/summary.md`. The 390×844 dark settings screenshot was visually inspected: corrected gateway/provider notice is readable and visible. Automated budgets do not establish screen-reader or physical-device acceptance.
- Dependency-free throwaway validation checked changed-document relative links and mentioned filenames; no persistent checker or dependencies were added. Generated build metadata and abbreviated shared-module references were resolved to their actual paths.
- Correct the shared in-app notice and current privacy documentation using owner-supplied gateway source inspection: no gateway prompt-text storage and forced upstream `store:false`; vendor retention/location and proxy/runtime logs remain unverified. This is not a new live gateway inspection.
- Leave the numbered changelog chronological rather than rewriting old behavior as if it were current. Its earlier rename review-invalidation entry was superseded by `12bf3a0`; a pure rename now preserves review and evidence freshness.

## 2026-10-17 — current studio changes

### Teacher workflow corrections — `12bf3a0`

- Move name editing below sticky navigation; close the successful edit panel, restore trigger focus and announce the change.
- Preserve review/freshness on pure renames. Persist old-name history and offer explicit narrative-name replacement without replacing teacher prose wholesale.
- Avoid showing initials while an avatar is still loading; retain fallback initials for missing/failed images.
- Show class completion after final review and on Home instead of an unusable continuation action.
- Regression coverage is present in the child-name, demo-media and studio DOM suites; the current gate above executes it.

### Free-form names and demo-media integration — `236c436`

- Give all 20 fictional seed identities English default names; retain stable child IDs and semester records.
- Add trimmed/NFC-normalised Unicode names, length/control validation, duplicate warnings, persistence and grapheme-aware initials.
- Connect watermarked AI-generated avatars/scenes to studio views, distinguish browser uploads and permit image-only `blob:` decoding in CSP.
- Add child-name and demo-media regressions; extend the static build's explicit asset list. The illustration files themselves were introduced earlier by `db94675`.

### Request-local masking — `9b0658c`

- Add browser-side request-local pseudonymisation, selected-child restoration, residual-identifier rejection and visible fail-closed behavior before remote and Offline mock drafting.
- Add masked-prompt disclosures and regression coverage in `tests/privacy-mask.test.js`, `tests/studio-privacy-dom.test.js` and `tests/narrative-ai.test.js`.
- Document pseudonymisation as a limited demo safeguard, not anonymisation or permission to process real records. Upstream retention/training, processing location and legal arrangements are not established by browser masking or this commit history.

### Root cutover and removals — `5d597c8`

- Make `index.html` the studio entry and replace `class.html` with the hash-preserving compatibility redirect using `src/redirect.js`.
- Remove the retired five-record long-scroll application, its old-only schema/sample, styles and tests; retain shared provider/portfolio/report/PWA modules and add [redirect tests](../tests/redirect.test.js).
- Remove obsolete numbered PRD, scope, walkthrough, agent-task and verification documents plus old QA screenshots. Intentional numbering gaps are historical, not missing current contracts.
- Update build, worker and route/documentation mappings for the single root application. Historical detailed QA remains in the numbered changelog, not evidence of a fresh run here.

### Legacy preservation, illustrations and mobile refinements — `111aa63`, `db94675`, `aed75d0`–`111aa63`

- `legacy-demo-v1` points to **`111aa63`**, before the root cutover, privacy-mask change and free-form name/media integration. It preserves the old root demo alongside the then-current routed studio; it is not a production release or the current application contract.
- `db94675` adds the 32 watermarked AI-generated demo illustrations after that tag.
- `aed75d0`, `ed122cc`, `c8fa177` and `111aa63` refine the compact shell, editor, list and utility-page layouts. The tag contains these earlier mobile refinements but not the subsequent cutover.
- `ebeb41d` and `8f80c32` add the dependency-free CDP UI audit and layout-budget refinements. The harness and its artifacts are development tools, not shipped runtime assets or proof of physical-device accessibility.

### Page-per-module studio — `55e9c75`, `9dcb84d`, `e954872`, `0c30b26`

- Add the shared shell/router, class overview, child editor and print pages, followed by Home, students/profile, evidence, drafts, reports, provider settings and About pages.
- Establish design tokens, page specifications and wireframes (`966ccea` and subsequent design syncs); refine layouts and route-scoped states.
- `0c30b26` records the combined page-per-module studio. At this point it was hosted by `class.html`; the old root demo had not yet been removed.
- `b520483` records deployment/Gateway observations for that earlier revision in documentation. A documentation commit or old observation does not verify the current checkout's published artifact or provider availability.

## 2026-10-16 — class portfolio prototype

- `c7cd1a5` adds the four-domain portfolio model, seed and local store; `2c3e6f7` adds the class overview and per-child editor.
- `efffb10` adds provider-backed narrative drafting, grounding checks and provider selection; subsequent fixes refine grounded English/Simplified Chinese output, neutral wording and partial draft handling.
- `6a014ae` adds printable per-child/class reports with Simplified Chinese support. This is not a complete translated application UI.
- `3d792df` restores a mixed Semester 2 sample state; `e617229` records the combined prototype and write-up.
- `108c80f` records earlier Pages/Gateway observations. Those observations concern that earlier prototype, not a current deployment or a production data-processing approval.

## 2026-10-14 — static demo and PWA infrastructure

- `df19c22` finishes the original static portfolio demo and adds the GitHub Actions Pages workflow.
- `0851b2c` adds static-release offline caching and controlled updates; `ca93b5b` adds responsive safe-area/theme/accessibility controls.
- `52fa27b` adds versioned build output, manifests and icons. Later commits document preview, deployment and PWA evidence for that historical application.

## 2026-10-13 — repository beginnings

- `ebca988` is the initial commit; `cf9e2fa` is the next recorded repository commit. Neither is presented here as a verified production release.

## What this history does not establish

Production authentication/roles, tenant RLS, private application server/database/storage, authenticated approval, vector RAG, classroom tracking and inter-school transfer remain **NOT IMPLEMENTED**. No measured time saving, edit-rate improvement or quality gain is asserted. No real child, family, staff, photo, voice or workplace data is permitted in this demo. Consult [SPEC](SPEC.md) for current behavior and [the test guide](10-testing.md) for the gates still requiring actual execution and recorded evidence.
