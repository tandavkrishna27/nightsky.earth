# Supported local native acceptance path — 17 October 2026

Read-only inspection of installed Codex CLI **0.154.0** confirmed a supported marketplace installation interface. No installation, configuration edit, model inference, provider request or nested-CLI policy retry was performed.

## Observed interfaces and state

- `codex plugin marketplace add <SOURCE> --json` accepts a local marketplace path.
- `codex plugin add <PLUGIN@MARKETPLACE> --json` installs from a marketplace. The CLI does **not** have a `plugin install` subcommand.
- `codex plugin marketplace list` reports `nightsky-local-20261015` at this worktree's `.superpowers/local-model-session/complete-plugin`.
- That marketplace's `.agents/plugins/marketplace.json` selects `./plugins/codex`, with policy `AVAILABLE`; its existence does not prove installation of the prepared 1.0.14 package.
- Prepared `dist/codex-local-preparation-20261017/plugin/plugin.json` declares 1.0.14. The directory contains the portable manifest, MCP connection, assets and skills, but is not itself a marketplace root.
- No callable tool exposed in this session supplies a local plugin installation operation. Account plugin creation and app uninstallation tools are not replacements for this local flow.

The plugin-creator local reference directs use of supported host installation, source-directory updates and reload/reinstall; it forbids editing caches. CLI help provides the concrete commands above. The normal host's current skill catalog still identifies NightSky cache version 1.0.12.

## Concrete next action for the authorized root operator

Prepare a separate local marketplace root (for example `dist/native-acceptance-marketplace-20261017`) containing `.agents/plugins/marketplace.json` and a byte-preserving copy of the prepared package at `plugins/codex`. Use a unique marketplace name such as `nightsky-native-acceptance-20261017`, the existing local-source schema and `AVAILABLE` policy. This keeps the prior marketplace evidence intact. Review and record the package hash before installing.

From the worktree, the supported installation commands are:

```powershell
codex plugin marketplace add './dist/native-acceptance-marketplace-20261017' --json
codex plugin add nightsky@nightsky-native-acceptance-20261017 --json
```

These commands are proposed, not executed. Installation changes persistent local host state and belongs to the authorized root operator. Do not claim the prepared ZIP or source manifest is installed-host evidence. Confirm the returned installation identity/version, then use the host's normal refresh or a fresh normal Codex chat selecting that exact plugin. Avoid simultaneously selecting the older NightSky installation.

Once that session is ready, start `node --import tsx scripts/prepare-codex-local-fixture.ts --serve` in the task terminal. Within its 120-second/twelve-call bounds, perform one explicit native preflight and save the actual installed skill/reference loading, MCP arguments/results and full answer. Review loading, transport and semantics separately before continuing. A separate unprompted observation is required for automatic discovery. Preserve each case's listener report before restarting.

## Remaining gates

The supported CLI resolves the previously uncertain installation-command question. It does not resolve actual 1.0.14 installation, fresh-host capability refresh, native answer quality or automatic discovery. Those are execution/evidence gates, not demonstrated technical impossibilities. The recorded nested Codex CLI cached-skill rejection remains blocked by policy; do not invoke the complete-model CLI runner or another nested model command to bypass it. The owner outing/conversation acceptance and deferred Claude checks remain separate.

## Executed supported installation

The coordinating operator registered the separate marketplace and ran the supported `codex plugin add` command. The installer returned plugin ID `nightsky@nightsky-native-acceptance-20261017`, version **1.0.14**, installed at `C:/Users/TK/.codex/plugins/cache/nightsky-native-acceptance-20261017/nightsky/1.0.14`. No cache was edited, no nested model was invoked, and no provider request occurred. The previous marketplace was preserved.

The active tool inventory in this existing chat still exposes no NightSky MCP tools. Consequently no native preflight was attempted and no fixture listener was left running. A normal host refresh/fresh session selecting this specific installed plugin remains necessary. Installation is now evidenced; native loading, tool transport and complete-answer acceptance are not.
