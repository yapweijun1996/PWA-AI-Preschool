# 20 — Documentation and Project Changelog

## Static demo completion — 2026-10-13

- Fixed the provider-settings crash by adding the missing BYOK acknowledgement; added modal feedback, key masking/cleanup and accessible review labels.
- Replaced silent schema/evidence repairs with strict rejection, bounded content and same-student/domain inline citation validation.
- Added deterministic cited mocks, full evidence chronology, coverage counts and linked source records.
- Protected generation from context changes; saved edits are revalidated, editing resets signoff, and printouts disclose local review status.
- Added config-only public logo support; defaults remain neutral, with no logo or organization configured.
- Added dependency-free runtime-only `dist/` build and checked GitHub Actions Pages deployment; PRs never deploy.
- Removed the stale ZIP packaging `MANIFEST.json`; its hashes and unverified status no longer describe the repository.
- Recorded 27 passing tests, browser journeys at the required viewports, print/PDF proof, injected failures, and live Gateway HTTP session/response smoke in [the delivery report](24-verification-report.md).
- Removed external font fetching; the static UI and Offline Mock require no external service after assets load.

## v0.2 — 2026-10-13

- Produced neutral, company-agnostic README and comprehensive documentation bundle.
- Added `src/config.js` with empty `organizationName` and editable product/portfolio labels.
- Removed original company/interview references and fixed sample product brand names from the public showcase.
- Preserved static source/demo behavior and default Gateway + BYOK + Offline Mock adapters.
- Added backend/API, security, Singapore regulatory, student RAG and school transition planning docs.
- Added supplemental schemas, machine-readable future API outline, and AI coding agent brief.
- Verified source syntax and baseline Node unit tests; browser E2E and live Gateway are explicitly **not verified** by this documentation build.

## Deferred

- Owner push, GitHub Actions execution and GitHub Pages publication; not performed here.
- Integration E2E tests against live gateway and OpenAI/Gemini in a real browser.
- Backend tenant isolation, identity, secure RAG and approval workflows.
