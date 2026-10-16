# Bounded weather regrouping proposal — 16 October 2026

The rejected v3 prefix now has a deterministic, offline **27-parent proposal**.
It is not executable. The executor still enforces 16 submissions, and the
proposal explicitly records a **proposed +11 submissions**, unapproved. The
historical [rejected proposal](global-acquisition-approval-proposal.md) remains
unchanged. No provider requests, browser work, credentials, dataset downloads,
allowance, deployment or publication occurred.

The [complete portable proposal](data-pilot-evidence/2026-10-16-weather-regrouping-proposal.json)
contains every ordered request and hash, old-to-new row mapping, unchanged source
and runtime pins, preparation-code pins, exact coverage proof, retained-owner
audits and budget review. The original packet identity remains
`40ebd34f37fe83016e0d7ec9adb6a115daeddf75710aeb006eedfb372f59bde8`.
The generated proposal is 59,765 bytes, SHA-256
`5482a483a50dd6870ac1b6e1bb061bfdfdc303596b7bee273fdab93e8ff846dd`.

## Deterministic transformation and offline proof

`scripts/era5/regroup_weather.py` splits each original parent **in place**, taking
at most 27 of its already selected, sorted years per replacement. It never takes
a smaller prefix of a regenerated global schedule. Eleven 30-year parents become
1991–2017 and 2018–2020 pairs; five rows remain byte-equivalent objects. Leap and
non-leap February year lists, both padding boundaries, both areas, all UTC hours,
required/filler ownership, dataset, format, member zero and final revision stay
unchanged. Every replacement receives a recomputed request identity and exact
monthly partitions. Provider status is unproved for every group; preexisting
provider-review claims are rejected as inputs.

The bitset proof compares **each cell, UTC month, day and hour**, including owner,
required/filler classification and source identity. Duplicate hours, omitted or
substituted years, changed ownership and equal-count coverage substitutions fail.
The union is exactly 363 monthly children, **526,272 required + 526,272 filler
cell-hours**. Coverage digest:
`7e9345cebdc3f9437415706cbcd26aa4bfbc011e8348274068ef85a2a3bde826`.

`weather_coverage.py` independently reconstructs calendars from pinned templates
and retained masks, then compares effective overrides against exact subtraction.
This checks positive retained evidence, rather than relying on the prefix's
zero retained overlap. Twelve owners are audited: selected owners `100:213` and
`100:214`, retained owners `200:514` and `245:517`, plus eight overlay owners.
Retained required hours are 13,392 and 3,024 for the two unaffected retained
owners; the latter also retains 9,072 filler hours. Null observations stay in
retained masks and cannot authorize reacquisition.

The existing independent overlay verifier proves the pinned transfer: 312 missing
required and 264 filler cell-hours in replacement rectangles, 96 retained
cell-hours excluded, and exactly 96 removed filler cell-hours. Original owners
lose the transferred day; it is accounted separately from retained subtraction.
Selecting overlay owners/replacements in this prefix proof fails with an explicit
gate; the actual prefix selects neither. The full existing overlay admission
tests continue to check its replacement route.

Owner `100:213` is fully selected for acquisition. Owner `100:214` contributes
only 48 timestamp hours; **526,080 required and 526,080 filler cell-hours remain
outside this prefix**. These are source-clock coverage statements, not scientific
completeness or worldwide completion. The 12 Done / 9 Partial / 6 Not started
accounting is unchanged.

## Budgets and provider gates

| Control | Existing executor | New proposal |
| --- | --- | --- |
| Submissions | 16 | 27 proposed; +11 requires review and a changed executable contract |
| Polls per job / spacing | 20 / at least 30 seconds | Unchanged; possible status calls rise from 320 to 540 |
| Job / batch deadline | 30 minutes / 8 hours | Unchanged |
| Raw per job / cumulative | 32 MiB / 512 MiB | Unchanged |
| Metadata response / cumulative | 1 MiB / 32 MiB | Unchanged |
| Output / free reserve | 4 GiB / 96 GiB | Unchanged |
| Process tree / sampled decoder RSS | 512 MiB, two processes / 256 MiB | Unchanged |
| Retries / active jobs | Zero / one | Unchanged |
| Maximum staging reservation | 308 MiB | 284 MiB after regrouping |

The 27 per-job raw ceilings sum to 864 MiB, exceeding the unchanged 512 MiB
cumulative cap; the cap would stop the batch first. Similarly, 27 job deadlines
sum to 13.5 hours against the unchanged eight-hour shared deadline. These are
upper-bound arithmetic, not forecasts or permission to raise any budget. Twenty
polls spaced 30 seconds apart still exhaust in roughly ten minutes; successful
completion of all 27 is not established. Asset-host allowlists, tokenless asset
session, no redirects, durable attempts and source/runtime admission are unchanged.

The retained browser observations are **30-year January rejected at cost 133,920
over 121,000**, **30-year April rejected at 129,600 over 121,000**, and **one
27-year January candidate enabled**. See [readiness evidence](weather-request-readiness.md).
This proposal does not generalize that candidate to other months, remaining
three-year pieces, February or padding selections. Main chat must coordinate any
later exact form inspection for all 27 ordered requests and bind sanitized
generated-code/cost observations to this proposal and its request hashes. No
`currentProviderFormReviewed` record or owner allowance exists for this proposal.

An eventual executable packet needs an explicit budget/resource decision, current
runtime equality, fresh exact packet pins and owner allowance. The preserved
runtime pins describe the rejected packet's reviewed runtime, not this lane's
Python 3.14 verification environment. The live executor rejects this proposal's
schema and parent count before any acquisition.

## Reproduction and bounded verification

From this worktree, using a fresh output path:

```powershell
python scripts/era5/regroup_weather.py --packet <retained-v3-packet> --packet-sha256 40ebd34f37fe83016e0d7ec9adb6a115daeddf75710aeb006eedfb372f59bde8 --source-paths <local-source-locators-json> --output <fresh-proposal-path>
python -m unittest discover -s tests/era5 -p test_regroup_weather.py
python -m unittest discover -s tests/era5 -p test_weather_coverage.py
.data/weather-py314/Scripts/python.exe -m unittest discover -s tests/era5 -p 'test_*.py'
```

Input packet: at most 1 MiB, at most 16 parents; sources: at most 8 MiB each,
hash-pinned independently; source locators: 64 KiB; proposed parents: at most 32;
output: at most 1 MiB, exclusive creation, no overwrite or symlink/junction paths.
The source audit bounds 263,088 hours per cell, 1,000,000 retained hours and 120
seconds, checked cooperatively. This is a finite local metadata proof, not a hard
process-memory/time quota. No massive artifacts or raw dataset bodies are copied.

The committed asset-origin receipt is LF-normalized, while its historical source
pin binds **824 CRLF bytes**, SHA-256
`6038f89252b2144afa4dae0910ebe8b45275140addeac268d6ab201b6e872747`.
Replay restored those exact bytes from the assigned checkout into a fresh ignored
local metadata file and verified the original hash; neither source pins nor
shared retained evidence were changed. The frozen plan and reconciliation were
read directly from retained `.data` files. The ownership overlay was read from
this checkout. Source locator paths remain local and are not published.

The existing disk-sampler race fixture was made independent of the number of
`Path.stat()` calls: Python 3.14 uses a different metadata path. The test now
raises the same disappearing-file race at `is_file()` and still checks that
permission errors propagate. Production executor code is unchanged.
