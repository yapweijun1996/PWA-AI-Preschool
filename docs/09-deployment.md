# 09 — GitHub Pages Deployment and Rollback

## Prerequisites

A neutral-name GitHub repository you control; GitHub Pages permission; an HTTPS browser; no secrets in tracked files; Node 24 (the CI version) and Python 3 or another static HTTP server for local preview. No npm dependencies or install step are required.

## Local verification and repository-subpath smoke

```bash
npm run check
npm test
npm start
# Builds dist/ and serves http://localhost:4173/
```

The dependency-free build recreates only the fixed repository-relative `dist/` directory. It copies HTML/CSS/favicon, five browser modules and three PNG icons, then generates light/dark manifests, `build-info.json`, a versioned worker and `.nojekyll`. The release identity hashes runtime inputs and worker template; CI adds a short `GITHUB_SHA` prefix. The worker precaches 15 exact routes (the root shell plus 14 static assets), not itself or `.nojekyll`. Docs, tests, specs, schemas, Git history and keys are not published. Add new bundled runtime assets to the explicit allowlist in `scripts/build.mjs`. `dist/` is ignored by Git.

To test the built artifact under a repository path without serving source files, run this exact command from the repository root after building:

```bash
python3 -c 'import functools, http.server; from urllib.parse import urlsplit; root="dist"; prefix="/REPOSITORY"; Subpath=type("Subpath", (http.server.SimpleHTTPRequestHandler,), {"translate_path": lambda self, url: http.server.SimpleHTTPRequestHandler.translate_path(self, url[len(prefix):] if urlsplit(url).path.startswith(prefix + "/") else "/__not_published__")}); http.server.ThreadingHTTPServer(("127.0.0.1", 4173), functools.partial(Subpath, directory=root)).serve_forever()'
# Open http://127.0.0.1:4173/REPOSITORY/
```

Select Offline Mock **first** and exercise generation, edits, evidence links, review and print. Wait for **Ready · offline shell available** before disconnecting and reloading. Cloud generation requires a network and never substitutes Mock automatically. Source-preview HTML and `file://` do not enable the built PWA; use `npm start` or serve `dist/`. A local smoke does not prove live hosting, native installation or external-provider health.

## Publish through GitHub Actions (owner action)

1. Include the project and `.github/workflows/pages.yml` in the repository. Review fictional-data and credential safety before publishing.
2. Set **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. The owner manually pushes the reviewed commit to `main`; this documentation does not perform or authorize an automatic push. Alternatively, the owner can select `main` in **Actions → Static checks and Pages deployment → Run workflow**.
4. Wait for checks, tests and build to pass, and for the `github-pages` deployment to succeed. Use the actual URL shown by the deployment, normally `https://USERNAME.github.io/REPOSITORY/`.
5. Repeat the browser scenarios at that actual HTTPS origin and repository path. Inspect module/asset requests for 404s and confirm only runtime files are hosted.
6. Record Offline Mock and any live provider results separately. For Gateway tests, its existing server configuration must allow the actual Origin/project identity and enforce session, model and quota controls. Never change live configuration or disable access control merely to pass a smoke test.

The workflow checks PRs to `main` with read-only repository/Pages metadata permission and no Pages upload/deployment. Pushes to `main`, or manual dispatch specifically on `main`, upload `dist/` and deploy only after checks pass. Other-branch dispatch performs checks only. Official `configure-pages`, `upload-pages-artifact` and `deploy-pages` actions handle publication. Only deployment has `pages: write` and `id-token: write`; it uses the `github-pages` environment. Complete runs are serialized per Git ref so an older main build cannot overtake a newer deployment. No provider secrets or npm dependencies are added.

> GitHub Pages is **public static hosting**, not a private student records server. It cannot keep server-side secrets in client JavaScript.

## Install, offline use and app updates

1. Open the published repository root over HTTPS. Inspect the PWA status and wait for caching to finish.
2. Where Chrome supplies an install prompt, use **Install app**. On iOS Safari, use **Share → Add to Home Screen**, then launch from the home-screen icon. Installation/standalone chrome must be verified on the actual device; desktop viewport emulation is not equivalent.
3. Disconnect, reopen or normally reload the root URL and explicitly select Offline Mock. Do not use a forced network reload that bypasses the worker. Roster/evidence, generation, local review and browser print remain available after a successful cache warmup. Remote providers remain unavailable.
4. A new build downloads as a waiting worker. **Update available** opens a warning that drafts, approvals, added observations, provider choice and keys will reset. Cancel preserves the session; confirmation activates the new release with a loader and reloads only this tab.
5. Generation in progress blocks activation. Duplicate actions are disabled; bounded activation errors retain the session and provide retry guidance. Other tabs show **Reload updated app** and wait for their own confirmation.
6. An incomplete release is not installed. The previous offline release remains usable; reconnect/reload to retry. Successful activation removes only this app's obsolete version caches. No user records, API sessions or responses are cached.

For a local N→N+1 check, keep the same origin/path, rebuild with changed runtime content (or a throwaway valid 40-hex `GITHUB_SHA` fixture), request an update/reopen the page online, and perform the explicit update. Restore the ordinary build after a fixture. Tests and fixtures do not authorize publication.


## Before showing external reviewers

- Confirm every profile and observation is fictional.
- Verify Offline Mock independently of live provider availability.
- Explain temporary BYOK risk and CORS limitations.
- Record actual Gateway session/Responses status and quota behavior only if exercised.
- Check desktop/mobile layouts and print/PDF disclaimers in actual browsers; automated Node checks do not establish these outcomes.
- Explain that this is a concept demo, not a purchase-ready school records system.

## Rollback

The owner can revert to a known-good **PWA-capable** commit on `main` and let the checked workflow publish a newly identified release; confirm deployment and repeat the actual-origin update/offline smoke. Keep a valid worker during rollback: merely removing `sw.js` or reverting to a pre-PWA build does not retire existing offline caches. If abuse or a leaked key is discovered, authorized operators must revoke/rotate credentials or disable the Gateway project and record an incident. Deleting a file alone does not remove leaked credentials from Git history.

## Proof of live readiness

Track separately: reviewed commit; owner push; Pages settings; Actions result; deployed URL opened; Offline Mock result; live Gateway/BYOK result if attempted; mobile/desktop and PDF evidence. A local build is not proof of deployment. Record PASS / FAIL / NOT TESTED with actual observations in the verification report; do not infer success from an expected URL.
