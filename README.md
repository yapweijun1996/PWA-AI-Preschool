# AI Preschool Studio — White-label Browser Demo

**Status:** completed fictional-only static PWA demo; deployed-origin route, cache and Gateway checks recorded; physical-device and true offline-reload acceptance remain untested. **Audience:** education product teams, prospective operators, engineers and reviewers. **No school affiliation is asserted.**

A browser-first, GitHub Pages–ready demonstration of evidence-grounded preschool learning portfolios. Visitors can try the default public GPT Demo Gateway (if configured and live), use a temporary **BYOK** OpenAI or Gemini test key, or choose **Offline Mock**. The UI uses **five fictional students** and synthetic observations across an illustrative **18-month** period.

> **Hard restriction:** This public project is **not** a school records platform. Never input real child identities, images, audio, observations, staff records or company-only documents. Teacher access is simulated client-side. The app does not provide production authentication, tenant isolation or a compliant data-processing service.

Studio avatars reuse the fictional seed's Latin initials, including Chinese sample names.
Three-letter initials use compact typography without wrapping; circles remain at least
40 px and do not shrink in flex rows. Mobile class cards use tighter vertical padding.
Responsive DOM QA in light mode at 390, 430 and 1440 px confirmed contained, centred
avatar text. At 390 × 844, document heights were Classes 4,884 px, Students 4,358 px
and Evidence 5,241 px. Browser screenshot capture timed out; visual QA remains unverified.

## Quick start

```bash
# Node 24 is used by CI; no npm dependencies or install step are required.
npm start
# Open http://localhost:4173/ (serves the built dist/ app)

# Optional checks in another terminal:
npm run check
npm test
npm run build
```

For the original `index.html` demo, open **AI provider settings**, select **Offline Mock Demo**
for an explicitly labelled local walkthrough, or try the configured Demo Gateway. Its drafts,
observations, approvals and keys reset on reload. The class studio below instead persists
fictional learning records in `localStorage`. Use only disposable restricted BYOK keys and
fictional data; browser memory is not secure key custody. Offline shell behavior requires
successful initial caching and is not new-studio offline-reload acceptance evidence.

## Page-per-module studio

Open the [live class studio](https://yapweijun1996.github.io/PWA-AI-Preschool/class.html)
for the static, vanilla ES-module studio: 20 fictional children, semester comparison,
browser-local autosave, editable drafts, review and printable reports.
The original five-record `index.html` demo remains independent and unchanged.

Deployed merge commit: `0c30b26`. Previous stable release / rollback commit: `108c80f`.
For this documentation update, `npm run check` passed and `npm test` confirmed
**177 passed, 0 failed**. Supplied Actions run `39002277394` passed both check/test/build
and GitHub Pages deployment jobs.

```bash
npm run build && python3 -m http.server 4173 --directory dist
# Open http://localhost:4173/class.html

npm run check
npm test
```

The shared shell has an icon sidebar in canonical order: Home, Class portfolios, Students,
Evidence library, AI drafts, Reports, then AI provider settings and About and privacy.
The topbar shows breadcrumbs, semester, provider, fictional-data and offline status; an amber
notice reinforces the demo boundaries. Mobile uses a chip row and five bottom tabs, hidden
on print routes.

| Page | Hash route |
|---|---|
| Home | `#/` |
| Class portfolios | `#/classes` |
| Child editor: domain tabs and Review narratives | `#/classes/class-a/children/<id>?sem=<semester>` |
| Students / profile | `#/students`, `#/students/<id>` |
| Evidence library | `#/evidence` |
| AI drafts | `#/drafts` |
| Reports | `#/reports` |
| Child / class print | `#/print/<id>?sem=<semester>`, `#/print-class?sem=<semester>` |
| Provider settings | `#/settings/ai` |
| About and privacy | `#/about` |

Legacy `#/child/<id>?sem=...` links redirect to the editor. Unknown hashes show Home with a
visible notice. Records and provider/model provenance persist in `localStorage`; keys and
rejection history remain in page memory. Browser storage is neither secure storage nor a backup.
Offline mock is explicit and labelled, not AI. Provider failures never silently select mock.
Grounding can reject faithful text or miss unsupported claims; teacher review is mandatory.

Owner-supplied QA (2026-10-17, built-in browser, `dist`, light scheme): every route loaded at
1440×900, 430×932 and 390×844 with one focused h1, no horizontal overflow and targets at least
44 px. Home reduced from 9,273 px to 1,162 px with three needing-work rows. Mock drafting,
editing, persisted review, fake-key non-persistence and sanitized failure were exercised.
The C-01 S1 PDF had two A4 pages, embedded PingFang SC, correct Simplified Chinese and no
app chrome. These are supplied observations, not checks rerun for this documentation edit.

Supplied deployed-origin verification (2026-10-17): all 14 route checks loaded with one h1
and no horizontal overflow; the active service worker cached 56 entries. GPT Demo Gateway
drafting for C-02 / 2026-S2 accepted three domains and visibly rejected English through
grounding checks. This single non-deterministic sample is not a quality benchmark.

Service-worker offline reload with networking disabled, real hardware, screen readers,
Safari/Firefox, Windows/Linux CJK fonts and real OpenAI/Gemini test keys remain untested.
Registration/cache population were verified, not a true offline reload.
No teacher-time, edit-rate or quality measurement is claimed.

Implementation: `src/studio/` contains routing, context, shared shell/UI, pages and models;
`studio.css` uses `src/studio/tokens.css`. The [design SSOT](design/README.md) contains
12 page specs and 24 WebP wireframes generated with Codex CLI image generation: images express
visual intent, specs define copy/behavior, tokens define enforceable values.
See the [submission write-up](docs/26-submission-writeup.md) for the walkthrough, evidence,
deployment status and production proposals.

**NOT IMPLEMENTED:** real login/roles/tenant isolation, application server, database, private
object storage, server-side PDF, finalisation lock, vector RAG, audit log, production AI hosting,
classroom tracking and inter-school transfer.

## Original five-record demo features

| Feature | Actual status |
|---|---|
| Synthetic student records and 18-month evidence | Implemented |
| Teacher/student selection | UI simulation only (NOT authorization) |
| In-session observations | Implemented; cleared on refresh |
| Evidence-based portfolio draft and evidence IDs | Strict shape and same-student/domain citations; linked fictional sources; human fact-check required |
| GPT Demo Gateway integration | Session + response HTTP smoke passed; deployed-browser test still required |
| OpenAI / Gemini temporary BYOK | Client adapters implemented; CORS/provider limits possible |
| Offline deterministic mock | Implemented; visibly labelled |
| Review, manual signoff and edit-distance estimate | Implemented; demo-only metric |
| Portfolio PDF | Browser Print → Save as PDF |
| PWA manifest, PNG/maskable icons and install guidance | Implemented; Chrome manifest parsing passed; native installation and physical iOS checks remain manual |
| Offline cold reload and static shell | Implemented after successful initial caching; no API responses or session records cached |
| Controlled app updates | Waiting notification, reset confirmation, loader, busy/duplicate guards and timeout recovery; other tabs do not silently reload |
| System themes, safe areas and reduced motion | Implemented; responsive browser checks passed; physical iOS system chrome remains untested |
| Real RAG/vector DB, school tenancy, staff auth | **Not implemented** |
| Classroom voice/face recognition, parent messaging, scheduling | **Not implemented** |

## White-label branding

Edit **`src/config.js`**. `organizationName` and `logoUrl` default to empty strings; `productName` defaults to `AI Preschool Studio`. Configure the portfolio title, optional public logo URL, illustrative benchmark, or demo gateway without rewriting application logic. A relative logo URL must refer to a published asset (for example `./favicon.svg`); new bundled assets require adding them to the build allowlist. Use only authorized assets in a private branded fork. Do not place secrets or personal data in this public module.

## GitHub Pages

1. Create a repository with any neutral name and include the project files and `.github/workflows/pages.yml`.
2. Set **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. The repository owner manually pushes the reviewed commit to `main`. The workflow runs syntax checks, tests and the dependency-free static build before publishing. PRs only check/test/build; manual dispatch deploys only when `main` is selected.
4. Wait for the **Static checks and Pages deployment** workflow and its `github-pages` deployment to succeed, then open the actual deployment URL (normally `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY/`).
5. Smoke-test Offline Mock from that real origin first. Live Gateway/BYOK results are separate: the Gateway may allow only configured origins/project identities. Do not change live access controls, disable authentication or use an unrestricted key to make a demo work.

`npm run build` recreates `dist/` from the explicit runtime asset allowlist, including every studio
page/helper, both application hosts, token/component styles, icons, generated theme manifests,
`build-info.json`, a versioned `sw.js` and `.nojekyll`. Documentation, tests, schemas and repository
history are not published. No bundler, dependencies or secrets are added. Relative paths and worker
scope support a repository subpath. See [deployment instructions](docs/09-deployment.md).

**Historical original-demo evidence:** the earlier 43-test PWA verification, responsive screenshots
and offline/update checks are documented in [the original verification report](docs/24-verification-report.md).
They do not establish acceptance of the redesigned class studio. See also the
[PWA acceptance contract](docs/25-pwa-standard.md). Publishing still requires the owner's approval.

Documentation: [`docs/README.md`](docs/README.md), including PRD, architecture, governance, provider protocols, security, deployment, acceptance tests, and a ready-to-paste coding-agent task. `AGENTS.md` describes project-safe engineering boundaries.

## Caveats and attribution

The **~6h per portfolio** and **<10% editing target** on the sample UI are *illustrative, unverified planning figures*, not verified customer facts, productivity savings or promises. A measure of edited words is not a substitute for teacher time-on-task or correctness evaluation. The sample profiles are fictional. Local delivery and hosted-release acceptance are separate actions. License: MIT; see `LICENSE`.
