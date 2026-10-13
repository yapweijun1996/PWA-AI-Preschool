# 13 — Risk Register and Architecture Decision Records

## Open risks

| ID | Risk | Severity | Mitigation / Owner |
|---|---|---|---|
| R-01 | Browser BYOK credential leaks | Critical for real keys | Use disposable test-only keys; trusted backend for production |
| R-02 | Published fake role gives false sense of security | High | Warn prominently; don't input real student data |
| R-03 | Hallucinated claims about minors | High | Source constraints, verification and human approval |
| R-04 | Demo gateway public abuse/cost | High | Server-side token quota, per-origin/project/IP limits, kill switch |
| R-05 | Vendor region/training/retention misunderstood | High | Exact contract & model-level review before real processing |
| R-06 | Children's biometric monitoring | Critical | Exclude from MVP; legal/DPIA assessment if ever proposed |
| R-07 | Unverified model API contract causes failures | Medium | Gateway live smoke/contract tests; mock fallback |
| R-08 | Sample baseline mistaken for achieved benefit | Medium | Mark as hypothesis, run measured field study |
| R-09 | School brand / confidential assets accidentally committed | High | White-label default, git scan + PR reviews |
| R-10 | Multi-student evidence mixed in retrieval | Critical | Tenant/student filters, tests and audited backend enforcement |

## ADR-001 — Public static demo first

**Status:** Accepted for prototype. **Why:** no install, simple GitHub Pages distribution. **Trade-off:** no secure multi-user data processing. **Boundary:** synthetic-only, browser UI permission simulation.

## ADR-002 — Provider-agnostic adapter

**Status:** Accepted for prototype. **Choice:** default personal Demo Gateway; optional OpenAI/Gemini disposable BYOK; Offline Mock. **Trade-off:** direct BYOK is unsafe for long-lived credentials and may fail CORS. **Production direction:** backend proxy with secrets server-side.

## ADR-003 — Student knowledge boundary

**Status:** Proposed production decision. **Choice:** tenant/student-scoped logical evidence partitions, not one physical server per student. **Why:** manageable infrastructure with enforced authorization and traceability.

## ADR-004 — Human-reviewed portfolio

**Status:** Accepted concept. **Choice:** AI drafts are not equivalent to approved reports. Educator corrections and explicit approval must precede distribution.

## ADR-005 — Avoid biometric classification in first release

**Status:** Accepted restriction for v1. **Why:** technical identity errors and heightened privacy risks for minors; manually verified photo IDs suffice for initial portfolio demonstration.

## ADR-006 — No company-specific hardcoding

**Status:** Accepted. **Choice:** neutral branding and optional display label through `src/config.js`; no client code branches on organization name.
