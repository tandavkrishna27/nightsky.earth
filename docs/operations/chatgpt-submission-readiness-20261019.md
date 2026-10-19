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
| Public pages | Website PR #13 is merged; `/get-started/`, `/contact/`, `/privacy/` and `/terms/` render publicly over HTTPS. | Their four URLs are now in `plugins/nightsky/plugin.json`. The get-started page identifies the plugin and links to contact, privacy and terms. |
| Support mailbox | The owner confirmed on 19 October that the daily review and 90-days-after-last-reply deletion process is running. | Owner-operated process; no automated mailbox retention or independent sweep verification is claimed. |
| Listing artwork | The existing SVG moon-and-star mark was deterministically rendered to 512 × 512 and 64 × 64 PNGs and visually inspected. | Manifest now references the PNGs; package validation checks their signatures and minimum square dimensions. |

## Work remaining before calling the upload submission-ready

1. **Portal metadata:** confirm the verified publisher identity and a supported category in the target portal. Keep review case dates resolved in the final evidence packet.
2. **Real review evidence:** run the five positive and three negative cases against the exact hosted plugin version, recording actual calls, bounded source use, outputs and failures. Record a readable real ChatGPT demo, host it at a reviewer-accessible URL and add that verified URL to the package. The offline fixture report does not satisfy either item.
3. **Release identity:** review the package ZIP inventory, source rights, credits and exact deployed image together. The `86eacfa` source and ARM64 image CI passed, but production still runs the older deployed image. Promote the intended exact image through protected staging and production, then recheck HTTPS, MCP initialization and a bounded native journey. A source edit or ZIP build alone does not update the deployed service.
4. **Portal setup:** upload the finalized ZIP as a draft to the intended verified publisher, inspect imported values and complete portal validation and attestations. Submission for review and later publication are separate actions.

The source package metadata now points at live website pages. The current ZIP and live production image are not yet the same reviewed release. The owner confirmed the mailbox process; this record does not independently audit the mailbox.

## Source of requirements

- [OpenAI plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)
- [OpenAI plugin submission guidance](https://developers.openai.com/plugins/deploy/submission)
- [Local provider and public-page review](chatgpt-provider-rights-and-public-pages-20261019.md)
- [Local retention and host verification](chatgpt-retention-verification-20261019.md)
