# 28 — Browser privacy masking for narrative drafts

This is a fictional-data public demonstration, not legal advice or a certification.
Pseudonymised text is **not anonymous**: a teacher who retains the underlying records
can still associate a draft with a child. Do not enter real children's data.

## LAW — statutory obligations, not a masking specification

The PDPA's personal-data definition includes identification using other information
an organisation has or is likely to access. Relevant obligations include consent
(section 13), reasonable purposes (18), notification (20), protection (24), retention
limitation (25), and overseas transfers (26). These obligations do not prescribe this
implementation's placeholder vocabulary, regexes, or browser architecture.

The research briefing obtained section references from PDPC publications; the statute
and the Personal Data Protection Regulations 2021 could not be independently retrieved
from Singapore Statutes Online. Treat this as a source limitation, not an independent
legal opinion. Whether a particular operator is covered, its legal basis for processing,
parent notices, contracts and transfer arrangements require deployment-specific review.

Sources: [Selected Topics, chapter 3](https://www.pdpc.gov.sg/-/media/Files/PDPC/PDF-Files/Advisory-Guidelines/AG-on-Selected-Topics/Advisory-Guidelines-on-the-PDPA-for-Selected-Topics-4-Oct-2021.pdf),
[Children's Personal Data in the Digital Environment](https://www.pdpc.gov.sg/-/media/files/pdpc/pdf-files/advisory-guidelines/advisory-guidelines-on-the-pdpa-for-children's-personal-data-in-the-digital-environment_mar24.pdf),
and [Key Concepts, chapter 19](https://www.pdpc.gov.sg/-/media/files/pdpc/pdf-files/advisory-guidelines/ag-on-key-concepts/advisory-guidelines-on-key-concepts-in-the-pdpa-17-may-2022.pdf).
The Key Concepts filename is historical; the briefing reports a revised 29 April 2026 footer.

## GUIDANCE — regulator recommendations and interpretation

- **PDPC children's guidance:** children's data generally merits a higher standard of
  protection; minimise data, provide understandable notices and consider a DPIA.
  Its under-13 consent guidance points to parent/guardian consent for real use.
- **PDPC generative-AI guidance:** the system deployer has primary responsibility for
  its use case, should limit input data and safeguard prompts and outputs, educate
  users, and consider scanning prompts for common personal identifiers.
- **PDPC anonymisation guidance:** reversibility and a serious possibility of
  re-identification matter. Replacing a name does not establish anonymisation.
- **IMDA transparency guidance:** the voluntary chatbot information-card approach
  covers collected data, retention, third-party sharing, training use and controls.
  The briefing read the PDF but obtained its publication date only from a secondary source.

Sources: [PDPC GenAI guidance page](https://www.pdpc.gov.sg/organisations/regulations-decisions/regulatory-guidance/advisory-guidelines-on-use-of-personal-data-in-generative-ai),
[GenAI guidance PDF, 20 July 2026](https://files.app.optical.gov.sg/pdpc/production/assets/143cb9d4-532e-4cca-9a77-bcc0415ca294.pdf),
[IMDA Transparency Guidelines for Generative AI Chatbots](https://www.imda.gov.sg/-/media/imda/file/emerging-technologies-and-research/artificial-intelligence/transparency-guidelines-for-generative-ai-chatbots.pdf),
and the children's and Selected Topics publications linked above.

## ENGINEERING — this demo's implementation choices

### Actual input and transport paths

`ctx.narrativeInput(child, record)` derives four-domain evidence using
`narrativeInputFor`, then supplies local identity metadata from the selected child,
all available child and portfolio records, sample class and teacher, configured
organisation name, and all children's derived first-name variants. Nested known
names/aliases/guardians are masking context, **not model evidence**.

Remote drafting flows through `generateNarrativesWithProvider` in `src/narrative.js`.
A request-local `createPrivacyMask` closure reduces evidence to masked first name,
comments and learning fields; the prompt builder selects the four domain fields.
`src/providers.js` wraps that text for Gateway/OpenAI Responses input or Gemini text
parts. Provider credentials and routing/model configuration are transport metadata,
not part of the displayed model prompt. Gateway session creation uses the configured
project identifier and sends no child record.

The studio's Offline mock branch applies the same masker before the local template
helper, checks the masked result, then restores the selected child's name locally.
It makes no provider request and remains visibly labelled as simulated, not AI.
A failed remote request does not silently switch to mock.

### Masking, restoration and visible failure

- Known display/first names, other available variants, initials, IDs, class, teacher,
  organisation and guardian metadata form a request-local dictionary. Pattern scanning
  additionally handles common contact, identity-number, date, address, URL and file tokens.
- Comments are scanned as data, not instructions. Recognised sensitive categories
  can block a draft rather than being forwarded. Dictionary/pattern scanning is bounded:
  it cannot reliably infer every unknown name, rare family detail or indirect identifier.
- Photos, pixel data, photo metadata and avatars are not model evidence. Metadata
  supplied to the masker stays local and is omitted from the minimal outgoing input.
- The reverse map is a closure used for one request, disposed in `finally`, never
  written to browser storage, logs, exports, URLs or a provider request. Other people's
  identifiers remain masked; this is not a general-purpose unmask-all operation.
- Remote outputs are checked against masked evidence, restored locally, then checked
  against the original evidence before acceptance. Existing name/pronoun/quantity/photo
  and Simplified Chinese guards remain in use. The offline helper retains its existing
  template behavior rather than acquiring new model-grounding restrictions.
- Masking/validation failures are visible and do not update narratives or trigger an
  automatic mock fallback. Preview errors never echo the original input.

### Honest disclosure

The class provider card, child editor, draft queue and AI provider settings share the
exported `privacyNotice`. The class card keeps its notice within “What is sent?” to
preserve mobile roster access; selecting an external provider opens it automatically.
The notice says this is a demo, masked text goes to an external AI service, photos are
never sent, gateway retention/training are unverified, and real children's data must
not be entered. The masked prompt is pseudonymised, not anonymous. Offline mode
separately states that no model request is sent.

“What is sent?” calls the same `buildNarrativePrompt(childInput)` used for remote
requests, rather than showing a manually assembled evidence summary. The editor is
bound to its child; other views allow local child selection. Changes to evidence
refresh the preview. All four domains are included even for a one-domain retry;
class batch drafting makes separate child requests. Settings also show the shared
exact connection-probe prompt for direct providers; Gateway probes only create a session.

The preview covers the exact **model text**, not the credential-bearing HTTP envelope.
It does not certify that residual text cannot identify someone.

### Storage and deployment limitations

Existing fictional portfolio records and restored narrative text are still saved by
the studio's existing browser-local portfolio store. This change does **not** convert
that store into an ephemeral or encrypted store, remove existing exports, or imply
secure browser key custody. Only the request-local reverse map is strictly ephemeral.
Do not use this demo as a real child-record system.

Gateway request/response logging, retention, training policy, upstream provider selection,
processing countries and enforceable transfer arrangements are **not verified**. An
OpenAI request's `store: false` field is not evidence about gateway or all provider
retention/training policies. No completed DPIA, signed DPA, parent-consent workflow,
production authentication, incident response service or regulatory certification is claimed.
Education-sector guidance content and applicable licensing/circular requirements were
not verified by the supplied research. A real deployment needs independent legal,
security and operational assessment, not just this masking mechanism.

For breach-response obligations and preparation, see the
[PDPC breach guide](https://www.pdpc.gov.sg/-/media/files/pdpc/pdf-files/other-guides/guide-on-managing-and-notifying-data-breaches-under-the-pdpa-15-mar-2021.pdf).
The guide is a source, not an incident workflow implemented by this demo.

## Verification scope

Automated coverage accompanies the masker, provider/narrative boundary and studio UI:
seeded and multilingual identities, restoration, residual-data rejection, excluded
images/metadata, exact preview-to-request text, offline masking and visible failure.
Tests are engineering regression checks, not proof of anonymisation or legal compliance.
Main-agent gate results belong in the task handoff/changelog; this document does not
claim unperformed live-provider, browser, physical-device or legal verification.
