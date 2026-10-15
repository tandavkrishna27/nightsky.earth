# Complete local plugin rehearsal packages

`scripts/build-local-plugin-package.ts` assembles the five canonical NightSky workflows, their exact bundled references, icons and release notes with one separately started loopback HTTP MCP backend. It reuses the validated public rehearsal bytes and existing ZIP dependency. It does not bundle the backend, datasets, dependencies, user configuration or model traces.

Both the returned result and saved report always state `submissionReady=false` and `hostInstallationVerified=false`; the bundled release notes repeat these limits. Package generation is offline preparation. Actual loading, tool discovery and all installed-skill/model journeys remain owner-deferred acceptance work. It does not resolve the Hanle darkness interpretation or other recorded accuracy findings.

## Host layouts and primary references

Codex uses portable Agent Plugins 1.0 root `plugin.json`, root `mcp.json` with one `streamable-http` entry, `skills/`, `assets/` and `RELEASE-NOTES.md`. The existing portable metadata, review cases and publication gates are preserved. This follows [OpenAI's package format](https://developers.openai.com/plugins/build/plugins). No legacy Codex compatibility overlay is inferred or generated; a particular older host may require one after its actual capabilities are checked.

Claude uses `.claude-plugin/plugin.json`, root `.mcp.json` with one `http` entry, and the same root skills/assets/release notes. The manifest carries the source name, version, description and keywords; author is retained if supplied and never invented. Optional `displayName` is omitted for compatibility with the installed Claude Code 2.1.126, whose native validator rejects it; newer official documentation supports that field. OpenAI-specific listing/review fields are not copied into Claude's manifest. This follows the [Claude manifest and standard layout reference](https://code.claude.com/docs/en/plugins-reference) and [Claude HTTP MCP configuration](https://code.claude.com/docs/en/mcp). Initial formats were checked on 14 October; native compatibility was checked on 15 October 2026. The archive stores host files at its root, matching the existing public rehearsal archive convention; extract into a dedicated plugin directory for a later authorized local load. An account-upload route may have different packaging requirements and is unverified.

Only literal `127.0.0.1`, `localhost` or `[::1]`, lowercase `http`, an explicit port from 1 through 65535, and exact `/mcp` are accepted. Credentials, headers, additional servers, query/fragment delimiters, IP aliases, DNS alternatives, leading zero ports, normalized dot paths and non-loopback URLs are rejected before URL normalization. The public builder and public HTTPS validator are unchanged and continue rejecting loopback endpoints.

## Build and inspect

From the worktree root, build each host independently:

```powershell
node --import tsx scripts/build-local-plugin-package.ts --host codex --endpoint http://127.0.0.1:4010/mcp
node --import tsx scripts/build-local-plugin-package.ts --host claude --endpoint http://127.0.0.1:4010/mcp
```

The endpoint is mandatory and must match the separately selected backend port. The examples do not start a server. Default outputs are `dist/local-plugin-rehearsal/codex/` and `dist/local-plugin-rehearsal/claude/`, each containing its host-named rehearsal ZIP and `package-report.json`. Optional `--out <directory>` selects an explicit output directory; use a dedicated rehearsal directory. Unknown, duplicate or missing flag values fail before writing. Importing the module writes no files.

The exported `buildLocalPluginPackage({host:'codex'|'claude', endpoint:string})` returns `host`, `endpoint`, `zip` bytes, ZIP `sha256`, sorted `{path,bytes,sha256}` inventory, both false readiness flags and unresolved gates. ZIP entries use a fixed timestamp and sorted order, so identical canonical/source bytes, host and endpoint produce identical bytes and digest. Changing a workflow, endpoint or host changes the package evidence; rebuild after the final source freeze.

`validateLocalPackageFiles(files, host)` independently checks the single connection shape, exact source manifest metadata, contained paths, valid text, size bounds, secrets/machine paths, required icons, all five skill references and exact canonical reference bytes. It maps the host's files to a temporary in-memory public lint view with an HTTPS placeholder solely for existing content validation. That placeholder is never the local package's connection. No public validation rule changes.

Each installed `skills/<name>/SKILL.md` points to its adjacent `references/workflow.md`. The bundled reference is the current exact `docs/product/workflows/<name>.md` byte sequence. All five names are fixed: `find-observing-place`, `plan-stargazing-night`, `plan-astrophotography`, `plan-sky-event`, `prepare-outing`.

## Separate backend and deferred evidence

Use the existing [standalone backend build/start procedure](deployment.md) and [listener configuration](v1-host-policy-handoff.md) for a separately started backend; the builder creates no launch command and changes no runtime architecture. The backend defaults to loopback port 5000; the 4010 build examples require a separately selected matching listener port. A client must be running on a surface that can reach that machine's loopback port. Saving/uploading a ZIP to an account does not establish such access on web or mobile.

The subsequent authorized local rehearsal is recorded in [model validation](complete-model-journey-validation.md): twenty Codex prompt-fed journey answers and four supplements were reviewed, Claude native initialization exposed five skills/fourteen tools but authentication blocked inference, and native Codex installation succeeded but automatic policy rejected its skill-file read. Native skills-plus-tools acceptance remains open. Continue the original official identity, source rights/coverage, production endpoint, policy, validation, reviewer-video, submission and publication gates. Neither a deterministic ZIP nor this local validator is official host acceptance.

Focused offline regression command:

```powershell
node --import tsx --test tests/platforms/local-package.test.ts tests/platforms/package.test.ts
```
