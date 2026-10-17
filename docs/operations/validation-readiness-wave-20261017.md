# Validation readiness wave — 17 October 2026

Baseline: `2b298d52f172a552ef315fe60e2b21a12f4e7812`, branch `codex/plugin-v1`.

## Delivered

| Lane | Result | Remaining gate |
| --- | --- | --- |
| Geography | [Official-contract diagnosis](geography-diagnosis-20261017.md); no confirmed bug, no speculative adapter change | Empty country response remains unresolved; alternative request is unexecuted and requires fresh authority |
| History | [Atomic accounting import and operator](history-accounting-20261017.md), real-ledger synthetic annual reservation tests, default offline CLI | Verified actual usage/allowance and coordinated consumers; authorized import; separately authorized annual probe and source admission |
| Codex | [Complete local package preparation](codex-local-preparation-20261017.md), loopback binding, 14 tools and five skills | Native installation/skill loading and full-answer/owner acceptance |

No live provider calls, private ledger reads or changes, installation, deployment or publication occurred. No ticket-count credit is claimed: 12 Done / 9 Partial / 6 Not started. The six completion blocks remain fixed.

## Review and verification

Independent whole-change review found no material findings. Initially missing real-ledger annual integration and absent/corrupt/ownership failure evidence were added before review completion. Optional additional coverage remains for import-specific termination after rename (shared persistence already has crash coverage) and the bounded serve shutdown path.

Type checks, website/server/plugin builds, plugin package assembly, compiled API and MCP runtime checks passed. API measurements used synthetic providers: sampled RSS 195,903,488 bytes, sequential HTTP timings 18–32 ms; these are not live latency or Hetzner capacity claims. The local package preparation observed zero external calls and closed its listener.

The reproducible local 1.0.14 rehearsal ZIP SHA256 is `498258fac6326dcc7b8ee0ac592b1a9cb578adeb7042c3ab42d069fdfb206393`. Endpoint: `http://127.0.0.1:8765/mcp`; it is not currently kept running. Installed/native model state remains unverified.

CI now runs complete fixture preparation on an ephemeral port and verifies the history operator's offline default. Aggregate tests include the new accounting, operator and fixture suites. Final aggregate count and exact-commit CI are recorded below after execution.

## Next sequence

1. Establish actual Open-Meteo allowance/complete usage and operator coordination, then obtain authority for the preserving import and bounded annual request. No new account is implied by this code.
2. If country-boundary validation is pursued, authorize the specifically revised one-request diagnostic. Do not replay the consumed selection packet or make ordinary point discovery wait for it.
3. Install the complete local package through the supported native flow when ready, run the existing journey matrix and owner questions, and review complete answers. Fixture success is not model acceptance.
4. Reconcile remaining source/event gates and final assembled measurements/audit inside blocks 1–3. Hosting/publication/pilot remain later blocks 4–6.

Final local aggregate: **1,462 passed, zero failed, two skipped** (1,464 total; 250.7 seconds). Fresh types and package verification passed for both Codex and Claude projections; compiled production runtime also passed. CI for the forthcoming commit remains pending at document commit time; the coordinator must observe that exact run before declaring this wave complete.
