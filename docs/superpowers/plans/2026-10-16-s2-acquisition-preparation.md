# S2 acquisition preparation implementation plan

> Use superpowers:subagent-driven-development for these independent tasks and fresh task/final reviews.

**Goal:** Advance existing S2-G2, S2-H2 and S2-E2 through concrete proposals and offline executor preparation, without acquiring data.

**Spec:** [Fixed completion tracker](../../operations/v1-completion-tracker.md), N1â€“N3. Permanent stages and original ticket acceptance are unchanged.

**Architecture:** Reuse the fixed time-series transport/state machine and existing Windows process containment. Geography and events produce retained-evidence proposals; root owns tracker, CI registration and integration.

## Constraints and review focus

- Existing isolated `codex/plugin-v1` worktree; no downloads, external metadata requests, credential access, installs, product-model tests, deployment or runtime data promotion.
- Default executor stays offline; real execution requires exact separate allowance and hard containment before credentials. Unknown raw data remains unvalidated.
- Source proposals cannot invent body hashes, provider mappings, accepted topology, scientific coverage or rights.
- Guard uncertain submissions/resumes, legacy allowance crossover, path aliases, host/auth leakage and blocked child processes with offline tests.
- No scope reduction or new wave numbering. Prepare later source decisions, not permission receipts on behalf of the owner.

## Tasks

- [x] Geography: create `docs/operations/s2-geography-acquisition-proposal.md`; exact two pinned sources, finite limits, integrity/mapping/topology tests, retention and stop conditions. Validate links/retained pins; fresh review.
- [x] Weather: create `scripts/era5/timeseries_sample*.py`, focused Python tests and `docs/operations/s2-weather-sample-proposal.md`. Reuse state machine/transport, exact allowance/output binding and hard process supervisor; TDD offline, no credential reads or scientific promotion. Coordinate shared edits with root; fresh review.
- [x] Events: create `docs/operations/s2-events-coverage-matrix.md`; reconcile current code, original acceptance and retained source rights/years/gaps. Distinguish supported/partial/permitted unsupported; fresh review.
- [ ] Integration: register test/CI checks as necessary, update existing tracker rows and ledger, verify affected suites/types/build as appropriate, fresh integrated review, commit/push authorized branch and watch exact-commit CI.

## Interface preflight

| Tasks | Shared interface / ruling |
| --- | --- |
| Geography self | Actual body unknown; propose measured hashes and mappings, never guess them. |
| Weather self | Live-capable code may be prepared but never invoked in this offline wave. Cooperative timeouts are insufficient; hard parent containment must precede credentials. |
| Events self | Old no-2027 documents are historical; current implementation/evidence controls current coverage. |
| All lanes / root | Separate owned new files. Root alone edits tracker/status/test registration/CI. No agent commits concurrently. |
| Weather / existing executor | Reuse bounded contract hook and transport; no legacy decoder assumption or executor duplication. |
