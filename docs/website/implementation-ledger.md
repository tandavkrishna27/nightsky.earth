# Implementation ledger — docs/superpowers/plans/2026-10-16-website-implementation.md

Website worktree only. Base 5f5b660. Native execution approved by owner.

Baseline: npm ci completed; npm run check and npm run build passed. Existing non-fatal warnings: old Browserslist data, PostCSS source warning, large bundle.

Preflight: tasks share ListingConfig, SiteRoute and copy; use one shared config and PageShell. Resources is local-only. News adapters share normalization. Meteor legacy IDs and reviewed records remain distinct. Build mode is resolved once.

Ruling: Windows shell cannot execute the skill's Bash bookkeeping scripts directly; keep the equivalent task ledger here and use explicit scoped git paths. No loss of progress history; no plugin access.

Task 1: in progress — pure contract tests written before implementation.
