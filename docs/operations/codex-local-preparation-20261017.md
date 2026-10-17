# Codex local fixture preparation — 17 October 2026

Prepared from source base `2b298d5` with the local preparation changes in this worktree. This is local offline transport/package evidence; installed host loading and answer acceptance remain pending. The plugin update and TDD skills were used.

## Reproduce

From the `plugin-v1` worktree:

```powershell
node --import tsx scripts/prepare-codex-local-fixture.ts
node --import tsx --test tests/platforms/codex-local-fixture.test.ts tests/platforms/api-model-harness.test.ts
```

The first command starts the real MCP route on `127.0.0.1:8765`, lists fourteen tools, resolves synthetic Fictionvale, builds the complete five-skill Codex package with that exact endpoint, and closes the listener. It neither installs the package nor calls a model. Port collision fails rather than selecting a different endpoint. `--port` and `--out` explicitly select another binding/output; port zero is useful for automated tests but does not give a stable restart endpoint.

Artifacts under `dist/codex-local-preparation-20261017/`:

- `nightsky-codex-local-rehearsal.zip`: version **1.0.14**, SHA-256 **498258fac6326dcc7b8ee0ac592b1a9cb578adeb7042c3ab42d069fdfb206393**.
- `plugin/`: unpacked portable package including five complete skill/reference pairs, manifest, MCP connection and assets.
- `package-report.json`: per-entry hashes and package gates.
- `preparation-report.json`: verified endpoint/inventory, two synthetic API transport attempts and zero external provider attempts.

The six focused tests passed, including two newly observed failures before implementation: requested port was ignored, and preparation entrypoint was absent. The new integration test verifies actual HTTP tool discovery/resolution, package connection consistency and listener closure. Existing API fixture tests cover unavailable/ambiguous/unknown-zone/expired/stale selection paths and twelve-call caps. Broad repository verification belongs to the integrating operator.

## Start a bounded preflight

Only when the supported native host session and package-loading mechanism are ready, run in a visible task terminal:

```powershell
node --import tsx scripts/prepare-codex-local-fixture.ts --serve
```

This regenerates the same bytes for the same source/endpoint, clears the preparation call from the case budget, and keeps the loopback listener alive for **120 seconds** or until Ctrl+C. It permits at most **twelve MCP calls**. On orderly stop it writes `listener-report.json` with traces/counters and closes connections. No background process is installed. Start a fresh bounded listener for a new case; records must be copied to a unique case evidence folder before reusing the output path. Synthetic API services have closed fixture transport and no live fallback, no actual keys, and no private ledger. The advancing synthetic clock cannot measure live provider pacing or forecast accuracy.

The root operator owns starting the final session. This preparation leaves no running listener. A supported host refresh must show the actual installed 1.0.14 package and exact loopback binding, complete packaged skill/reference reads, and native calls. Review the whole first answer before continuing the matrix. Automatic discovery needs a separate observation. Capture source revision, package hash, sanitized answer/traces and loading/transport/semantic verdicts independently.

The recorded nested Codex CLI cached-skill read remains **blocked by policy**. This preparation provides no retry, alternate model call, policy change or installation workaround. No persistent host files or caches were changed. If the normal host lacks a supported reviewed loading mechanism, stop at these artifacts and retain the gate. Claude remains owner-deferred; no deployment, publication or provider request was made.
