# P03 — Child portfolio editor
Route: `#/classes/class-a/children/C-05?sem=2026-S2` · Menu item: child of Class portfolios · User: educator · Purpose: complete one child's four-domain record and review source-labelled narratives.
The editor keeps one domain in view at a time; the final step reviews all four narratives.
## Wireframes
![desktop](../wireframes/P03-child-editor-desktop.webp) ![mobile](../wireframes/P03-child-editor-mobile.webp)
## Regions (top to bottom, left to right; numbered)
1. AppShell: SidebarNav, TopBar breadcrumb “Class portfolios / 李沐辰”, semester switch “2026-S1” / “2026-S2”, provider/PWA status, and DemoNotice: “Fictional demo data”, “Stored only in this browser”, “NOT IMPLEMENTED: real login / server / database”.
2. Sticky PageHeader: “李沐辰”, “C-05 · Class A (Sample)”, SecondaryButton “Previous child”, “5 / 20”, SecondaryButton “Next child”, StatusChip “In progress”, and save status “Saved in this browser”.
3. ProgressBar: “2 / 4 domains ready”; the current S2 record has English and Chinese ratings plus comments.
4. DomainTabs: “English” (selected), “Chinese”, “Mathematics”, “Social-Emotional Development”, “Review narratives”. Keep exactly one domain panel visible.
5. PanelCard “English”: RatingControl with “Developing” selected; FormField “Teacher comment” containing “Retells a familiar picture-book event using short sentences and points to supporting illustrations.”; S2 comparison “Semester 1: Emerging → Semester 2: Developing (+1)”; PhotoTile abstract placeholder with required alt text “Fictional sample activity 1”.
6. NarrativeBox: “Narrative (teacher editable)”, empty helper “No narrative yet”, source label “No narrative”, and PrimaryButton “Draft narrative”. After generation show exactly “MOCK DRAFT (offline, not AI)” or “AI DRAFT (provider) - teacher must review”.
7. ActionGroup: SecondaryButton “Add sample placeholder photo”; final Review narratives step shows all four source labels, editable text, stale/rejected notices and PrimaryButton “Mark reviewed and go to next child” (disabled until all four narratives are nonempty).
## Data shown (fields, from which existing module/function)
CHILDREN/C-05 and seedRecords() in src/portfolio-seed.js; domain rating, comment, photos and narrative from the selected 2026-S2 record; S1 baseline and change from progressComparison() and narrativeInputFor() in src/portfolio-model.js. C-05 is 李沐辰: English Emerging → Developing (+1), Chinese Emerging → Emerging (0), Mathematics and Social-Emotional Development not rated in S2 (S1 Extending). Photo alt text comes from the seed record.
## Actions and navigation (what each control does, where it goes)
DomainTabs switch the visible panel; Review narratives opens the final step. Rating/comment/photo edits autosave to localStorage and clear the reviewed flag; changed existing narratives become stale. Add sample placeholder photo requires alt text and explicit Save photo. Draft narrative uses the selected provider; failures keep existing text and never silently switch to mock. Previous/Next changes the child while preserving the semester. Review advances to the next unfinished child; Print / PDF opens P08 with C-05 selected.
## States (empty, loading, error, offline, long content, 20 children)
Show Skeleton while local records load; show “Not saved: storage unavailable” if persistence fails and retain edits. Missing rating/comment stays empty and does not count as a ready domain. Remote drafting offline shows “Offline: select Offline mock or reconnect before remote drafting.” Rejected domains keep their rejection reason and retry/manual edit actions. Narrative limit is 2000 characters; comment limit is 1000; a domain allows up to six photos.
## Responsive behaviour (what changes at 390 px)
Hide SidebarNav for MobileTabBar. Keep the child PageHeader and ProgressBar visible while scrolling the single PanelCard. DomainTabs wrap to two rows within their labelled region; rating choices and photo tiles wrap vertically, with no horizontal page scrolling. Leave safe space above the fixed bottom tabs.
## Accessibility notes
Use one h1, labelled DomainTabs with selected state, fieldset/legend for RatingControl, persistent FormField labels, required alt text, live save/draft feedback and visible focus. Do not convey ratings or status by color alone; honor reduced motion.
## Implementation mapping (existing files/functions to reuse; new files proposed; hash route)
Reuse src/class-app.js editor state, src/portfolio-model.js, src/portfolio-seed.js, src/portfolio-store.js, src/narrative.js and src/class-view.js narrativeChip(). A shared-shell route renderer, sticky PageHeader, domain-tab view and final review step are proposed; current editor route is `#/child/C-05?sem=2026-S2`.
## Acceptance checks (5-8 testable bullets)
- Opening the route selects C-05, 2026-S2, English, and shows “5 / 20”.
- Exactly one domain panel is visible; Review narratives is a distinct final step.
- S2 shows S1 comparison for every domain, including “Not rated in Semester 2”.
- Saving a photo requires nonempty alt text; the preview uses abstract placeholder art only.
- Offline or failed AI drafting preserves the current narrative and its source label.
- A changed narrative is marked stale and a successful local save reads “Saved in this browser”.
- At 390 px all controls remain reachable above MobileTabBar without horizontal overflow.
