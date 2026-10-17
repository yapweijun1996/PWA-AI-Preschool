# 11 — Roadmap and release gates

## Current static studio

The root hosts one page-per-module fictional-data studio: 20 sample children, four-domain semester records, local autosave, explicit mock/remote drafts, local review and browser reports. `class.html` is a hash-preserving redirect, not a second product. The original five-record showcase is historical under `legacy-demo-v1`.

Implemented behavior is not blanket acceptance. Current-root/offline/update and hosted-origin checks, physical devices, screen readers, cross-browser/CJK print behavior and real disposable BYOK calls require their own evidence; see [testing](10-testing.md), [PWA gates](25-pwa-standard.md) and [recorded evidence](26-submission-writeup.md).

## Proposed phases — NOT IMPLEMENTED

| Phase | Goal | Release condition |
|---|---|---|
| Curriculum-template pilot | Operator-defined sections and writing style | Educator-approved templates; source-support evaluation |
| Secure private pilot | Staff identity, authorized tenant/student access and durable records | DPO/contracts, independent authorization tests, audit, retention and restore evidence |
| Governed school workflow | Finalisation, controlled guardian release and exports | Authenticated reviewers, purpose/recipient checks and human sign-off |
| Advanced research | Optional classroom/voice assistance | Separate necessity, DPIA, policy, consent and feasibility validation |

No production capability is implied by the public demo. Browser `localStorage` is not secure records storage, editable local review is not finalisation, and provider grounding guards are not an accuracy benchmark.

Classroom AV capture, child biometrics, automated teacher ranking, automatic family messaging, inter-school transfer and commerce must not be introduced as incidental extensions. Each requires explicit scope, governance and independent validation.
