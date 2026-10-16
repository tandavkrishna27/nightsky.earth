# Weather lane handoff — 17 October 2026

## Current wave: all 27 public form/code comparisons

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
silently closed. Exact pushed commit and CI delivery record follows after commit.

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
