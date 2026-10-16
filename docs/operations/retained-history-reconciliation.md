# Retained history reconciliation — 16 October 2026

This offline reconciliation joins actual decoded observations to the frozen worldwide acquisition ownership. It is an admission/holdback artifact, not a complete executable global schedule or scientific baseline. No provider request, download, credential inspection, deployment or publication occurred.

The frozen plan remains SHA-256 `0b296d22142fea417a71299e17009536f82b14417f33eb4b38baa2ff307d2b12`. [Sanitized evidence](data-pilot-evidence/2026-10-16-retained-history-reconciliation.json) retains the input pins, exact new hours and blocked owners. [Reproduction inputs](data-pilot-evidence/2026-10-16-retained-history-reconciliation-inputs.json) specify all nine decoded children, seven distinct raw parents and three lineage ledger bodies plus the independent validation receipt. Existing frozen exclusions are checked against actual observed rows. Equal repeated values are deduplicated; unequal overlaps fail. Retrieved nulls prevent reacquisition but confer no scientific completeness.

| Quantity | Frozen | Reconciled |
| --- | ---: | ---: |
| Retained required cell-hours | 16,416 | 16,512 |
| Retained acquisition cell-hours | 25,488 | 25,584 |
| Retained required baseline UTC cell-hours | 16,368 | 16,368 |
| Retained required padding cell-hours | 48 | 144 |
| Retained outside acquisition ownership | 0 | 0 |

The new raw parent is 25,261 bytes, SHA-256 `4d54f0e655b04c22c077d94fe790bbec5cc5e1f49df32f6ac9189a8013e2d5bd`. Fresh local decoding with the existing strict decoder produced 3,601 bytes, SHA-256 `546559857fd63fa7086543b29652a3a1aef66e403580a0906243bec16d383f3f`. All four cells (`era5:32:48.75`, `era5:32:49`, `era5:32.25:48.75`, `era5:32.25:49`) are **required** in the worldwide inventory, despite three being called fillers in the earlier single-target request. Each has exactly 1990-12-30T00:00:00Z through 23:00:00Z, inclusive, member zero, final revision 0001. The extra 96 cell-hours are entirely padding; they add zero baseline dates.

Each new cell is a corner of a different existing four-cell rectangle: `243:457`, `243:458`, `244:457`, `244:458`. Those four owners, comprising 16 acquisition cells, are blocked in full because retained masks differ. A four-cell 2×2 rectangle cannot be divided into smaller nondegenerate quarter-degree rectangles. Combining the central sample rectangle across the four owners leaves one-cell-wide perimeter strips; broader spatial reownership would require a separate exact audit. No cells or hours are silently dropped, grouped across unequal masks or reacquired. Other owners remain eligible for a separately authorized packet once its exact requests and reconciliation pins are checked.

Theoretical missing required cell-hours become 14,422,993,824 and missing acquisition cell-hours become 26,286,148,848. These arithmetic complements are not a ready-to-submit schedule: blocked ownership still needs resolution. Full 1991–2020 dark-night completeness and quality gates remain unproved.

## Reproduction and bounded contract

The new `scripts/era5/reconcile-retained-history.ts` accepts four arguments: root, manifest relative path, manifest SHA-256 and fresh output path. Inputs are hash checked and root constrained; limits are 64 MiB cumulative reads, 8 MiB per raw/plan body, 4 MiB other bodies, 4,000 entries, 1,000,000 observed rows, 120 seconds and 16 MiB output. Output creation is exclusive. No network modules are used.

For the retained workspace, the executed command was:

```powershell
npx tsx scripts/era5/reconcile-retained-history.ts . .data/retained-reconciliation-20261016-v1/manifest-v2.json 2ddd52a9e60a566eb372cb99676046975e62c7367b84b5c258a06f6ed341870e .data/retained-reconciliation-20261016-v1/reconciliation-v2.json
```

The manifest's committed copy is byte identical. Choose a fresh output pathname when replaying. The fresh sample JSONL can be reproduced with the existing `read_chunks.py` from the pinned retained raw body; choose a fresh directory so the decoder cannot replace earlier evidence.

Output: **597,434 bytes**, SHA-256 `a5cc2399ca627fbf23a3a776182f93235c37dab2bd639c954d7ed5d1a200a2ba`; logical input reads **8,374,628 bytes**. The full ignored artifact contains every retained cell's exact UTC-hour set, with all lineage pins. Two unaffected retained owners receive exact recomputed overrides.

Handoff schema v1 contains `frozenPlanSha256`, `inputPins`, `cells` (cell ID, owner tile ID or null, required/filler/outside classification, exact `hoursUtc`), `blockedTiles` (owner ID, reason and per-cell exact masks), `updatedOverrides` (owner ID and replacement calendar overrides), and counts. A consumer must hash-pin this artifact, match its frozen plan hash, reject every selected blocked owner, and apply updated overrides before deriving request identities. Unlisted owners keep their frozen overrides. The artifact is not authorization to acquire data.

Focused tests cover exact null subtraction, conflicting overlaps, equal-overlap idempotence, unequal-mask holdback, outside ownership, unjustified frozen subtraction, duplicate ownership and invalid clocks. `npx tsx --test tests/era5/reconcile-retained-history.test.ts`: **7 passed, exit 0**. Initial red run failed with missing module (exit 1). An initial actual replay rejected a 32 MiB read-limit argument; reducing it to the existing trusted reader's 8 MiB limit resolved that failure. Successful actual replay: **exit 0**. `npx tsc -p tsconfig.era5.json --noEmit`: **exit 0**. No full suite was run concurrently by this lane.

The new decode lineage receipt is also [committed](data-pilot-evidence/2026-10-16-retained-history-decode-lineage.json); its ignored manifest path can be restored by copying those exact bytes into a fresh reproduction directory. Each admitted legacy ledger must bind the same raw parent and decoded child hash, including grouped monthly partitions. The fresh decoded child is bound by its explicit new decode receipt, while the independent validation receipt must bind the same raw hash and accepted validation. The manifest hash is a trusted operator input; the code does not establish trust in arbitrary self-authored manifests. Compute deadlines are checked during union and tile reconciliation, and output parent paths reject aliases before exclusive creation.

Review follow-up: a fresh output directly under the validated root is now accepted; the root realpath identity is rechecked, while child parents still use the original boundary/alias checks. A regression test first reproduced the empty-relative-parent failure, then passed with root output, repeat-output rejection, outside traversal rejection and aliased-root rejection. Focused test run: seven passed, exit 0; ERA5 TypeScript check: exit 0. Pinned replay bytes are unaffected.
