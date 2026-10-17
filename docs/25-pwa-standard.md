# 25 — PWA Product Standard and Acceptance

Contract: `pwa:product-standard` v1.0.0, retrieved through the owner's KB-MCP. This neutral technical contract applies to the static fictional-data demo; it does not authorize real school data or the proposed private backend.

## Required behavior

- Installable repository-subpath app with matching neutral identity, 192/512 PNG icons, maskable icon, standalone display and coherent startup colors.
- iOS-oriented safe areas and opaque system-chrome surfaces. System light/dark themes stay coherent with the app shell, theme metadata and manifest. Inputs use at least 16px; primary controls target 44×44 CSS pixels.
- Long screens provide safe-area-aware navigation without obstruction from fixed shell elements. The studio uses a shared topbar and mobile bottom tabs; evaluate their actual scrolling/focus behavior rather than inheriting the retired demo's layout acceptance.
- Respect reduced motion in both CSS and explicit JavaScript scrolling. Preserve keyboard focus, dialog containment, labels, readable contrast and no document-width overflow.
- Complete version-local static shell caching. A release changes worker/build identity. Waiting workers do not automatically activate; obsolete caches belonging to this app alone are cleaned during activation.
- Explicit update prompt, session-reset confirmation, immediate branded updating loader, duplicate-action protection, activation/controller handoff, reload and bounded failure recovery. Other open tabs must not silently refresh.
- Connection, caching, ready, update-available, updating and error states are understandable. Generation in progress must not be interrupted by an update action.
- HTTPS, sensible static-page CSP and a narrow cache allowlist. Cache neither credentials, temporary sessions, provider/API requests, generated narratives nor browser-entered records. Persistent fictional records belong to localStorage, not Cache Storage.

## Offline and data contract

After initial asset caching, offline launch must provide the fictional roster/evidence, Offline Mock generation, local edits/review and browser print where the browser supports it. Cloud generation requires a network and never silently substitutes simulated output. The user explicitly chooses Offline Mock.

Fictional semester records, photos, narratives and source/provider/model provenance persist in browser `localStorage`; this is not secure storage or a backup. BYOK keys and transient rejection history remain memory-only and reset on reload. Update warnings must distinguish page-memory resets from persisted records. Do not add real records, authenticated approval, tenant isolation, vector RAG, messaging, transfer, biometrics or commerce under this contract.

## Acceptance gates

1. Build and serve only public runtime files through GitHub Actions; bundled URLs and worker scope remain within the repository path. The root hosts the studio and `class.html` redirects there with hash routes intact.
2. Inspect generated manifests/icons and launch in an installed/standalone context where supported.
3. Warm the cache, disable network and ordinary HTTP cache, then reload and exercise the complete local portfolio journey.
4. Publish a local test build N+1 at the same origin. Confirm waiting notification, postponement, reset warning, loader, activation and newest build identity after reload.
5. Verify no silent refresh in another tab, repeated-click protection, busy-generation protection and installation/update failure recovery.
6. Inspect Cache Storage: static assets only; unrelated paths, sensitive/query URLs and POST requests must never be admitted.
7. Exercise 390×844, 430×932, 768×1024 and 1440×900, system themes, touch targets, contrast, focus and reduced motion. Test print disclaimers.
8. Repeat at the real Pages origin after the owner manually pushes. Report device-specific iOS/Safari checks as NOT TESTED when no real device is available.

## Completion evidence

Record PASS, FAIL, PARTIAL, N/A or NOT TESTED per gate with commit/build, environment and observed artifacts. The [submission write-up](26-submission-writeup.md) records earlier studio evidence and its limits. A manifest, worker file, passing unit test or successful build alone is not proof of product-grade PWA completion.

The retired five-record demo's offline/update acceptance does not certify the root studio cutover. Network-disabled studio reload, two-build/multi-tab handoff, persisted-record preservation, native installation, physical devices and the newly hosted root require their own actual evidence. No blanket certification is claimed here.
