# 11 — Phases, Milestones and Prioritized Backlog

| Phase | Goal | Release condition |
|---|---|---|
| P0 — Static demo | Show full fictional portfolio workflow | GitHub Pages, 5 fictional students, mock, edit, print |
| P1 — Reliable AI demo | Verify Default Gateway, OpenAI/Gemini test adapters | Real browser API evidence, rate limits, CORS, empty response UX |
| P2 — Curriculum-template pilot | Demonstrate school-configurable sections and language | Educator validates template, deterministic evidence mapping |
| P3 — Secure private pilot | Real authentication, tenant/student evidence access, DB | DPO/contract signoff, authorization tests, audit, retention |
| P4 — School workflow | Curriculum guide mapping, review workflow, scheduling | Human approvals and teacher/parent permissions |
| P5 — Advanced research | Optional classroom audio with restrictions | Independent DPIA, policy, consent, feasibility validation |

## Priority backlog

### P0 (must have now)

- White-label `src/config.js` not containing school/company names.
- Device responsive demo and test scripts.
- Five synthetic 18-month profiles, evidence IDs and domains.
- Provider picker, default public Gateway session, OpenAI & Gemini BYOK sandbox modes, offline mock.
- Review, edit estimate, approval state, Print/PDF.
- Clear `DEMO ONLY` warnings, no student data persistence.

### P1 (before external live showcase)

- Browser integration tests and visual screenshots for supported viewports.
- CORS/origin/credential expiry/429 test on current Gateway.
- API response schema and version contract test against current gateway.
- Error telemetry sanitized of prompts/keys.
- If needed: accessible mobile navigation and print stylesheet fixes.
- One-page neutral demo instructions and a five-minute scripted walkthrough.

### P2 (future pilot)

- Operator-configurable portfolios, curriculum map, photo tagging **without** face recognition.
- Real source-by-source fact-check screen and change tracking.
- Signed reviewer attribution, submission rules and re-generation comparisons.
- Pilot metrics dashboard (generation time, review minutes, factual support).

### P3 (production prerequisites)

- Authorized private API, tenant isolation, row-level access, audit, backups.
- Contracts, privacy review, DPIA, data residency and provider evaluation.
- Parent-facing delivery authorization and controlled exports.

### Do not rush

- Classroom AV capture, children's voiceprints/facial recognition, automated teacher rankings, auto-send family updates, inter-school transfers. These need separate governance and validation.
