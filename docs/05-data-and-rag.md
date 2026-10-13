# 05 — Student Knowledge, Evidence and RAG Design

## Domain vocabulary

- **Student:** record representing a child (fictional in MVP).
- **Educator assignment:** scope limiting a teacher to specific students.
- **Observation:** timestamped evidence about actual student behavior, activities or artifacts.
- **Learning domain:** e.g. Communication, Literacy, Numeracy, Social-emotional, Creative expression; configurable for a school-defined framework.
- **Source reference:** stable observation/document/version ID supporting a narrative claim.
- **Portfolio draft:** structured generated output awaiting educator approval.
- **Review:** explicit change, comment, approval actor and timestamp.
- **Transition package:** minimal approved transfer between organizations (future).

## Current data model

`src/data.js` ships exactly 5 invented students and dated observations for a demonstration period. Each student has sample evidence IDs such as `ST-001-E01`. Editing is in memory and lost at refresh. No database, authentication or true RAG/vector search is implemented. Evidence filtering inside the JS demo is **not** production isolation.

### Implemented static-demo validation and traceability

The provider portfolio remains exactly four fields: `summary`, the five named `domains`, `nextSteps`, and `evidenceIds`. `spec/portfolio.schema.json` describes this shape; `generationMode: "mock" | "ai"` is application-local metadata and is rejected in provider responses. Domain citations are inline text such as `[ST-001-E05]`, not a nested claim schema.

`validatePortfolio` rejects missing/empty text, arrays in place of objects, extra fields or domains, text over the schema limits (4000 characters for summary/next steps, 3000 per domain), and empty or oversized evidence lists (1–250 unique IDs). It rejects invalid, unknown and other-student IDs rather than dropping them, and never supplies replacement narrative. Evidence authorization here means membership in the selected student's supplied evidence pack, not backend access control.

Every complete inline citation in summary, domains and next steps must resolve to supplied evidence and be listed in `evidenceIds`. A domain containing supplied observations must cite at least one of its own domain's IDs; references to another domain are rejected. These are structural and attribution checks, **not proof that every factual claim is cited or supported**. The prompt requires citations for factual summary/next-step claims, but educator review must check sentence-level factual support and uncited assertions.

The deterministic Offline Mock is visibly labelled simulated, copies each supplied observation with its own inline citation, and provides provisional suggestions rather than asserted outcomes. A domain without observations receives an explicit evidence-gap note. A portfolio without any supplied evidence cannot pass validation; add fictional observations before generating a usable draft. All five bundled students have evidence for the five displayed domains. `examples/portfolio.sample.json` illustrates the same strict cited shape.

## Production knowledge-base strategy

**One logical knowledge boundary per student** within a secure multi-tenant store, not necessarily one physical database or server per student. Suggested keys:

- `tenant_id` — operator/school boundary.
- `student_id` — stable internal GUID, never rely on child name.
- `observation_id` + `revision` — evidence provenance.
- `subject_domain` — configurable learning framework mapping.
- `consent_purpose`, `visibility`, `retention_policy`, `data_classification`.

### Proposed retrieval pipeline

```mermaid
flowchart TD
    REQ[Teacher requests student portfolio] --> AUTH{Authenticated AND assigned?}
    AUTH -->|No| DENY[403 + audit denial]
    AUTH -->|Yes| Q[Select tenant student & approved period]
    Q --> E[Retrieve approved text evidence]
    E --> FILTER[Filter by purpose, visibility and approval]
    FILTER --> PACK[Bounded evidence pack with stable IDs]
    PACK --> GEN[AI structured draft]
    GEN --> VERIFY[Schema, source IDs, per-claim traceability]
    VERIFY --> REVIEW[Educator edits and signs off]
    REVIEW --> FINAL[Publish/export authorized portfolio]
```

### Prompt-injection safeguards

Teacher text, imported documents and OCR/transcripts are *untrusted evidence*, never model instructions. Prompts enforce use-only-supplied-evidence; the output schema is validated independently. Do not conclude correctness solely because IDs exist; the referenced evidence **must actually support the claim**. For an unsupported domain, return a neutral evidence-gap note. Never infer diagnosis, impairment, discipline or emotional state from limited evidence.

### Recommended future domain-specific AI metrics

- Evidence citation precision = backed supported claims / checked claims.
- Attribution error = cross-student claims / checked claims (**blocking if nonzero**).
- Template completeness; educator approval rate; hours spent editing; unsafe disclosure checks.
- <10% word-edit distance is an **illustrative goal**, not equivalent to 90% AI accuracy and not proven.

## Photos

Avoid face recognition for early MVP. Attach photos manually to a student ID, verify by educator, store with consent/purpose and maintain takedown/deletion ability. Biometric matching of minors requires separate necessity/security/legal review; it is not a prerequisite for student portfolio generation.
