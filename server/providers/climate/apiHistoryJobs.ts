import { createHash } from "node:crypto";
import { planApiHistory, type ApiHistoryPlan } from "./apiHistoryPlan";
import { decodeOpenMeteoHistory } from "./openMeteoHistoryContract";
import { aggregateHostedHistory, type RetainedHistoryChunk } from "./openMeteoHistoryServing";
import type { ProviderQuota } from "../quotaTypes";
import type { ApiHistoryStore } from "./apiHistoryStore";
import { utcInstantSchema } from "../../../shared/nightsky/common";
import { decodeApiHistoryCache } from "./apiHistoryProvider";

export interface ApiHistoryApproval {
  decision: "approved-api-history-build"; executionId: string; planSha256: string;
  expiresAt: string; maxReservedCredits: number;
}
export type ApiHistoryTransport = (request: { url: string; signal: AbortSignal; maxBytes: number; timeoutMs: number }) => Promise<{ status: number; bytes: Uint8Array; retrievedAt: string }>;
export interface ApiHistoryBuildOptions {
  store?: ApiHistoryStore; quota?: ProviderQuota; transport?: ApiHistoryTransport;
  approval?: ApiHistoryApproval; now?: () => number;
  /** Trusted computation seam for offline tests; production uses the existing astronomy reducer. */
  aggregate?: typeof aggregateHostedHistory;
}
export interface ApiHistoryBuildResult { status: "offline" | "cache-hit" | "built" | "stopped" | "review-required" | "busy"; reason: string; requests: number; reservedCredits: number; receivedBytes: number; cacheKey: string }

/** Optional bounded public transport. Construction does not fetch. Never installed by default.
 * The worker supplies its abort signal; no redirects, retries, API key or proxy chain is added.
 */
export function createApiHistoryTransport(fetcher: typeof fetch = globalThis.fetch): ApiHistoryTransport {
  return async ({ url, signal, maxBytes }) => {
    const parsed = new URL(url);
    if (parsed.origin !== "https://archive-api.open-meteo.com" || parsed.pathname !== "/v1/archive" || parsed.username || parsed.password || parsed.hash) throw Error("Unapproved history host");
    const response = await fetcher(url, { method: "GET", redirect: "manual", signal, headers: { Accept: "application/json", "Accept-Encoding": "identity" } });
    const encoding = response.headers.get("content-encoding");
    if (encoding && encoding !== "identity") { await response.body?.cancel(); throw Error("History content encoding"); }
    const declared = response.headers.get("content-length");
    if (declared !== null && (!/^\d{1,9}$/.test(declared) || Number(declared) > maxBytes)) { await response.body?.cancel(); throw Error("History response byte bound"); }
    if (response.status !== 200) { await response.body?.cancel(); return { status: response.status, bytes: new Uint8Array(), retrievedAt: new Date().toISOString() }; }
    if (!response.body) throw Error("Missing history body");
    const reader = response.body.getReader();
    const pieces: Uint8Array[] = []; let length = 0;
    try {
      for (;;) {
        const next = await reader.read(); if (next.done) break;
        length += next.value.byteLength;
        if (length > maxBytes) throw Error("History response byte bound");
        pieces.push(next.value);
      }
      if (declared !== null && length !== Number(declared)) throw Error("History response length mismatch");
    } finally { try { await reader.cancel(); } finally { reader.releaseLock(); } }
    return { status: response.status, bytes: Buffer.concat(pieces), retrievedAt: new Date().toISOString() };
  };
}

/** Operator worker only: no timer, queue, background launch or implicit network dependency.
 * Completed summaries survive restart. Incomplete execution IDs require review/new authority;
 * raw input is bounded transient memory, not a permanently owned source catalogue.
 */
export async function runApiHistoryBuild(plan: ApiHistoryPlan, options: ApiHistoryBuildOptions = {}): Promise<ApiHistoryBuildResult> {
  const expected = planApiHistory(plan.requestedPoint, plan.timeZone, { rangeDays: plan.ranges[0]?.rangeDays });
  if (JSON.stringify(expected) !== JSON.stringify(plan)) throw Error("Changed API history plan");
  const result: ApiHistoryBuildResult = { status: "offline", reason: "Explicit approved plan and configured worker dependencies required", requests: 0, reservedCredits: 0, receivedBytes: 0, cacheKey: plan.cacheKey };
  const now = options.now ?? Date.now, approval = options.approval;
  if (!approval || approval.decision !== "approved-api-history-build" || approval.planSha256 !== plan.planSha256 || !/^[a-f0-9]{64}$/.test(approval.executionId) || !utcInstantSchema.safeParse(approval.expiresAt).success || Date.parse(approval.expiresAt) <= now() || !Number.isSafeInteger(approval.maxReservedCredits) || approval.maxReservedCredits < plan.accounting.reservedIntegerCredits || approval.maxReservedCredits > 1000 || !options.store || !options.quota || !options.transport) return result;
  const { store, quota, transport } = options;
  const stop = (status: ApiHistoryBuildResult["status"], reason: string) => ({ ...result, status, reason });
  if (plan.requestCount > 30) return stop("stopped", "History worker permits at most 30 source requests; use the larger-range plan");
  let release: (() => Promise<void>);
  try { release = await store.acquireLease(); } catch { return stop("busy", "History worker lease unavailable; stale ownership requires review"); }
  const started = now();
  let state: Record<string, unknown> | undefined;
  const receipts: { sha256: string; requestUrl: string; retrievedAt: string; expectedHours: number; nullHours: number; absentHours: number }[] = [];
  const check = () => {
    if (!Number.isFinite(now()) || now() < started || now() - started >= plan.limits.maxBuildMs || now() >= Date.parse(approval.expiresAt)) throw Error("History build deadline or authority expired");
  };
  try {
    check();
    if (await store.readSummary(plan.cacheKey)) return stop("cache-hit", "Completed summary already cached; no source request");
    if (await store.readJournal(approval.executionId)) return stop("review-required", "Execution identity already recorded; no automatic retry or uncertain replay");
    if (!(await store.canPublish(plan.cacheKey))) return stop("stopped", "History summary capacity reached before acquisition");
    state = { schemaVersion: 1, executionId: approval.executionId, planSha256: plan.planSha256, cacheKey: plan.cacheKey, status: "started", receipts };
    await store.writeJournal(approval.executionId, state);
    const chunks: RetainedHistoryChunk[] = [];
    for (let index = 0; index < plan.ranges.length; index++) {
      check();
      const range = plan.ranges[index]!, cost = plan.accounting.perRequest[index]!.reservedIntegerCredits;
      const reservation = await quota.reserve("open-meteo", cost);
      if (!reservation.allowed) throw Error(`History quota stopped: ${reservation.reason}`);
      result.reservedCredits += cost;
      if (result.reservedCredits > approval.maxReservedCredits) throw Error("History credit budget");
      check();
      state = { ...state, status: "request-intent", request: index + 1, requestUrl: range.url, reservedCredits: result.reservedCredits, receipts: [...receipts] };
      await store.writeJournal(approval.executionId, state);
      check();
      const controller = new AbortController();
      const remaining = Math.min(plan.limits.requestTimeoutMs, plan.limits.maxBuildMs - (now() - started), Date.parse(approval.expiresAt) - now());
      const timer = setTimeout(() => controller.abort(Error("History request deadline")), remaining);
      const requestStarted = now(); result.requests++;
      let response: Awaited<ReturnType<ApiHistoryTransport>>;
      let onAbort!: () => void;
      const deadline = new Promise<never>((_resolve, reject) => { onAbort = () => reject(Error("History request deadline; unfinished transport is uncertain")); });
      controller.signal.addEventListener("abort", onAbort, { once: true });
      try { response = await Promise.race([transport({ url: range.url, signal: controller.signal, maxBytes: plan.limits.maxResponseBytes, timeoutMs: remaining }), deadline]); }
      finally { clearTimeout(timer); controller.signal.removeEventListener("abort", onAbort); }
      check();
      if (controller.signal.aborted || now() - requestStarted >= remaining) throw Error("History request deadline");
      result.receivedBytes += response.bytes.byteLength;
      if (response.bytes.byteLength > plan.limits.maxResponseBytes || result.receivedBytes > plan.limits.maxTotalBytes) throw Error("History received-byte budget");
      if (response.status !== 200) throw Error(`History HTTP status ${response.status}; no retry`);
      utcInstantSchema.parse(response.retrievedAt);
      const decoded = decodeOpenMeteoHistory(response.bytes, range, plan.queryCell);
      receipts.push({ sha256: decoded.receipt.sha256, requestUrl: range.url, retrievedAt: response.retrievedAt, expectedHours: range.expectedHours, nullHours: decoded.nullHours, absentHours: decoded.absentHours });
      chunks.push({ partition: range, bytes: Buffer.from(response.bytes), retrievedAt: response.retrievedAt });
      state = { ...state, status: "response-validated", receivedBytes: result.receivedBytes, receipts: [...receipts] };
      await store.writeJournal(approval.executionId, state);
    }
    check();
    const aggregate = (options.aggregate ?? aggregateHostedHistory)(chunks, { timeZone: plan.timeZone, ...plan.period, maxHours: plan.expectedHours, maxRetainedBytes: plan.limits.maxTotalBytes, maxElapsedMs: plan.limits.aggregateTimeoutMs });
    check();
    if (aggregate.period.kind !== "baseline-1991-2020" || aggregate.mapping.latitude !== plan.queryCell.latitude || aggregate.mapping.longitude !== plan.queryCell.longitude || aggregate.mapping.timeZone !== plan.timeZone || aggregate.historicalAdmission !== false || aggregate.receipts.length !== receipts.length || aggregate.receipts.some((r, i) => r.sha256 !== receipts[i]!.sha256 || r.requestUrl !== receipts[i]!.requestUrl || r.retrievedAt !== receipts[i]!.retrievedAt)) throw Error("History aggregate identity mismatch");
    const bytes = Buffer.from(JSON.stringify({ schemaVersion: 1, key: plan.cacheKey, planSha256: plan.planSha256, rangeDays: plan.ranges[0]!.rangeDays, requestedPoint: plan.requestedPoint, builtAt: new Date(now()).toISOString(), aggregate }));
    decodeApiHistoryCache(bytes, plan.cacheKey);
    state = { ...state, status: "complete", summarySha256: createHash("sha256").update(bytes).digest("hex"), receivedBytes: result.receivedBytes, receipts };
    await store.writeJournal(approval.executionId, state);
    check();
    await store.putSummary(plan.cacheKey, bytes); // Final publication point after all validation and durable completion intent.
    return stop("built", "Completed compact summary cached; source qualification remains independent");
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 300) : "History worker stopped";
    if (state) { try { await store.writeJournal(approval.executionId, { ...state, status: "stopped", reason, requests: result.requests, receivedBytes: result.receivedBytes, receipts }); } catch { /* Existing intent remains uncertain; never retry automatically. */ } }
    return stop("stopped", reason);
  } finally { await release(); }
}
