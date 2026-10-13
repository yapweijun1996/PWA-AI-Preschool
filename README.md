# AI Preschool Studio — White-label Browser Demo

**Status:** implemented static MVP / concept demonstration. **Audience:** education product teams, prospective operators, engineers and reviewers. **No school affiliation is asserted.**

A browser-first, GitHub Pages–ready demonstration of evidence-grounded preschool learning portfolios. Visitors can try the default public GPT Demo Gateway (if configured and live), use a temporary **BYOK** OpenAI or Gemini test key, or choose **Offline Mock**. The UI uses **five fictional students** and synthetic observations across an illustrative **18-month** period.

> **Hard restriction:** This public project is **not** a school records platform. Never input real child identities, images, audio, observations, staff records or company-only documents. Teacher access is simulated client-side. The app does not provide production authentication, tenant isolation or a compliant data-processing service.

## Quick start

```bash
# Node is needed for tests, not for running the static app.
python3 -m http.server 4173
# Open http://localhost:4173

npm run check
npm test
```

Open **AI provider settings**, select **Offline Mock Demo** for an entirely offline walkthrough, or try GPT Demo Gateway. To test OpenAI/Gemini BYOK, only use a disposable restricted key and fictional data; browsers may reject cross-origin provider requests. Keys live in JavaScript page memory only — **this is not equivalent to secure client-side key custody**.

## Features in the current build

| Feature | Actual status |
|---|---|
| Synthetic student records and 18-month evidence | Implemented |
| Teacher/student selection | UI simulation only (NOT authorization) |
| In-session observations | Implemented; cleared on refresh |
| Evidence-based portfolio draft and evidence IDs | Implemented (AI output requires review) |
| GPT Demo Gateway integration | Client adapter implemented; current remote availability unverified |
| OpenAI / Gemini temporary BYOK | Client adapters implemented; CORS/provider limits possible |
| Offline deterministic mock | Implemented; visibly labelled |
| Review, manual signoff and edit-distance estimate | Implemented; demo-only metric |
| Portfolio PDF | Browser Print → Save as PDF |
| Real RAG/vector DB, school tenancy, staff auth | **Not implemented** |
| Classroom voice/face recognition, parent messaging, scheduling | **Not implemented** |

## White-label branding

Edit **`src/config.js`**. `organizationName` defaults to an empty string; `productName` defaults to `AI Preschool Studio`. Change the portfolio title, illustrative benchmark, or demo gateway configuration without rewriting application logic. Do not place secrets or personal data in this public module.

## GitHub Pages

1. Create a repository with any neutral name; upload the **contents of this folder** to its root.
2. Go to **Settings → Pages → Deploy from a branch → `main` → `/ (root)`**.
3. Visit `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY/` only after Pages reports success.
4. Test from that real origin. The demo gateway may permit only previously configured CORS origins/project identities. Update its server-side allowlist/quotas before handing out a public URL. **Do not disable authentication or use an unrestricted key to make it work.**

Documentation: [`docs/README.md`](docs/README.md), including PRD, architecture, governance, provider protocols, security, deployment, acceptance tests, and a ready-to-paste coding-agent task. `AGENTS.md` describes project-safe engineering boundaries.

## Caveats and attribution

The **~6h per portfolio** and **<10% editing target** on the sample UI are *illustrative, unverified planning figures*, not verified customer facts, productivity savings or promises. A measure of edited words is not a substitute for teacher time-on-task or correctness evaluation. The sample profiles are fictional. The deployed demo link does not exist merely because this ZIP exists; deployment is a separate action. License: MIT; see `LICENSE`.
