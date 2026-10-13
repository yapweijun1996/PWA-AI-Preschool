# 03 — MVP Scope and Acceptance Criteria

## Current demo boundaries

The shipped UI is static and accesses only bundled fictional records plus current-session edits. No real RAG database or school backend exists.

### Core user journey

1. Open public landing page; visible warning says fictional records only.
2. Choose a simulated educator role; see only that role's sample roster in the UI.
3. Select student; review evidence chronology and domain coverage.
4. Open AI settings; select Default Demo / OpenAI / Gemini / Offline Mock.
5. Generate a portfolio; show evidence IDs and clear generation mode.
6. Review each section and correct errors; explicitly mark educator-reviewed.
7. Use browser Print → Save as PDF; output must still contain demo label.

### Acceptance conditions

| ID | Condition | Type |
|---|---|---|
| AC-01 | No organization/company name is hardcoded; config defaults to neutral studio | Source scan + browser inspection |
| AC-02 | Mock produces complete portfolio for 5 fictional students | Automated |
| AC-03 | Malformed portfolios, fabricated/cross-student IDs and cross-domain inline citations are rejected, never silently dropped | Automated |
| AC-04 | Teacher role switching never claims to enforce real security | Content/UI inspection |
| AC-05 | BYOK key is never placed into URL, storage or source control | Static search + manual browser inspection |
| AC-06 | Failure of cloud model does not silently fake a success | Manual/error injection |
| AC-07 | Teacher can edit draft, sign off locally, and print PDF | Browser E2E required |
| AC-08 | Dashboard usable at 390×844, 430×932 and desktop 1440×900 | Browser E2E required |
| AC-09 | All visible content is explicitly fictional | UI/source review |
| AC-10 | Real school name/logo can be added by configuring only neutral public fields | Manual smoke |

### Strict production go/no-go

Before importing *any* real child data: identity/access/RBAC with school tenant boundary; legal/DPO review and guardian-facing notices; lawful basis; purpose limitation; vendor contracts and regional data flows; encryption; retention/deletion; independent authorization tests; abuse/incident response; human signoff; deployment/backup/audit; threat model and security test evidence. Do not interpret successful demo tests as satisfying these controls.
