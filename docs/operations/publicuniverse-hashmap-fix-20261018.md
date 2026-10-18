# Public Universe upstream hash-map correction — 18 October 2026

## Diagnostic evidence

The owner approved two diagnostic requests: original Sirius starter search and original Hyderabad discovery, maximum 60 seconds and 2 MiB total, without retries or raw response files. Independent preflight review found no bounds/accounting defect.

Both returned HTTP 200; **294,573 bytes** were accepted. Both remained rejected by the unchanged adapter. Sanitized validation issues identified the same field mismatch:

| Boundary | Rejected field | Actual shape |
| --- | --- | --- |
| Starter search | `sources.bsc5p.upstream_sha256` | Filename-to-hash object; `bsc5p.tdat` has a 64-character string |
| Starter search | `sources.openngc.upstream_sha256` | Filename-to-hash object; `NGC.csv` and `addendum.csv` each have a 64-character string |
| Discovery | `discovery.source_snapshots[0..1].upstream_sha256` | Object rather than scalar string |
| Nested observing plan | `plan.targets[1].catalogue.upstream_sha256` | Object rather than scalar string |

The adapter incorrectly modeled these as a single SHA-256 string. The diagnostic retained only bounded error paths/types, field names and string lengths, not source values or raw response bodies. The existing private ledger was reused; no initialization/reset or normal-plugin admission occurred. Total source requests through this diagnostic: twelve (ten previous, two diagnostic).

## Reviewed correction sequence

1. Verify the named-file hash semantics against pinned upstream source/manifest metadata.
2. Add synthetic regression cases and observe failure before editing production schemas.
3. Validate bounded filename/hash maps at both upstream and public-output boundaries, preserve every accepted hash, and canonically serialize named-file identity for comparisons. Reject malformed hashes and oversized maps; do not bypass identity checks.
4. Test search/detail/discovery/window flows, key-order invariance and stale lineage on changed file identity. Independently review the complete correction.
5. Run affected and assembled regressions, types, backend/package and compiled checks. Update the same local plugin package; keep source admission disabled.
6. Record evidence and CI. Any subsequent live acceptance requests require a separate bounded decision; these two diagnostic requests are consumed.

## Verification status

Implementation and verification results are recorded below when available. The diagnostics alone do not establish a corrected live result or native-model acceptance.

## Source-of-truth confirmation

A separate read-only reviewer verified the pinned backend `95584ebc5f8cc40e4f6dc923f4e58288910e0093`: `starter_catalogues.py` copies non-row metadata unchanged, ingestion stores it unchanged, and discovery copies that provenance into source snapshots and target catalogue metadata. `NOTICE.md` distinguishes original source-file hashes from prepared subset hashes. These small primary-source reads did not call the astronomy API or download catalogue rows. The fix must preserve both the subset digest and each named upstream-file digest.

## Correction and independent review

The shared public snapshot and upstream provenance schemas now accept a nonempty map of at most eight filename/SHA-256 pairs. Keys are bounded filename-only identifiers; malformed digests, unsafe names, empty/oversized maps and prototype keys are rejected. The prior scalar adapter contract remains supported for compatibility; this does not assert that current upstream manifests use a scalar. Both starter and observing identities serialize maps canonically into the existing bounded string identity store. The public observing catalogue retains the full accepted map and separate subset digest.

The implementer observed two failing regressions before the first correction, then 37 affected tests passed. Independent review found one remaining order-sensitive discovery comparison: nested provenance used JSON.stringify equality. A reversed-key nested-only regression failed before the targeted canonical comparison fix and passed afterward. Independent re-review approved all four corrected schema/normalization/test files. The final affected provider/contracts/starter/MCP run passed all 42 tests. All three TypeScript configurations passed.

## Approved post-fix live recheck

After separate owner approval, the reviewed runner permitted at most four requests / 90 seconds / 4 MiB with no retries. It reused the ledger and kept normal plugin admission unchanged. Actual execution was **2026-10-18T05:41:04.449Z–05:41:16.686Z**, **two HTTP 200 requests / 294,573 accepted bytes**:

- Starter search now returns available with a valid empty result (total=0) for the string Sirius. This is a limited-catalogue search result, not evidence that Sirius does not exist or cannot be observed.
- Hyderabad discovery now returns available with two targets (Moon and `bsc5p:hr617`), each with one viewing window and three selected-window direction samples. Model, provenance and coordinate limits remain attached; these are not weather/site-access guarantees.
- Starter detail and selected Sirius-window calls were skipped because the required search identity was absent. No alternate target or replacement request was silently substituted. Those paths have synthetic regression coverage, not live acceptance from this run.
- Dedicated accounting records fourteen total attempts: ten initial, two diagnostic, two recheck. No existing ledger was reset. All live allowances for these completed scripts are closed; another check requires a separately bounded decision.

## Local package verification

Package revision **1.0.22** was installed with the supported installer using the existing `nightsky@nightsky-native-acceptance-20261017` identity. All fifteen installed files match their inventory hashes. The source remains disabled in normal plugin configuration; no real-data local session, native-model conversation acceptance, deployment or publication was performed.

Portable packaging, complete Codex/Claude offline package verification, backend build, and compiled API/light-pollution/Public Universe checks passed. The compiled optional-source check exposes eighteen selected-source tools and returns unavailable when unadmitted with zero external requests.

- Codex ZIP SHA-256: `c7b2566268fe884c3ba6a93f72e64bb59f30cd2894cba91073ba96aa0cf5792b`.
- Claude ZIP SHA-256: `4c16e43adb4f305818cc8d3a9958be8f70492b23653a59679a7089ea1954e3ec`.
- Backend SHA-256: `beb6f12d35f45f655c9085152874b9412f5a211bb443d1454ca0d09104ee0c05`.

Fresh final aggregate regression passed after all corrections: **1,762 tests / 1,760 passed / zero failed / two skipped**, 212.2 seconds. Exact-commit CI is checked after push before handoff. Original V1 ticket totals remain unchanged; live selected-starter acceptance and native owner conversation review remain separate gates.
