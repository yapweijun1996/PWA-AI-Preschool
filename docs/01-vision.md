# 01 — Product Vision and Scope Boundaries

## Problem

Educators spend substantial time collecting evidence, organizing observations and rewriting individually formatted learning portfolios. A benchmark of **six teacher-hours per student portfolio** and a **150-student scenario** (900 teacher-hours per complete cycle) may be used to frame a *hypothesis*, but both numbers require real measurement before being used in marketing or ROI claims.

## Outcome

Help educators spend more time with children by producing **traceable, editable, age-appropriate first drafts** rather than independently asserting developmental outcomes. Human reviewers remain accountable for the content sent to families. Narrative quality is important, but child identity protection and evidence correctness are release-blocking requirements.

## Users

- Educator: record events, see assigned students, generate/edit/approve drafts.
- Curriculum lead: define template sections and language guidelines.
- Centre administrator: manage staff, assignments and approval workflows (future backend).
- Parent/guardian: receive only an approved portfolio for their own child (future backend).
- Privacy/DPO reviewer: verify consent, processing, retention and disclosure (future backend).

## North-star measure

`Median educator minutes from opening student evidence to approving an accurate portfolio`, compared against an observed manual baseline. Secondary measures: evidence precision, false child attribution, unsafe disclosures, portfolio format accuracy, time to resolve incorrect claims, teacher edits and model cost per portfolio.

## Design principles

1. **Fictional data first** in every public repo/demo.
2. **Source before summary**: every developmental claim must be supportable by approved observations.
3. **Teacher-in-the-loop**; no automatic delivery of AI-only drafts.
4. **Public demo ≠ real school production software.**
5. **White-label**: operator names and branding must be configuration, never logic.
6. **Provider-agnostic**, with safe server-side integration when real data becomes necessary.
7. **No unconsented biometric analysis**; voice/face matching deferred.

## Non-goals for v1

Real child data, persistent authentication, vector database, biometric identification, classroom surveillance, real parent communications, teacher performance scoring, inter-school data exchange, course payments, or legal certification.
