/**
 * White-label site configuration. No school/company name is embedded.
 * This file is PUBLIC and must never contain API keys or student records.
 * Replace UI labels here, or use a future authenticated per-tenant backend.
 */
export const STUDIO_CONFIG = Object.freeze({
  productName: 'AI Preschool Studio',
  organizationName: '', // Optional licensed organisation display name (blank by default)
  portfolioTitle: 'Learning & Development Portfolio',
  logoUrl: '', // Optional public logo asset URL; blank preserves the neutral mark.
  portfolioSubtitle: 'Evidence-based preschool progress',
  demoOnly: true,
  metrics: Object.freeze({
    illustrativeHoursPerPortfolio: 6,
    hypotheticalEditingTargetPercent: 10,
  }),
  demoGateway: Object.freeze({
    origin: 'https://gpt.yapweijun1996.com',
    projectId: 'github-pages',
    modelId: 'demo-auto',
  }),
});
