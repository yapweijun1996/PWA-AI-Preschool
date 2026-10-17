# P12 — System states
Route: reference sheet, no route · Menu item: none · User: design and implementation team · Purpose: keep feedback consistent across P01-P11.
The sheet shows shared-shell states with exact copy and recovery actions; it is not a product destination.
## Wireframes
![desktop](../wireframes/P12-system-states-desktop.webp)
## Regions (top to bottom, left to right; numbered)
1. AppShell and DemoNotice with “Fictional demo data”, “Stored only in this browser” and “NOT IMPLEMENTED: real login / server / database”.
2. PageHeader: “System states”; supporting copy “Feedback is clear, recoverable and never color-only.”
3. StateCard “Loading”: skeleton rows and “Loading portfolios…” with aria-busy.
4. StateCard “Empty”: “No children match this search.” and SecondaryButton “Clear search”.
5. StateCard “Drafting error”: “AI request failed. Check the connection, model, permissions or quota, then retry. No narratives were changed.” and PrimaryButton “Retry draft”.
6. StateCard “Rejected draft”: “English draft rejected: unsupported capitalised word or name.” plus “Press Draft narrative to retry or write it yourself.”
7. StateCard “Offline”: “Offline: select Offline mock or reconnect before remote drafting.” Local work remains available; remote action is unavailable.
8. StateCard “Update available”: “Update available”; action “Review update”. The proposed shared-shell confirmation says “Saved portfolios stay in this browser. Unsaved changes and temporary provider choices will be lost.” Actions are “Keep this session” and “Update app”.
9. StateCard “Saved”: positive icon plus “Saved in this browser”.
10. StateCard “Not saved”: “Not saved: storage unavailable.” Keep the edited screen visible and provide “Retry save” or export/recovery guidance where available.
## Data shown (fields, from which existing module/function)
Loading comes from route/store initialization; empty/search from filterChildren() in src/class-view.js; provider errors/rejections from src/narrative.js and src/class-app.js; offline/PWA state from src/pwa.js; persistence from src/portfolio-store.js. Most copy is based on actual runtime messages. The review-update and retry-save actions are proposed for the future shared shell; current PWA update copy is session-oriented and current class storage failure has no retry control.
## Actions and navigation (what each control does, where it goes)
Retry draft reruns the selected provider for the failed domain. Write it yourself focuses the editable narrative. Clear search resets query and filter. Review update opens the explicit confirmation, with Keep this session as a safe exit. Retry save attempts local persistence without discarding edits.
## States (empty, loading, error, offline, long content, 20 children)
All eight conditions are shown at once as isolated examples. Long errors wrap within cards. Loading skeletons keep stable geometry. Offline affects cloud generation only. A rejected domain can coexist with accepted domains. Not saved must remain distinct from Saved and remain visible until persistence succeeds.
## Responsive behaviour (what changes at 390 px)
The reference sheet reflows to one column; each card keeps heading, message and action together. It is not a horizontal carousel.
## Accessibility notes
Use role=status for non-blocking save/provider changes and role=alert for blocking failures; text labels accompany icon/color; actions are keyboard reachable and have 44 px minimum target size.
## Implementation mapping (existing files/functions to reuse; new files proposed; hash route)
Reuse persistence/provider/PWA state owners in src/portfolio-store.js, src/class-app.js, src/narrative.js and src/pwa.js. New shared-shell state components are proposed. This reference has no route.
## Acceptance checks (5-8 testable bullets)
- Each state has a visible heading, plain-language message and recovery action where recovery exists.
- “Saved in this browser” and “Not saved” cannot be mistaken for each other.
- Offline messaging disables remote drafting while preserving local work.
- A rejected domain can be retried or edited without hiding other accepted domains.
- Update requires an explicit review/confirmation and offers a keep-session exit.
- All examples remain readable in one column at 390 px and communicate state without color alone.
