# Weather lane handoff — 17 October 2026

## Current continuation: bounded Icechunk metadata preparation

Local executor/parser preparation was also assessed after the catalogue review.
The [dossier's preparation result](icechunk-metadata-dossier-20261017.md#local-executorparser-preparation-result)
and [local inventory](data-pilot-evidence/2026-10-17-icechunk-parser-readiness.json)
identify the missing maintained parser in existing environments. Python 3.14
Zstd support alone is insufficient. The new
[specific dependency plan](icechunk-parser-dependency-plan-20261017.md) recommends
official Icechunk 2.3.0 plus a seven-wheel closure of 18,438,932 bytes, with exact
versions/URLs/hashes/licences and a local-only API design. The coordinator then
approved exactly that isolated development setup: verified wheel archives plus
installed target use 70,453,339 bytes below 128 MiB. The
[setup receipt](data-pilot-evidence/2026-10-17-icechunk-development-setup.json)
pins all seven actual wheels and 293 installed files; the shared/lane test
environment and existing NumPy/typing packages remain unchanged.
The smaller FlatBuffers/flatc route lacks the required verification path.
The four-request design is **not execution-ready**, and no owner source-access
approval is requested. A raw repo receipt is transport evidence only, not usable
snapshot progress. The official local-file parser and bounded transport are now
implemented for offline fixtures. The reader can inspect the fixed descriptors
in known-format metadata-only fixtures, but its APIs omit unknown stored feature
IDs and opaque extensions; the reviewed native open path does not reject them.
The coordinator refined the metadata-only contract to report the pinned reader's
interpretation with `unsupportedFeatureExclusionProved=false` and
`scientificAdmission=false`, without asserting complete compatibility or absent
extensions. Default/candidate packets remain nonexecuting; source access still
requires separate explicit approval and a fresh byte-pinned packet/allowance.
See the dependency plan's actual-capability section for the exact limitation.
No source request is authorized or executed; source cap/authority is unchanged.

Fresh focused verification discovered 25 tests on each runtime: Python 3.14.3
passed 19 and delegated six native methods to its passing contained-child
harness, where all six actually ran; Python 3.12.14 passed 17 and skipped eight
unavailable optional/Zstd cases. The [verification receipt](data-pilot-evidence/2026-10-17-icechunk-offline-verification.json)
pins all four new files and records the exact scope, counts, default CLI results
and unchanged 293-file dependency admission. Independent review found malformed
Zstd error normalization and an exited-worker peak-RSS admission gap; both have
regressions and are fixed. Final independent review is clear under the refined
metadata-only contract; complete scientific or format compatibility is unproved.

Attempted-access evidence combines the actual six-key store boundary, guarded
public cloud factories, native snapshot-download tracing with a missing-metadata
positive control, and pinned source review. It does not claim a kernel I/O
sandbox. Actual Job limits and supervisor-pipe helpers were exercised; full live
execution, allocation-limit stress and production deadline-kill tests were not.
No additional dependency or Rust helper was added. The final pushed identity and
exact-tip CI result are supplied by the delivery chat; this file cannot pin its
own commit hash.

The catalogue evidence and lossless README packaging correction are delivered at
`1a120dd09d7754cb56dd60d03f627bccec4a7a01`; all six jobs passed in
[exact-tip CI run 38960516980](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38960516980).

The authenticated review/source audit below is delivered at
`69c0e6c568e39d051f3899faec8c15eb21657125`, with all six jobs successful in
[exact-tip CI run 38959423443](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38959423443).
The requested continuation began independently while that CI ran. It does not
repeat the 27 form checks or alter their evidence.

The [metadata dossier](icechunk-metadata-dossier-20261017.md) records concrete
new findings from the registry-linked, logged-out public marketplace catalogue:
`single/temporal/tcc` exists in that catalogue as Float32, shape
`(758232,721,1440)`, chunks `(8736,12,12)`, PCodec level 8; attributes identify
parameter 164, cloud fraction and the regular 0.25° grid. The public licence is
CC-BY 4.0. Per-hour status descriptors define cloud-cover QC codes and
`expver=1` final / `5` preliminary / `255` unspecified. Full values were not read;
truncated previews do not establish valid/final status for the target horizon.
`GRIB_totalNumber=0` and no member axis shown do not independently certify every
hour's deterministic member identity.

The [hash index](data-pilot-evidence/2026-10-17-icechunk-metadata-index.json)
binds ten retained browser metadata captures/screenshot files. The catalogue's
association with the anonymous S3 store is publisher-declared, not byte-bound to
a snapshot. Its contradictory variable counts/daily-versus-quarterly prose are
explicitly preserved. The old route audit's unknown catalogue inventory/layout
is narrowed by these new observations; its pinned-source/admission unknowns
remain. The old audit bytes and hash are unchanged.

The finite inspection stops before binary repository metadata. The dossier
prepares exact derived S3 repo/snapshot URLs and a conditional four-request plan:
HEAD/GET `repo`, offline resolve one snapshot, HEAD/GET that snapshot, ≤1 MiB
per object / ≤2 MiB aggregate bodies, no retries/redirects, bounded parsing and
deadline. It is **not executed or an allowance**. Manifests are excluded because
they can inline observation chunks; convenience client opens can preload data.
Snapshot identity/retention, actual final/QC/member coverage, physical reads and
bytes, scientific admission and measured aggregation remain separate gates.

During the public catalogue inspection, no direct S3 request, repository binary,
data chunk, job, install, credential, subscription or terms acceptance occurred.
The later seven development wheels are the separately approved setup above.
Ordinary public-page metadata/assets were inspected; website backend operations
were not instrumented. Shared
tracker/build/test aggregator/workflow files and the 16-job cap remain unchanged.
Acceptance remains **12 Done / 9 Partial / 6 Not started**.

The catalogue-only delivery changed documentation and metadata evidence; its
previous runtime milestone was 195 ERA5 tests. The newer focused implementation
verification is recorded below. All ten catalogue evidence sizes and
hashes, full AX captures, UTC+05:30 observation dates and local dossier/handoff
links passed an offline check; `git diff --check` passed. The first date-check
attempt lacked system `tzdata`; the successful rerun used the explicit +05:30
offset for these instants, without installing anything. Independent review
reproduced hashes/dates, checked the screenshot and exact metadata, recomputed
the advertised hourly extent, and checked primary specification/schema sources.
No actionable findings remain. No repeated runtime suite is needed for this
documentation-only catalogue delivery. Runtime preparation is tracked separately
above and receives its own focused fixtures and independent review.

The browser README's trailing spaces triggered the initial staged whitespace
check. Its capture is now wrapped losslessly in JSON, retaining original byte
length/hash and exact restorable content; the ten-file index hashes the wrapper.
The corrected staged check and byte-equivalence check pass.

Resolve the continuation delivery commit with
`git log -1 --format=%H -- docs/operations/icechunk-metadata-dossier-20261017.md`.
Its full pushed branch-tip SHA and exact-tip six-job CI result accompany the
delivery chat; historical delivery identities below remain valid.

## Delivered authenticated form review and global-history route audit

Started clean on assigned branch `codex/weather-readiness` at integrated baseline
`750b12f29b2ae10eb8f3e88eae31755874198156`. The parent alone controlled a new
in-app browser (`iab`) tab using the existing signed-in session; the coordinator's
tab was untouched. Two subagents handled the public-source audit and independent
review. No new chat was created.

**All 27 exact generated dataset/request objects match the retained proposal.
All 27 show existing CC-BY acceptance and enabled Submit controls, with no
observed request-too-large error. No job was submitted.** This resolves the
earlier logged-out form blocker for these exact selections. The form exposes no
absolute numeric cost or ceiling for the enabled selections; percentage bar
widths are not cost units. Provider acceptance and execution remain unproved.

The [authenticated findings](weather-authenticated-form-review-20261017.md)
retain the full selection table, reproduction command and remaining decisions.
The unchanged proposal is 59,765 bytes, SHA-256
`5482a483a50dd6870ac1b6e1bb061bfdfdc303596b7bee273fdab93e8ff846dd`.

| Current evidence | Bytes | SHA-256 |
| --- | ---: | --- |
| [Observations](data-pilot-evidence/2026-10-17-cds-authenticated-observations.json) | 31,722 | `09d3951aaa9cf4f83e83e96d368c5ddc0a222491911e64d23295200980c35c79` |
| [Computed report](data-pilot-evidence/2026-10-17-cds-authenticated-comparison.json) | 15,387 | `bbb34a6a10b26855f47e0ae99da11732c47716438bc87d2e678953ade667385a` |
| [Sanitized screenshot](data-pilot-evidence/2026-10-17-cds-authenticated-enabled.jpg) | 46,320 | `a9c310100eec0a6edc5bdf3361e93ab4c033d2fe70a6bfbdca7ddf594b96b2ca` |
| [Global-history route audit](global-history-route-audit-20261017.md) | 22,516 | `ca7e77ae908ef31f74b6930a9ab42264ab256b6e23d20845f20047f277463c00` |

All 27 observations were saved individually and immediately with offset instant
timestamps before assembly. The offline verifier reproduces 27 compared,
27 enabled, zero disabled/login-required/missing, `allRequestsCompared=true`,
`allSubmitControlsEnabled=true`, **`executionEligible=false`**. The new fixture
guards that distinction and the unchanged 16-submission cap. No authority flag
or allowance was added. These are sanitized agent observations, not receipts.
The final parent-owned IAB tab (`1`) is retained for handoff at selection 27.

The route audit preserves all 236,042 destinations, 54,822 required cells and
56,039 cell/zone pairs. Retained subtraction leaves 14,422,993,824 required
cell-hours; Float32 representation alone is 57,691,975,296 bytes before transport,
blocks, masks or lineage. The 373,619-parent count predates the latest overlay
and does not establish feasible global acquisition.

The first concrete alternative is a **metadata-only descriptor dossier** for
the exact anonymous `earthmover-icechunk-era5/icechunkV2` temporal store, with
NCAR as fallback comparator. The new store's exact `tcc` inventory, immutable
snapshot/underlying object pins, final `0001`/member-zero semantics, physical
read geometry and transfer bounds remain unknown. Older Earthmover examples and
QC-tool variable mappings do not prove that inventory. No source is admitted by
this audit. Efficient acquisition also leaves solar/timezone aggregation CPU,
scratch, lineage and serving fit to measure separately. Source citations, exact
arithmetic, revision/licence differences and future gates are in the audit.

**Remaining decisions:** owner disposition of proposed +11 submissions and the
unchanged eight-hour/512 MiB envelope; fresh executable contract, packet/code/
runtime pins and explicit allowance before execution. The 16-job executor cannot
execute the 27-parent proposal as-is. Queue/completion, output conversion, routing,
actual bytes and scientific completeness remain unproved. The alternative source
requires its own metadata/scientific admission and later bounded-data decision.

No terms acceptance, credential/token access, provider job, dataset download,
external message, deployment or publication occurred. No scope or source-contract
reduction occurred. Shared tracker, `tests/all.test.ts`, `tsconfig.tools.json`
and CI workflow were not edited. Acceptance remains **12 Done / 9 Partial /
6 Not started**. Historical evidence below remains unchanged.

Milestone verification in the lane-owned Python 3.14 environment:

```text
.data/weather-py314/Scripts/python.exe -m unittest discover -s tests/era5 -p test_form_readiness.py
19 tests, OK, exit 0 (2.231 seconds)
.data/weather-py314/Scripts/python.exe -m unittest discover -s tests/era5 -p 'test_*.py'
195 tests, OK, exit 0 (22.509 seconds)
git diff --check
exit 0
```

The independent reviewer reproduced all raw-record/proposal comparisons, hashes,
report equality and timestamp precision; inspected the sanitized screenshot;
reran all 19 focused tests; and checked primary source claims and arithmetic in
the route audit. No actionable findings remain in those artifacts. Existing
NumPy fixture deprecation warnings remain; no shared environment was changed.
The independent handoff review also found no actionable issues.

Reviewed implementation commit: `b56e652bbbef4957a736f1e2d7f08b7d1f246c24`.
The final lane commit adds only this delivery identity; resolve it with
`git rev-parse codex/weather-readiness`. Its pushed full SHA and exact-tip six-job
CI result are supplied in the delivery chat. The reviewed evidence, audit and
test remain unchanged after the implementation commit.

## Historical public form/code comparison — 17 October 2026

Started clean on assigned branch `codex/weather-readiness` at integrated baseline
`ca7de5a70a60e7178c5ccf6f1f3e03ee5ffe9538`. The parent alone owned the CDS browser;
one subagent implemented the offline evidence verifier and another independently
reviewed its code and final artifacts. No new chat was created.

**All 27 exact generated dataset/request objects matched the retained proposal.
All 27 remained login-required; account-side constraints and actionable Submit
controls could not be established.** The request-size widget exposed no numeric
cost or limit in this logged-out Chrome session. This does not create provider
acceptance, licence acceptance, a `currentProviderFormReviewed` claim or allowance.
The executor still caps submissions at 16; proposed +11 remains an owner decision.

The [current findings and reproduction](weather-form-comparison-20261017.md)
include a request-by-request selection table and the precise remaining gates.
The [observations](data-pilot-evidence/2026-10-17-cds-form-observations.json) bind
the unchanged 27-parent proposal SHA-256
`5482a483a50dd6870ac1b6e1bb061bfdfdc303596b7bee273fdab93e8ff846dd`, every ordered
request identity and all source pins. Observations: 32,964 bytes, SHA-256
`8b1ffdbb21fc8c6ffc06ef044791f9c05443e64c51ab35b5f094281b9a87f13d`.
The [computed report](data-pilot-evidence/2026-10-17-cds-form-comparison.json) is
16,570 bytes, SHA-256
`faf18164d0af07df7df989701a1bdf3c50d0e8a07ae35ccc4441525b24aa4f3e`:
27 compared, no missing rows, zero enabled submission controls,
`allRequestsCompared=true`, `allSubmitControlsEnabled=false`,
`executionEligible=false`.

Twelve records retain exact timestamps; fifteen retain honest day precision.
The review crossed midnight: the earliest two selections were rechecked on
17 October, and offset timestamps are checked in Asia/Calcutta. Browser inventory,
page-update and transient API-code-panel failures were recovered before counting
affected selections. The full-key equality checks, not checkbox appearance or
representative-month inference, establish each transcribed match. These are
sanitized agent observations, not provider-signed receipts.

The [saved screenshot](data-pilot-evidence/2026-10-17-cds-logged-out.jpg) shows
licence/login gates and the nonnumeric request-size widget. The final public
form is retained as a Chrome handoff tab (`1924823419`, last selection row 27).
The first stalled agent-created tab was closed. No login, terms acceptance,
token/credential access, request submission, provider job or dataset download
occurred. No deployment/publication, source mutation or scope reduction occurred.

`scripts/era5/form_readiness.py` is offline and read only. It checks the trusted
operator-supplied proposal byte hash (fixed to the retained SHA above in this
invocation), full request equality and source/order/date/control consistency.
It rejects duplicate JSON keys, nonfinite values, oversized files, missing or
duplicate reviewed rows, changed selections and authority claims. Missing rows
may be reported honestly as incomplete. A reviewer-reproduced timezone defect
received failing boundary tests, a fix, and independent successful rechecks.
No actionable review findings remain.

Verification in this lane's own retained Python 3.14 environment:

```text
.data/weather-py314/Scripts/python.exe -m unittest discover -s tests/era5 -p test_form_readiness.py
18 tests, OK, exit 0
.data/weather-py314/Scripts/python.exe -m unittest discover -s tests/era5 -p 'test_*.py'
194 tests, OK, exit 0 (35.641 seconds)
git diff --check
exit 0
```

The independent reviewer reran the 18 focused tests, compared all 27 raw objects
with the pinned proposal, recomputed the report, checked byte/hash/precision
counts and inspected the screenshot. Existing NumPy fixture warnings remain.
An initial verifier-agent test run in the unprovisioned default interpreter
failed for missing dependencies; the owned-environment full rerun above resolves
that environment issue. No shared environment was modified.

**Exact outstanding gates:** signed-in session and truthful existing licence
state; current account-side cost/constraint validation for all 27 requests; owner
decision on proposed +11 submissions and unchanged resource-cap implications;
fresh executable contract, packet/runtime pins and explicit allowance. Provider
queue/conversion/routing/bytes and scientific completeness are unproved.

Integration: ERA5 CI already discovers `test_*.py`; no change is needed to
`tests/all.test.ts`, `tsconfig.tools.json` or the workflow. Shared tracker and
acceptance totals remain **12 Done / 9 Partial / 6 Not started**. This bounded
handoff ends this wave; account/form validation and execution gates are not
silently closed.

Current-wave reviewed implementation commit (pushed):
`3f40986a9657717e3f506ae2c58e08593a3ad9b4`.
The final lane commit adds only this delivery identity. Resolve that commit with
`git rev-parse codex/weather-readiness`; its full pushed SHA and exact-tip six-job
CI result are supplied in the delivery chat. The code, observations, computed
report and screenshot are unchanged after the reviewed implementation commit.

## Historical regrouping handoff — 16 October 2026

Branch: `codex/weather-readiness`. Assigned baseline:
`b6bb5726b61c5faf05f9e9073306fd19f7828918`.

The bounded assignment is implemented and independently reviewed. The
[proposal and reproduction notes](weather-regrouping-proposal.md) describe the
exact 27-parent manifest, immutable source/runtime pins, coverage proof and
unchanged execution limits. The [portable packet](data-pilot-evidence/2026-10-16-weather-regrouping-proposal.json)
is 59,765 bytes, SHA-256
`5482a483a50dd6870ac1b6e1bb061bfdfdc303596b7bee273fdab93e8ff846dd`.

## Findings and changes

- Eleven 30-year parents split in place into 27+3 years. Five original rows,
  including exact February year lists and padding/second-area rows, remain intact.
- Exact cell/month/day/hour bitsets prove unchanged 363 monthly children and
  526,272 required + 526,272 filler cell-hours. Equal totals alone cannot pass.
- Twelve owner audits independently compare actual retained masks with calendar
  subtraction; positive retained owners and all eight overlay owners are covered.
  The overlay preserves 312 missing required hours, excludes 96 retained hours,
  transfers 264 filler hours and removes exactly 96 unnecessary filler hours.
- Owner `100:213` has full selected acquisition-clock coverage. Owner `100:214`
  has only 48 selected hours, leaving 526,080 required and 526,080 filler
  cell-hours outside the prefix. No scientific/global completion follows.
- Production executor code and all limits are unchanged. Its 16-submission cap
  rejects the 27-parent proposal. A +11 submission delta is proposed explicitly;
  all other cumulative/time/byte/process limits remain unchanged.
- Historical origin metadata was restored as exact CRLF bytes in this lane's
  ignored metadata directory to preserve its original source pin. Shared retained
  data were read only; no source hashes were relaxed or updated.
- The existing disk-race test now triggers its disappearing-file exception
  independently of Python's internal stat-call count; permission denial remains
  checked. A reviewer-found final-owner deadline gap received a failing test,
  an implementation fix, and a passing rerun.

## Verification and review

Local environment: own `.data/weather-py314` virtual environment, Python 3.14,
repository-pinned ERA5/download dependency versions. No shared environment was
modified. Python 3.11 cannot install the repository's NumPy 2.5.4 pin; its unused
lane-local trial environment is ignored. Preserved packet runtime pins remain
historical Python 3.12.14, not a claim of equality to this test environment.

```text
.data/weather-py314/Scripts/python.exe -m unittest discover -s tests/era5 -p 'test_*.py'
176 tests, OK, exit 0 (27.458 seconds)
git diff --check
exit 0
```

NumPy array-shape deprecation warnings in unchanged fixtures remain. New focused
coverage: five regrouping tests and eight source-proof tests. Initial regrouping
test failed before implementation; reviewer deadline regression failed before
the fix and passed after it. Actual full pinned-source replay passed and wrote
the exact committed proposal with zero live calls. Independent review found one
deadline defect, now fixed, and then reported no outstanding actionable findings.
The reviewer also independently rebuilt the complete proposed object and verified
its current preparation-code pins, row mapping, coverage proof, source/runtime
pins, byte count and hash.

## Unresolved gates and integration

The observed 27-year January form selection is **one candidate only**. January
and April 30-year selections were rejected at 133,920/129,600 against 121,000.
Main chat must coordinate any later exact form review for all 27 rows; this lane
did no browser work and fabricated no acceptance or `currentProviderFormReviewed`
record. Owner review of the +11 submissions/resource implications, a fresh
executable contract/packet/runtime and explicit allowance remain required.
Queue acceptance, conversion success, bytes, future routing and scientific
completeness remain unproved. The unchanged eight-hour/512 MiB caps can stop the
expanded proposal; no cap is silently enlarged.

Do not add these Python tests to `tests/all.test.ts`: the ERA5 CI job already
discovers `test_*.py`. No aggregate test file, shared tracker, geography/event
implementation, other branch, serving data or source dataset was modified.
Acceptance totals remain **12 Done / 9 Partial / 6 Not started**.

## Final delivery record

Final reviewed implementation commit:
`274c355c2045063a21ccc2e7a6607537c99ac87b` (pushed).
Its [exact-commit CI run](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38937463860)
completed successfully: **all six jobs green**, Node/ERA5/OSM on both Linux and
Windows. The working tree was clean after that push.

The final lane commit contains only this CI record and the completed plan
checkbox. Resolve its exact identity with `git rev-parse codex/weather-readiness`;
the delivery chat supplies the full final pushed SHA and its separate exact-tip
CI result (a commit cannot contain its own SHA). No implementation, packet,
source pin or proof changed after the reviewed implementation commit. Stop here
for the concrete proposal/budget/form-review handoff; no further waves are implied.
