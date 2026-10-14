# V1 owner inputs and configuration record — 14 October 2026

This is the fill-in decision record for Tasks 13/14. Follow [policy/host procedure](policy-host-wave.md) and [deployment](deployment.md) for execution; this document adds no deployment authorization. Source review found the existing handshake and rehearsal procedures sufficient. The missing local deliverable was a concrete record of unresolved values and their conditional use. No hosting values, retention periods or publisher legal identity are inferred.

## Actual input status and conditions

| Decision | Known now | Required next value / acceptance condition |
|---|---|---|
| Publisher | Individual based in India; display name confirmed `NightSky.earth` | Exact verified legal name; required contact/address details determined by qualified review and submission requirements. |
| Support | Monitored `nightsky.earth2026@gmail.com` | Named mailbox operator, access/deletion process, chosen retention and relevant mail/backup handling. No invented response SLA. |
| MCP host | Hetzner chosen; exact values explicitly deferred until deployment preparation | Supply exact product, architecture, region and allocated resources, current quote and approved recurring ceiling. The earlier 2 vCPU/4 GiB and $25/month proposals are not selected/approved values. |
| Production/staging | Exact values never supplied | Two distinct controlled hostnames, full HTTPS MCP URLs and DNS/TLS/proxy topology. Freeze the production URL before real draft creation. |
| Policy hosting | Same-repository static website intended; standalone plugin serves no policy pages | Confirm final policy host and exact privacy/terms/support HTTPS URLs, direct-route behavior, approved content and legal review. |
| Release | Standalone image recipe exists | Exact source commit, built image digest, architecture, mode, immutable mounted artifact selections and previous release record. Base-image digest alone is not a built release digest. |
| Logs and budgets | Code bounds/log format verified below | Actual edge/container/provider retention and access, process count and resource/provider budgets, actual-host capacity and rollback evidence. |

These values close input ambiguity only. Hosted streaming, TLS/firewall, redaction, promotion/rollback, official scans and publication remain their existing release gates. One-off data-build ceiling is required if paid data processing is proposed; it is not a prerequisite for an offline resolver rehearsal. Additional dashboards, on-call schedules or support response targets are optional enrichments, not new closure requirements.

## Declarative operator template

Copy this record to private operator storage and fill it with actual decisions. It is **not executable configuration**, is deliberately incomplete and has no deployable hostname. `null` means unknown, not an instruction to omit a required gate. Do not pass it to Docker or source it as an environment file. Do not add credentials. Keep a redacted version with evidence references.

```json
{
  "status": "pending-owner-inputs-not-deployable",
  "publisher": { "type": "individual", "country": "India", "displayName": "NightSky.earth", "verifiedLegalName": null, "requiredContactDetails": null },
  "support": { "email": "nightsky.earth2026@gmail.com", "operator": null, "retention": null, "deletionAndAccessProcess": null, "mailAndBackupHandling": null },
  "host": { "provider": "Hetzner", "plan": null, "architecture": null, "region": null, "vCPU": null, "ramBytes": null, "diskBytes": null, "os": null, "quoteReference": null, "approvedRecurringCeiling": null },
  "endpoints": { "productionHostname": null, "productionMcpUrl": null, "stagingHostname": null, "stagingMcpUrl": null, "privacyUrl": null, "termsUrl": null, "supportUrl": null },
  "release": { "sourceCommit": null, "imageDigest": null, "processCount": null, "resourceLimits": null, "previousReleaseReference": null },
  "network": { "proxyTopology": null, "backendBinding": null, "firewallAndIpv6Evidence": null, "tlsEvidence": null, "headerRewriteEvidence": null },
  "runtimeEnvironment": {
    "NODE_ENV": "production", "HOST": null, "PORT": null,
    "NIGHTSKY_MCP_ALLOWED_HOSTS": null, "NIGHTSKY_MCP_TRUSTED_PROXIES": null, "NIGHTSKY_MCP_TOOL_MODE": null,
    "MET_NORWAY_USER_AGENT": null, "NIGHTSKY_GEONAMES_INDEX": null,
    "NIGHTSKY_OSM_CANDIDATE_INDEX": null, "NIGHTSKY_OSM_CANDIDATE_SHA256": null, "NIGHTSKY_OSM_CANDIDATE_MAX_BYTES": null,
    "NIGHTSKY_OSM_REGIONAL_MANIFEST": null, "NIGHTSKY_OSM_REGIONAL_SHA256": null,
    "NIGHTSKY_CLIMATE_ARTIFACT": null, "NIGHTSKY_CLIMATE_SHA256": null
  },
  "artifacts": { "geonamesReviewedDigestAndCoverage": null, "osmReviewedVersionOfferAndCoverage": null, "climateReviewedDigestAndCoverage": null, "mountPermissionsEvidence": null },
  "operations": { "proxyLogFormatAndRetention": null, "containerLogDriverRotationAndRetention": null, "hostProviderLogHandling": null, "backupRetentionAndAccess": null, "providerBudgetEvidence": null, "capacityEvidence": null, "rollbackEvidence": null },
  "policy": { "hostingDecision": null, "qualifiedReviewReference": null, "legacyContactAndClaimsReview": null, "publicationApprovalReference": null }
}
```

## Verified runtime contracts

Reviewed `server/plugin.ts`, `server/mcp/route.ts`, `server/mcp/proxyTrust.ts`, `server/mcp/metadata.ts`, artifact loaders, `server/providers/upstreamControls.ts`, `server/requestLogging.ts`, `Dockerfile.plugin` and `scripts/build-plugin-package.ts` locally. These are source facts, not fresh hosted evidence.

* Listener defaults: `HOST=127.0.0.1`, `PORT=5000`; mode defaults to `full` and accepts only `full`/`resolver-only`. Choose mode explicitly. Default MCP allowed hosts are loopback; configure bare reviewed hostnames. Proxy trust is disabled unless explicitly configured for narrow single-proxy peers. Docker/container topology must determine binding and restricted reachability before selecting values.
* Resolver-only validates regional configuration without loading candidate artifacts. Regional manifest/path digest must be set together and cannot coexist with `NIGHTSKY_OSM_CANDIDATE_INDEX`. Full regional mode loads the pinned manifest at startup. Single-index OSM checksum is optional in code, so a public release must explicitly pin it; byte ceiling defaults/maxes to 512 MiB. Regional defaults are two resident regions, 8 MiB serialized bytes, 20,000 rows and eight active/pending queries; these are code options, not environment variables. Serialized bytes do not establish RSS.
* GeoNames has a path environment setting but no runtime SHA256 environment setting. Record its independently reviewed digest in the release inventory and verify before mounting; do not invent `NIGHTSKY_GEONAMES_SHA256`. Climate uses its path/digest pair. Review referenced files as well as manifests and retain complete immutable selections for restart/rollback. No runtime CDS credential or database is required.
* `/mcp` defaults per process: 60 requests/IP/60 seconds, 600 global/60 seconds, 20 active requests and 10,000 IP keys; subject tool-call allowance defaults to 60/60 seconds with 10,000 salted digest keys. These are dependency/code options, not operator environment settings. They do not coordinate separate processes. Admission remains retained until underlying work settles after cancellation.
* Upstream defaults per process: eight concurrent globally/four per provider, 300 calls/minute globally, 240/minute and 19/second per provider; 4 MiB response bound and backoff capped at 300 seconds. They are code defaults, not claimed provider entitlement or environment knobs. Full mode needs an accurate MET User-Agent using the confirmed contact.
* Application logs use fixed route labels, method, status and duration; bodies, query strings, hints, subjects and arbitrary path segments are not interpolated by this logger. Startup messages are fixed. This creates stdout records; no code retention/deletion schedule is implemented. IP counters and salted subject digests are bounded process memory with no exact idle-key deletion SLA. Proxy, container, provider, support-mail and backups require their own verified settings.
* `/health` is liveness for the default standalone app. Package generation defaults to an example endpoint and explicitly returns `submissionReady: false`; its output is rehearsal material until actual endpoint/policy/identity and other submission gates are satisfied.

Existing [rollback evidence](artifact-rollback.md) pins the 59-node OSM fixture and three-place 2025 climate sample. Those digests identify existing local rehearsal artifacts; they must not be copied as the production selections without a deliberate coverage decision. The pinned Node base in `Dockerfile.plugin` is likewise not a release-image digest. No further fixture run adds evidence for the unsupplied host choices, so this handoff does not claim a new runtime rehearsal.

Owner steering: finish local implementation and bounded actual-model testing first. Hosting inputs are deliberately deferred; no deployment is authorized. The confirmed display name does not independently verify a legal identity.
