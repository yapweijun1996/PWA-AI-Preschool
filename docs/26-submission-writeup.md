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

### Architecture and design SSOT

`class.html` mounts `src/studio/app.js`. `src/studio/` separates the hash router, context,
shell, UI helpers, `pages/` and pure `models/`, reusing the portfolio, provider and report
modules. `studio.css` supplies layouts; `src/studio/tokens.css` copies `design/tokens.css`.
The obsolete `src/class-app.js` and `class.css` were removed; `index.html` is unchanged.

The [design SSOT](../design/README.md) includes 12 page specs, 24 WebP wireframes generated
with Codex CLI image generation, shared tokens and a consistency review. Images express visual
intent; specs own exact copy and behavior; tokens own enforceable values. To change a page,
edit its spec, regenerate its image, update shared tokens when needed and synchronize the
runtime token copy before implementing the page.

The design index still describes target routes as unimplemented, names the retired
`src/class-app.js`, and calls the wireframes PNGs despite linking WebP files. Those historical
statements do not describe the current studio. Design files were left unchanged in this stage.

### What to try (3 minutes)

Open the [live studio](https://yapweijun1996.github.io/PWA-AI-Preschool/class.html).
Suggested walkthrough, not a measured duration:

1. Start on Home, inspect needing-work rows, then open Class portfolios and switch semesters.
2. Open a child, choose Offline mock, Draft all four, edit a narrative and Mark reviewed.
   Continue to the next child, then reload to inspect persisted progress.
3. Explore Students and a profile, filter Evidence library, and inspect the AI drafts queue.
4. In Reports choose a child/semester, open print preview and explicitly Print / Save as PDF.
5. Inspect AI provider settings and About and privacy. Use only disposable test keys and
   fictional data; memory-only keys are not secure browser custody.

| Page | Route |
|---|---|
| Home | `#/` |
| Class portfolios | `#/classes` |
| Child editor, domain tabs and Review narratives | `#/classes/class-a/children/<id>?sem=<semester>` |
| Students / profile | `#/students`, `#/students/<id>` |
| Evidence library | `#/evidence` |
| AI drafts | `#/drafts` |
| Reports | `#/reports` |
| Child / class print | `#/print/<id>?sem=<semester>`, `#/print-class?sem=<semester>` |
| AI provider settings | `#/settings/ai` |
| About and privacy | `#/about` |

Legacy `#/child/<id>?sem=...` redirects to the editor. Unknown hashes show Home with a notice.
The desktop icon sidebar follows the canonical module order; the topbar includes breadcrumbs,
semester, provider, fictional-data and offline chips. An amber notice strip persists.
Mobile uses a chip row and five fixed bottom tabs; print routes hide app navigation.

| Built vs designed-only | Status |
|---|---|
| Routed studio, shared shell, local autosave, semester comparison, evidence filters, drafts, review and child/class print | Built; verification scope below |
| Login, roles, tenant RLS, application server, database/private object storage | NOT IMPLEMENTED |
| Finalisation lock, server PDF, vector RAG, audit log, production AI hosting/contracts | NOT IMPLEMENTED |
| Classroom tracking and inter-school transfer | NOT IMPLEMENTED |

## Verification evidence

Deployment, browser, Gateway and build observations below were supplied for 2026-10-17.
`npm run check` and `npm test` were rerun for this documentation update; both passed.

### Commands and counts

Current check/test results and supplied pre-merge build evidence:

| Command | Current result |
|---|---|
| `npm run check` | Passed, including syntax and static CSP checks |
| `npm test` | 177 tests passed; 0 failed, cancelled, skipped or todo |
| `npm run build` (supplied pre-merge result) | Passed; build ID `310aad36f9f29889`; 56 precached routes |
| Deployed merge commit on `main` | `0c30b26` (`feat: page-per-module studio with design SSOT`) |

### Browser QA

Owner-supplied built-in browser QA, served from `dist`, light scheme:

| Scenario | Recorded observation |
|---|---|
| Every route at 1440×900, 430×932 and 390×844 | One h1, focus moved to h1, no horizontal overflow, interactive targets at least 44 px |
| Navigation | Sidebar icons and canonical order; five-icon mobile tab bar fixed to bottom and hidden on print routes |
| Home | Height reduced from 9,273 px to 1,162 px; three needing-work rows |
| Draft/edit/review | Offline mock Draft all four; editing marked narrative edited; Mark reviewed persisted to localStorage and moved to next child |
| Reload | Saved data retained; Home showed “1 / 20 reviewed” |
| Key handling | Empty field with “Paste a disposable test key”, autocomplete off; fake key absent from localStorage, sessionStorage, URL and page |
| Failed provider request | Fake OpenAI key produced sanitized “AI request failed ... No narratives were changed.”; narratives unchanged, no mock label |
| Route recovery | Legacy redirect and unknown-hash Home notice verified |

Supplied final-build mobile measurements at 390 px width:

| Route | Before compact-card fix | Final build |
|---|---|---|
| `#/classes` | 8,656 px | 4,884 px |
| `#/students` | 8,750 px | 4,358 px |
| `#/evidence` | 8,695 px | 5,241 px |

Independent pre-merge QA also verified page-scoped error banners with a Dismiss button.

### PDF

Owner-supplied headless Chrome result for `#/print/C-01?sem=2026-S1`: two A4 pages,
embedded PingFang SC, correct Simplified Chinese comment and narrative, no printed app chrome.
No current class-PDF page count is claimed. Pagination depends on content and installed fonts.

### Live Gateway

Supplied deployed-origin browser sample: GPT Demo Gateway, fictional child C-02, semester
2026-S2, “Draft all four” accepted Chinese, Mathematics and Social-Emotional Development
with provenance `ai / gateway / demo-auto`. Each accepted tab showed
“AI DRAFT (GPT Demo Gateway) - teacher must review”. Grounding checks rejected English,
which appeared under “Rejected drafts” on the AI drafts page.
This is one non-deterministic sample, not a quality benchmark. Localhost is blocked by
Gateway CORS; the deployed-origin result does not establish localhost support.

### Not tested

- Service-worker offline reload with the network disabled. Registration and cache population
  WERE verified on the deployed origin; a true offline reload was not.
- Real phone/tablet hardware, screen readers, Safari/Firefox and Windows/Linux CJK fonts.
- OpenAI/Gemini calls with real disposable test keys.
- Teacher time saved, edit rate or draft quality.

### Deployment check

Supplied verification for 2026-10-17; not rerun during this documentation update:

| Check | Verified result |
|---|---|
| Live demo | https://yapweijun1996.github.io/PWA-AI-Preschool/class.html |
| Repository | https://github.com/yapweijun1996/PWA-AI-Preschool |
| Release | Merge `0c30b26` on `main`; previous stable release / rollback commit `108c80f` |
| GitHub Actions | Run `39002277394`, “Static checks and Pages deployment”: “Check, test, and build” and “Deploy GitHub Pages” both succeeded |
| HTTP | `class.html`, `src/studio/app.js`, `src/studio/router.js`, `studio.css`, `src/studio/tokens.css` and `sw.js` returned 200 |
| Build identity | Deployed `build-info.json`: `0c30b2667ac4-310aad36f9f29889`; source snapshot `310aad36f9f29889...` matched the verified local build |
| Browser routes | After clearing old worker/caches and a real reload, all 14 checks loaded: Home, classes, editor, students, profile, evidence, drafts, reports, child print, class print, AI settings, about, legacy child redirect and unknown-hash Home fallback; exactly one h1 and no horizontal overflow each |
| Service worker/cache | Active scope `https://yapweijun1996.github.io/PWA-AI-Preschool/`; 56 cached entries including `src/studio/app.js`; network-disabled reload not tested |
| Gateway drafting | Deployed-origin C-02 / 2026-S2 sample accepted 3 of 4 domains; English visibly rejected by grounding checks; not a quality benchmark |

## Known limitations

- Grounding heuristics can reject faithful text or miss unsupported claims; teacher review is
  mandatory. Model output is non-deterministic; no quality benchmark is claimed.
- Browser Print/Save as PDF depends on local fonts and content length; the macOS sample is
  not cross-platform pagination or font proof.
- `localStorage` is browser/origin-specific, quota-limited, not secure storage and not a backup.
  Clearing it loses records; no cross-device sync exists. Keys remain in memory only.
- Local review is editable state, not authenticated approval or finalisation.
- True network-disabled offline reload remains unverified; deployed Gateway drafting was
  exercised only in the single sample described above.
- Production SQL, private hosting, retention and provider contracts are designs only.
  No compliance or measured efficiency benefit is claimed.

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
