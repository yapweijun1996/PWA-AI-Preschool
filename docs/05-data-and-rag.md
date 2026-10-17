# 05 — Semester records, evidence and RAG boundary

## Current studio data

`src/portfolio-seed.js` supplies 20 fictional children and semester records. `src/portfolio-model.js` validates and derives completion/status, rating changes and narrative input. The four domains are English, Chinese, Mathematics and Social-Emotional Development. Semesters use identifiers such as `2026-S1` and `2026-S2`.

Each child-semester record has domain ratings/comments and abstract placeholder photos, narratives with source/provenance, and editable local review state. Missing ratings remain missing, not zero progress. Evidence library views project these domain comments/photos; they do not supply an invented dated observation history or a vector-search service.

`src/portfolio-store.js` persists validated records in browser `localStorage` under `ai-preschool-portfolios-v2`, in `{version: 2, savedAt, records}`. Unsupported versions are rejected rather than silently migrated. Storage is origin-specific, quota-limited, unencrypted, unauthenticated and not a backup. Save errors must remain visible. See the [submission write-up](26-submission-writeup.md) for the detailed JSON and production mapping.

## Drafting and traceability

`src/narrative.js` builds per-domain inputs from the child's first name, rating, educator comment and available previous rating. Photos are not sent to providers. Strict JSON parsing and grounding guards can reject output, but do not prove factual correctness. Rejections remain visible; no failed remote call silently becomes mock output.

Narratives distinguish `mock`, `ai` and `teacher` sources and retain available provider/model provenance and edited state. Review is local editable state, not authenticated authorship, approval or finalisation. Educators must compare every narrative with the supplied evidence. Do not infer diagnosis, personality, gender or unobserved achievements.

## Production RAG proposal — NOT IMPLEMENTED

Use one logical knowledge boundary per student in an authorized multi-tenant store, not one physical server per student. Proposed keys include `tenant_id`, `student_id`, `evidence_id`, period, domain, source, reviewer and retention state.

A private pipeline must authenticate the staff member, authorize tenant/class/student/purpose, retrieve only permitted evidence, apply scope filters before and after search, validate generated claims, and require human sign-off. The browser's filtering is not authorization or real RAG. Teacher text, documents, OCR and transcripts are untrusted evidence, never instructions.

Evaluate evidence support, cross-child attribution, unsupported claims, educator corrections and actual review time. Valid schema or source identifiers alone never establish entailment or accuracy.

Real child photos are forbidden in this public demo. Any future private attachment workflow requires lawful purpose, permissions, private storage, authorized access, safe decoding, metadata removal, retention and deletion. Face recognition is not a prerequisite for portfolio drafting.
