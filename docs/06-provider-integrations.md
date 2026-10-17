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

## Gateway requests (public demo API contract)

```http
POST /demo/session HTTP/1.1
Origin: https://YOUR_GITHUB_USERNAME.github.io
Content-Type: application/json

{"project_id":"github-pages"}
```

The 2026-10-13 HTTP smoke returned **201** with `token`, `token_type`, `expires_in`, `expires_at`, and `model`. The adapter uses the verified `token` field and starts a fresh session for each explicit generation. Deprecated guessed token aliases and legacy Chat Completions envelopes are not supported.

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

## Studio narrative response contract

`src/narrative.js` builds per-domain requests using request-local pseudonyms, masked comments and current/previous ratings. `src/privacy-mask.js` removes known identifiers and contact patterns before provider dispatch; photos, filenames and image metadata are excluded. The disclosure previews the exact masked prompt. Strict JSON parsing and grounding run before and after local name restoration; the reverse map is disposed after the request. Pseudonymised text is not anonymous. See [privacy masking and limitations](28-privacy-masking.md) and [semester data and traceability](05-data-and-rag.md).

These guards can reject faithful text or miss unsupported claims; they do not establish factual entailment or a quality benchmark. Teacher review remains mandatory. Provider/model/source metadata is recorded with accepted narratives; Offline mock is a separately selected, labelled deterministic mode, never a failure fallback.

Transport responses must be JSON objects. OpenAI/Gateway output arrays and Gemini candidate/part arrays are checked before reading text; malformed envelopes or missing visible text fail visibly. Raw provider output and credentials must not be rendered as error guidance.

## Error behavior

- HTTP errors use short, application-authored guidance keyed to status: 400/422 input/model, 401 credentials/session, 403 permission/origin, 404 model/endpoint, 408/504 timeout, 413 input size, 429 quota/rate limit, and other 5xx temporary availability.
- Error response bodies are never read or shown. Provider error strings, raw JSON, request credentials and temporary tokens are never interpolated into displayed errors.
- Network/CORS and 30-second request timeout failures use local actionable messages. Invalid JSON, malformed envelopes and unreadable responses are rejected without echoing raw content.
- No failed request produces a substitute portfolio or automatically retries through another provider. The user must explicitly retry or choose Offline Mock.
- Each Gateway generation obtains a new public short-lived session; no long-lived Gateway key is bundled or persisted. Record runtime status and origin-specific CORS evidence separately in the [submission write-up](26-submission-writeup.md), never as an assumption of universal availability.

## Security notes

Keys are not stored in `localStorage`, `sessionStorage`, `IndexedDB`, cookies, URLs or Git. They remain in memory while the page is open. This is **not a secure-secret design**, only an explicitly warned sandbox test. Restrict and rotate any trial credentials; never use actual pupil records with browser BYOK. Add server-side audit and daily spending limits for real workflows.
