# ChatGPT submission readiness record

**Reviewed:** 19 October 2026. **Scope:** the current ChatGPT-first package. This is a preparation record, not a public submission or approval.

## What is ready locally

| Item | Evidence | Status |
| --- | --- | --- |
| Production transport | `https://mcp.nightsky.earth/mcp` initialized successfully after the approved production deployment; `/health` returned 200. | Previously checked on the deployed `d026288` image; recheck the exact submitted version. |
| Core source profile | Geoapify/OSM place search, MET Norway forecast, DarkSkySites modelled darkness and local Astronomy Engine calculations are the selected profile. | The bounded production check exercised the three remote providers. Other adapters remain unadmitted. |
| Plugin review cases | Five positive and three negative cases in `plugins/nightsky/plugin.json`. | Eight offline server assertion sets pass with zero external provider calls. Assistant routing and answers remain unverified for the revised relative-date prompts. |
| Portable package | `npm run plugin:package -- --endpoint https://mcp.nightsky.earth/mcp --out dist/chatgpt-release-review` builds a ZIP with the real endpoint and five skills. | Local rehearsal archive only; its builder reports `submissionReady: false`. The source `mcp.json` still holds a deliberate placeholder and must not be uploaded directly. |
| Host facts | Production nginx access logging is off; Docker logs are size-limited; journald age is unbounded; Hetzner automatic backups and snapshots are off. | Documented without a fixed host-log deletion promise. |

## Work remaining before calling the upload submission-ready

1. **Public pages:** reconcile and publish the website worktree. Recheck the public website, privacy, terms and `/contact` pages over HTTPS and confirm their rendered text covers the actual running source profile and support channel. Local edits are not public evidence.
2. **Support mail:** TK will implement the chosen 90-days-after-last-reply process, including a first sweep and permanent removal of due mail from Trash. Until verified, the public copy must not promise that rule. Host-log age is separately described as variable/unknown; changing host logging or backups requires updating the policy.
3. **Package metadata and artwork:** after the pages are live, put their four verified HTTPS URLs into `extensions.com.openai.interface`. Confirm the verified publisher identity and a supported category in the target portal. Replace or supplement the current SVG logo/composer icon with inspected square PNG assets meeting the portal's size requirements. Keep review case dates resolved in the final evidence packet.
4. **Real review evidence:** run the five positive and three negative cases against the exact hosted plugin version, recording actual calls, bounded source use, outputs and failures. Record a readable real ChatGPT demo, host it at a reviewer-accessible URL and add that verified URL to the package. The offline fixture report does not satisfy either item.
5. **Release identity:** review the package ZIP inventory, source rights, credits and exact deployed image together. Run the exact-commit source/image CI, promote the image through protected staging and production, and recheck HTTPS, MCP initialization and a bounded native journey. A source edit or ZIP build alone does not update the deployed service.
6. **Portal setup:** upload the finalized ZIP as a draft to the intended verified publisher, inspect imported values and complete portal validation and attestations. Submission for review and later publication are separate actions.

The website branch has other concurrent edits. Do not stage or discard its whole worktree when integrating the ChatGPT page changes. The current ZIP and live production image are not yet the same reviewed release.

## Source of requirements

- [OpenAI plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)
- [OpenAI plugin submission guidance](https://developers.openai.com/plugins/deploy/submission)
- [Local provider and public-page review](chatgpt-provider-rights-and-public-pages-20261019.md)
- [Local retention and host verification](chatgpt-retention-verification-20261019.md)
