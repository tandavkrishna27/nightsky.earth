# ChatGPT release alignment plan

**Date:** 19 October 2026
**Goal:** Make the hosted NightSky plugin and its public website accurate and reviewable for ChatGPT submission, while keeping the free-source profile and existing production quota state intact.
**Source review:** [ChatGPT provider rights and public pages](../../operations/chatgpt-provider-rights-and-public-pages-20261019.md).
**Scope:** ChatGPT first. Claude, Gemini and Grok get separate integration and publication checks.

## Current baseline

The remote MCP endpoint is live. The production data profile selects Geoapify, MET Norway and DarkSkySites; Astronomy Engine calculates sky geometry locally. A bounded production check exercised the three providers. Other adapters are implemented or researched, but are not all admitted. GitHub Actions is presently delayed by a reported service incident. The website has an independent active editing worktree, so public-page edits must be made there by its owner or after that work is reconciled.

## Progress on 19 October

- Confirmed the personal operator name with the owner: Tandav Krishna (TK).
- The owner chose deletion of support email 90 days after the last reply; [the retention handoff](../../operations/chatgpt-retention-verification-20261019.md) records the enforcement and host checks needed before publishing that as an active promise.
- The read-only host audit and Hetzner Console check are recorded in that handoff. Production nginx logging is known; automatic backups are disabled and there are no NightSky server snapshots. Docker and journald age limits remain unknown and are disclosed honestly. The owner accepted the current size-based/unknown-age host-log behavior for V1 preparation; adding a time-based limit is an operational improvement. Public review may still request a clearer timeline. Support-mail retention and policy approval remain separate gates.
- Corrected draft plugin policy wording for a general-audience ChatGPT listing and updated the hosted-feature release note. Type checks and all eight offline review assertion sets pass.
- Corrected the website worktree's age, active-provider and deployed-host statements without discarding its other edits. The current host logging and backup state was checked and recorded on 19 October; no fixed host-log deletion period is claimed. Website type checks, 47 unit tests, six contact/source browser cases and preview build passed when last run.
- The website edits are still local in a separately active worktree; the live site has **not** been updated. Source inventory, content rights, support-mail retention, final policy and setup approvals remain unset. The full native hosted conversation review and public submission remain pending.
- Replaced past-dated ChatGPT review prompts with relative dates. The offline review script still uses fixed synthetic 2026 fixtures to check tool contracts; it does not verify the live assistant behavior for those relative prompts. The exact dates and host responses must be recorded in the final native review.

## Sequence and acceptance

### 1. Freeze the ChatGPT source profile

- Keep the four current sources active and preserve their quota ledgers. Confirm adjacent Geoapify/OSM and DarkSkySites credit on actual ChatGPT tool answers and cards.
- Admit WeatherAPI only after the account has returned to its actual Free tier and a bounded request confirms the three-day fields. Admit OpenWeather only after the required logo/link and derivative/alteration-method obligations are satisfied on the rendered client surface. Admit Public Universe by screened record class with upstream rights and its dedicated ledger. All others remain explicitly unavailable until their documented gate passes.
- Review each activation as a separate configuration change: source entitlement, sample semantics, quota policy, credits, fallback, staging, bounded live check and protected promotion. Existing keys alone do not enable a source.
- **Done when:** the selected/admitted provider lists, source matrix and actual output agree. No paid endpoint, bulk data acquisition or browser scraping is needed for ChatGPT V1.

### 2. Align public website pages

- In the website worktree, reconcile existing edits before changing files. Update live privacy and terms to describe the deployed Hetzner service, actual selected providers, data recipients, logging/cache/ledger retention and support channel. Replace the blanket 18+ statement with general-audience 13+ content plus host-specific age/consent rules, without claiming age verification.
- Use the website's existing `/contact` page as the ChatGPT support URL. Verify its published HTTPS response and the monitored email; the MCP draft's `/support` path does not need to be exposed by the website.
- Maintain a readable sources page, plus provider-required credit adjacent to values in cards or answers. Keep ChatGPT installation labelled private/preview until a real approved listing exists.
- **Done when:** live HTTPS privacy, terms, support, sources and get-started pages match the running service and pass a rendered-content check on desktop and mobile.

### 3. Complete ChatGPT package and submission evidence

- Inspect `plugins/nightsky/plugin.json`, package skill instructions and remote MCP tool descriptions against current production behavior. Remove stale rehearsal dates or “endpoint pending” text. Verify all metadata URLs use the final site pages.
- Run the five positive and three negative review cases with a fixed evidence packet. Include place discovery, point darkness, weather-source disagreement, event planning, unavailable optional source and source credit. Record tool calls, bounded provider usage, answer quality and failures.
- Complete publisher/domain verification, tool and skill safety checks, listing text, icons and the demo required by OpenAI. Keep submission as its own decision after evidence is assembled.
- **Done when:** the ZIP/manifest, endpoint, website and review evidence describe the same version and no unsupported capability is promised.

### 4. Configuration and release path

- Existing GitHub `production` environment secret `NIGHTSKY_PRODUCTION_ENV` is the single protected provider configuration payload; SSH deployment secrets are separate. Do not create per-provider GitHub secrets merely because keys exist locally. Update the payload only for sources that passed step 1 and preserve quota checkpoint files.
- Once GitHub Actions recovers, check the exact source and ARM64 image workflows. Promote an immutable digest through staging and the protected production workflow. A secret edit by itself does not update the running container.
- **Done when:** exact-commit CI, staging health, production health/MCP initialization and one bounded production acceptance match the release record. No new deployment is authorized by this plan.

### 5. Final ChatGPT experience review

- Test the installed hosted plugin in a normal ChatGPT conversation with real outdoor place candidates, point-specific darkness, a near-term forecast, a far-future meteor plan and an optional-source failure. Include follow-ups asking for exact values, uncertainty, sources and an on-site walkthrough.
- Confirm the answer starts usefully, asks only relevant follow-up questions, identifies city versus site evidence, explains SQM/Bortle simply, and never presents a model estimate as a live measurement or a sampled forecast as a continuous clear interval.
- Fix material failures, rerun affected cases and record remaining limits before any public submission.

## Parallel work and dependency

Website copy/source-credit design and plugin package review can proceed in parallel. Provider activation depends on rights, entitlement and rendered credit. Final native review depends on the assembled package and public pages; public submission depends on all preceding evidence. GitHub incident recovery is a release-pipeline dependency, not a reason to guess that queued jobs passed.
