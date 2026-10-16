# History ownership overlay admission

The Python executor accepts an optional `ownershipOverlay` source pin and matching source path. It verifies the overlay against the actual hash-pinned frozen plan and reconciliation before admitting any packet job. Without that source, the original frozen ownership route and four-owner holdback remain in force.

The bounded overlay covers eight original owners (rows 243–244, columns 456–459) on the 24 hours of 30 December 1990. The verifier independently checks unique frozen cell ownership, required/filler classification, the 32-cell source geometry, all affected retained masks, and exact subtraction of the overlay hours from every affected owner's calendar. Only the four original blocked owners are resolved, after those checks. Their original geometry remains eligible outside the replaced day; requests that still include the replaced day fail admission.

Every replacement passes normal request identity, rectangle, cell inventory, partition and clock validation. The verifier independently proves no replacement overlaps another, leaves original ownership, or reacquires the four retained central cells. Its required-cell union must equal original required coverage minus retained observations. Removed fillers must be explicitly and exactly accounted for; added cells are rejected. Counts, status and any declared executable flag are not proof. Packet jobs using replacement IDs must exactly match their pinned replacement records, including request SHA, required/filler lists and clocks.

The actual overlay is [retained evidence](data-pilot-evidence/2026-10-16-history-ownership-replan.json), SHA-256 `3e7c22f35afa2f44e59bedafafc0226d8d4a373c163e0de63ece38cd2c8f3235`. It preserves 312 missing required cell-hours and removes 96 unnecessary filler cell-hours. This is finite source admission, not baseline completion or acquisition authorization.

## Refreshed offline packet

The old preparation remains untouched. `.data/global-acquisition-preparation-20261016-v3/packet.json` contains the same original 16 requests and 363 monthly children with current runtime pins and the added overlay source pin. Its SHA-256 is `40ebd34f37fe83016e0d7ec9adb6a115daeddf75710aeb006eedfb372f59bde8` (38,304 bytes). The [public receipt](data-pilot-evidence/2026-10-16-global-acquisition-overlay-preparation-v3.json) records all request hashes and source/runtime pins without local paths or credentials. All four replacement rows were separately passed through packet and source validation against the actual full pinned inputs; they were not substituted into the first-16 packet.

The live gates remain explicit owner allowance, exact current provider acceptance, runtime equality and supervised execution. No allowance was manufactured, and no calls, downloads, credentials, deploy, commit or push occurred.

## Offline verification

The new test uses selected actual source metadata and the actual overlay. Initial red run failed because replacement owners had no admission route. Green coverage includes replacement admission, original blocked-owner remainder admission, retained-day rejection, missing exclusion overrides, dropped/duplicate replacements, incorrect removed-filler accounting, changed retained masks, arbitrary blocked-owner resolution, changed required classification and changed replacement clock. Existing tests preserve no-overlay blocked-owner and source hash denials.

Commands run from the plugin worktree:

```text
.data/era5/venv/Scripts/python.exe -m unittest discover -s tests/era5 -p test_global_acquisition.py
.data/era5/venv/Scripts/python.exe -m unittest discover -s tests/era5 -p test_*.py
```

Focused: 13 passed, exit 0. Full ERA5 Python suite: 163 passed, exit 0. Existing NumPy 2.5 array-shape deprecation warnings appeared in NetCDF fixtures. A separate local replay verified the original 16 and all four replacement jobs against full pinned inputs and wrote the fresh packet, exit 0.

Review follow-up: a rehashed replacement that shortened the last rectangle and removed two extra filler cells first reproduced the admission bug. The verifier now independently requires the exact four approved removed filler cells (96 cell-hours). Full ERA5 Python suite rerun: 163 passed, exit 0; the regression failed before the fix. Fresh v3 packet and receipt bind the updated runtime; v1 and v2 artifacts remain untouched. Actual full-source admission replay passed for the prefix and four replacements, exit 0.
