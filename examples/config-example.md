# Customizing this product without company hardcoding

The demo imports `STUDIO_CONFIG` from `src/config.js`:

```js
productName: 'AI Preschool Studio',
organizationName: '',
portfolioTitle: 'Learning & Development Portfolio',
```

You can use a new, authorized organization name in a **private fork** by changing a config value. No organization name should appear as a literal in component code. For a public neutral template, keep organizationName blank.

The demo Gateway values are routing identifiers, not credentials. A public `github-pages` Gateway project/allowed Origin must be configured server-side for each deployment origin. Never commit API keys.
