# 02 — Product Requirements Document (PRD)

**Version:** 0.2 (concept MVP) · **Company-neutral:** yes · **Data:** synthetic only.

## Personas and needs

| Persona | Need | V1 demo behavior | Production requirement |
|---|---|---|---|
| Educator | Assemble a student's growth narrative from evidence | Select fictional student and generate template | Authenticated assigned-only access, review queue |
| Curriculum lead | Consistent writing format | Fixed domain headings | Versioned, per-operator templates with approvals |
| Administrator | Verify role separation | Teacher-dropdown simulation | Backend authorization, auditing, school tenancy |
| Guardian | Understand child progress | Print sample portfolio | Scoped authenticated delivery / release consent |
| Technical buyer | See value without installation | Public browser demo | Staging pilot with real controls and assessed providers |

## Functional requirements

- **FR-01** Provide fictional student roster and classroom labels. `LIVE IN STATIC MVP`.
- **FR-02** Show an illustrative 18-month evidence trail with dates, competency domains, and immutable-looking evidence IDs. `LIVE IN STATIC MVP`; entries are in-memory only.
- **FR-03** Simulate per-teacher student visibility, visibly disclose that this is not access control. `LIVE IN STATIC MVP`.
- **FR-04** Choose Gateway / OpenAI BYOK / Gemini BYOK / Offline Mock with explicit failure handling and no silent provider fallback. `LIVE IN STATIC MVP`.
- **FR-05** AI must return structured fields: summary, five domains, next steps, evidence IDs. `LIVE IN STATIC MVP` with validation; factual alignment still requires human inspection.
- **FR-06** Educator can review, edit, optionally mark approved, and print/save PDF. `LIVE IN STATIC MVP` (approval is local only).
- **FR-07** Show unproven sample metrics as hypotheses, not claimed savings. `LIVE IN STATIC MVP`.
- **FR-08** Configure product name, optional operator name, portfolio title and Gateway routing in a public config. `LIVE IN STATIC MVP`.
- **FR-09** Authenticate staff and enforce student access on every query and retrieval step. `PROPOSED`.
- **FR-10** Store student-specific observations, evidence lineage, teacher edits and approval history in encrypted DB/object storage. `PROPOSED`.
- **FR-11** Export an approved controlled-format portfolio, with school-defined layout. `PROPOSED`.
- **FR-12** Allow controlled student transition export to next school if legally and operationally approved. `PROPOSED`.

## Non-functional requirements

- Static demo works on desktop/mobile modern browsers with internet access and no installation.
- Offline Mock works without a model provider; user-facing output clearly says **SIMULATED**.
- No real school data or API keys are ever embedded in the repository.
- Input strings are inserted into the DOM as text, not parsed into HTML.
- Version 1 is *not* intended for minors or live operations; explicit warning must remain visible.
- AI failures show actionable messages without misreporting mock responses as real AI output.
- All tool/provider calls have bounded timeouts; costs/quotas are enforced at a trusted backend where applicable.

## Quality questions to resolve with a future customer

1. What exactly must appear in the 18-month portfolio (chapters, languages, images and curriculum framework)?
2. How often is the portfolio issued, how many edits and who authorizes final delivery?
3. Are the six-hour baseline and <10% rewrite target measured as *time*, *word changes* or *percentage of documents*?
4. What student records may leave the country or be processed by which vendors?
5. What software and consent processes already exist for collection and photos?
