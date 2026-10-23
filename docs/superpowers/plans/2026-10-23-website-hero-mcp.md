# Homepage Hero and MCP Address Implementation Plan

> **For agentic workers:** Implement the two page changes in this local worktree. The owner will review the preview before publication.

**Goal:** Update NightSky’s homepage message and expose its public MCP address on the homepage and Get Started page.

**Architecture:** A shared `McpAddressCard` reads the existing validated endpoint constant and owns its clipboard feedback. Home and Get Started place it in their existing page structure with page-specific sizing. The existing setup guide keeps its own detailed connection steps.

**Tech Stack:** React, TypeScript, CSS.

**Spec:** `docs/superpowers/specs/2026-10-23-website-hero-mcp.md`

## Global Constraints

- Public URL: `https://mcp.nightsky.earth/mcp` from `NIGHTSKY_PUBLIC_MCP_URL`.
- Hero headline: “Know when, where, and how to look up.”
- Preserve the welcome screen, footer, and existing detailed guide. Label ChatGPT and Claude as under directory review and Gemini and Grok as listing coming soon while retaining manual setup links.
- Keep changes local; no deployment.

## Review Focus

- Narrow phones: headline and URL wrap without horizontal overflow.
- Clipboard unavailable: the address remains selectable, the button shows Retry, and assistive technology hears manual-copy guidance.
- Copy success: five stars twinkle around the card edge, its border brightens, and the fixed-size button shows a temporary checkmark without moving the card; reduced-motion preference disables the star animation.
- Assistive technology: copy state is announced without relying on icon changes.
- Directory pending states: the new card does not imply a public marketplace listing.

## Tasks

- [x] Update the homepage hero headline and supporting copy in `client/src/pages/Home.tsx` and `client/src/content/websiteCopy.ts`.
- [x] Add `client/src/components/setup/McpAddressCard.tsx` using the existing public endpoint constant, a copy button, a selectable URL, and accessible status feedback.
- [x] Place the compact card beneath the homepage action and assistant names; place the larger card between the Get Started intro and assistant cards.
- [x] Add responsive styles in `client/src/styles/home.css` and `client/src/styles/get-started.css` with shared card rules in `client/src/styles/mcp-address-card.css`.
- [x] Owner reviewed the local design; desktop and phone widths were checked before publication.
