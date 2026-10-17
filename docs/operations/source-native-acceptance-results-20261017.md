# Source and native acceptance results — 17 October 2026

## Approved execution outcomes

| Lane | Actual result | Remaining acceptance |
| --- | --- | --- |
| Geography diagnostic | One approved unfiltered country GET; HTTP 200, 149 bytes, 779 ms, one reserved credit; `selection-empty`. No Details or follow-up request | This query still has no usable country identity. Do not infer a filter bug or universal country failure. Ordinary point workflows remain independent; no further request authorized |
| History accounting | Owner-approved Open-Meteo import succeeded; one prior source-estimated credit charged. Every pre-existing provider entry compared unchanged before/after. Zero requests during import | Provider-measured debit remains unobserved; subsequent consumption must use shared accounting |
| Annual history | Separately approved single request returned HTTP 200 in 1,443 ms, 111,061 decoded bytes; all 8,784 expected 1992 hours, zero null/absent hours; three credits reserved | Quarantine-only annual shape success. Full baseline, upstream scientific revision, historical production admission and actual serving measurement remain open |
| Native plugin | Supported CLI installed `nightsky@nightsky-native-acceptance-20261017` version 1.0.14 | Existing chat has no refreshed NightSky tool inventory. Native loading/tool/answer acceptance needs a normal refreshed host; no nested-model bypass |

## Annual provenance and retained evidence

Plan SHA256: `c96b488bbcda010ddeed686816fa959eba6d984124c4b826f3ec3a16a3e0ad29`.
Execution ID: `f75333f9f0f09bda5422292d1471b50dfda7e91aadcb76c0c712eb68bef2517e`.
Raw SHA256: `a5b7a7e7ddb2eba8de01d0eb7dd01de18a6ce93bc2f60b29395f8585fb0dc894`.
Retrieval: `2026-10-17T11:07:09.831Z`; grid 28.5/77.25; units Unix UTC hours and cloud percent.

Ignored local evidence is under `.superpowers/sdd/source-native-acceptance-20261017/history/<execution-id>/`: raw response, attempt, receipt, intent, reservation and validation. Total retained files: 114,840 bytes. No raw data or private accounting/credentials is committed. Reserved credits are local accounting, not provider-measured debit. No runtime history flag was enabled and no deployment occurred.

Both live allowances are now consumed. Do not replay either command, issue a geometry follow-up or acquire further historical periods without a new decision. Installation evidence is separate from model acceptance.

## Review and tests

Independent read-only review found no concrete blockers in the filter guard, fixture tests or usage reconciliation. Focused geography tests passed 26/26; TypeScript passed. Full-suite and exact-commit CI evidence are appended after execution. No speculative production adapter change was made.

Final local aggregate: **1,466 passed, zero failed, two skipped** (1,468 total; 236.1 seconds). All TypeScript projects passed; independent review found no blockers. Exact-commit CI is checked after push; earlier CI does not validate this increment.
