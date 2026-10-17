# Sky source activation follow up

Date: 17 October 2026. Scope: source admission, verified allowances and preserving quota accounting. This review does not establish production activation or scientific accuracy.

## AstronomyAPI public evidence

The official [getting started guide](https://docs.astronomyapi.com/) describes a free account, application ID and secret, and Basic authentication. The [known issues page](https://docs.astronomyapi.com/known-issues) says rate limiting applies across consumers according to IP and overall API consumption and can return HTTP 429. It directs high usage inquiries to the provider. Neither page states a numeric free allowance. The [homepage](https://astronomyapi.com/) describes paid plans for custom endpoints and high request rates.

The indexed [terms of service](https://astronomyapi.com/terms-of-service), last revised 11 April 2020, require account credential security, lawful use, use of the provided administrative interfaces and avoidance of interference with other users. The provider reserves intervention for availability/performance problems. The current direct page returned no extractable body during this review, so this is limited indexed evidence, not confirmation that those are the complete current terms. Public or commercial redistribution permission and account-specific restrictions still need confirmation before public release.

The account's actual free entitlement, remaining balance, billing behavior and reset windows remain unknown. An HTTP 200 from the earlier search diagnostic does not resolve these questions. The configured 20/hour, 100/day and 1,000/month are operator ceilings only. Do not substitute similarly named astrology services' pricing for AstronomyAPI. Keep AstronomyAPI unadmitted until account evidence or provider confirmation supports the intended ceiling and use.

## Consumption already incurred

The prior bounded diagnostic recorded six attempted requests. Charge attempts even when upstream service or validation failed:

| Provider | Requests | Accounting destination |
| --- | ---: | --- |
| 7Timer | 1 | Existing weather ledger preserving migration |
| Dark Sky Planner | 1 | Separate sky ledger |
| AstronomyAPI | 1 | Separate sky ledger when entitlement is verified |
| NASA DONKI | 1 | Separate sky ledger; HTTP 503 still counts |
| JPL | 2 | Separate sky ledger; includes rejected Horizons response |

These counts are minimum known consumption, not a statement that every other consumer is idle. Include all subsequent requests and shared-account usage. Rolling usage can age out after its actual interval; monthly consumption remains until the relevant reset. The local ledger uses UTC months, so a different vendor window requires conservative reconciliation before admission.

## Setup review and implemented correction

The original fresh sky setup could only write empty counters under an unused-budget attestation. Its evidence text could not charge the six earlier requests. Fresh initialization now also supports a reviewed complete usage packet. This imports each selected provider's rolling-day and current-month consumption, conservatively charging all imported rolling usage to the current hour. It requires verified allowance, complete account usage and quiesced consumers; observations must be at most five minutes old and in the current UTC month. Every selected provider must have exactly one usage record. Existing checkpoints and initialization markers still prevent reset.

7Timer already has a preserving migration using the same usage attestations. Keep the existing weather ledger and use `scripts/migrate-seventimer-quota.ts --apply` with its reviewed packet. Never create another weather ledger to avoid existing counters.

## Exact fresh sky initialization command

Run only after completing a reviewed private packet and quiescing every consumer:

```powershell
node --env-file=C:\Users\TK\.nightsky\providers.env --import tsx scripts/initialize-sky-quota.ts --initialize-with-usage C:\Users\TK\.nightsky\sky-usage-reviewed.json
```

Packet fields are `decision: "approved-initialize-sky-usage"`, `quotaPath` matching the absolute `NIGHTSKY_SKY_QUOTA_STATE_PATH`, a future ISO UTC `expiresAt`, and `usage` keyed by exactly the selected provider IDs. Each usage record has `verifiedAllowance: true`, `verifiedAllAccountUsage: true`, `allConsumersQuiesced: true`, nonsecret `evidence` of 8–500 characters, `observedAt` as epoch milliseconds, and nonnegative integer `usedLast24Hours` and `usedCurrentMonth`. Evidence must support the operator ceiling as well as actual usage. Do not fill unknown entitlement with `true`.

Exclude AstronomyAPI from initial selected/admitted sources if its allowance remains unresolved. Adding it later requires a preserving extension or a reviewed migration; creating replacement ledgers to discard usage is not permitted. Selection, admission and available quota are all required before upstream requests. The weather and sky quota paths must differ.

## Remaining activation needs

1. Obtain account evidence for AstronomyAPI free allowance and intended use, without exposing secrets or sending an API request to probe quota.
2. Reconcile prior attempts and all consumers, then prepare fresh reviewed usage packets immediately before an authorized setup operation.
3. Initialize only verified sky providers; preserve weather counters while adding 7Timer. Update admission only for verified sources.
4. Keep NASA successful live-response acceptance, AstronomyAPI body positions acceptance and JPL observer-response acceptance separate from accounting activation. Each future live request needs its own bounded authorization and durable reservation.

## Offline verification

The sky setup suite passes 7 tests, covering imported consumption, subsequent quota enforcement, reset refusal and stale/incomplete/unverified/expired snapshots. `npx tsc -p tsconfig.tools.json --noEmit` passes. The initial test run hit sandbox temporary-directory rename EPERM; rerunning with TEMP and TMP set to the worktree's ignored dist directory passed. No private configuration, private ledger or provider API was accessed by this review.

The broader quota-state suite passed 17 of 19 tests in the sandbox; two environment-dependent tests could not run successfully because junction creation returned EPERM and the Windows short-path helper was blocked by PowerShell authorization. This is not a fully passing broader suite.
