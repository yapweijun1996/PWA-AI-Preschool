# 09 — GitHub Pages Deployment and Rollback

## Prerequisites

A neutral-name GitHub repo you control; GitHub Pages permission; HTTPS browser; no secrets in tracked files; Node for tests and Python/any web server for local preview.

### Local verification

```bash
npm run check
npm test
python3 -m http.server 4173
# Open http://localhost:4173 in a browser
```

Test Offline Mock **first**. Source uses ES modules; opening `index.html` through `file://` is not a valid acceptance test.

### Upload and publish (not performed by packaging)

1. Create a new public GitHub repository with a generic name (example: `ai-preschool-studio`).
2. Upload all project files from the ZIP root, including `src/`, `tests/`, `styles.css`, `index.html`, `favicon.svg`, `.nojekyll` and `README.md`; documentation can be included alongside source.
3. Set **Settings → Pages → Deploy from a branch**, branch `main`, directory `/ (root)`.
4. Verify Pages deployment reaches success; open `https://USERNAME.github.io/REPOSITORY/` and re-run the browser scenario.
5. Confirm no real child material or API keys are visible in repository history, browser network traffic or compiled assets.
6. For the GPT Demo Gateway, confirm the **exact real Origin** is server-allowed, project identity is permitted, sessions work, model is enabled and quota/abuse controls are active. Never disable access control just to pass smoke tests.

> GitHub Pages is **public static hosting**, not a private student records server. GitHub pages cannot keep server-side secrets in client JavaScript.

## Before showing external reviewers

- Confirm all student profiles and evidence are fictional.
- Demo mode defaults to publicly rate-limited Gateway or Offline Mock.
- BYOK modal explains temporary test-key risk and CORS limitations.
- Test and record actual Gateway session status, Responses API, 429 behavior and total spend guardrail.
- Check Edge, Chrome and Safari where possible; inspect both mobile/desktop layout.
- Ensure reviewers know this is a concept demo, not a purchase-ready school system.

## Optional GitHub Actions (later)

The initial project needs no bundler. You can add a CI workflow to run `npm run check && npm test` on PRs and publish only on approved merges; do not store cloud provider keys in public Actions or print them to logs.

## Rollback

Revert to the last known-good commit, confirm Pages deploys successfully, disable the Demo Gateway project if abused, revoke/rotate any exposed test key, and record an incident/change note. GitHub history may preserve leaked keys; deleting a file alone is insufficient to clean a disclosed credential — rotate it.

## Proof of live readiness

Track *separately*: repo created; branch pushed; GitHub Pages enabled; URL opened; mock works; Gateway returns healthy response; BYOK smoke success if browser supports it; mobile QA screenshots; usage cap confirmed. Do not claim "deployed" when you only have a ZIP or guessed URL.
