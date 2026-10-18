# Consent-Gated Google Analytics and Search Console Setup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Configure the verified Search Console property with the public sitemap and add privacy-first, consent-gated page-view analytics to the website.

**Architecture:** Google Analytics loads only after an explicit visitor choice to allow analytics. NightSky sends manual page-view events for SPA route paths without query strings or referrers, and only on the production domain. GA4 also emits its standard first-visit, session-start and engagement events and baseline technical metadata; the site discloses this before consent. Google-side settings disable Enhanced Measurement, query parameters, Google Signals and ads personalization, turn off granular device/location reporting, and retain event/user data for two months.

**Tech Stack:** React, TypeScript, Wouter, Playwright, Node test runner, GA4 web stream, Google Search Console.

**Spec:** Approved in-chat design from 18 October 2026: explicit allow/reject choice, no analytics before consent, sanitized page views and a transparent disclosure of GA4 core events/technical data, redact query information, privacy notice, sitemap submission, website-only PR, and post-implementation re-investigation.

## Global Constraints

- Do not edit the plugin worktree or plugin source.
- NightSky must never send URL query strings, fragments or referrers. Do not track search terms, clicks, forms or scrolls. GA4's standard first-visit/session/engagement events and baseline metadata must be disclosed.
- Do not load Google Analytics before explicit consent.
- Do not send analytics from localhost or deploy-preview domains.
- Keep tracking limited to the existing GA4 stream `G-G6DTHEN2E1`.
- Do not merge the PR; create it and inspect its Netlify preview.

## Review Focus

- A visitor who rejects or has not yet chosen must produce no GA script request or event.
- A visitor who accepts must produce one manual page view per SPA route with a clean path, fixed title and empty referrer; GA4 core events and technical metadata are disclosed.
- Changing the choice to reject must stop subsequent collection and clear first-party GA cookies.
- Direct route visits, mobile layout, and storage-unavailable browsers must keep the consent UI usable.
- Preview and local hostnames must never send events to the production property.

## Files

- Create `client/src/lib/analytics.ts` for consent storage, production-host check, tag loading, page-view dispatch and revocation.
- Create `client/src/components/AnalyticsConsent.tsx` for the persistent accessible choice UI and route tracking.
- Modify `client/src/App.tsx` to mount the consent provider globally.
- Modify `client/src/components/Footer.tsx` to expose preference controls after an initial choice.
- Modify `client/src/styles/support-pages.css` or a focused consent stylesheet for responsive, keyboard-visible consent UI.
- Modify `client/src/pages/SupportingPages.tsx`, `client/src/content/releaseFacts.ts`, and `docs/website/source-and-rights-register.md` to accurately disclose GA processing.
- Create `tests/unit/analytics.test.ts` and `tests/browser/analytics-consent.spec.ts` for the privacy and tracking contract.

## Tasks

### Task 1: Consent and privacy-safe tracking

- [x] Write failing unit tests for path sanitization, hostname allowlisting, consent persistence, and rejection/revocation behavior.
- [x] Run those tests and confirm expected failures.
- [x] Implement `analytics.ts` and the global consent provider with no pre-consent script loading.
- [x] Update policy, release facts and source register to state analytics is optional, consent-gated, includes GA4 core events and technical metadata, and is separate from the MCP no-analytics statement.
- [x] Add browser tests for undecided, reject, accept, revoke, footer preferences and mobile visibility.
- [x] Run unit/browser tests, TypeScript check, and release build.

### Task 2: Google account setup and sitemap

- [x] In the existing verified GA4 stream, disable Enhanced Measurement and enable email/query redaction (24 query keys).
- [x] Set user and event data retention to two months, with reset on activity disabled.
- [x] Keep Google Signals off, disallow Ads Personalization in all 307 regions, and disable granular location/device reporting.
- [x] In Search Console, submit `https://nightsky.earth/sitemap.xml` to the verified domain property.
- [x] Verify settings and sitemap submission in the signed-in browser; sitemap is Success with 146 discovered pages (18 October 2026).

### Task 3: Website-only PR and re-investigation

- [x] Review the complete diff and confirm plugin paths/worktrees are untouched.
- [x] Run the complete unit, focused consent browser checks, TypeScript check, and release build. (The broader browser suite previously had 4 unrelated astronomy/date/schema assertion failures.)
- [ ] Commit the website changes, push the feature branch, and open a website-only PR.
- [ ] Inspect the Netlify preview and verify the consent flow at desktop/mobile sizes; confirm no GA request on preview hosts.
- [ ] Recheck Search Console sitemap status and GA Realtime after production deployment; if this PR remains unmerged, clearly record production checks as pending.
