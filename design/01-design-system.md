# Design system — AI Preschool Studio

## Direction

Mid-fidelity, calm and practical: ivory canvas, forest-green actions, soft green surfaces, rounded cards and clear sans-serif typography. Use spacious editorial hierarchy with compact data rows where a teacher scans many children. Keep decoration to small abstract shapes; never use portraits, school marks or real-photo imagery.

The same shell and component language applies to all modules. Prefer text plus icon for status; color reinforces meaning and never carries it alone. Controls have at least 44 px hit areas, clear labels and a visible keyboard focus ring. Honor reduced-motion preferences.

## Tokens

The authoritative light/dark color, spacing, radius, shadow, type, breakpoint-comment and focus tokens live in tokens.css. Design values use rem-based spacing and typography; control dimensions remain at least 44 px. The base canvas, text, warning and error colors follow design/BRIEF.md.

## Shell components

- **AppShell** — full-height application frame; responsive sidebar becomes a mobile bottom bar.
- **SidebarNav** — text-only brand, Home/Class portfolios/Students/Evidence library/AI drafts/Reports/AI provider settings/About and privacy destinations, active item and privacy summary.
- **MobileTabBar** — five equal, keyboard-reachable tabs: Home, Classes, Students, Drafts, More.
- **TopBar** — breadcrumb, 2026-S1 / 2026-S2 switch, ProviderStatus, FictionalDataChip and PWA status.
- **DemoNotice** — persistent warning with “Fictional demo data”, “Stored only in this browser” and “NOT IMPLEMENTED: real login / server / database”.
- **PageHeader** — page title, supporting sentence and one primary page action.

### Shell rules

- **Desktop sidebar order:** Home, Class portfolios, Students, Evidence library, AI drafts, Reports; then a divider; AI provider settings, About and privacy. Keep this order on every application page.
- **Child pages:** keep the parent destination highlighted. P03 highlights Class portfolios; P05 highlights Students.
- **Mobile shell at 390 px:** hide the sidebar. Keep the TopBar, provider status, fictional-data status, PWA status and DemoNotice above the page content. Reserve safe-area space above the fixed bottom navigation.
- **Mobile bottom tabs:** Home, Classes, Students, Drafts, More. P03 highlights Classes and P05 highlights Students. P06, P08, P10 and P11 highlight More; More opens Evidence library, Reports, AI provider settings and About and privacy.
- **Print and reference pages:** P09 is a print document without app navigation and keeps its report disclaimer. P12 is a reference sheet, not a routed application page.

## Components

| Component | Anatomy and behavior |
| --- | --- |
| **PrimaryButton / SecondaryButton** | 44 px minimum height; sentence-case action label; disabled, hover, pressed and focus states |
| **StatusChip** | Text label for Not started, In progress, Ready to draft, Drafted, Reviewed, Mock or AI; never color-only |
| **ProgressBar** | Semantic value plus visible “0 / 20 reviewed” text and adjacent status counts |
| **MetricCard** | Label, prominent count, one short explanatory line; no unverified savings claims |
| **PanelCard** | Titled content group with optional count, empty state or action |
| **Toolbar / ActionGroup** | Related controls wrap in reading order; one primary action per group |
| **FilterChips** | Single selection, aria-pressed and visible selected treatment |
| **SearchField** | Explicit label, search icon, clear action and no-match state |
| **ChildCard / ChildRow** | Initials-only abstract avatar, fictional name, portfolio state, four domain ratings and contextual open link |
| **DomainTabs** | Four labelled tabs with selected state and completion text; one panel shown at a time |
| **RatingControl** | Fieldset/legend and four radio options: Emerging, Developing, Secure, Extending |
| **FormField** | Persistent label, helper/error text, visible character count when bounded |
| **PhotoTile** | Abstract placeholder only; alt-text field and explicit remove action; previews never go to AI |
| **NarrativeBox** | Editable text, character count, source label (“MOCK DRAFT (offline, not AI)” or “AI DRAFT (...) - teacher must review”), evidence links and stale/rejected state |
| **ProviderCard** | Provider selector, data disclosure, connection status; test keys explicitly disposable and not stored |
| **StateCard** | One named system state with message, status icon and recovery action |
| **Toast / InlineNotice** | Short saved/error feedback; role=status; recovery action stays visible for persistent failures |
| **Dialog** | Labelled heading, focus containment, close/cancel and explicit confirmation for reset/update |
| **EmptyState / ErrorState / Skeleton** | Plain cause, next step and retry/clear action; loading uses aria-busy and stable geometry |

## Status and rating colours

These are the canonical semantic pairs from `tokens.css`. Keep the state or rating label visible; color reinforces meaning and never carries it alone. Every foreground/background pair has at least 4.5:1 contrast for normal text in both themes. Red and rose are reserved for errors.

| Type | Label | Light background / text | Dark background / text | Contrast (light / dark) |
| --- | --- | --- | --- | --- |
| Status | Not started | `#eef0f2` / `#39434d` | `#38434b` / `#edf2f5` | 8.82:1 / 8.98:1 |
| Status | In progress | `#e5f0ff` / `#164a8a` | `#123d70` / `#d9eaff` | 7.66:1 / 8.91:1 |
| Status | Ready to draft | `#e4f3e9` / `#14532d` | `#174b2b` / `#ddf7e4` | 7.94:1 / 8.90:1 |
| Status | Drafted | `#f1e8ff` / `#4b247a` | `#45256f` / `#f0ddff` | 9.67:1 / 9.44:1 |
| Status | Reviewed | `#14532d` / `#ffffff` | `#0f3d27` / `#c8f5d8` | 9.11:1 / 10.20:1 |
| Rating | Emerging | `#fff1c2` / `#654000` | `#593d10` / `#ffe8ae` | 8.14:1 / 8.29:1 |
| Rating | Developing | `#e5f0ff` / `#164a8a` | `#123d70` / `#d9eaff` | 7.66:1 / 8.91:1 |
| Rating | Secure | `#e5f4e8` / `#245438` | `#21452f` / `#d8f5df` | 7.68:1 / 9.22:1 |
| Rating | Extending | `#d6efdd` / `#14532d` | `#18502c` / `#d7f5de` | 7.48:1 / 8.10:1 |
| Rating | Not rated | `#eef0f2` / `#39434d` | `#38434b` / `#edf2f5` | 8.82:1 / 8.98:1 |

## Status and content rules

- Portfolio states are derived from the record model: Not started, In progress, Ready to draft, Drafted, Reviewed. A rating alone is not a complete domain; a domain is ready only with both rating and comment.
- S2 shows each domain's S1 rating/change. Missing prior rating reads “Not rated in Semester 1”; it is not zero progress.
- Use fictional names and seed records only. Domains are English, Chinese, Mathematics, Social-Emotional Development; ratings are Emerging, Developing, Secure, Extending.
- Keep provider provenance visible. Offline mock is simulated text, not AI; AI drafts require educator review. A failed provider call never becomes mock output without an explicit user choice.
- Keep “NOT IMPLEMENTED: real login / server / database” visible in the application shell. Reviewed is local, unauthenticated demo state.

## Responsive and interaction rules

- At 1440 × 900, use a 224–240 px sidebar, fluid content column and generous card gutters. Dense class cards may use a four-column grid.
- At 390 × 844, hide the sidebar, use the five-tab bottom bar, stack cards and actions, and switch the 20-child grid to one-column rows. No horizontal scrolling.
- P03 keeps the child header and domain tabs available while the selected domain panel scrolls; domain tabs wrap or scroll within their own labelled region without moving the page sideways.
- Use keyboard order matching visual order, semantic headings, labels, fieldsets, live status text and visible focus. Prefer reduced motion over smooth scrolling when requested.

## Surface and state inventory

The system sheet includes both navigation variants, buttons, status chips, rating control, domain tabs, cards, labelled form fields, photo tile, source-labelled narrative box, toast, dialog, empty state, loading skeleton, provider error, rejected draft, offline state, update available and saved/not-saved feedback. P12 defines the exact state copy.
