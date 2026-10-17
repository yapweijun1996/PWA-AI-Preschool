# Documentation index

Current product: **AI Preschool Studio**, a fictional-data browser prototype. [Published demo URL](https://yapweijun1996.github.io/PWA-AI-Preschool/) (availability/build not rechecked by this documentation sync). `index.html` hosts the studio; `class.html` only redirects, preserving hash routes.

## Standard documentation set

- [DESIGN — architecture and trust boundaries](DESIGN.md)
- [SPEC — current behavior, requirements and acceptance](SPEC.md)
- [EPIC — problem, outcomes and work boundaries](EPIC.md)
- [ROADMAP — proposed sequence and release gates](ROADMAP.md)
- [TASK — actionable work and verification status](TASK.md)
- [CHANGELOG — Git-based implementation history](CHANGELOG.md)

Read these current contracts before older planning material. Source and actual runtime/test evidence take precedence over documentation; a proposal is not an implemented feature. The standard set distinguishes unmeasured workflow assumptions, proposed edit-effort targets and future multilingual/measurement/privacy work from the shipped demo.


## Current behavior and development

- [Architecture and trust boundaries](04-architecture.md)
- [Semester records, evidence and RAG boundary](05-data-and-rag.md)
- [Provider adapters and disposable BYOK](06-provider-integrations.md)
- [Security and privacy](07-security-privacy.md)
- [UI, branding and accessibility](08-ui-and-branding.md)
- [GitHub Pages deployment and rollback](09-deployment.md)
- [Testing and evaluation](10-testing.md)
- [Chinese quickstart](18-zh-quickstart.md)
- [Historical detailed changelog and recorded QA](20-changelog.md) (chronological, not the current specification)
- [PWA acceptance contract](25-pwa-standard.md)
- [Submission write-up, recorded evidence and production proposal](26-submission-writeup.md)
- [Development UI audit harness](27-ui-audit.md)
- [Browser privacy masking and legal-source limitations](28-privacy-masking.md)

The [design detail index](../design/README.md) covers routes/menu, 12 page specs, 24 WebP wireframes and shared tokens. Specs define copy/behavior, images visual intent and tokens enforceable values; use the current standard set to resolve superseded product assumptions.

## Product direction and proposed production work

These documents are planning references, not implemented private services:

- [Vision and boundaries](01-vision.md)
- [Roadmap and release gates](11-roadmap.md)
- [Risks and decisions](13-risks-and-decisions.md)
- [Future backend/API design](14-backend-api.md)
- [Operating model and costs](15-operations-and-costs.md)
- [Singapore regulatory research checklist](16-singapore-compliance.md)
- [Official sources](19-sources.md)
- [Optional classroom/timetable research](21-future-classroom.md)
- [Controlled school transition proposal](22-transition-exports.md)
- [Separate course-commerce proposal](23-course-commerce.md)

Supporting proposals: [future OpenAPI sketch](../spec/future-api.openapi.yaml), [future SQL sketch](../schema/future-postgres.sql) and [public configuration example](../examples/config-example.md). None provides production authorization, tenancy or legal approval.

Old-only PRD, acceptance, walkthrough, coding-agent task and five-record verification documents/screenshots were removed during the root cutover. Their historical context belongs to the `legacy-demo-v1` tag, not the current product contract. Numbering gaps are intentional. Historical evidence in the numbered changelog/write-up must not be treated as current-root acceptance. For example, its earlier rename entry invalidates review, while the later workflow fix and current standard docs preserve review/freshness on a pure rename.
