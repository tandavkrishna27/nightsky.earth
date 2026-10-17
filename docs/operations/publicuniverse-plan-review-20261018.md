# Public Universe V1 plan review - 18 October 2026

Design: [optional provider](../product/publicuniverse-v1-integration-design.md). Plan: [implementation sequence](../superpowers/plans/2026-10-18-publicuniverse-v1.md).

## Source of truth

- Local baseline37aee0c, package1.0.20; worktree `codex/plugin-v1`.
- Upstream backend95584ebc5f8cc40e4f6dc923f4e58288910e0093, confirmed through GitHub metadata. Source/API definitions are not live-result acceptance.
- Published OpenAPI document was read successfully during prior investigation; no astronomy-data requests, catalogue/bulk downloads, source activation or implementation in this planning pass.

## Review round1

Independent source-contract and local-compatibility reviewers inspected the draft against actual source. Findings and corrections:

| Finding | Disposition |
| --- | --- |
| New policy in existing sky ledger can invalidate shared quota accounting | Dedicated optional Pub ledger/policy, legacy policies unchanged, missing budget fails Pub only; add initialized-legacy/unmigrated-Pub regression. The initial review described app startup failure, but validation is caught and marks the quota failed; the concrete risk is cross-source denial, not necessarily app termination. |
| Two-second catalogue spacing prevents cold multi-section detail enrichment | Rolling catalogue/shared counters permit bounded sequential bursts; no queue/sleep; max3explicit dispatches and15second total operation deadline; prefer already-returned inline sections. |
| Literal route mappings and detail discriminators were missing | Added fixed operation/path/query/envelope/identity matrix and explicit public union. No runtime endpoint choice or arbitrary pagination. |
| Meteor detail can contain more than20parameter sets | Validate up to500within body fence, explicitly reduce to20with total/truncation/source order; above-fence is a size failure, not absent shower. |
| Source revision comparison was vague | Canonical identity/provenance revision fields, same-lineage comparison only, absent comparable token explicitly unverified, selected observing identities require comparable source metadata. |

Other confirmed boundaries: observing no-store versus allowed reference caching, rounded coordinates versus original requested point, full-night chart samples versus selected windows, full-night midpoint Moon phase, source-specific catalogue identity, unsupported reference-to-observing targets and data-specific licences.

## Review round2

Fresh reviewer inspected revised artifacts against both source truths and found two remaining P2 issues:

| Finding | Correction |
| --- | --- |
| Discovery body shorthand used invalid plural/nested fields | Exact flattened POST mappings for discovery and night, public-to-upstream names and serialized-key fixture assertions; singular `preference` |
| ProviderQuota erased the required cooldown persistence method | Dedicated `PublicUniverseQuota` includes mandatory `reserve` and `setProviderState`; specified bounded Retry-After, monotonic serialized updates, failed-write denial and restart tests |

The reviewer confirmed that the revised dedicated-ledger isolation and observing/catalogue lineage address round 1 concerns. After correction, the reviewer rechecked both exact POST field sets and the durable quota interface and found no remaining concrete blocker in those corrections. No implementation begins before the planning skill's owner review gate.

## Remaining gates

- Owner review of saved design/plan, then explicitly chosen subagent execution (already requested).
- Offline implementation/testing and independent whole-diff review.
- Separately approved provider budget/live acceptance; no API key required.
- Native-host conversation evidence remains separate; no deployment implied.

Original V1 ticket totals remain12Done/9Partial/6Not started. These are planned source/experience additions, not new completion credit.
