# 10 — Test Plan and Evidence-Based Evaluation

## Automated tests in package

`npm run check` parses five browser modules, the worker template and `scripts/build.mjs`. The **43 Node tests** cover the original roster, portfolio/citation, review, provider and credential contracts plus PWA atomic installation, strict cache boundaries, scoped cleanup, cold shell routing, explicit activation, first control without reset, multi-tab handoff, busy/duplicate guards and timeout recovery. `npm run build` emits only runtime assets, manifests/icons, release metadata, worker and `.nojekyll`; it is not proof of browser installation or live-provider availability.

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
| B-13 | Compare built file list with allowlist | HTML/CSS/favicon, five src modules, three PNG icons, two manifests, build-info.json, sw.js and .nojekyll only; no docs/tests/spec/schema/history/keys |
| B-14 | Warm cache, disable network and ordinary HTTP cache, cold-reload | Ready offline shell; explicit Mock generation/edit/review/print; cloud generation disabled |
| B-15 | Install through browser/home-screen UI | Neutral name/icons; repository scope; standalone launch; actual iOS safe areas/status bars inspected |
| B-16 | Publish N+1 at the same origin; cancel then confirm update | Waiting prompt; session preserved on cancel; reset warning, loader and newest version on explicit activation |
| B-17 | Update with two open tabs, repeat clicks and generation in flight | Only confirming tab reloads; duplicate/busy guard; other tab offers explicit reload |
| B-18 | Fail one required install asset or activation handoff | No partial cache activation; old offline release survives; visible error, bounded timeout and retry recovery |
| B-19 | Inspect caches after query/API/POST attempts | Exact static routes only; no session, key, response, narrative, unrelated route or query cached |
| B-20 | Theme/reduced-motion/keyboard/viewport checks | Metadata/manifests match theme; motion respected; 44px targets and 16px inputs; no overflow at 320/390/430/768/1440 widths |

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
