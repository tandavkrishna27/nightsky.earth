/** One-use NASA DONKI diagnostic. Never enables a production source. */
import { open, lstat } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPersistentQuota } from '../server/providers/quotaState';
import { SKY_QUOTA_POLICIES } from '../server/providers/skyConfiguration';
import { createSpaceProviders } from '../server/providers/space';

export const NASA_GST_PLAN = Object.freeze({
  requests: 1, retries: 0, timeoutMs: 10000, maxBodyBytes: 1048576,
  endpoint: 'api.nasa.gov/DONKI/GST', startDate: '2026-08-02', endDate: '2026-08-03',
  purpose: 'Historical GST transport and schema diagnostic; not a local aurora forecast or production admission.',
});

export interface NasaGstReport {
  endpoint: string; httpStatus?: number; acceptedBytes?: number; attempts: number;
  result: 'available-with-events' | 'available-empty' | 'unavailable' | 'refused';
  eventCount?: number; reason: string;
}

async function regularFile(path: string): Promise<boolean> {
  try { const stat = await lstat(path); return stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1; }
  catch { return false; }
}

/** Requires an existing initialized sky ledger. This function never initializes or resets one. */
export async function runNasaGstDiagnostic(
  env: Record<string, string | undefined>, journalPath: string, transport: typeof fetch = fetch,
  quotaFactory: typeof createPersistentQuota = createPersistentQuota,
): Promise<NasaGstReport> {
  const quotaPath = env.NIGHTSKY_SKY_QUOTA_STATE_PATH;
  const key = env.NIGHTSKY_NASA_API_KEY;
  if (!quotaPath || !isAbsolute(quotaPath) || !(await regularFile(quotaPath)) || !(await regularFile(quotaPath + '.initialized')))
    throw Error('Existing initialized sky quota ledger required.');
  if (!key || key.length > 256 || /[\x00-\x20\x7f]/.test(key)) throw Error('Private NASA key required.');
  if (!isAbsolute(journalPath)) throw Error('Absolute new journal path required.');

  const file = await open(journalPath, 'wx', 0o600);
  let quota: Awaited<ReturnType<typeof createPersistentQuota>> | undefined;
  let attempts = 0;
  let httpStatus: number | undefined;
  let acceptedBytes: number | undefined;
  const record = async (entry: Record<string, unknown>) => { await file.writeFile(JSON.stringify(entry) + '\n'); await file.sync(); };
  try {
    await record({ plan: NASA_GST_PLAN, startedAt: new Date().toISOString() });
    const policy = SKY_QUOTA_POLICIES.find(p => p.providerId === 'nasa-donki');
    if (!policy) throw Error('NASA quota policy unavailable.');
    quota = await quotaFactory({ path: quotaPath, now: Date.now, policies: [policy] });
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (attempts !== 0 || url.protocol !== 'https:' || url.host !== 'api.nasa.gov' || url.pathname !== '/DONKI/GST' ||
          url.searchParams.get('startDate') !== NASA_GST_PLAN.startDate || url.searchParams.get('endDate') !== NASA_GST_PLAN.endDate ||
          url.searchParams.get('api_key') !== key || [...url.searchParams.keys()].length !== 3)
        throw Error('Diagnostic request refused.');
      attempts = 1;
      await record({ attempt: NASA_GST_PLAN.endpoint });
      const response = await transport(url, { ...init, redirect: 'error' });
      httpStatus = response.status;
      const length = response.headers.get('content-length');
      if (length && (!/^\d+$/.test(length) || Number(length) > NASA_GST_PLAN.maxBodyBytes)) {
        await response.body?.cancel(); throw Error('Response body limit.');
      }
      if (!response.body) throw Error('Response body missing.');
      const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
      try {
        for (;;) {
          init?.signal?.throwIfAborted();
          const part = await reader.read(); if (part.done) break;
          bytes += part.value.byteLength;
          if (bytes > NASA_GST_PLAN.maxBodyBytes) throw Error('Response body limit.');
          chunks.push(part.value);
        }
        init?.signal?.throwIfAborted();
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      acceptedBytes = bytes;
      await record({ response: NASA_GST_PLAN.endpoint, httpStatus, acceptedBytes });
      return new Response(Buffer.concat(chunks), { status: response.status });
    }) as typeof fetch;
    const provider = createSpaceProviders({ quota, nasaEnabled: true, nasaApiKey: key, fetcher, timeoutMs: NASA_GST_PLAN.timeoutMs });
    const outcome = await provider.getSpaceWeather({ eventType: 'GST', startDate: NASA_GST_PLAN.startDate, endDate: NASA_GST_PLAN.endDate });
    const report: NasaGstReport = { endpoint: NASA_GST_PLAN.endpoint, httpStatus, acceptedBytes, attempts,
      result: outcome.status === 'available' ? outcome.events?.length ? 'available-with-events' : 'available-empty' : 'unavailable',
      ...(outcome.status === 'available' ? { eventCount: outcome.events?.length ?? 0 } : {}),
      reason: outcome.status === 'available' ? 'Validated historical event response; no local visibility claim.' : 'Upstream or validation unavailable; no retry.' };
    await record({ report }); return report;
  } catch {
    const report: NasaGstReport = { endpoint: NASA_GST_PLAN.endpoint, httpStatus, acceptedBytes, attempts, result: 'refused', reason: 'Diagnostic stopped; inspect sanitized journal. No retry.' };
    await record({ report }).catch(() => {});
    return report;
  } finally { await quota?.close().catch(() => {}); await file.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--plan') console.log(JSON.stringify(NASA_GST_PLAN));
  else if (args.length === 2 && args[0] === '--live') runNasaGstDiagnostic(process.env, args[1])
    .then(report => { console.log(JSON.stringify(report)); if (report.result === 'refused') process.exitCode = 1; },
      () => { console.error('NASA diagnostic stopped before request; no retry.'); process.exitCode = 1; });
  else { console.error('Use --plan or --live <absolute-new-journal-path>.'); process.exitCode = 1; }
}
