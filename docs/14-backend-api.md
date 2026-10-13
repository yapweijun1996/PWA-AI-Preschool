# 14 — Future Secure Backend/API Design (NOT IMPLEMENTED)

## Proposed API facade (authenticated internal app only)

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/v1/me` | Current actor, tenant and role grants |
| GET | `/api/v1/students` | List accessible student summaries only |
| GET | `/api/v1/students/{id}/evidence` | Filtered, authorized evidence with provenance |
| POST | `/api/v1/students/{id}/evidence` | Append observation, validate teacher assignment and purpose |
| POST | `/api/v1/students/{id}/portfolio-drafts` | Generate from approved, scoped evidence |
| PATCH | `/api/v1/portfolio-drafts/{id}` | Update draft with optimistic concurrency |
| POST | `/api/v1/portfolio-drafts/{id}/approve` | Approve with authenticated reviewer identity |
| GET | `/api/v1/portfolio-drafts/{id}/export` | Export only if authorized, approved and retention-valid |
| POST | `/api/v1/transition-packages` | Controlled data-sharing request for approved transition |

A machine-readable outline is in `spec/future-api.openapi.yaml`. It is an illustrative proposal and not a deployed or audited implementation.

## Core entities

`tenants`, `staff_users`, `students`, `teacher_assignments`, `observations`, `portfolio_drafts`, `portfolio_edits`, `approval_events`, `provider_usage`, `audit_events`, `consent_records`, `attachments`. `schema/future-postgres.sql` contains a starter SQL sketch; it intentionally avoids implying that a handful of example RLS policies satisfy real data security.

### Access protocol

1. Validate auth server-side (never trust teacher/student/tenant IDs from body alone).
2. Bind `tenant_id` and `user_id` to a backend verified principal.
3. Check assignment and purpose prior to RAG retrieval.
4. Treat retrieved observations as untrusted, annotate source IDs and versions.
5. Generate structured model response; validate schema and claim evidence.
6. Store as `DRAFT`; apply review and separate approval.
7. Send to parent/export only when authorized and approved; log action.

## Idempotency, limits and audits

- Add `Idempotency-Key` to generation/review APIs and request timeout/queue support.
- Rate limits by tenant, actor and provider, with explicit per-tenant spend caps.
- Audit denies and privileged operations; never log API tokens, raw child voice or full private prompts.
- Idempotent event processing for timetable changes or parent notifications.
- Backups, restore drills and destructive migration controls required before live school use.
