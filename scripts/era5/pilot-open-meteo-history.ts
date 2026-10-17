import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { decodeOpenMeteoHistory, planOpenMeteoHistory, OPEN_METEO_HISTORY_MAX_BYTES } from "../../server/providers/climate/openMeteoHistoryContract";
import { OPEN_METEO_HISTORY_METHOD } from "../../server/providers/climate/openMeteoHistoryMethod";

export const PILOT_TIMEOUT_MS = 20_000;
export const PILOT_ARTIFACT_BYTES = 4 * 1024 * 1024;
export function historyPilotPlan() {
  return { mode: "offline", partition: planOpenMeteoHistory({ latitude: 28.5, longitude: 77.25 })[0],
    method: OPEN_METEO_HISTORY_METHOD, requests: 1, retries: 0, redirects: 0,
    timeoutMs: PILOT_TIMEOUT_MS, decodedBodyCap: OPEN_METEO_HISTORY_MAX_BYTES,
    artifactCap: PILOT_ARTIFACT_BYTES, estimatedAccountingUnits: 1, measuredDebit: "unobserved" };
}

/** Only explicit CLI --execute-one invokes transport. Injectable transport is for offline tests.
 * Exclusive directory creation is the durable spend receipt: never delete/reuse after an attempt.
 * Fetch yields decompressed bytes; raw-response.body retains those exact decoded entity bytes.
 */
export async function executeHistoryPilot(directory: string, transport: typeof fetch = fetch, timeoutMs = PILOT_TIMEOUT_MS) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > PILOT_TIMEOUT_MS) throw Error("Invalid deadline");
  const root = resolve(directory);
  await mkdir(root); // No recursive/exist-ok: prior attempt, including a crashed one, blocks re-execution.
  const plan = historyPilotPlan();
  const start = performance.now();
  const controller = new AbortController();
  let retainedBytes = 0;
  const save = async (name: string, bytes: Uint8Array) => {
    if (retainedBytes + bytes.byteLength > PILOT_ARTIFACT_BYTES) throw Error("artifact-cap");
    retainedBytes += bytes.byteLength;
    await writeFile(join(root, name), bytes, { flag: "wx" });
  };
  const json = (value: unknown) => Buffer.from(JSON.stringify(value, null, 2));
  await save("attempt.json", json({ requestUrl: plan.partition.url, retrievalUtc: new Date().toISOString(), plan }));
  let status: number | null = null;
  let headers: Record<string, string> = {};
  let raw = Buffer.alloc(0);
  let failure = "transport-failure";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { failure = "timeout"; controller.abort(); reject(Error("timeout")); }, timeoutMs);
  });
  try {
    const response = await Promise.race([transport(plan.partition.url, {
      method: "GET", redirect: "manual", credentials: "omit", signal: controller.signal,
      headers: { Accept: "application/json" },
    }), deadline]);
    status = response.status;
    // Deliberately omit cookie/auth/location headers and free-form error messages.
    for (const name of ["content-type", "content-length", "content-encoding", "date", "retry-after", "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"]) {
      const value = response.headers.get(name);
      if (value !== null) headers[name] = value.slice(0, 1024);
    }
    if (status !== 200) { failure = status === 429 ? "rate-limited" : "http-or-redirect-failure"; throw Error(failure); }
    if (!response.body) { failure = "missing-body"; throw Error(failure); }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await Promise.race([reader.read(), deadline]);
        if (part.done) break;
        size += part.value.byteLength;
        if (size > OPEN_METEO_HISTORY_MAX_BYTES) { failure = "decoded-body-cap"; throw Error(failure); }
        chunks.push(part.value);
      }
      raw = Buffer.concat(chunks);
    } finally { controller.abort(); void reader.cancel().catch(() => {}); }
    await save("raw-response.body", raw);
    failure = "decoder-rejection";
    const decoded = decodeOpenMeteoHistory(raw, plan.partition, plan.partition.requestedPoint);
    const { receipt, ...summary } = decoded;
    await save("quarantine.json", json({ ...summary, method: OPEN_METEO_HISTORY_METHOD,
      receipt: { ...receipt, rawBytes: undefined, rawPath: "raw-response.body" } }));
    failure = "";
  } catch {
    controller.abort(); // Never retain exception messages, which can contain secrets.
  } finally {
    if (timer) clearTimeout(timer);
  }
  const receipt = { outcome: failure ? "stopped" : "decoded-quarantine-only", failure: failure || null,
    requestUrl: plan.partition.url, status, headers, elapsedMs: Math.round(performance.now() - start),
    decodedBytes: raw.byteLength, sha256: raw.byteLength ? createHash("sha256").update(raw).digest("hex") : null,
    requests: 1, measuredDebit: "unobserved", historicalAdmission: false };
  await save("receipt.json", json(receipt));
  return receipt;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.length === 0) console.log(JSON.stringify(historyPilotPlan(), null, 2));
  else if (args.length === 2 && args[0] === "--execute-one") {
    const receipt = await executeHistoryPilot(args[1]);
    console.log(JSON.stringify(receipt, null, 2));
    if (receipt.outcome === "stopped") process.exitCode = 1;
  } else throw Error("Usage: pilot-open-meteo-history.ts [--execute-one <new-receipt-directory>]");
}
