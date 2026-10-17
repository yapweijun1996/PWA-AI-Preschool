# Development UI audit harness

The dependency-free Node/CDP harness audits the built static demo with actual device metrics,
not a cropped `--window-size` desktop layout. It is a development tool, not shipped in `dist/`.
Use Node 23 or newer (global `fetch` and `WebSocket`) and installed Google Chrome.
Set `CHROME_PATH` to override the default macOS Chrome executable.

## Run

```sh
npm run build && npm run ui:audit
npm run ui:audit -- --quick
npm run ui:audit -- --url https://example.org/demo/ --quick
npm run ui:audit -- --routes '#/classes,#/students' --viewports 390x844 --schemes dark
npm run ui:audit -- --no-screenshots --out artifacts/ui-audit/local
```

Without `--url`, a loopback HTTP server serves `dist/` on an ephemeral port.
Remote URLs must use HTTP(S), have a host and contain no credentials.
Each route/viewport/scheme uses a fresh Chrome target and clears origin storage including
service workers before navigation. Do not point the audit at an origin whose browser storage
must be preserved in this temporary browser profile. No production authentication is supplied.
The harness waits for an h1 and fonts, checks exact CSS viewport width, and checks PNG width
against twice the CSS width. Chrome and the temporary profile are cleaned up on completion.

The default matrix includes all main routes and editor domain tabs, five viewport sizes and
both colour schemes. `--quick` selects 390x844 and 1440x900 with both schemes.
Routes, viewports and schemes accept comma-separated lists.

## Outputs and budgets

`artifacts/ui-audit/<UTC timestamp>/` contains `summary.json` and `summary.md`.
Each `<route-slug>__<width>x<height>__<scheme>/` contains `metrics.json`, `full.png` and up to
eight viewport PNGs spanning the page. All PNGs use device scale factor 2.
`--no-screenshots` keeps metrics and reports without PNGs.

`scripts/ui-audit.budgets.json` defines fail/warn budgets and viewport-specific limits.
Failures include overflow, mobile header height, body fonts, tap targets, known contrast,
clipping, overlapping controls, missing control names, h1 count, selected page heights and
console errors. Warnings include notice height, chip fonts, unknown contrast and h1 focus.
Exit code 1 means at least one fail-severity budget failed, or harness execution failed.
The report lists results per combination and recurring offender selectors with screenshot links.
`npm run check` recursively syntax-checks every harness `.mjs`; `npm test` includes pure
math/budget/options and traversal tests without Chrome.

### RC0 geometry rules and new regression locks

Native radio/checkbox targets use an associated label's box when it is at least 44x44.
Their own label is not an overlapping control. Fixed elements (including descendants of
fixed bars) are excluded from overlap pairs: transient scroll occlusion is expected.
The end-of-page `bottomCoverage` check still fails if the last content is covered.
Local horizontal scrollers are not page-overflow offenders; document overflow still fails.
Intentional 1px `clip`/`clip-path` screen-reader patterns and explicit CSS line clamps
are excluded from accidental clipping. Ordinary overflow-hidden text is still checked.

New fail-level metrics:

- `brokenWords`: single-word text with multiple Range line positions; words whose natural
  measured width exceeds their container are ignored, as required by the triage.
- `stickyTopHeight`: union of top-stuck sticky/fixed regions after a 400px scroll,
  excluding bottom navigation. Maximum 200px through width 1023.
- `headerHeight`: maximum 130px through width 1023, including tablet.
- `labelOverflow`: button/tab/chip/link scroll width exceeds client width by more than 1px.
- `tabletColumns`: multi-column text cards below 280px at widths 601–1023.
- `firstScreen`: configured route content must be fully above fixed bottom navigation
  at 320x720, 390x844 and 430x932. Alternatives are OR; each all/count group is AND.
  The JSON selector map uses semantic elements, link destinations and action text.
  Unresolved selectors (including Review, which has no rating choices) are explicitly
  **SKIPPED / warn**, never a pass; routes without a configured requirement also warn.

At 390px, height limits are Classes 4200px, Students 4200px and Evidence 5000px.
These intentionally fail until the later UI batches. No app layout is changed by RC0.

Read `summary.md` by combination: FAIL means a fail-level regression lock fired;
WARN can include unresolved/skipped coverage and is not proof of compliance.
Violated numeric budgets show actual/limit; array metrics show offender counts.
Use `summary.json` and per-route `metrics.json` for rectangles and selector details,
then open the linked viewport images to distinguish visible defects from heuristics.
Sticky measurement restores the initial scroll position before screenshot capture.

## Agent workflow and limitations

Run the quick audit before proposing UI changes. Read metrics and inspect the linked full-page
and scroll screenshots; distinguish repeated shell issues from route-specific issues. Keep
budget failures visible rather than lowering thresholds to make the report green. Audit the
changed routes afterward. Do not treat a screenshot as proof of screen-reader behavior.

Geometry and contrast heuristics are candidates; no screen reader or real-device run;
gradients/images unknown contrast. Transparent foregrounds, layering, shadows, pseudo-elements,
complex accessible-name computation and intentional clipping can require manual review.
Only the initial fictional seed state is exercised, not all interactions, keyboard journeys,
provider calls or Gateway availability. Print-route screenshots use screen media, not PDF output.
Remote pages run their own scripts; use only trusted demo URLs. This is not a security scanner.
