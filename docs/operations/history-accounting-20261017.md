# Annual history accounting operator — 2026-10-17

Implemented and checked offline. No private ledger was opened, migrated or reserved; no credentials or upstream service were accessed. This document and the printed plan are not authority to execute a request.

## Safe invocation now

From the repository root:

```powershell
node --import tsx scripts/era5/history-accounting-operator.ts
```

This prints the fixed annual plan and digest without reading a packet, ledger or environment credentials. The existing `probe-annual-history.ts` offline command remains available. The new operator explicitly connects the existing annual executor to `createPersistentQuota`; callers cannot accidentally get a fresh in-memory budget through this CLI.

## Separate provider addition, after accounting evidence and authority

The existing ledger can lack `open-meteo`. `addVerifiedProvider` holds the existing exclusive lock and atomically replaces the checkpoint after adding that one entry. Every pre-existing entry, account label, bucket, monthly count, disabled flag and backoff is preserved. It cannot initialize a missing ledger, replace a provider or recover corrupted state. It never calls `initializeVerifiedBudget`. The new entry retains its reviewed policy and import evidence; reopening with a different policy fails closed. Key order is irrelevant. Invalid import metadata fails closed even when reopening for another provider.

The operator's stable account identity is `operator-open-meteo`. The maximum permitted application slice is 500/hour, 1000/day and 30000/UTC calendar month; smaller reviewed positive integer limits are accepted. These ceilings are not verified upstream allowance, unused capacity, a purchase or approved spend. All calls by the shared account/IP budget must be included in the usage evidence. Obtain evidence for the applicable upstream limits, already consumed weighted credits and other consumers; do not derive unused balance from public pricing or from this repository.

Use an independently reviewed JSON packet with exactly these fields (placeholders below are deliberately not runnable JSON values):

```text
decision: "approved-add-open-meteo-account"
quotaPath: absolute path of the existing shared ledger
expiresAt: future UTC ISO timestamp
policy:
  providerId: "open-meteo"
  accountLabel: "operator-open-meteo"
  hourlyLimit: verified positive integer, at most 500
  dailyLimit: verified positive integer, at most 1000
  monthlyLimit: verified positive integer, at most 30000
usage:
  verifiedAllowance: true
  verifiedAllAccountUsage: true
  allConsumersQuiesced: true
  evidence: 8–500 character nonsecret evidence reference covering allowance and usage
  observedAt: snapshot time as Unix milliseconds
  usedLast24Hours: verified nonnegative integer ceiling of all weighted credits in the rolling 24 hours
  usedCurrentMonth: verified nonnegative integer ceiling of all weighted credits in the current UTC month
```

All consumers must be quiesced from the snapshot through import. The snapshot must be at most five minutes old, not in the future and in the current UTC month. Values above the policy limit remain charged and deny new reservations. Month usage cannot be less than rolling-day usage except on the first UTC day, when the rolling window includes the previous month. A zero requires affirmative complete-usage evidence; unknown usage must not be entered as zero.

Imported rolling-day usage is deliberately placed in the current minute, so it is charged against both the hourly and daily limits for a full conservative window. This can temporarily deny requests despite available upstream hourly capacity. No fabricated historical bucket distribution or refund is used. Monthly usage remains charged until the normal UTC month boundary. New reservations then use the existing minute buckets and monthly counter.

Only after separate authority to mutate that ledger, run:

```powershell
node --import tsx scripts/era5/history-accounting-operator.ts --apply-provider C:\operator\reviewed-add-open-meteo.json
```

Paths here are illustrative operator-owned locations, not discovered local state. A second import is refused. The exclusive lock, initialization marker, temp-file exclusive creation, file sync and atomic replacement retain existing crash behavior. An interrupted `.tmp`, stale lock, changed checkpoint or lost ownership fails closed; there is no automatic recovery. Windows cannot directory-fsync, as in the existing implementation. Preserve uncertain files for operator review; never delete/reset the ledger to make this command pass.

## Separate one-request approval

After the real migration has been authorized, performed and verified by the operator, prepare a distinct JSON packet with exactly these fields:

```text
decision: "approved-annual-history-probe"
quotaPath: same absolute shared ledger path
policy: identical reviewed policy object used by the import
expiresAt: future UTC ISO timestamp
planSha256: digest printed by the safe command
executionId: fresh 64 lowercase hexadecimal characters
evidenceRoot: existing absolute local unlinked directory
maxReservedCredits: 3
sourceUseEligibilityReviewed: true
sourceUseEvidence: 8–500 character nonsecret finite-evaluation eligibility evidence reference
accountPolicyEvidence: 8–500 character nonsecret allowance/import evidence reference
allAccountConsumptionUsesSharedLedger: true
```

All ongoing consumption must reserve through this same ledger and policy; an external consumer invalidates the complete-account assumption. Consumers that do not participate must remain stopped. The runtime's existing weather policies are unchanged; no automatic initialization or runtime history enabling occurs. The account policy and evidence fields accompany the annual attempt record.

Following fresh explicit approval for this packet, the future operator command is:

```powershell
node --import tsx scripts/era5/history-accounting-operator.ts --execute-approved C:\operator\reviewed-annual-attempt.json
```

This is a live-capable command, **not authorized by the current offline work**. It opens the shared durable quota with the added policy, reserves three before transport, and closes its owned lock. It retains the annual executor's one GET, no retry/redirect/fallback, 60-second deadline, 2 MiB body cap, 4 MiB evidence cap, unique attempt directory and quarantine-only result. Failed attempts keep their reservation; restart never refunds or automatically replays. The attempt is not scientific admission or proof of provider-measured debit.

## Evidence still required

The actual shared ledger path and account scope, authoritative allowance and complete current rolling-day/month usage, quiescence/shared-account coordination, a fresh import approval, and then a fresh annual approval with eligibility basis, exact digest, identity, expiry and evidence directory remain operator inputs. Free/ad-free/no-affiliate facts already settled elsewhere are not reopened here. No production scientific admission is implied.

Offline checks cover state preservation, imported usage across restart, duplicate refusal, policy key reordering, metadata corruption, missing/corrupt state, lost ownership, concurrent lock exclusion, interrupted persistence, safe default CLI, malformed authority, explicit synthetic migration, and end-to-end real-ledger annual reservation before synthetic transport. The synthetic monthly ceiling is reached exactly before dispatch; a further attempt is denied without another transport call. Existing annual and quota regression suites also pass. The coordinator owns aggregate-suite registration and full repository verification.
