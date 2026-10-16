# 26 - Submission write-up: AI Preschool Studio

## Short write-up

AI Preschool Studio is a fictional-data prototype, not a school records service. It demonstrates class progress, semester comparison, editable drafting, teacher review and printable portfolios. Never enter real identities, photos or workplace records.

### 1. Tech stack

All production choices below are proposals, **NOT IMPLEMENTED**.

| Layer | Prototype (built) | Production proposal | Why |
|---|---|---|---|
| Frontend | Static zero-build vanilla-JS PWA, semantic HTML and CSS; build stages assets | TypeScript frontend with shared validation | Simple workflow, explicit service contracts |
| Backend | None; public Demo Gateway is not a school backend | Node.js/Fastify API with validated requests | Central authorization and server-owned secrets |
| Database and file storage | Browser `localStorage`, image data URIs | PostgreSQL and private object storage | Transactional records, history and controlled photo access |
| AI | Offline mock default; Gateway/OpenAI/Gemini adapters. Prompt uses structured input only: first name, rating, comment and available previous rating. Requires strict JSON, no invention, no gendered pronouns, exact first name and Simplified Chinese for the Chinese domain. Grounding validator, visible rejection, no silent fallback to mock; teacher review required | Contracted server-side inference with approved style exemplars | Minimise data; retain human accountability |
| PDF generation | Browser Print/Save as PDF; Simplified Chinese system font stack and `lang="zh-Hans"`; verified in headless Chrome with embedded PingFang SC | Render the same HTML server-side with a pinned embedded Noto Sans SC subset | Reproducible fonts, independent of local installation |
| Login and access control | No real login; teacher role is simulated | Managed identity, MFA, assignment checks and tenant row-level security | Default-deny enforcement outside the browser |

### 2. Storing progress across semesters

S1 covers January-June; S2 covers July-December. The proposed database keeps one record per child per period, with domain ratings, comments, photo references and append-only narrative versions. The S2 query joins the same child's S1 ratings by year and domain, so the S2 portfolio shows prior ratings and change; missing evidence stays missing, not zero progress. A finalisation transaction and database enforcement would lock approved records; amendments preserve the original. Prototype review remains editable local state. Full SQL, query and retention design appear in the appendix; none is an applied migration.

### 3. Hosting and security

**Proposal only — NOT IMPLEMENTED:** Singapore-region private hosting, public application ingress, private API/database subnets and private object storage. Use TLS, managed encryption keys, encrypted backups and tested restores. Managed identity, assigned-class checks and PostgreSQL row-level security must authorize every record operation. Minimise AI inputs; no third-party AI use with real data without approved contract, processing-location, no-training and retention terms. First names and comments are still personal data. Photos need a lawful purpose, restricted signed access, metadata removal, validation and deletion procedures. Regional hosting alone is not compliance.

### 4. Future features

Proposed priorities, not shipped features:

- Private authenticated storage and finalisation.
- Class-wide quick-entry grid.
- Reviewed voice-to-comment.
- Approved curriculum and style templates.
- Parent release with sign-off.
- Accessibility audit and cross-device verification.

### What to try (3 minutes)

Suggested walkthrough, not measured duration: open `https://<owner>.github.io/<repo>/class.html` after deployment verification, or run locally:

```bash
npm run build
python3 -m http.server 4175 --directory dist
# Open http://localhost:4175/class.html
```

Inspect the overview, switch S1/S2, open a child, select Offline mock, draft, edit, mark reviewed and continue. Open child Print / PDF or Print class report, then Print / Save as PDF. Disposable provider test keys are memory-only, not secure browser custody.

| Built vs designed-only | Status |
|---|---|
| Overview/editor, local autosave, semester ratings, provider selector, partial draft acceptance, review, child/class print | Built; verification scope below |
| Backend, database/object storage, real login/RLS, finalisation, server PDF, production AI contracts, vector RAG, classroom tracking and inter-school transfer | NOT IMPLEMENTED |

## Verification evidence

Supplied measurements collected 2026-10-16/17 on macOS, runtime v23.10.0 and Google Chrome 155.0.8059.84. Branch `omp/portfolio-v2-polish-2026-10-16`, measured HEAD `3d792df`. This documentation-only task ran no commands, browser journeys, provider calls or deployment.

### Commands and counts

| Command | Recorded result |
|---|---|
| `npm run check` | Pass: all syntax checks |
| `npm test` | 129 tests, 129 pass, 0 fail; `node --test`, including grounding, pronoun, Chinese, seed, report and PWA tests |
| `npm run build` | Pass; build ID `afcb039a23b3a3f2`; 26 precached routes, including `class.html` |

| Seed measurement | Recorded result |
|---|---|
| S1 | 15 ready-for-draft; 5 drafted |
| S2 | 3 ready-for-draft; 5 in-progress; 12 not-started, fully empty |
| S1-to-S2 rating-change histogram over compared domain pairs | No change: 12; +1: 6; +2: 2; -1: 1 |

Measured commit lineage, oldest first: `c7cd1a5` data model; `2c3e6f7` overview/editor; `5164674` whitespace-only reformat (whitespace-stripped hash equality for 8 files); `94a6702` labels/seed/mobile cards; `efffb10` AI/provider selector; `6a014ae` print report; `f250d35` Simplified Chinese seed; `e5e7ae0` grounding/partial acceptance; `a7bf0ff` gendered-pronoun guard; `8f83c52` Chinese mock narrative; `c84124d` non-numeric Chinese compound handling; `3221d72` exact-first-name prompt; `3d792df` restored S2 mix.

### Browser QA

Built-in browser, fictional data, served from `dist` at `http://localhost:4175`:

| Scenario | Recorded observation |
|---|---|
| Responsive overview/editor/print | No horizontal overflow at 390x844, 430x932 and 1440x900; interactive targets at least 44px at 390 and 430; 20-child overview about 4.5 phone screens at 390 |
| Draft/review workflow | Open child, draft all four using mock, mark reviewed and go to next child; saved to localStorage and navigated; humanised status/filter labels checked |
| Provider controls | Offline mock default, GPT Demo Gateway, OpenAI test key, Gemini test key; disclosure and connection status visible |
| Disposable-key handling | Password field, autocomplete off, disposable-key/not-stored/not-production warning; fake key absent from localStorage, sessionStorage and URL |
| Provider failure | Fake OpenAI key produced sanitized “AI request failed ... No narratives were changed.”; narratives unchanged, no mock label, no key displayed |

### PDF

Headless Google Chrome printed `http://localhost:4175/class.html#/print/C-01?sem=2026-S1`.

| Check | Recorded result |
|---|---|
| Child PDF | 2 A4 pages, 594.96 x 841.92 pt |
| Chinese glyphs | Embedded PingFang SC Regular and Semibold; Simplified Chinese child name, comment and narrative rendered correctly |
| Labels and focus | Narrative labelled “MOCK DRAFT (offline, not AI)”; no focus outline in print |
| Class PDF | 40 pages for 20 children, two pages each |

This sample does not guarantee fixed pagination for edited content. Glyph coverage depends on installed CJK fonts; Linux/CI without them was not tested.

### Live Gateway

Public demo-session Node harness used the project's own `buildNarrativePrompt -> requestProviderText -> parse -> grounding` path with fictional children C-01 through C-08 for 2026-S2.

| Check | Recorded result |
|---|---|
| Session | `POST /demo/session`: HTTP 201; keys `token`, `token_type`, `expires_in` (900), `expires_at`, `model` (`demo-auto`); no credential value reproduced |
| CORS | Allowed the configured GitHub Pages origin; did not allow `http://localhost:4175`. Browser Gateway drafting could not be tested before deployment |
| Latency | About 2-5 seconds per child, four domains per request |
| Final sample | 8 children x 4 domains: 30 of 32 accepted; 2 visible retryable conservative rejections (capitalised-word and number-word); 0 gendered pronouns in accepted drafts |

The initial run exposed false rejection of Chinese drafts repeating picture-card evidence, invented gender, English rating words in Chinese, and whole-response loss after a domain rejection. The evidence records fixes in `e5e7ae0`/`a7bf0ff` and subsequent prompt/Chinese refinements. The final run is a single non-deterministic sample, not a quality benchmark or deployed-browser proof.

### Not tested

- Real-browser service-worker offline reload: registration failed in the built-in browser, including the original page; Node-level worker tests passed.
- Browser Gateway drafting from the deployed GitHub Pages origin.
- Real phone/tablet hardware, screen readers, Safari/Firefox, Windows/Linux CJK fonts and print-to-PDF on other operating systems.
- Live OpenAI/Gemini calls with real disposable test keys.
- Teacher time saved, edit rate or draft quality; the school's hypothetical hours-per-portfolio baseline is unverified.

### Deployment check

Pending: to be filled after the GitHub Pages deployment is verified.

## Known limitations

- Grounding heuristics can falsely reject faithful text and miss unsupported claims; they are not semantic proof. Exact-name and language prompt requirements are not guarantees. Teacher review is mandatory.
- Model output is non-deterministic. The Gateway sample is not a quality benchmark; availability and quota are external.
- Browser Print/Save as PDF depends on local fonts and content length. The macOS sample is not cross-platform font or pagination proof.
- `localStorage` is per-browser/origin, quota-limited, not secure or shared storage, and not a backup. Clearing browser data loses records; no cross-device sync exists.
- No real login, authenticated approval or tenant isolation exists. Local “reviewed” state is not finalisation.
- Offline reload, deployed-origin Gateway drafting and other untested surfaces remain outside measured acceptance.
- Production SQL, finalisation, retention, private hosting and provider contracts are designs only. No compliance or measured efficiency benefit is claimed.

## Appendix: detailed design

### Narrative prompting and review

Implemented drafting uses structured first name, ratings, comments and available previous ratings, not photos or unrelated records. Strict JSON shape validation precedes heuristic grounding. Accepted domains can be saved independently; rejected domains retain existing text and show retry/manual-edit guidance. Malformed responses and transport failures change no narratives and never silently substitute mock output. Sequential bulk drafting counts fully accepted children, reports domains needing attention and stops on request errors.

Offline mock is an explicit, labelled local generator, not AI. Its Chinese template uses localized ratings and preserves the supplied comment; arbitrary user-entered English comments are not translated. The seed uses Simplified Chinese observations where that domain is populated.

**Production proposal, NOT IMPLEMENTED:** add school-approved house-style exemplars for tone and paragraph structure only, never as evidence about the current child. Delimit comments and exemplars as untrusted data. Use server-side validation and preserve original AI versions alongside teacher revisions. Evaluate factual corrections and observed teacher time alongside a defined, versioned edit-rate metric; low edit rate does not prove correctness. No edit-rate, quality or time-saving measurement is available.

### Proposed PostgreSQL schema

This is a design, not an applied migration or working tenant isolation. UUIDs come from the trusted service; `tenant_id` is the school/operator boundary. Production migrations must install reviewed RLS policies and authenticated tenant context.

```sql
CREATE TABLE children (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL,
  display_name text NOT NULL,
  PRIMARY KEY (tenant_id, id)
);
CREATE TABLE classes (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL,
  label text NOT NULL,
  PRIMARY KEY (tenant_id, id)
);
CREATE TABLE class_enrolments (
  tenant_id uuid NOT NULL,
  child_id uuid NOT NULL,
  class_id uuid NOT NULL,
  starts_on date NOT NULL,
  ends_on date,
  PRIMARY KEY (tenant_id, child_id, class_id, starts_on),
  FOREIGN KEY (tenant_id, child_id) REFERENCES children (tenant_id, id),
  FOREIGN KEY (tenant_id, class_id) REFERENCES classes (tenant_id, id),
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);
CREATE TABLE portfolio_periods (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL,
  year integer NOT NULL CHECK (year BETWEEN 1000 AND 9999),
  half smallint NOT NULL CHECK (half IN (1, 2)),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, year, half),
  CHECK (starts_on = make_date(year, CASE half WHEN 1 THEN 1 ELSE 7 END, 1)),
  CHECK (ends_on = CASE half WHEN 1 THEN make_date(year, 6, 30)
                            ELSE make_date(year, 12, 31) END)
);
CREATE TABLE portfolio_records (
  tenant_id uuid NOT NULL,
  id uuid PRIMARY KEY,
  child_id uuid NOT NULL,
  period_id uuid NOT NULL,
  reviewed_by uuid,
  finalised_at timestamptz,
  UNIQUE (tenant_id, id),
  UNIQUE (child_id, period_id),
  FOREIGN KEY (tenant_id, child_id) REFERENCES children (tenant_id, id),
  FOREIGN KEY (tenant_id, period_id) REFERENCES portfolio_periods (tenant_id, id)
);
CREATE TABLE domain_codes (
  code text PRIMARY KEY,
  label text NOT NULL
);
INSERT INTO domain_codes VALUES
  ('english', 'English'), ('chinese', 'Chinese'),
  ('mathematics', 'Mathematics'),
  ('social-emotional', 'Social-Emotional Development');
CREATE TABLE domain_entries (
  tenant_id uuid NOT NULL,
  record_id uuid NOT NULL,
  domain_code text NOT NULL REFERENCES domain_codes (code),
  rating smallint CHECK (rating BETWEEN 1 AND 4),
  comment text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 1000),
  PRIMARY KEY (tenant_id, record_id, domain_code),
  FOREIGN KEY (tenant_id, record_id) REFERENCES portfolio_records (tenant_id, id)
);
CREATE TABLE photos (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL,
  record_id uuid NOT NULL,
  domain_code text NOT NULL,
  slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 6),
  object_key text NOT NULL,
  alt text NOT NULL CHECK (btrim(alt) <> ''),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, record_id, domain_code, slot),
  FOREIGN KEY (tenant_id, record_id, domain_code)
    REFERENCES domain_entries (tenant_id, record_id, domain_code)
);
CREATE TABLE narratives (
  tenant_id uuid NOT NULL,
  record_id uuid NOT NULL,
  domain_code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 2000),
  source text NOT NULL CHECK (source IN ('mock', 'ai', 'teacher')),
  model text,
  prompt_hash text,
  edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, record_id, domain_code, version),
  FOREIGN KEY (tenant_id, record_id, domain_code)
    REFERENCES domain_entries (tenant_id, record_id, domain_code)
);
```

Production must create all four domain rows transactionally, verify enrolment during each authorized write, and bind reviewer/editor IDs to authenticated identities. The SQL does not implement those checks. Narrative history is append-only: the runtime role would have INSERT/SELECT, not UPDATE/DELETE; a privileged retention process is separate. Allocate versions under a transaction/record lock to avoid concurrent version collisions. Preserve original AI versions when appending teacher revisions; `model` and `prompt_hash` may be null for teacher-only or mock entries, never fabricated for a local import.

### S1-in-S2 query (same year)

```sql
SELECT c.domain_code, p.rating AS s1_rating, c.rating AS s2_rating,
       c.rating - p.rating AS rating_change
FROM portfolio_records r2
JOIN portfolio_periods s2
  ON s2.tenant_id = r2.tenant_id AND s2.id = r2.period_id AND s2.half = 2
JOIN domain_entries c
  ON c.tenant_id = r2.tenant_id AND c.record_id = r2.id
LEFT JOIN portfolio_periods s1
  ON s1.tenant_id = s2.tenant_id AND s1.year = s2.year AND s1.half = 1
LEFT JOIN portfolio_records r1
  ON r1.tenant_id = r2.tenant_id AND r1.child_id = r2.child_id
 AND r1.period_id = s1.id
LEFT JOIN domain_entries p
  ON p.tenant_id = r1.tenant_id AND p.record_id = r1.id
 AND p.domain_code = c.domain_code
WHERE r2.tenant_id = $1 AND r2.child_id = $2 AND s2.year = $3;
```

Missing S1 data yields null comparison, not zero progress. Parameters come from authenticated scope and validated input, not unchecked browser tenant IDs. RLS and assignment authorization remain required beyond these tenant-qualified joins.

### Finalisation, amendments and retention

`finalised_at` is the proposed lock marker, not a lock by itself. A production transaction would validate completeness, approvals and current version, then finalise. Database triggers and privileges must reject changes to finalised records and their domain entries, photos and narratives, including attempts to clear the marker. Finalised reports retain their exact content/version references. An amendment requires an authorized request, reason, reviewer and a separately versioned amendment artifact linked to the original; never overwrite the original report. Amendment tables and enforcement are not supplied or implemented here. Prototype “reviewed” is editable local state, not production finalisation.

The school and DPO must approve purpose-specific retention periods before real use; no legal retention duration is assumed. Scheduled deletion must cover records, objects, derived AI content, signed-link access and eventual backup expiry, subject to documented legal holds. Maintain access/correction and deletion procedures with audited privileged actions.

### Mapping the prototype JSON

- `childId` maps through an import ID map to `children.id`; `semester` such as `2026-S2` maps to `portfolio_periods(year, half)`; each record becomes one child-period portfolio.
- `domains[domain_code]` becomes `domain_entries`; rating null remains null, not Emerging. Photo `{id, src, alt}` becomes a private object plus a `photos` row after safe decoding and validation; data URIs do not become public URLs.
- `narratives[domain_code]` has `{text, source, edited}` and optional AI `{provider, model}`; preserve supplied provenance when importing an initial version. Local edits retain original `mock`/`ai` source with `edited: true`; teacher-created narratives use `teacher`. “EDITED BY TEACHER” is not authenticated authorship. Do not invent absent editor/model/prompt provenance.
- `status` is derived from input/narrative completeness and `reviewed`. Neither establishes authenticated approval. The envelope `savedAt` is a local save timestamp, not a per-narrative creation time or audit trail.

`portfolio-store.js` uses key `ai-preschool-portfolios-v2` and envelope `{version: 2, savedAt, records}`. Load/import validates structure, domains, bounds, dates and duplicate child-semester identities. Import replaces rather than merges and stamps a new save time. Unsupported versions are rejected: **there is no automatic v1-to-v2 migration**. Future migrations should preserve an export, validate the old schema, transform explicitly, validate the new schema and commit only after successful persistence. Quota/storage failures are surfaced; the store commits its new in-memory snapshot only after storage succeeds, though unsaved UI edits can still exist. The class app seeds fictional records when its loaded list is empty; a load error is not data recovery. Export and preserve any damaged source before attempting migration. Browser storage is neither backup nor secure storage.

### Hosting and security detail

**Production proposal, NOT IMPLEMENTED:** host the API, PostgreSQL and S3-compatible private storage in Singapore. Regional proximity supports latency and the school's expected data-residency controls; it does not itself establish PDPA compliance. Verify exact services, inference locations, subprocessors, support access and cross-border transfers with the DPO and contracts. See [the compliance checklist](16-singapore-compliance.md); this is not legal advice.

- **Network:** only the application load balancer is public; API workers and database occupy private subnets. Serve the private application's frontend through that controlled entry point. Security groups/firewalls permit only required load-balancer-to-API and API-to-database traffic, with restricted outbound destinations. No direct public database access. Use bastion-less administration through SSM with identity controls and logged sessions, not public SSH.
- **Transport and storage:** TLS at ingress and between services; verify certificates. Encrypt database, objects and backups at rest using managed KMS keys with least-privilege grants and rotation policies. Private buckets deny public access; issue short-lived signed URLs only after record-level authorization. URLs are bearer capabilities, not a substitute for access checks.
- **Secrets and IAM:** use a managed secrets store for provider/database credentials; never bundle secrets into static assets. Use workload identities, narrowly scoped roles, separate environments and restricted administrative grants. Rotate and revoke credentials through a documented process.
- **Recovery:** point-in-time recovery for PostgreSQL, versioned protected object backups and an off-site copy at an independent approved location within Singapore. Regularly test restores, including photo/report references; define and measure recovery objectives before launch. No recovery times or backup success are claimed here.
- **Operations:** monitor availability, failed authorization, quota/cost anomalies, failed jobs and backup/restore results. Redact tokens, signed URLs, raw comments and photos from operational logs. Maintain a separate restricted audit log of actors, scope, decisions and versions. Review dependencies and advisories, pin versions, patch regularly and test migrations/rollback before promotion.
- **AI controls:** do not send student IDs, surnames, photos or unrelated records to third-party AI. The implemented prototype reduces input to first name, ratings and comments, including available previous ratings; a first name is still personal data, not anonymization, and comments can leak identifiers. Production should prefer a neutral placeholder and screen/minimize comments. Obtain a DPA and explicit no-training/retention terms before using any provider with real data. Treat comments as data to defend against prompt injection; schema and grounding validation plus human review remain mandatory. Evaluate in-region managed model hosting, verifying processing and logging rather than assuming compliance from the cloud brand.
- **Child photos:** real photos are forbidden in this public demo. A private production service would require a lawful collection purpose and permissions, private encrypted storage, ownership checks, restricted type/size validation, metadata stripping, malware checks, scoped previews and retention deletion. No face recognition is proposed. Local browser downsizing alone does not implement these production controls.
- **Incident response:** maintain an accountable incident lead/DPO escalation path; contain access, revoke tokens/links, preserve scoped evidence, assess affected children and disclosure duties, notify within applicable requirements, restore safely and record corrective actions. Exercise the process before a real pilot.

The prototype deliberately does **NOT IMPLEMENT** real login, roles or tenant isolation; an application server, database or object storage; server-side PDF; vector RAG; audit log; or production AI hosting. Public Demo Gateway availability is external and is not a production school service. No security certification, production approval or lawful real-data processing is claimed. Earlier memory-only statements in [security documentation](07-security-privacy.md) and [the PWA standard](25-pwa-standard.md) concern the original demo: class records instead persist in browser `localStorage`, while disposable test keys must never be persisted.

### Future features detail (proposed priorities)

All items are proposals, not shipped features or measured benefits.

1. **Class-wide quick-entry grid:** rate/comment across children without repeatedly opening editors; preserve explicit missing-input states and save feedback.
2. **Voice-to-comment with teacher review:** opt-in capture, transcription correction and a deliberate save step; complete privacy review before any real recordings.
3. **Template/curriculum mapping per age band:** school-approved, versioned mappings and house style; do not infer attainment from age alone.
4. **Photo tagging without face recognition:** teacher-controlled activity/domain tags; no identity inference or biometric matching.
5. **Edit-rate and time-saved metrics dashboard:** define baselines and measurement methods; separate factual corrections from stylistic edits and avoid teacher-surveillance claims.
6. **Parent-facing release with principal sign-off:** authenticated guardian relationships, explicit release versions, revocation and authorized access only.
7. **Comparison across semesters:** extend the existing same-year S1-in-S2 rating display to longitudinal evidence and reviewed narrative comparison without turning rating differences into diagnoses.
8. **Bilingual (EN/ZH) narrative option:** reviewed parallel text, language-specific grounding and terminology; current Chinese-domain templates are not general bilingual support.
9. **Offline-first sync:** authenticated server synchronization, conflict resolution, encryption/key lifecycle and deletion propagation; local autosave alone is not sync.
10. **Accessibility audit:** keyboard/screen-reader, contrast, zoom, touch and print review with remediation; no conformance claim before the audit.
11. **Export to school systems:** school-approved schemas, minimal authorized fields, versioned contracts and export audit records.
