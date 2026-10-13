# 15 — Operations, Sizing and Cost Model

## Illustrative workloads (not measured customer data)

Let `S` = portfolio count per cycle; `T_manual` = measured manual hours per portfolio; `T_review` = measured educator post-AI review hours; `T_setup` = all model/setup/QA/admin hours per cycle.

```text
Manual hours = S × T_manual
Assisted hours = S × T_review + T_setup
Net hours saved = Manual hours − Assisted hours
Saving fraction = Net hours saved / Manual hours
```

Example for **150 sample portfolios** at **six assumed manual hours each** → **900 manual hours**. This baseline is illustrative only. Do not declare savings until pilot measurements include actual review, rework, setup, validation and admin time.

## Provider cost estimation

```text
Estimated generation cost = (# portfolios × typical input tokens × input unit price)
                          + (# portfolios × typical output tokens × output unit price)
                          + any hosting / retrieval / file / audit costs
```

Unit prices and model availability change; fill them from *current vendor price pages* at test time. Demo Gateway may impose session/route/daily quotas independent of token prices. Consider one portfolio regeneration per edited observation and manage large-context evidence packs with chunk limits.

## Operational alerts (future)

- Gateway session failure rates / 429s / 503s.
- Monthly model spend against tenant limit; missing data sources.
- Accuracy regression in evidence-supported samples.
- Unauthorized access attempts, student identity mismatches.
- Export failures, delayed educator approvals and backup failures.

## Recovery priorities

1. Disable public Demo Gateway project if abuse/credential incident.
2. Roll back static Pages to prior verified commit.
3. Disable AI generation while preserving manual draft review if the provider is down.
4. Stop data processing and escalate via operator DPO if sensitive information is exposed.

## Ownership and support

Production should identify owners for education content, privacy, engineering, security, cloud operations and user support. A single engineer should not be implicitly responsible for authorizing children’s biometric processing or determining legal compliance.
