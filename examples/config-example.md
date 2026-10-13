# Customizing this product without company hardcoding

The demo imports `STUDIO_CONFIG` from `src/config.js`:

```js
productName: 'AI Preschool Studio',
organizationName: '',
portfolioTitle: 'Learning & Development Portfolio',
logoUrl: '', // Optional public URL; './favicon.svg' uses an already published neutral asset.
```

You can use a new, authorized organization name in a **private fork** by changing a config value. No organization name should appear as a literal in component code. For a public neutral template, keep organizationName blank.

The demo Gateway values are routing identifiers, not credentials. Its public `github-pages` project must allow the deployment Origin server-side. Never commit API keys. Configured logo URLs must reference authorized public assets; add new bundled assets to `scripts/build.mjs` before building. The neutral public template keeps the logo and organization fields blank.
