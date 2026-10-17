# 10 — Test plan and evidence-based evaluation

## Automated gates

```sh
npm run check
npm test
npm run build
```

Use the actual output for counts/results rather than a fixed historical total. Tests cover current portfolio model/seed/store, provider transport and narratives, reports, studio routing/pages/models and PWA/build contracts. The build must contain only the declared runtime assets, with the root studio and `class.html` redirect—not the retired long-scroll application. A successful command does not establish deployed behavior, live provider health or visual/accessibility acceptance.

## Browser acceptance

Use the built artifact under both `/` and a repository subpath; see [deployment](09-deployment.md). Record each unexercised case as **NOT TESTED**.

- Open every studio destination and editor/domain/print route at desktop, tablet and phone widths; inspect heading focus, keyboard flow, dialogs, status labels and overflow.
- Open `class.html` with editor, print and legacy child hashes; verify hash-preserving navigation to the root. Unknown hashes show Home with a notice.
- Inspect the 20-child semester seed; edit ratings/comments/placeholder photos, draft explicitly with Offline mock, edit narratives and mark reviewed. Reload to confirm saved fictional records and provenance.
- Inject provider failures and malformed/ungrounded responses; preserve existing narratives, show sanitized errors/rejections and never silently switch provider or mock mode.
- Exercise disposable BYOK acknowledgement/key cleanup; inspect URLs and browser storage to confirm no key persistence.
- Check evidence filters, profile comparisons, report completeness and actual child/class print output, including fictional/incomplete warnings and CJK rendering.
- Test storage failure/retry and reset confirmation without misreporting unsaved edits as saved.
- Exercise cold-offline launch after successful static caching and controlled N→N+1 updates in two tabs. Inspect exact cache boundaries; see [PWA gates](25-pwa-standard.md).
- Verify native installation, physical iOS/Safari, screen readers and Windows/Linux fonts separately; viewport emulation cannot establish these results.

Run the [development UI audit](27-ui-audit.md) for measured layout checks. Visual captures, browser journeys, print/PDF, live Gateway/BYOK and deployed-origin CORS remain distinct evidence.

## Future private-service negative tests — NOT IMPLEMENTED

Before real data, independently test tenant/student/assignment authorization, revoked access, hostile imported text, data retention/deletion, least-privilege object access, authenticated review and export controls. Client-side filtering or a local reviewed flag does not satisfy them.

## Quality study

Measure actual educator time and supported/unsupported claims on authorized synthetic or permitted de-identified samples under a formal pilot plan. Track source support, attribution errors, corrections, review time, provider cost and model/template version. No teacher-time saving, low edit-rate or quality result is currently claimed.

Evidence records should identify date/environment, commit/build, scenario, PASS / FAIL / PARTIAL / NOT TESTED, observed result and artifact path. Keep credentials, prompts containing private data and real identities out of reports. Historical results in the [submission write-up](26-submission-writeup.md) are not acceptance of later changes.
