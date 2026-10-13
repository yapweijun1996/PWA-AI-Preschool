# 16 — Singapore Compliance Research Checklist (Non-legal Advice)

**Important:** This is a technical due-diligence checklist, not certification or a legal opinion. Apply current law and school/operator policy with qualified DPO/legal review.

## Authorities and primary sources

- [PDPC — Advisory Guidelines on Children’s Personal Data in the Digital Environment](https://www.pdpc.gov.sg/guidelines-and-consultation/2024/03/advisory-guidelines-on-the-pdpa-for-childrens-personal-data-in-the-digital-environment): clarifies PDPA data-protection obligations in children’s digital contexts.
- [ECDA — CCTV requirements in preschools](https://ask.gov.sg/ecda/questions/cm4mgs6rt005uptnrcgk279tf): CCTV covers relevant areas; **audio is not required**. This CCTV requirement does **not** by itself grant permission to run AI classroom recording/surveillance.
- [Google — Gemini API key security](https://ai.google.dev/gemini-api/docs/api-key): explicitly advises against client-side production API keys.
- [OpenAI — API authentication](https://platform.openai.com/docs/api-reference): warns not to expose API keys in browsers or apps.
- [GitHub — Pages publishing guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site): public static site model, hosting choices.

## Compliance gating by data category

| Data type | Public demo | Real use approval requirements |
|---|---|---|
| Fictional learning observations | Allowed | N/A |
| Real name, class, progress | Prohibited | Data inventory, permitted purposes, DPO, identity/access rights |
| Photos/videos of children | Prohibited | Notice/consent or lawful basis, purpose scope, retention, secure storage |
| Voice recordings/speaker tracking | Prohibited | Distinct recording policy, necessity, permission/legal review, retention |
| Face/voice biometric identifiers | Prohibited | Specially scoped necessity and proportionality assessment, heightened safeguards |
| Performance analytics about teachers | Prohibited | Workplace transparency, fairness, purpose limits and human governance |
| Preschool→primary school transition data | Prohibited | Verify disclosure authority, recipient identity, least privilege, transfer trace |

## Cloud / vendor review

Do **not** say any specific Bedrock or Gemini deployment is “Singapore-government approved” solely because its parent cloud platform has a certification. Check the exact service, model, processing region, logs, training policy, data retention, subcontractors, contractual terms and migration plan. Compare security claims to written provider documentation and internal DPO requirements. Browser BYOK with actual child data is ruled out for this demo.

## Go / no-go decisions before production

- DPO signs off data-flow map and child-specific DPIA.
- Written staff and parent/guardian policies satisfy actual legal/contract requirements.
- Data stored only in approved regions and account settings, with verified contractual controls.
- School-to-school transfer formally authorized; no open browsing by receiving schools.
- No automated teacher performance punishment or student diagnosis based on AI inference.
- Incident response, key handling, export/deletion processes tested.
