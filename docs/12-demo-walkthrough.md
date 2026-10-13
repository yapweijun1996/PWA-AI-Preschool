# 12 — Five-minute Demo Script and FAQ

## Demo preparation

Run in a modern browser with sample app open, mock provider tested and no real secrets/records visible. If Gateway is confirmed live, keep it as default but prepare Offline Mock for network problems. Operator branding should be blank, so the same demo suits any education operator.

## Walkthrough

**0:00–0:30 — Pain and concept**: "Educators often spend time gathering learning observations and formatting individual portfolios. This prototype illustrates evidence-backed drafting to reduce that work."

**0:30–1:30 — Records**: Choose one fictional student; inspect learning domains, chronology and evidence IDs. Explain that all names and records are invented.

**1:30–2:40 — AI generation**: Show Provider Settings; default uses short-lived Demo Gateway sessions, or switch to Offline Mock. Click Generate. Highlight the generated narrative and source IDs. Avoid claiming every sentence is independently verified.

**2:40–3:45 — Educator control**: Edit one paragraph, review the % metric as a lexical proxy, and mark approval. Explain drafts are not released to parents automatically.

**3:45–4:30 — Output**: Print/Save as PDF; show clear fictional/demo disclaimer.

**4:30–5:00 — Future vision**: Controlled organization templates, real evidence governance and staff authentication, then optional curriculum/scheduling modules after a formal pilot.

## Questions and truthful answers

**Q: Is this real RAG?** Not yet. The static demo filters locally bundled observations. True retrieval with pgvector and authenticated per-student authorization is a proposed production phase.

**Q: Does it securely isolate each student?** No. The teacher selector is a UI demonstration; all fictional data ships to browsers. Real school access requires backend authorization and tenant isolation.

**Q: Can we put real child photos in?** No. Public demo must not contain actual child data; proposed private deployment requires consent, agreements, access control, retention and security review.

**Q: Does GPT always work?** Depends on currently enabled demo gateway project, quotas, network and CORS; Offline Mock works without the cloud endpoint.

**Q: Can I enter my own OpenAI or Gemini key?** Test-only BYOK exists. Use a limited disposable key and fake data; provider CORS may reject requests, and long-lived secrets are not safe in a browser.

**Q: Is 90% accuracy achieved?** No. The <10% editing number is an illustrative requirement to validate with users. Editing % is not model factual accuracy.

**Q: Is this approved by a Singapore regulator?** No. There is no claimed approval or certification. Any deployment with real children requires an independent legal/security assessment.
