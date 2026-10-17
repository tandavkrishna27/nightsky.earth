import { createHash } from "node:crypto";
import { lstat, mkdir, open } from "node:fs/promises";
import { dirname, isAbsolute, join, parse } from "node:path";
import { pathToFileURL } from "node:url";
import { mapApiHistoryPoint } from "../../server/providers/climate/apiHistoryPlan";
import { createApiHistoryTransport } from "../../server/providers/climate/apiHistoryJobs";
import type { ProviderQuota } from "../../server/providers/quotaTypes";
import { utcInstantSchema } from "../../shared/nightsky/common";

const BODY_CAP = 2097152, EVIDENCE_CAP = 4194304;
const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
export function annualHistoryProbePlan() {
  const requestedPoint = { latitude: 28.6139, longitude: 77.209 };
  const queryCell = mapApiHistoryPoint(requestedPoint);
  const plan = { schemaVersion: 1, mode: "offline", requestedPoint, queryCell, timeZone: "Asia/Kolkata",
    url: "https://archive-api.open-meteo.com/v1/archive?latitude=28.5&longitude=77.25&start_date=1992-01-01&end_date=1992-12-31&hourly=cloud_cover&models=era5&timezone=GMT&timeformat=unixtime&cell_selection=nearest&elevation=nan",
    startUnixSeconds: 694224000, endUnixSeconds: 725846400, expectedHours: 8784,
    requests: 1, retries: 0, redirects: 0, timeoutMs: 60000, maxBodyBytes: BODY_CAP, maxEvidenceBytes: EVIDENCE_CAP,
    estimatedWeightedCredits: 366 / 140, reservedIntegerCredits: 3, deployedDebit: "unobserved",
    sourceCodeCommit: "01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a", historicalAdmission: false };
  return { ...plan, planSha256: sha(JSON.stringify(plan)) };
}

/** Separate annual diagnostic contract: does not weaken baseline partition validation. */
export function decodeAnnualHistoryProbe(bytes: Uint8Array) {
  if (bytes.byteLength > BODY_CAP) throw Error("annual-body-cap");
  const wire = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const p = annualHistoryProbePlan();
  if (!wire || Array.isArray(wire) || wire.latitude !== p.queryCell.latitude || wire.longitude !== p.queryCell.longitude ||
      wire.utc_offset_seconds !== 0 || wire.hourly_units?.time !== "unixtime" || wire.hourly_units?.cloud_cover !== "%") throw Error("annual-cell-or-units");
  const times = wire.hourly?.time, clouds = wire.hourly?.cloud_cover;
  if (!Array.isArray(times) || !Array.isArray(clouds) || times.length !== 8784 || clouds.length !== 8784) throw Error("annual-hour-count");
  let nullHours = 0;
  for (let i = 0; i < 8784; i++) {
    if (times[i] !== p.startUnixSeconds + i * 3600) throw Error("annual-hour-clock");
    const cloud = clouds[i];
    if (cloud === null) nullHours++;
    else if (typeof cloud !== "number" || !Number.isFinite(cloud) || cloud < 0 || cloud > 100) throw Error("annual-cloud-percent");
  }
  return { expectedHours: 8784, observedHours: 8784, nullHours, absentHours: 0,
    actualCell: p.queryCell, units: { time: "unixtime", cloud_cover: "%" },
    upstreamScientificRevision: "unverified", historicalAdmission: false };
}

export interface AnnualProbeApproval {
  decision: "approved-annual-history-probe"; planSha256: string; executionId: string;
  evidenceRoot: string; expiresAt: string; maxReservedCredits: 3; sourceUseEligibilityReviewed: true;
}
/** Root must already exist; refuse links/aliases before making the exclusive attempt directory. */
async function safeRoot(root: string) {
  if (!isAbsolute(root) || root.includes("\0") || root.startsWith("\\\\") || root.startsWith("//") || root.slice(parse(root).root.length).includes(":")) throw Error("Unsafe evidence root");
  let cursor = root;
  for (;;) {
    const info = await lstat(cursor);
    if (!info.isDirectory() || info.isSymbolicLink()) throw Error("Unsafe evidence root");
    const parent = dirname(cursor); if (parent === cursor) break; cursor = parent;
  }
}

/** Operator API only. No default quota, automatic initialization, live CLI, retry or cache publication. */
export async function executeAnnualHistoryProbe(options: {
  approval: AnnualProbeApproval; quota?: ProviderQuota; fetcher?: typeof fetch;
  /** May shorten the deadline for offline checks; cannot extend reviewed authority. */
  timeoutMs?: number;
}) {
  const plan = annualHistoryProbePlan(), a = options.approval;
  const timeoutMs = options.timeoutMs ?? plan.timeoutMs;
  if (!a || a.decision !== "approved-annual-history-probe" || a.planSha256 !== plan.planSha256 ||
      !/^[a-f0-9]{64}$/.test(a.executionId) || !utcInstantSchema.safeParse(a.expiresAt).success ||
      Date.parse(a.expiresAt) <= Date.now() || a.maxReservedCredits !== 3 || a.sourceUseEligibilityReviewed !== true ||
      !options.quota || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw Error("Reviewed annual authority and durable account quota required");
  // Snapshot authority so caller mutation cannot change the approved directory or deadline mid-flight.
  const approval = { ...a };
  await safeRoot(approval.evidenceRoot);
  const root = join(approval.evidenceRoot, approval.executionId);
  await mkdir(root); // Exclusive identity claim: failures and uncertain attempts are never reused.
  let retainedBytes = 0;
  const save = async (name: string, bytes: Uint8Array, final = false) => {
    if (retainedBytes + bytes.byteLength > EVIDENCE_CAP - (final ? 0 : 65536)) throw Error("Evidence cap");
    retainedBytes += bytes.byteLength;
    const file = await open(join(root, name), "wx", 0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    if (process.platform !== "win32") { const directory = await open(root, "r"); try { await directory.sync(); } finally { await directory.close(); } }
  };
  const json = (value: unknown) => Buffer.from(JSON.stringify(value, null, 2));
  const startedUtc = new Date().toISOString(), started = performance.now();
  let failure = "attempt-persistence", requests = 0, reservedCredits = 0, status: number | null = null;
  let rawBytes = 0, rawSha256: string | null = null, retrievedAt: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  const checkAuthority = () => { if (Date.now() >= Date.parse(approval.expiresAt)) throw Error("Expired"); };
  try {
    await save("attempt.json", json({ plan, approval, startedUtc, status: "claimed" }));
    failure = "quota-reservation"; checkAuthority();
    const reservation = await options.quota.reserve("open-meteo", 3);
    if (!reservation.allowed) throw Error("Quota unavailable");
    reservedCredits = 3;
    await save("reservation.json", json({ providerId: "open-meteo", reservedCredits, reservedAt: new Date().toISOString(), measuredDebit: "unobserved" }));
    failure = "request-intent"; checkAuthority();
    await save("request-intent.json", json({ url: plan.url, requests: 1, reservedCredits }));
    checkAuthority();
    const remaining = Math.min(timeoutMs, Date.parse(approval.expiresAt) - Date.now());
    if (remaining <= 0) throw Error("Expired");
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { failure = "timeout-uncertain"; controller.abort(); reject(Error("Deadline")); }, remaining);
    });
    const fetcher = options.fetcher ?? globalThis.fetch;
    const transport = createApiHistoryTransport((url, init) => fetcher(url, { ...init, credentials: "omit" }));
    const requestStarted = performance.now();
    failure = "transport-or-body"; requests = 1;
    const response = await Promise.race([transport({ url: plan.url, signal: controller.signal, maxBytes: BODY_CAP, timeoutMs: remaining }), deadline]);
    if (timer) clearTimeout(timer);
    if (controller.signal.aborted || performance.now() - requestStarted >= remaining) { failure = "timeout-uncertain"; throw Error("Deadline"); }
    checkAuthority();
    status = response.status; retrievedAt = response.retrievedAt;
    if (status !== 200) { failure = "http-status"; throw Error("HTTP status"); }
    rawBytes = response.bytes.byteLength; rawSha256 = sha(response.bytes);
    failure = "raw-persistence"; await save("raw-response.body", response.bytes);
    failure = "annual-decoder";
    const validation = decodeAnnualHistoryProbe(response.bytes);
    failure = "validation-persistence"; await save("validation.json", json(validation));
    failure = "";
  } catch { controller.abort(); /* Never retain exception text or secret-bearing upstream diagnostics. */ }
  finally { if (timer) clearTimeout(timer); }
  const receipt = { outcome: failure ? "stopped" : "validated-annual-shape-only", failure: failure || null,
    planSha256: plan.planSha256, executionId: approval.executionId, requestUrl: plan.url, startedUtc, retrievedAt,
    status, elapsedMs: Math.round(performance.now() - started), requests, reservedCredits,
    rawBytes, rawSha256, measuredDebit: "unobserved", historicalAdmission: false };
  await save("receipt.json", json(receipt), true);
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 2) throw Error("Offline plan only; operator API requires reviewed authority and durable quota");
  console.log(JSON.stringify(annualHistoryProbePlan(), null, 2));
}
