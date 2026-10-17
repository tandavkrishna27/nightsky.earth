# Next geography selection packet — preparation only

Prepared 17 October 2026 from the integrated geography executor. **This document is a reviewable proposal, not live authorization.** Preparation used source and existing operational documents only; no private configuration was read, quota state inspected, provider request sent, or deployment performed.

## Exact proposed request and allowance

Authorize only envelope `geometry-selection-v2-va-1-1-30-zero-retries`, invoked with the single script argument `--selection-live`.

```text
GET https://api.geoapify.com/v1/geocode/search?country=Vatican+City&type=country&filter=countrycode%3Ava&bias=countrycode%3Anone&limit=5&format=geojson
```

The executor appends `apiKey` privately; the URL above deliberately excludes that secret parameter. The six public parameters are exactly `country=Vatican City`, `type=country`, `filter=countrycode:va`, `bias=countrycode:none`, `limit=5`, and `format=geojson`. No body, redirect, alias, pagination, fallback provider or retry is permitted.

| Limit | Maximum |
| --- | --- |
| HTTP requests | 1 |
| Geoapify quota credits reserved | 1 |
| Packet transport deadline | 30 seconds |
| Response body / total response bytes | 262144 / 262144 |
| Retries | 0 |

The HTTP client additionally applies a request timeout of at most 5000 ms. The 30-second guard bounds transport, not arbitrary filesystem stalls or total process startup/shutdown time. The journal has its own 262144-byte ceiling. Credits are reserved durably before fetching; an uncertain or failed attempt does not authorize a refund or another attempt.

## Invocation after separate explicit approval

Use Node 24 and the installed dependencies from this worktree. The existing approved private environment is `C:/Users/TK/.nightsky/providers.env`, and its recorded quota path is `C:/Users/TK/.nightsky/provider-quota.json`. Load the file into the child process without displaying or copying its contents. Do not initialize/reset quota, delete checkpoints, journals or markers, remove locks, or switch quota paths to bypass a refusal. Run one operator process only.

The following PowerShell command is prepared for a future authorized operator. **Do not execute it during preparation.** The outer Node process loads existing private configuration; the inner process receives only scoped invocation overrides, leaving the shell and private file unchanged. A fresh UUID creates a valid lowercase batch ID, but never creates fresh account allowance.

```powershell
Set-Location -LiteralPath 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\plugin-v1'
@'
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const env = {
  ...process.env,
  NIGHTSKY_LIVE_APPROVED_ENVELOPE: 'geometry-selection-v2-va-1-1-30-zero-retries',
  NIGHTSKY_LIVE_BATCH_ID: 'geo-selection-' + randomUUID(),
  NIGHTSKY_LIVE_GEOAPIFY_ADMITTED: 'yes',
  NIGHTSKY_DISCOVERY_MODE: 'api',
  NIGHTSKY_GEOMETRY_ENABLED: 'false',
  NIGHTSKY_GEOMETRY_SOURCE_ACCEPTED: 'false'
};
const result = spawnSync(process.execPath,
  ['--import', 'tsx', 'scripts/validate-geometry-live.ts', '--selection-live'],
  { env, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
'@ | node --env-file=C:/Users/TK/.nightsky/providers.env --input-type=module
```

Neither command arguments nor printed output contain credential values. The child requires existing `NIGHTSKY_GEOAPIFY_API_KEY` and `NIGHTSKY_QUOTA_STATE_PATH`. Do not add a preflight API call, credential dump, quota initialization, package installation, or automatic rerun to this command. Review any inherited environment conflict privately before executing; Node's existing process environment takes precedence over values in an env file.

For offline proposal inspection only, the actual CLI accepts no arguments:

```powershell
node --import tsx scripts/validate-geometry-live.ts
```

The no-argument path returns proposal metadata before accessing configuration or quota. Do not substitute `--live`: that selects the separate six-request/nine-credit envelope and is outside this proposal. No `--dry-run`, output-file, timeout, byte-limit or retry override flag exists.

## Evidence and stop rules

The exclusive journal is `geometry-live-<batch>.jsonl` beside the existing quota file. It records the envelope/batch/start, synchronized attempt-start and completion records, safe selection facts, selected public identity when eligible, and final report. Attempt evidence includes public query, cost, HTTP status, bytes, elapsed milliseconds and outcome. Selection facts include collection/feature validity, count, expected-country/type checks and bounded identity validity. No raw response body or coordinates are retained. Preserve the private journal; publish only reviewed safe evidence, never private configuration or the quota ledger.

Success requires exactly one eligible `Feature` with `country_code=va`, `result_type=country`, and a control-free opaque `place_id` of 3–2048 characters. The returned ID must not contain the credential. Successful final evidence is `status=selection-completed`, `results=[]`, `sourceAccepted=false`, `productionEnabled=false`, and `phase=vatican-geocode`. HTTP 200 or exit code zero alone is insufficient: a stopped packet can return a report with exit code zero.

Stop after the one selection even on success. Stop on malformed/empty/over-limit/ambiguous or ineligible selection, unsafe identity, missing/corrupt/locked quota, quota refusal, exclusive-journal collision, persistence failure, unexpected endpoint/query, redirect, non-success HTTP response, timeout, or byte/deadline limit. Preserve uncertain attempts and partial journals; report the observed stop reason without inferring discarded response contents. No rerun with a new batch is authorized by failure or by this document.

An outer refusal prints `status=refused-or-failed` and the selection envelope for the exact `--selection-live` invocation. Some failures before journal creation have no receipt; report that absence rather than inventing one.

The previous Vatican attempt consumed one credit and stopped before geometry. Its HTTP 200, 136-byte, 445-ms receipt does not establish why selection failed. This revised structured request is a contract correction, not a diagnosis or a retry under the consumed allowance. Selection success authorizes no Details acquisition, park lookup, second country, source acceptance, production gate change, deployment or real-client acceptance claim.

## Source verification

The flags, envelope strings, exact query, guards and receipt fields above were checked by reading [the executor](../../scripts/validate-geometry-live.ts), [Geoapify query construction](../../server/places/api/geoapify.ts) and [HTTP client](../../server/places/api/http.ts). Existing authority/quota instructions are in [the validator guide](../../scripts/validate-geometry-live.md), [API validation proposal](api-live-validation-proposal.md), [private setup record](api-mode-local-setup.md) and [geography handoff](API-GEOGRAPHY-COMPLETION.md). The invocation is prepared from those interfaces; it has not been executed live.

The coordinator rechecked [Geoapify pricing](https://www.geoapify.com/pricing/) on 17 October 2026: simple geocoding uses one credit; the Free tier lists 3000 credits/day. The application's stricter existing quota policy is unchanged. This does not inspect current account balance or authorize a request.
