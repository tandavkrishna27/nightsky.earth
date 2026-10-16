# Exact Icechunk metadata owner-review proposal — 17 October 2026

**Local preparation is ready; source execution is not approved.** This is the
concrete four-request candidate for separately approved bounded metadata
observation. No source request has occurred. Unknown-feature exclusion and
scientific admission remain false; the result is Icechunk 2.3.0's interpretation
of pinned metadata, not full format/scientific compatibility.

This candidate expires at **2026-10-17T20:53:24.103083+00:00**
(**2026-10-18T02:23:24.103083+05:30**, India time).
An expired or changed packet needs regeneration and review of its new bytes;
approval of these bytes never authorizes a replacement packet.

## Exact review objects

| Object | SHA-256 |
| --- | --- |
| [Candidate packet](data-pilot-evidence/2026-10-17-icechunk-candidate-packet.json) | `c6b263ff07d8a740d7119e469bc72fb37f917e584744bfd8b7ea0245b57eeb71` |
| [Unapproved allowance template](data-pilot-evidence/2026-10-17-icechunk-allowance-template.json) | `1cff7177bef844669f24510988aa24a9abc8bfca14f1dbec36b44a2f77f183a4` |
| [Review bundle](data-pilot-evidence/2026-10-17-icechunk-review-bundle.json) | `77eaec14bdc33b5303219f06ea206bf139adf6cf110bf5213f7310515b0b5585` |
| Exact approved-shape bytes, only a nested preview in the bundle | `2d07deef8e239988912c26a99b272d73934ef312b4cd8ddca054d3318d54d14d` |

The retained template has `decision=proposed-metadata-only` and
`allowExecution=false`; it cannot pass executor authority checks. The bundle
contains the exact future approved-shape canonical JSON as a nested string so
its hash/command can be reviewed now. It is not an allowance file. No retained
approved allowance, claim or output directory was created.

The packet byte-binds both parser scripts, the reused supervisor/path modules,
Python executable/DLL/standard-library bytes, seven isolated dependencies and
the reused lane NumPy/typing trees. Paths deliberately select this owned lane.
The packet hashes identify the current implementation. Since `6452712`, the
executor approval window is 24 hours; owned test roots were canonicalized after
the Windows CI alias rejection. The strict production path guard is unchanged.

Working directory: `C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness`

Fresh output root (must remain absent): `C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\.data\icechunk-source-metadata-20261017-review1`

Future allowance path (currently absent): `C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\.data\icechunk-source-metadata-20261017-approved-allowance.json`

## Host, requests and resource contract

Only HTTPS host `earthmover-icechunk-era5.s3.us-east-1.amazonaws.com` is allowed:

1. HEAD then conditional GET `https://earthmover-icechunk-era5.s3.us-east-1.amazonaws.com/icechunkV2/repo` with the exact ETag.
2. Resolve `main` once using only quarantined local bytes; validate the
   canonical 20-character snapshot ID.
3. HEAD then conditional GET `https://earthmover-icechunk-era5.s3.us-east-1.amazonaws.com/icechunkV2/snapshots/{ID}` with that ID and exact ETag.
4. Parse only the six fixed local Zarr descriptor keys in the packet.

Four serial requests maximum; 1 MiB per declared object, 2 MiB aggregate
received response-body bytes, 32 KiB headers per response, zero retries or
redirects. TLS/protocol overhead is distinct from the response-body cap.
No listing, alternate reference/history lookup, manifest, observation chunk,
virtual target, status/coordinate value array, credential/account operation or
provider job is permitted.

The shared deadline is 120 seconds, each HTTP operation at most 30 seconds,
each local parse at most 15 seconds, each expansion at most 16 MiB; JSON depth
32 and 100,000 aggregate descriptor entries. The native worker requires actual
Windows Job containment: hard 512 MiB tree commit, at most two active processes,
with main-worker peak RSS checked against 256 MiB, including after exit.
Thread counts are one; the worker uses the direct base interpreter with isolated
paths and sanitized private config/temp environment. Approved dependencies
already occupy 70,453,339 archive-plus-target bytes within their separate
128 MiB development ceiling; this proposal adds no packages.

Stop on changed/expired hashes or authority, reused output/allowance, absent
containment/parent pipe, unexpected status/header/encoding/ETag/length, invalid
ID or internal identity, unsupported header/version, malformed native metadata,
missing/invalid descriptor, or any byte/time/memory/JSON bound. Retain durable
intent, raw/derived objects and receipts. No automatic retry, alternate output,
broader access or allowance reuse follows a stop.

## Verified local entrypoints

Actual `preflight()` rejected the exact unapproved template after checking
current pins. An ephemeral approved-shape **test fixture** passed that same
entrypoint using this exact packet/output/hash contract, while transport
construction was trapped. The fixture was deleted; no claim/worker/supervisor
or request ran. The review bundle records these checks. Independent review is
clear: current pins, all candidate hashes, 24-hour validity, command arrays and
PowerShell syntax match; activation, output and claim remain absent. The runtime
also passed the [focused verification](data-pilot-evidence/2026-10-17-icechunk-offline-verification.json),
including actual contained native parsing, attempted-access instrumentation and
the independent Job/pipe helper check. Live TLS and source content remain
unobserved; a source mismatch must stop within these limits.

## Exact activation and commands, only after explicit owner approval

The owner must approve this exact unexpired packet, host, request and resource
contract before the activation below. Until then, do not materialize the nested
approved-shape bytes or run the execution command. The first block verifies the
bundle and bytes, then creates the approved allowance exclusively; it never
overwrites a file.

```powershell
$bundlePath = 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\docs\operations\data-pilot-evidence\2026-10-17-icechunk-review-bundle.json'
if ((Get-FileHash -LiteralPath $bundlePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne '77eaec14bdc33b5303219f06ea206bf139adf6cf110bf5213f7310515b0b5585') { throw 'Review bundle changed' }
$review = Get-Content -LiteralPath $bundlePath -Raw | ConvertFrom-Json
$activation = $review.activationAfterExplicitOwnerApprovalOnly
$bytes = [Text.Encoding]::UTF8.GetBytes($activation.canonicalJson)
$hasher = [Security.Cryptography.SHA256]::Create()
try { $hash = [BitConverter]::ToString($hasher.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant() } finally { $hasher.Dispose() }
if ($hash -ne $activation.sha256) { throw 'Allowance preview changed' }
$stream = [IO.File]::Open($activation.path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
try { $stream.Write($bytes, 0, $bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
```

Run the exact offline preflight first; stop on a nonzero exit:

```powershell
& 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\.data\weather-py314\Scripts\python.exe' '-B' 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\scripts\era5\icechunk_metadata.py' '--preflight' '--packet' 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\docs\operations\data-pilot-evidence\2026-10-17-icechunk-candidate-packet.json' '--expected-packet-sha256' 'c6b263ff07d8a740d7119e469bc72fb37f917e584744bfd8b7ea0245b57eeb71' '--allowance' 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\.data\icechunk-source-metadata-20261017-approved-allowance.json' '--expected-allowance-sha256' '2d07deef8e239988912c26a99b272d73934ef312b4cd8ddca054d3318d54d14d' '--output' 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\.data\icechunk-source-metadata-20261017-review1'
if ($LASTEXITCODE -ne 0) { throw 'Preflight stopped; do not execute' }
```

Then run the bounded operation once, under that same approval:

```powershell
& 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\.data\weather-py314\Scripts\python.exe' '-B' 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\scripts\era5\icechunk_metadata.py' '--execute' '--packet' 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\docs\operations\data-pilot-evidence\2026-10-17-icechunk-candidate-packet.json' '--expected-packet-sha256' 'c6b263ff07d8a740d7119e469bc72fb37f917e584744bfd8b7ea0245b57eeb71' '--allowance' 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\.data\icechunk-source-metadata-20261017-approved-allowance.json' '--expected-allowance-sha256' '2d07deef8e239988912c26a99b272d73934ef312b4cd8ddca054d3318d54d14d' '--output' 'C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\weather-readiness\.data\icechunk-source-metadata-20261017-review1'
```

No command above was executed with a retained approved allowance during
preparation. These exact commands are the proposed next action for owner
approval, not authority inferred from the presence of this document.

A successful metadata receipt still has `scientificAdmission=false` and
`unsupportedFeatureExclusionProved=false`. Full grid/time/status/member
coverage, retention, source equivalence, physical read costs and aggregation
remain separate scientific/operational gates. CDS cap 16 and acceptance totals
12 Done / 9 Partial / 6 Not started remain unchanged.
