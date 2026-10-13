# Agent Engineering Contract

- Mission: maintain a company-neutral **AI Preschool Studio** static demo and its clearly labelled design documents.
- Never insert any company or school name into source, sample identity records or assets. `organizationName` defaults to empty; use neutral `AI Preschool Studio` as public product name.
- Use English for code, comments, tests and application UI. `docs/18-zh-quickstart.md` is an intentional Chinese user aid.
- Public repo must contain **fictional learning records only**. Never introduce actual children, parents, staff, classroom voice, photos or workplace documents.
- Do not hardcode tokens, API keys or provider credentials. Never replace temporary public Demo Sessions with a baked-in private Gateway key.
- BYOK OpenAI/Gemini is disposable-test-key mode only; no storage, no claim of browser secrecy or production suitability.
- Keep production authentication, tenant RLS, vector RAG, classroom tracking and inter-school transfer explicitly **NOT IMPLEMENTED** unless independently built and verified in a separate private service.
- Validate schema and evidence IDs. Never substitute mock content when an AI provider call fails without visible user selection and labeling.
- Run `npm run check` and `npm test`; record actual browser QA and Gateway status separately rather than claiming success without proof.
- Preserve existing Git history; use a branch; avoid unrelated edits. Do not push, merge, set production Gateway configs, or deploy without explicit approval.
- Before PR/ZIP verify neutral branding, synthetic data, no credentials, GitHub Pages path portability and print/PDF disclaimer.
