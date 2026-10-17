# 08 — UI, branding and accessibility

The root studio uses one shared shell and dedicated hash routes: Home, Class portfolios, Students, Evidence library, AI drafts, Reports, AI provider settings and About and privacy. Child editors, profiles and print views are separate routes. `class.html` redirects to the root with its hash intact; old child-editor hashes are resolved by the studio router.

The [design SSOT](../design/README.md) owns the canonical menu, page specs, wireframes and tokens. Specs define exact copy/behavior; images express visual intent, not verified implementation. `studio.css` and `src/studio/tokens.css` implement the shared visual system.

## Safety and storage copy

Keep fictional-data and browser-local-storage notices visible. The studio uses 20 fictional children and four learning domains, not a real roster or permission model. Label Offline mock as simulated, show provider failures without substituting mock, and distinguish local review from authenticated approval. Print reports retain their fictional-data disclaimer and incomplete-content warnings.

## Neutral configuration

`src/config.js` contains public product/portfolio labels and Gateway routing; `organizationName` and `logoUrl` default to empty. Never add real organization identities, private records or secrets to this public template. Config fields are not a guarantee that every optional branding treatment is rendered; use the current shell/page implementation as the behavior contract. Any new bundled asset needs an entry in the build allowlist and must be authorized for public distribution.

## Accessibility review

- Verify no horizontal overflow across phone, tablet and desktop widths.
- Maintain semantic headings, associated labels, fieldsets, keyboard access and visible focus.
- Preserve focus when routing or updating dynamic content; dialogs contain focus and have a clear exit.
- Use text/icons as well as color for status and rating.
- Target 44px controls and at least 16px inputs; account for safe areas and fixed bottom navigation.
- Respect reduced motion and system themes; retain readable print output.
- Test physical devices and screen readers separately from browser emulation.

Use the [UI audit workflow](27-ui-audit.md) for measured development evidence; it is not a substitute for manual accessibility, print or real-device acceptance.
