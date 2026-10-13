# 10 — Test Plan and Evidence-Based Evaluation

## Automated tests in package

`npm run check` parses all JS modules. `npm test` exercises bundled student identities, evidence ID uniqueness, role partitions in the *simulated* data, mock portfolio shape, invalid evidence ID rejection, JSON parsing, and prompt instructions.

## Required manual browser tests (not proven by Node unit tests)

| ID | Scenario | Expected |
|---|---|---|
| B-01 | Open app in mobile Chrome / Safari | No broken layout, click targets accessible |
| B-02 | Select Ms Jordan and Mr Lee | Appropriate fictional cards change; UI labels simulation |
| B-03 | Select Offline Mock and generate | Ribbon explicitly says simulated/no AI call |
| B-04 | Generate and edit each portfolio text area | Edits shown and not lost within current page session |
| B-05 | Check approval | Status changes to educator reviewed locally |
| B-06 | Print / PDF | Only portfolio on printed pages; demo disclaimer visible |
| B-07 | Invalid OpenAI key | Error message; no mock response substituted |
| B-08 | Invalid Gemini key | Error message; no secret in URL or page logs |
| B-09 | Gateway CORS block or 429 | Useful error; provider can be changed safely |
| B-10 | Refresh page | In-memory test data, approval and BYOK key reset |

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
