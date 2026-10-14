# AI Preschool Studio — White-label Browser Demo

**Status:** completed fictional-only static PWA demo; physical-device and newly deployed-origin acceptance remain separate checks. **Audience:** education product teams, prospective operators, engineers and reviewers. **No school affiliation is asserted.**

A browser-first, GitHub Pages–ready demonstration of evidence-grounded preschool learning portfolios. Visitors can try the default public GPT Demo Gateway (if configured and live), use a temporary **BYOK** OpenAI or Gemini test key, or choose **Offline Mock**. The UI uses **five fictional students** and synthetic observations across an illustrative **18-month** period.

> **Hard restriction:** This public project is **not** a school records platform. Never input real child identities, images, audio, observations, staff records or company-only documents. Teacher access is simulated client-side. The app does not provide production authentication, tenant isolation or a compliant data-processing service.

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

Open **AI provider settings**, select **Offline Mock Demo** for a walkthrough without any live external provider, or try GPT Demo Gateway. Wait for **Ready · offline shell available** before disconnecting and reloading. Cloud generation is disabled offline; Mock is always an explicit choice. Drafts, added observations, approvals and keys remain memory-only and reset on reload. To test OpenAI/Gemini BYOK, only use a disposable restricted key and fictional data; browsers may reject cross-origin provider requests. Page memory is **not equivalent to secure client-side key custody**.

## Features in the current build

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

`npm run build` recreates `dist/` with only runtime HTML/CSS/favicon, five `src/` modules, three PNG icons, two generated theme manifests, `build-info.json`, a versioned `sw.js` and `.nojekyll`. Documentation, tests, schemas and repository history are not published. No bundler, dependencies or secrets are added. Relative paths and worker scope support a repository subpath. See [deployment, offline, update and rollback instructions](docs/09-deployment.md).

**Ready for local testing:** `npm start` serves the built app. Syntax checks, **43 tests**, the static build, cold offline reload, mock editing/review/PDF, controlled version updates, multi-tab behavior, failure recovery and required responsive viewports passed. See [the current verification report and screenshots](docs/24-verification-report.md) and [the KB-MCP PWA acceptance contract](docs/25-pwa-standard.md). The earlier static site was deployed; these new PWA commits are local and require the owner's manual push before hosted acceptance.

Documentation: [`docs/README.md`](docs/README.md), including PRD, architecture, governance, provider protocols, security, deployment, acceptance tests, and a ready-to-paste coding-agent task. `AGENTS.md` describes project-safe engineering boundaries.

## Caveats and attribution

The **~6h per portfolio** and **<10% editing target** on the sample UI are *illustrative, unverified planning figures*, not verified customer facts, productivity savings or promises. A measure of edited words is not a substitute for teacher time-on-task or correctness evaluation. The sample profiles are fictional. Local delivery and hosted-release acceptance are separate actions. License: MIT; see `LICENSE`.
