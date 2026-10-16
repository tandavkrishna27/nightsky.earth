# Bounded planet receipt and offline preflight

`scripts/osm/planet_receipt.py` prepares the single receipt proposed in
[geography acquisition readiness](geography-acquisition-readiness.md). Its
default operation prints a read-only JSON plan. Implementation and synthetic
tests authorize no source request. No planet body was acquired in this work.

Run only the offline plan during preparation:

```powershell
python scripts/osm/planet_receipt.py
```

An optional positional argument selects the proposed receipt directory. With
no argument, the fixed proposal is `.cache/planet-261012-receipt-v1` under this
checkout. Preflight creates no directory, opens no connection, and returns exit
zero with structured `gates` even when execution is blocked. Missing parent,
existing attempt, insufficient live disk or unsupported Windows containment
appear as gates. `receiptAuthorized` remains false. Ready means the observed
local capacity can support the proposal, not that an operator approved receipt.

The JSON `source` binds exactly these retained observations:

| Field | Required value |
| --- | --- |
| `edition` | `planet-261012.osm.pbf` |
| `url` | `https://osm-planet-eu-central-1.s3.dualstack.eu-central-1.amazonaws.com/planet/pbf/2026/planet-261012.osm.pbf` |
| `bytes` | `95380942829` |
| `versionId` | `brLMq6.oGIcbk.3ciQgjtqIduCfYJMT1` |
| `etag` | `"37619b1886c62145e6a0a6b31109b300-5686"` |
| `md5` | `c51bb08eb9fc486d010aaa1a3424cabc` |
| `lastModified` | `2026-10-15T19:22:44Z` |

The multipart ETag is not an MD5. The source metadata artifact is checked before
preflight/output against its Git-text LF SHA-256
`98d6637d14b741be946762d561db84c3fb516411008d1f59e3c68eec75117203`:
[retained provider evidence](data-pilot-evidence/planet-identity-capacity-s3-20261016.json).
Checkout CRLF is normalized only for this Git artifact pin. Its path and digest
are included in the plan and attempt intent, and its actual on-disk bytes are
automatically included in logical retained accounting.

## Allowance preparation for a later decision

The operator must separately authorize the body receipt and prepare a JSON file
with **exactly** these fields. This guide does not supply an actual authorization
reference or a ready-to-run online command.

| Field | Contract |
| --- | --- |
| `schemaVersion` | Integer `1` |
| `action` | `receive-one-exact-planet` |
| `source` | Exact `source` object above; no alternative edition, URL or identity |
| `attemptRoot` | Absolute, previously nonexistent fixed receipt directory |
| `retainedPaths` | Explicit absolute existing retained file/directory inventory, at most 64 paths; include the allowance file and all coexisting source, failure, scratch, rollback and other job allocations |
| `operatorApprovalReference` | The actual separately obtained operator authorization reference, 1–500 characters |
| `limits` | Complete integer object below |

`limits` requires `bodyBytes: 95380942829`, `evidenceBytes: 1048576`, and
`maxProcesses: 1`. It requires `freeBytes` at least `137438953472` (128 GiB),
`wallSeconds` at most `86400`, `connectSeconds` at most `30`, `commitBytes` at
most `4294967296`, and `rssBytes` at most `2147483648` and no greater than
`commitBytes`. All limits must be positive integers; they are stop ceilings.
The complete default object is emitted in the offline plan.

An allowance can be inspected offline with `--allowance FILE` together with
`--allowance-sha256 SHA256`. Its SHA-256 binds the exact file bytes, without
newline normalization. Duplicate JSON keys, unknown/missing fields, oversized
files (64 KiB), changed identities, noninteger bounds and digest mismatches are
refused. An allowance is an operator attestation, **not** an independently
trusted source-policy review. No trusted approver record is generated here.

Only explicit `--receive` plus the validated allowance and its digest can
enter the receipt path. A new allowance/root decision cannot automatically
retry an existing failed attempt. Existing directories are always refused;
there is no overwrite, append, cleanup, retry, resume or second-copy behavior.
Retain previous failed evidence and count it in any subsequently reviewed
allocation rather than deleting it to make a new attempt appear to fit.

## Enforcement and evidence

The supervisor exclusively creates the attempt directory and fsyncs an
`attempt-intent.json` before starting a worker. The worker must prove a live
parent-owned OS pipe handoff, the exact allowance/root/deadline identity, and
actual Windows Job hard memory, one-process and kill-on-close settings. Direct
worker invocation cannot substitute an argv claim for that handoff. The child
starts with `-I -S -B`, an explicit source-directory bootstrap, only Windows
system-directory environment fields and attempt-local temporary directories.
It inherits no proxy/authentication settings or arbitrary Python hooks.

Before its only request the worker fsyncs `request-intent.json`. It uses a
direct stdlib HTTPS connection with certificate verification, no proxy lookup,
and `If-Match` for the exact ETag. There is one GET, no HEAD/checksum refresh,
redirect, retry, Range, resume, mirror or alternate edition. Parsed response
headers are bounded to 64 KiB. Header reads are unbuffered so validation does
not prefetch body bytes. Status must be 200, exact Content-Length, ETag, S3
version and Last-Modified must match, and duplicate identity/framing headers,
Transfer-Encoding, Content-Range and nonidentity Content-Encoding are rejected
before any body read. `response-accepted.json` records acceptance.

Body reads request at most 64 KiB and never exceed the remaining exact byte
allowance. There is no extra-byte EOF probe. The worker streams provider MD5
and local SHA-256 and refuses a short body/checksum mismatch. The single raw
allocation remains `planet-261012.osm.pbf.partial` even after successful
transport; a transport report does not promote or publish it. Failed partials
are retained under the same name. Writable handles are flushed/fsynced on
success and best-effort on failure.

The independent supervisor enforces the total deadline and a connection/header
deadline covering child startup, DNS, TLS, request and response headers. A
shared absolute header deadline travels in the authenticated pipe handoff.
The worker checks it immediately after headers return and before body
acceptance; the parent verifies the marker's recorded acceptance time against
the same deadline, so a late marker cannot erase a timeout between samples.
A blocked read cannot disable outer termination. Windows Job commit and process
count are hard worker-tree limits. Main-worker RSS, logical disk and free
reserve are sampled at 20 ms **plus retained inventory cost**; they are not
hard filesystem reservations or tree RSS measurements. Initial free disk must
cover raw + 1 MiB evidence + retained 128 GiB free reserve. Logical accounting
includes the attempt and nonoverlapping retained paths, capped at initial
retained bytes + raw + 1 MiB. Existing files already reduce measured free disk;
logical inclusion does not allocate them again. No reclamation is assumed.
Inventory checks the shared deadlines at each directory/entry and after scans;
OS scheduling and individual filesystem calls still bound watchdog response
latency, so no submillisecond deadline precision is claimed.

Before terminating a running child, the supervisor attempts to fsync
`termination-intent.json`; evidence-write failure cannot prevent termination.
Its `supervisor-report.json` survives a worker kill and records exit, retained
partial bytes and the stop reason. A failed blocking read reports
`receivedBytesExact: null` with a conservative whole in-flight-read upper
bound in the worker report. After a kill, the supervisor conservatively reserves
the full source byte allowance if request intent exists. Retained file size
is reported separately and never misrepresented as total HTTP bytes received.
Exit zero without a valid exact-size transport report is a bounded stop.
Storage failure may also prevent report persistence; the prior fsynced intent
then remains evidence of an uncertain attempt, never a success marker.

## What remains after receipt

Transport completion provides actual raw SHA-256 and matching provider MD5.
It does not establish the native `osmosis_replication_timestamp`, parser
compatibility, whole-world source evidence admission or searched coverage.
Inspect the actual received native header, bind actual-source descriptor and
independently trusted reviews through the operator policy path, and stop before
any separately authorized build. Preserve `source-domain-only` semantics.

The existing 128 MiB individual assembly stream caps remain unchanged. This
receiver makes no planet classification, SQLite/runtime, build fit or catalogue
size claim. The 2 CPU / 4 GB serving host receives only a separately admitted
and measured catalogue/runtime installation; the raw planet and scratch do not
belong there. No G3 or release acceptance totals change.

Validation: `python -m unittest discover -s tests/osm -p test_planet_receipt.py -v`
uses only tiny synthetic streams, fake headers and local Python children,
including Windows Job termination/handoff tests. Production source identity
checks are not weakened for tests.
