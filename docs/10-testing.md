# 10 — Test Plan and Evidence-Based Evaluation

## Automated tests in package

`npm run check` parses all runtime JS modules and `scripts/build.mjs`. The 27 Node tests cover simulated roster partitions, complete labelled mocks, session-observation isolation, strict portfolio bounds, missing sections, duplicate/unknown/cross-student IDs, cross-domain citations, parsing, immutable public configuration, provider credential leakage, fresh Gateway sessions, timeouts, malformed envelopes and sanitized failures. `npm run build` stages only runtime HTML/CSS/favicon/modules plus `.nojekyll`; it is not a browser or live-provider test.

The Pages workflow runs these commands on PRs to `main`, pushes to `main`, and manual dispatch. PR CI has read-only repository access and never uploads/deploys Pages; arbitrary-branch manual dispatch also cannot deploy. Publishing requires `main` and a successful check job. Verify the workflow execution, deployment environment and actual deployed URL separately; configuration alone is not evidence of a live deployment.

## Required manual browser tests (not proven by Node unit tests)

| ID | Scenario | Expected |
|---|---|---|
| B-01 | Open app in mobile Chrome / Safari | No broken layout, click targets accessible |
| B-02 | Select Ms Jordan and Mr Lee | Appropriate fictional cards change; UI labels simulation |
| B-03 | Select Offline Mock and generate | Ribbon explicitly says simulated/no AI call |
| B-04 | Generate and edit all seven portfolio sections | Saved edits remain in the current session; invalid citations are rejected without changing the saved draft |
| B-05 | Approve, edit again, and regenerate | Local reviewed status is explicit; edits clear the checkbox; regeneration resets approval |
| B-06 | Print / PDF | Only portfolio on printed pages; demo disclaimer visible |
| B-07 | Invalid OpenAI key | Error message; no mock response substituted |
| B-08 | Invalid Gemini key | Error message; no secret in URL or page logs |
| B-09 | Gateway CORS block or 429 | Useful error; provider can be changed safely |
| B-10 | Refresh page | In-memory test data, approval and BYOK key reset |
| B-11 | Serve built `dist/` under `/REPOSITORY/` using the deployment guide command | Relative modules, stylesheet and favicon load without 404s; source/docs/tests are not served |
| B-12 | Repeat Offline Mock at actual Pages HTTPS origin | Generation succeeds without external provider availability; evidence links remain within the selected fictional student |
| B-13 | Compare built file list with allowlist | Only index.html, styles.css, favicon.svg, four src modules and .nojekyll; no docs/tests/spec/schema/MANIFEST/history/keys |

Run the subpath smoke command from [the deployment guide](09-deployment.md). Browser interaction, layout, print/PDF, external-provider availability and deployed-origin CORS require manual verification and are not established by syntax checks, Node tests or build success. Record each unexercised scenario as **NOT TESTED**, not PASS. Offline Mock is independent of live Gateway/BYOK health after static assets load.

## Security-focused negative tests (future API, not static demo)

- API request for another tenant's student → 403, no evidence fragments.
- Teacher assignment revoked → no cached access after invalidation.
- Parent attempts to fetch another child's PDF → 403 with auditable denial.
- Cross-student information inside prompt injection text → output validator rejects any unsupported claim.
- API key injected into query string/exception/log → CI security scan fails.
- Replaying expired demo session → 401; over quota → 429.
- Model returns valid syntax with fabricated facts → human evaluator marks fail (schema validity alone insufficient).

## Quality study methodology

Baseline the educator's **actual minutes per portfolio**, not only sample claims. Choose 20–30 synthetic or properly permitted de-identified examples under a formal pilot plan. Track:

1. Preparation time; generation time; educator review time; total end-to-end time.
2. Edit-distance % (lexical proxy) **and** editing minutes (workload measure).
3. Evidence support rate; unsupported claims; cross-child attribution count.
4. Correct document template/section order; nonstandard claims; spelling.
5. Reviewers' usability rating; cost per successful approved portfolio.

Do not interpret a <10% edit ratio as 90% factual accuracy. Set exact success thresholds **after** representative baseline measurement and privacy approval.

## Validation evidence report template

```text
Test date (timezone):
Commit SHA:
Demo URL:
Browser / viewport:
Mode: Mock / Gateway / OpenAI BYOK / Gemini BYOK
Result: PASS / FAIL / NOT TESTED
Evidence: screenshot, HTTP status, sanitized log ID
Defect / repro steps:
Reviewer:
```
