# 09 — GitHub Pages Deployment and Rollback

## Prerequisites

A neutral-name GitHub repository you control; GitHub Pages permission; an HTTPS browser; no secrets in tracked files; Node 24 (the CI version) and Python 3 or another static HTTP server for local preview. No npm dependencies or install step are required.

## Local verification and repository-subpath smoke

```bash
npm run check
npm test
npm run build
python3 -m http.server 4173 --directory dist
# Open http://localhost:4173/
```

The deterministic, no-bundler build recreates only the fixed repository-relative `dist/` directory. It first requires every runtime asset to exist, then copies `index.html`, `styles.css`, `favicon.svg`, the four current `src/` modules, and an empty `.nojekyll`. It does not publish docs, tests, specs, schemas, MANIFEST, Git history or keys. If a new runtime module is introduced, add it to the explicit allowlist in `scripts/build.mjs`. `dist/` is ignored by Git.

To test the built artifact under a repository path without serving source files, run this exact command from the repository root after building:

```bash
python3 -c 'import functools, http.server; from urllib.parse import urlsplit; root="dist"; prefix="/REPOSITORY"; Subpath=type("Subpath", (http.server.SimpleHTTPRequestHandler,), {"translate_path": lambda self, url: http.server.SimpleHTTPRequestHandler.translate_path(self, url[len(prefix):] if urlsplit(url).path.startswith(prefix + "/") else "/__not_published__")}); http.server.ThreadingHTTPServer(("127.0.0.1", 4173), functools.partial(Subpath, directory=root)).serve_forever()'
# Open http://127.0.0.1:4173/REPOSITORY/
```

Select Offline Mock **first** and exercise generation, edits, evidence links, review and print. Offline Mock does not require a working Gateway, OpenAI or Gemini after the static files load. Source uses ES modules; opening `index.html` through `file://` is not valid acceptance evidence. A local smoke does not prove live hosting or external provider health.

## Publish through GitHub Actions (owner action)

1. Include the project and `.github/workflows/pages.yml` in the repository. Review fictional-data and credential safety before publishing.
2. Set **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. The owner manually pushes the reviewed commit to `main`; this documentation does not perform or authorize an automatic push. Alternatively, the owner can select `main` in **Actions → Static checks and Pages deployment → Run workflow**.
4. Wait for checks, tests and build to pass, and for the `github-pages` deployment to succeed. Use the actual URL shown by the deployment, normally `https://USERNAME.github.io/REPOSITORY/`.
5. Repeat the browser scenarios at that actual HTTPS origin and repository path. Inspect module/asset requests for 404s and confirm only runtime files are hosted.
6. Record Offline Mock and any live provider results separately. For Gateway tests, its existing server configuration must allow the actual Origin/project identity and enforce session, model and quota controls. Never change live configuration or disable access control merely to pass a smoke test.

The workflow checks PRs to `main` with read-only repository/Pages metadata permission and no Pages upload/deployment. Pushes to `main`, or manual dispatch specifically on `main`, upload `dist/` and deploy only after checks pass. Other-branch dispatch performs checks only. Official `configure-pages`, `upload-pages-artifact` and `deploy-pages` actions handle publication. Only deployment has `pages: write` and `id-token: write`; it uses the `github-pages` environment. Complete runs are serialized per Git ref so an older main build cannot overtake a newer deployment. No provider secrets or npm dependencies are added.

> GitHub Pages is **public static hosting**, not a private student records server. It cannot keep server-side secrets in client JavaScript.

## Before showing external reviewers

- Confirm every profile and observation is fictional.
- Verify Offline Mock independently of live provider availability.
- Explain temporary BYOK risk and CORS limitations.
- Record actual Gateway session/Responses status and quota behavior only if exercised.
- Check desktop/mobile layouts and print/PDF disclaimers in actual browsers; automated Node checks do not establish these outcomes.
- Explain that this is a concept demo, not a purchase-ready school records system.

## Rollback

The owner can revert to a known-good commit on `main` and let the same checked deployment workflow publish it; confirm deployment success and repeat the actual-origin smoke. If abuse or a leaked key is discovered, authorized operators must revoke/rotate credentials or disable the Gateway project and record an incident. Deleting a file alone does not remove leaked credentials from Git history.

## Proof of live readiness

Track separately: reviewed commit; owner push; Pages settings; Actions result; deployed URL opened; Offline Mock result; live Gateway/BYOK result if attempted; mobile/desktop and PDF evidence. A local build is not proof of deployment. Record PASS / FAIL / NOT TESTED with actual observations in the verification report; do not infer success from an expected URL.
