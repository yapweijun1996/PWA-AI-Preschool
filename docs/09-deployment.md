# 09 — GitHub Pages deployment and rollback

## Local preview

Use Node 24 (CI's major); no npm dependencies or install step are required.

```sh
npm run check
npm test
npm start
# Built studio: http://localhost:4173/
```

The dependency-free build recreates only repository-relative `dist/` using an explicit runtime allowlist. It stages the root studio, the `class.html` hash-preserving redirect, studio/shared modules and styles, public assets/icons, generated theme manifests, `build-info.json`, a versioned worker and `.nojekyll`. Docs, tests, schemas, Git history and keys are not published. Release identity hashes runtime inputs and the worker template; CI includes a commit prefix.

For a repository-subpath preview:

```sh
npm run build
python3 -c 'import functools, http.server; from urllib.parse import urlsplit; root="dist"; prefix="/REPOSITORY"; Subpath=type("Subpath", (http.server.SimpleHTTPRequestHandler,), {"translate_path": lambda self, url: http.server.SimpleHTTPRequestHandler.translate_path(self, url[len(prefix):] if urlsplit(url).path.startswith(prefix + "/") else "/__not_published__")}); http.server.ThreadingHTTPServer(("127.0.0.1", 4173), functools.partial(Subpath, directory=root)).serve_forever()'
# Open http://127.0.0.1:4173/REPOSITORY/
```

Verify root routes and `class.html#/students` redirect to the root with the hash intact. Exercise explicit Offline mock, local autosave/reload, review, reports and print. Wait for actual offline-ready status before disconnecting and cold-reloading. A local smoke does not prove live hosting, native installation or provider health. Source preview and `file://` are not built-PWA acceptance.

## Publish — owner action only

1. Review fictional-data safety and credential hygiene. Include `.github/workflows/pages.yml`.
2. Set **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. The owner pushes the reviewed commit to `main`. PRs only check/test/build; manual dispatch deploys only from `main`.
4. Wait for **Static checks and Pages deployment** and the `github-pages` deployment to succeed.
5. Open https://yapweijun1996.github.io/PWA-AI-Preschool/ and verify the actual build identity. This URL is the product entry, not proof that a local change is deployed.
6. Repeat root/redirect, repository-subpath, Offline mock, cold-offline, update, storage and print acceptance at that origin. Test Gateway/BYOK independently; do not weaken origin policy, quotas or authentication to make a demo work.

## Installation and updates

Where Chrome provides an install prompt, use **Install app**. On iOS Safari use **Share → Add to Home Screen**. Real installed launch, status bars, safe areas, keyboard and resume behavior require the actual device/environment.

Waiting-worker activation requires explicit confirmation and a loader. Warn that page-memory provider/key state resets; persisted fictional records are separate browser storage, not secure server records. Other open tabs must not silently reload. Test two builds and two tabs, busy/duplicate guards and bounded failure recovery; consult the [PWA acceptance contract](25-pwa-standard.md).

## Rollback and evidence

The owner may deploy a known-good PWA-capable commit as a newly identified release and repeat hosted-origin acceptance. Removing `sw.js` alone does not retire existing offline caches. The `legacy-demo-v1` tag is historical source, not a current-product rollback recommendation.

Record reviewed commit, authorized publication, Actions result, build identity, root/redirect behavior, Offline mock, actual network-disabled reload, update handoff, device/browser, print and provider results separately as PASS / FAIL / PARTIAL / NOT TESTED. The [submission write-up](26-submission-writeup.md) contains earlier evidence with explicit scope; it does not certify the root cutover. For credential abuse, an authorized operator must revoke affected credentials or disable the Gateway project and record the incident.
