# AI Preschool Studio

**Published demo URL:** https://yapweijun1996.github.io/PWA-AI-Preschool/

A neutral, fictional-data static PWA for class portfolios: 20 sample children, semester comparison, four-domain narrative drafting, local review and printable child/class reports. The root is the only application host. `class.html` redirects to the root while preserving the hash route, including editor and print links.

> Use fictional records only. Never enter real child, family, staff, photo, voice or workplace data. Browser storage and local review are not secure records storage or authenticated approval.

**Status (2026-10-17):** browser-only fictional-data prototype, not a production school system. This README/history update inspected source and Git history; it did not recheck the published build or exercise providers. See the [changelog](docs/CHANGELOG.md) for the integration owner's supplied automated gate result; historical QA remains revision-specific.

## Local use

Use Node.js 24 (the CI version) and Python 3 (`python3`) for the local server. No npm dependencies or install step are required.

```sh
npm start
# Open http://localhost:4173/
```

Start with **Offline mock**, which is explicitly simulated. Gateway, OpenAI and Gemini modes require network/provider access; failures never silently switch to mock. Requests use browser-side pseudonymisation and an inspectable masked-prompt preview, not guaranteed anonymisation. BYOK accepts disposable test keys only, held in page memory—not secure secret custody. See [provider and privacy boundaries](docs/06-provider-integrations.md).

Records, photos and narrative provenance persist in this browser's `localStorage`. Keys and transient rejection history do not. Clearing browser storage loses records; there is no server sync or backup. PWA offline readiness requires successful initial static caching. Current-root offline, update, deployment and device acceptance must be verified independently; historical evidence is not a new cutover pass.

All 20 sample children have English default display names. Below the child portfolio's sticky navigation, expand **Edit child name** to save a fictional name in any script (trimmed, NFC-normalised, 1–60 Unicode characters, no controls). Duplicate names are allowed with a warning; child IDs stay distinct. Renaming preserves prose and evidence freshness. When old names remain, **Replace old name in narratives** updates name occurrences while preserving teacher prose; review the result before sharing.

Sample avatars and evidence pictures are watermarked AI-generated cartoons, not real children. Uploaded fictional pictures are labelled **Uploaded in this browser** and remain in browser storage. The image-only CSP permits local `blob:` URLs for temporary upload decoding; scripts and styles remain self-only. No real child data belongs in this demo.

## Routes and implementation

The shared shell links Home (`#/`), Class portfolios (`#/classes`), Students (`#/students`), Evidence library (`#/evidence`), AI drafts (`#/drafts`), Reports (`#/reports`), AI provider settings (`#/settings/ai`) and About and privacy (`#/about`). Child editors, profiles and print views have dedicated hash routes. Old `#/child/<id>?sem=...` hashes resolve to the editor; unknown routes show Home with a notice.

The dependency-free build stages `index.html`, the compatibility redirect, `studio.css`, `src/studio/` and shared runtime modules, static assets, generated manifests and the scoped service worker. Documentation, tests and repository history are not published. Public configuration is in `src/config.js`; never put credentials or private data there.

**Not implemented:** real login, roles, tenant isolation, application server/database, private object storage, authenticated approval/finalisation, vector RAG, server PDF, production AI hosting, classroom tracking or inter-school transfer. No measured time-saving, edit-rate or quality benefit is claimed.

The UI is English; existing Simplified Chinese domain narratives and report support are not a complete translated application. An `en` / `ms` / `zh-Hans` UI, formal measurement and PDPA/DPIA work remain planned.

## Development and references

```sh
npm run check
npm test
npm run build
```

Existing regressions include `tests/redirect.test.js` (legacy-entry route preservation), `tests/pwa.test.js` (version-local caching and update control), `tests/child-name.test.js` (renames preserve IDs/prose) and `tests/studio-privacy-dom.test.js` (masked preview/transmission boundaries). Automated tests do not establish live-provider health, deployed-origin behavior, physical-device accessibility or actual print output.

- [Documentation index and standard set](docs/README.md), [current specification](docs/SPEC.md) and [design](docs/DESIGN.md)
- [Deployment](docs/09-deployment.md), [testing](docs/10-testing.md) and [Git-based changelog](docs/CHANGELOG.md)
- [Design detail](design/README.md): route/page specs, wireframes and tokens
- [Submission write-up](docs/26-submission-writeup.md) and [UI audit workflow](docs/27-ui-audit.md)
- [Chinese quickstart](docs/18-zh-quickstart.md), [contributing](CONTRIBUTING.md) and [engineering contract](AGENTS.md)

The removed five-record, long-scroll demo is historical; use the `legacy-demo-v1` tag for that version rather than current product instructions. Publishing requires owner authorization; see the deployment guide. License: [MIT](LICENSE).
