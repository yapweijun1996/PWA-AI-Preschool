# 06 — AI Providers, Gateway and BYOK

## Provider matrix

| Provider | UI status | Authentication | Secret handling | Constraints |
|---|---|---|---|---|
| GPT Demo Gateway | Adapter implemented | Public short-lived demo token from `/demo/session` | No long-lived key bundled | Current availability and per-origin CORS must be rechecked; owner-managed quotas |
| OpenAI | Adapter implemented | User-entered test key | In-memory JS state only | Browsers may block direct calls; vendor warns against client-side keys |
| Gemini | Adapter implemented | User-entered test key | In-memory JS state only | Browser CORS/usage restrictions; vendor warns against production exposure |
| Offline Mock | Implemented | None | None | Simulated only, prominently labelled |

## White-label config

`src/config.js` controls public branding **and** demo routing:

```js
export const STUDIO_CONFIG = Object.freeze({
  productName: 'AI Preschool Studio',
  organizationName: '', // optional display only
  portfolioTitle: 'Learning & Development Portfolio',
  demoGateway: {
    origin: 'https://gpt.yapweijun1996.com',
    projectId: 'github-pages',
    modelId: 'demo-auto',
  },
});
```

This sample is explanatory; use the complete actual `src/config.js` as the source of truth. **Never place credentials in it.** The default Gateway hostname is an owner-operated demonstration service, not a general official AI provider endpoint.

## Gateway requests (historical API contract; verify live)

```http
POST /demo/session HTTP/1.1
Origin: https://YOUR_GITHUB_USERNAME.github.io
Content-Type: application/json

{"project_id":"github-pages"}
```

Expected on success: HTTP 201 with one temporary session token field. The client supports several token field names because the server response shape may differ.

```http
POST /demo/v1/responses HTTP/1.1
Authorization: Bearer TEMPORARY_DEMO_TOKEN
Content-Type: application/json

{"model":"demo-auto","input":[{"role":"user","content":[{"type":"input_text","text":"Only fictional evidence..."}]}],"stream":false}
```

**IMPORTANT:** gateway configuration and quota/cors setup must be checked at deployment time. Don't route the browser to private `/v1` with a permanently embedded `gw_` key. Do not bypass rate limits to make a demo work.

## OpenAI BYOK test adapter

`POST https://api.openai.com/v1/responses` with `Authorization: Bearer <USER_TEST_KEY>`, `store:false`, model selected in UI and a fictional-data prompt. The key is held in page memory only; a browser/network/device extension can still see it. Do not enter a long-lived production organization key. **Production must use server-side credential management.**

## Google Gemini BYOK test adapter

`POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent` with `x-goog-api-key: <USER_TEST_KEY>`; body carries `contents` and `generationConfig.responseMimeType=application/json`. Client can fail on CORS or vendor restrictions. Model names change; don't promise model availability based solely on source defaults. Never put keys in query parameters or static bundles.

## Error behavior

- Missing/expired token → display error and permit retry.
- Invalid credentials → show 401/403 but never echo key.
- Quota/rate limit → show status 429 and actionable message.
- Empty/invalid JSON → reject, don't fake an AI result.
- Provider CORS failure → suggest Offline Mock or a future server proxy.
- Session expired → request a new short-lived session when user explicitly initiates a new generation.
- Never automatically send private data to an alternate provider.

## Security notes

Keys are not stored in `localStorage`, `sessionStorage`, `IndexedDB`, cookies, URLs or Git. They remain in memory while the page is open. This is **not a secure-secret design**, only an explicitly warned sandbox test. Restrict and rotate any trial credentials; never use actual pupil records with browser BYOK. Add server-side audit and daily spending limits for real workflows.
