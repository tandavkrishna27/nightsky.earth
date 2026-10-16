# S2-H2 / N2 — finite ERA5 time-series sample proposal

Prepared 16 October 2026. This packet proposes one actual acquisition for later
owner authorization. Implementation and all verification in this wave are offline;
no account credential was read, provider job submitted or response downloaded.
The current [tracker](v1-completion-tracker.md) remains authoritative.

## Exact proposed operation

Submit once to `https://cds.climate.copernicus.eu/api/retrieve/v1`, dataset
`reanalysis-era5-single-levels-timeseries`, with the retained browser-generated
[request contract](era5-timeseries-adapter.md):

```json
{"variable":["total_cloud_cover"],"location":{"longitude":48.75,"latitude":32},"date":["1990-12-30/1990-12-30"],"data_format":"netcdf"}
```

Fixed plan SHA-256:
`95edd1dddef2cd942e66089f3d6f85760d5ffd8876f7f4e32a6646be794a5322`.
The destination identity is `place:v1:geonames:12`; 24 hours is a request
expectation, with actual response dimensions and scientific meaning unverified.

| Bound | Exact ceiling |
| --- | --- |
| Remote submissions | 1; no automatic retry |
| Raw body | 2,097,152 bytes (2 MiB) |
| New output / scratch | 134,217,728 bytes (128 MiB) |
| Whole local operation | 1,800 seconds; resume keeps original deadline |
| Polls | 60 total, minimum 30 seconds apart |
| HTTP operation timeout | At most 30 seconds, clipped by remaining deadline |
| Worker containment | Windows Job, one active process, 536,870,912 bytes total commit; kill on close |
| Asset hosts | Only `cds.climate.copernicus.eu`, HTTPS port 443; no redirects |

The whole operation deadline includes blocked HTTP calls. The supervising parent
uses a monotonic clock, launches the worker suspended, assigns it to the Job,
then resumes it. Before credentials, the worker verifies the actual OS Job
flags, memory and active-process limits. It also requires an inherited pipe owned
by its live parent and a finite handoff bound to this plan and monotonic deadline.
The handoff also preserves the wall deadline captured before Job creation and
worker startup. The shared state machine persists the earlier of that deadline
and its own ceiling; resume can only keep or shorten the persisted deadline.
Worker startup time therefore cannot reappear as extra time on a later resume.
Direct `--worker` invocation without that handoff stops before allowance
consumption or credential lookup; argv/environment markers grant no authority.

The 128 MiB ceiling uses bounded application writes and parent output checks every
20 ms. It is not an OS filesystem quota. The state machine checks each raw block
before writing; individual blocks are at most 65,536 bytes. No scientific decoder,
archive extraction or optional scratch-producing processing runs in this sample.
The Job hard ceiling bounds commit memory rather than promising a measured RSS.
Local termination does not cancel a provider job or prove remote compute stopped.

## Concrete allowance and commands

Proposed output is the fresh directory
`C:\Users\TK\OneDrive\Desktop\Claude Data\nightsky.earth-main\.worktrees\plugin-v1\.data\era5\timeseries-sample-19901230`.
Proposed allowance is its sibling
`.data/era5/timeseries-sample-19901230.allowance.json`, within this worktree.
No allowance file or output directory has been created by this proposal.

Use the existing `.data/era5/venv/Scripts/python.exe`; nothing is installed by
these commands. From the worktree, this first command only prints the proposal
and the exact `allowanceTemplate` JSON:

```powershell
.data/era5/venv/Scripts/python.exe -I scripts/era5/timeseries_sample.py --plan --output .data/era5/timeseries-sample-19901230
```

After explicit owner authorization, save exactly the printed `allowanceTemplate`
object as the proposed allowance file. It binds request, dataset, plan digest,
absolute output, all ceilings, zero retries and unimplemented scientific
admission. Unknown fields, duplicate keys, booleans in numeric fields, changed
limits or legacy sample receipts are rejected. The reviewable offline preflight is:

```powershell
.data/era5/venv/Scripts/python.exe -I scripts/era5/timeseries_sample.py --preflight --owner-allowance .data/era5/timeseries-sample-19901230.allowance.json --output .data/era5/timeseries-sample-19901230
```

Only after that finite authorization and offline preflight, the actual acquisition
command would be:

```powershell
.data/era5/venv/Scripts/python.exe -I scripts/era5/timeseries_sample.py --execute --owner-allowance .data/era5/timeseries-sample-19901230.allowance.json --output .data/era5/timeseries-sample-19901230
```

The owner supplies `CDSAPI_KEY` explicitly to the execution environment; no
credential value belongs in the command, allowance, output, report or repository.
No account/config discovery or CDS SDK runs. The parent inherits the native
environment without looking up the token. Only the contained worker reads it,
after a durable exclusive `.consumed.json` receipt burns the allowance. A missing
token also burns that claim. Missing existing `requests` dependency fails before
claim/credential access; no installation is attempted.

Windows venv launchers can spawn another process, which conflicts with the
one-process ceiling. The parent uses its base interpreter with `-I` and hands its
existing interpreter's `sysconfig` site-packages path through the parent pipe.
The worker appends that explicit path only after OS containment and handoff
verification; it does not execute `.pth` files or consult `PYTHONPATH`.

## Stop, evidence and continuation

`sample_executor._run` remains the sole state machine. `timeseries_transport.Adapter`
reuses the reviewed explicit wire handling and separate API/asset sessions.
Only the API session receives `PRIVATE-TOKEN`; environment trust, redirects and
HTTP adapter retries are disabled. Unreviewed asset origins stop before fetch.

Keep the allowance consumption receipt, `checkpoint.json`, `job-identity.json`
and any `sample.raw`. Submission uncertainty is persisted before POST. Unknown
submit outcomes, partial downloads and terminal states never automatically
resubmit. Resume is restricted to known queued/running/successful jobs, exact
receipt/identity/output and the original deadline; it does not grant a new job,
poll allowance or time allowance. A killed process may leave `writer.lock`,
which requires independent reconciliation; it must not be silently removed.

Every completed body, including unknown, malformed or unexpected scientific
content, ends `downloaded-unvalidated`. Partial/rejected downloads remain
`download-uncertain`. Nothing is decoded as legacy expver `0001`, scientifically
accepted, published, promoted or wired into runtime weather answers.

After an actual authorized sample, inspect format, point coordinates, time axis,
units, missing values, revisions, returned host, measured bytes and elapsed
cost before designing a separate scientific decoder. This sample cannot prove
1991–2020 baseline eligibility, global coverage, practical throughput or H3
feasibility. Any larger acquisition requires a new concrete finite continuation.

## Offline evidence

The new tests exercise strict allowance binding, durable consumption, blocked
credential access, raw quarantine through the existing state machine, parent
deadline cleanup, and direct-worker rejection. An actual native Windows Job test
uses an inert child with an empty environment: it verifies Job limits, parent
pipe handoff and retained dependency discovery, then blocks and is terminated
and drained. It performs no credential lookup or provider operation.

The default CLI and explicit `--plan` remain offline. The old
`timeseries_executor.py` CLI remains the original fixture-only preparation path;
this separately gated `timeseries_sample.py` entrypoint supplies the proposed live
sample path. H2 scientific admission and H3 baseline acquisition remain open.
