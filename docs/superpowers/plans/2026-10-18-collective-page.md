# Collective Page Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. The user approved the discussed redesign and asked for the plan and implementation in this session; proceed with local website edits.

**Goal:** Make the Collective’s purpose, audience and coming-soon contribution path clear in a shorter, polished page.

**Architecture:** Replace the current repeated editorial sections with four sections in Community.tsx. Keep audience/purpose copy in a focused content module and scope styling under collective-page. Reuse existing imagery, routing, footer, rounded action styling and SUPPORT_EMAIL; do not modify the plugin.

**Tech Stack:** React, TypeScript, CSS, Lucide icons and existing Playwright setup. No new dependencies.

**Spec:** The user-approved discussion in this chat: retain welcoming atmospheric hero, combine introduction/audience, include six named groups, consolidate Observe/Create/Learn/Conserve, remove decorative small headings and numbered image captions, clearly say coming soon, and provide an email contribution button.

## Global Constraints

- Website worktree only; preserve all earlier homepage, setup, splash and footer changes.
- No actual membership, research programme, signup, forum, upload or community link is invented.
- Six audience groups: Stargazers & skywatchers; Astronomers & researchers; Astrophotographers & filmmakers; Educators & science communicators; Astronomy clubs & observatories; Dark-sky advocates & nature lovers.
- Beginners remain welcome: no title, equipment or experience required.
- Shared purpose: Observe, Create, Learn and Conserve, with concise descriptions.
- Remove decorative eyebrow labels and numbered photo captions. One meaningful Coming soon status badge is allowed, as explicitly requested.
- Contribution is mailto to the existing SUPPORT_EMAIL with a clear contribution subject; no message is sent by the website.
- Keep main Get NightSky Plugin navigation action unchanged. No plugin changes, commits, deployment or publication.

## Review Focus

- Coming-soon copy must not imply an already active membership platform or current members.
- Email recipient/subject must be valid and inspectable without opening an external mail application during tests.
- Audience titles and purpose descriptions must reflow at320/390px and with enlarged text.
- Hero and editorial images need readable contrast, meaningful image descriptions and no fixed-height caption clipping.
- Changes must stay scoped to the Collective and preserve route metadata/navigation/footer behaviour.

### Task 1: Content, hierarchy and contribution action

**Files:** client/src/pages/Community.tsx; new client/src/content/collective.ts; new client/src/styles/collective.css; tests/browser/collective.spec.ts; existing experience.spec.ts Collective expectations.

- [x] Write browser assertions for six groups, four themes, no decorative eyebrows, coming-soon status and mailto recipient/subject; observe the missing-behaviour failure.
- [x] Build four sections: hero, Different places / The same wonder audience, Curiosity travels further shared purpose, Bring your perspective contribution invitation.
- [x] Style a compact three-column audience grid on desktop, two on tablet and one on mobile; one shared-purpose image with four themes, stacked on mobile.
- [x] Run targeted behaviour, keyboard and enlarged-text checks.

### Task 2: Review and verification

- [x] Compare desktop/mobile/narrow views with the earlier page and check for horizontal overflow, clipping, broken images or misleading copy.
- [x] Run both TypeScript checks, relevant browser suite and production build; broaden only for relevant failures.
- [x] Obtain a focused independent review of the changed website files; fix material findings.
- [x] Report the local Collective URL and verification results. Leave the mail application unopened and the plugin untouched.

## Execution record

- Initial: Reused existing website worktree and existing published contact address. User explicitly approved coming-soon status and an email contribution action.

- Completed: four-section layout, six audience groups, four shared purposes, coming-soon status, and encoded mailto contribution action. Removed all decorative eyebrows and numbered photo captions.
- Verification: 11 relevant browser tests passed; both TypeScript checks and production preview build passed. Visual checks at1440/1024/390/320 found no horizontal overflow, broken images or runtime errors;200% type and email keyboard-focus checks passed.
- Independent read-only review: no material findings. Page height reduced from4454 to3236px desktop and5317 to4051px at390px mobile in captured views. No email application opened, no message sent, no plugin files changed, and no publication/commit.
