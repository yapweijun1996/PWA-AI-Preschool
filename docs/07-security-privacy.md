# 07 — Security, Privacy and Threat Model

## Public demo data classification

**PUBLIC & SYNTHETIC ONLY.** Fictional names/observations are hardcoded in JavaScript and therefore visible to anyone who opens the site. No student identifiers belonging to real people, biometric photos or audio may be uploaded. All input is treated as fictitious test material. A fake educator role is only a UI filter, not a security boundary.

## Threats and mitigations

| Threat | Demo mitigation | Production minimum |
|---|---|---|
| Child data leaked to GitHub Pages | Never include real records | Private backend, controlled storage, prepublication DLP scan |
| Cross-student retrieval | Fictional evidence ID filtering; test only | Tenant/student authorization on every read, after vector search too |
| API key disclosure | No embedded key, disposable BYOK warning | Trusted server proxy with secret manager and restricted scopes |
| Gateway abuse | Server-owned short-lived sessions and quota expected | Enforced per-project quota, IP/session limits, bot defense, logging and revocation |
| Hallucinated development claims | Evidence IDs validated; educator review | Per-claim provenance checks and independent QA |
| Prompt injection via observations | Evidence marked untrusted | Parse schema, isolate tool permissions, do not obey evidence instructions |
| Child face/voice biometric misuse | No real recognition module | Separate lawful basis, necessity, safeguards and DPIA before considering pilot |
| Staff surveillance | Not present | Transparent policy, purpose limitation, consultation and oversight |
| Sensitive logs | No backend data logs in demo | Redacted logs, access controls, retention/deletion, breach response |
| School-to-school transfer error | Not present | Confirm authority and minimum dataset; recipient verification and access expiry |

## Static PWA security boundary

- The HTML CSP restricts scripts, styles, fonts, workers and manifests to this origin; connections are limited to this origin and the configured default Gateway/OpenAI/Gemini hosts. HTTPS images allow authorized public branding. Objects are disabled and base/form destinations remain same-origin. A custom Gateway origin requires updating the CSP in `index.html` as well as public configuration.
- The worker admits only exact, same-origin, query-free GET routes in its generated static allowlist. POST, other paths/origins, provider sessions, responses and credential-bearing URLs are not cached. Cache names include registration scope and release identity; cleanup touches only this app's obsolete releases.
- Drafts, extra observations, approvals and BYOK keys never enter Cache Storage, localStorage or sessionStorage. Reload and an accepted update reset them. Static bundled fictional examples remain public and cached.
- HTTPS is provided by GitHub Pages; localhost is only a development secure-context exception. CSP and scoped caches do not provide staff authentication, tenant isolation, secure BYOK custody or protection from trusted same-origin scripts/extensions.


## Production access model

`SchoolTenant -> StaffIdentity -> AssignedClass -> Student -> Evidence`. RBAC role is necessary but not sufficient; implement **ABAC** based on assignment, active date, document purpose, guardian relationship and school.

- Administrator does **not** necessarily receive unconditional child access.
- Parents see only their own child, approved released documents, and the permitted period.
- Educators see only students assigned within the relevant period.
- Approvers are explicit identities; apply four-eyes review if required.
- Denied accesses and overrides are logged. Default deny; avoid `SELECT *` tenant-wide exports.

## Privacy engineering requirements before real data

1. Appoint accountable operator and DPO; identify controller/processor responsibilities and sign vendor agreements.
2. Record purpose, notice/consent or appropriate statutory basis; do not assume blanket authorization from enrolment.
3. Map every field, audio image and prompt to its collection source and retention rule.
4. Review offshore processing, vendor training policies, temporary retention and regional inference.
5. Encrypt transmission/storage and restrict keys. Isolate tenants at backend and DB level.
6. Provide correction, access, deletion and expiry process consistent with applicable law/contract.
7. Train operators: AI summarization is assistance, **not evaluation/medical diagnosis**.
8. Complete security testing and a documented DPIA. Obtain legal review for children's biometrics, classroom recordings and staff evaluation.

## Logging policy

Log event ID, actor ID, tenant, scoped student ID, request type, timestamp, model/template version, decision code and cost, rather than raw children's narratives. Strictly separate debug logs from production. Purge on retention expiry, protect incident/audit records and define breach escalation procedures.

## Privacy notice to display in public demo

> This interactive prototype uses fictional students and sample records. Do not enter any real child's personal, academic, health, face or voice information. Browser-entered API keys are for temporary testing only and may be visible to your browser and extensions. Do not use production API keys. This demonstration is not a certified school records service.
