# API-only V1 release readiness implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development and independent review before integration.

**Goal:** Align executable release checks with approved API-only V1, record finite maintained event coverage and audit the assembled local package.

**Architecture:** Add an explicit API-only release profile rather than weakening legacy release validation. Preserve runtime/provider admission and request limits. Document the supported event evidence and maintenance responsibility without fabricating missing scientific data.

**Tech Stack:** TypeScript, Node offline tests, JSON maintenance inventory and Markdown operations records.

**Spec:** docs/operations/v1-api-only-scope-20261018.md; v1-api-readiness-20261018.md; v1-remaining-ticket-release-matrix.md.

## Constraints and review focus

No provider calls, data acquisition, source activation, private key/ledger changes or deployment. Preserve two existing unrelated documentation edits. API-only current releases must not bypass legacy rollback gates. Keys alone cannot admit providers. Missing event maxima/seasons remain explicit; maintainer identity is NightSky.earth. Keep source credits, partial failures, finite quotas and actual public-host gates.

## Parallel tasks

- [x] A: Add an explicit api-only-v1 release profile to operator preflight and tests. Require API mode/no local geography or history, waive only historical baseline prerequisites for that explicit profile; preserve omitted/legacy behavior. Write regression, observe red, implement, rerun affected tests. Document exact proposed source roles and outstanding activation/account conditions.
- [x] B: Reconcile maintained event evidence and review schedule with actual runtime inventories, preserving all supported identities and finite years/gaps. Add schema-compatible maintenance metadata and offline regressions only where justified; retain owner decisions explicitly if adoption would exceed authorization.
- [x] C: Independently audit permissions, privacy, failure/source claims and release boundaries. Record material actionable findings with exact files. Do not turn optional history or website into V1 blockers.

## Integration

- [x] Independently cross-review lane changes, address material findings, run affected tests/type checks and full offline suite. Build changed runtime/package as applicable; do not bump package for operations-only changes.
- [x] Update tracker and ticket evidence accurately; do not recategorize work as done solely because a gap is documented.
- [ ] Commit/push the reviewed development branch, then watch exact-head CI; record final outcome in the handoff. No deployment.
