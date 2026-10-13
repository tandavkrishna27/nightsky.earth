export type UpstreamProvider = "met" | "noaa";
export interface UpstreamBounds {
  globalConcurrency?: number;
  providerConcurrency?: number;
  globalCallsPerMinute?: number;
  providerCallsPerSecond?: number;
  providerCallsPerMinute?: number;
  maxResponseBytes?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  now?: () => number;
}
/** Process-local admission: no queues or automatic retries. */
export class UpstreamControls {
  private active = 0;
  private counts = new Map<UpstreamProvider, number>();
  private calls: Array<{
    provider: UpstreamProvider;
    at: number;
  }> = [];
  private blocked = new Map<UpstreamProvider, number>();
  private failures = new Map<UpstreamProvider, number>();
  private flights = new Map<string, Promise<Response>>();
  private bounds: Required<UpstreamBounds>;
  constructor(bounds: UpstreamBounds = {}) {
    this.bounds = {
      globalConcurrency: 8,
      providerConcurrency: 4,
      providerCallsPerSecond: 19,
      globalCallsPerMinute: 300,
      providerCallsPerMinute: 240,
      maxResponseBytes: 4 * 1024 * 1024,
      backoffMs: 1000,
      maxBackoffMs: 300000,
      now: Date.now,
      ...bounds,
    };
    for (const [key, value] of Object.entries(this.bounds))
      if (key !== "now" && (!Number.isSafeInteger(value) || Number(value) < 1))
        throw new TypeError(`Invalid upstream bound: ${key}`);
  }
  async fetch(
    provider: UpstreamProvider,
    key: string,
    operation: () => Promise<Response>,
    signal?: AbortSignal,
  ): Promise<Response> {
    const flightKey = provider + ":" + key;
    const shared = this.flights.get(flightKey);
    if (shared) return (await shared).clone();
    const now = this.bounds.now();
    if ((this.blocked.get(provider) ?? 0) > now)
      throw new Error("Upstream backoff active");
    this.calls = this.calls.filter((call) => call.at > now - 60000);
    if (this.admissionLimitReached(provider, now)) {
      throw new Error("Upstream admission limit reached");
    }
    this.active++;
    this.counts.set(provider, (this.counts.get(provider) ?? 0) + 1);
    this.calls.push({ provider, at: now });
    const work = (async () => {
      try {
        const response = await operation();
        if (response.status === 429 || response.status >= 500) {
          const raw = response.headers.get("Retry-After");
          const delay =
            raw && /^\d+$/.test(raw.trim())
              ? Number(raw) * 1000
              : raw
                ? Date.parse(raw) - this.bounds.now()
                : 0;
          this.fail(provider, Number.isFinite(delay) ? delay : 0);
        }
        const declared = Number(response.headers.get("Content-Length"));
        if (declared > this.bounds.maxResponseBytes) {
          void response.body?.cancel().catch(() => {});
          throw new Error("Upstream response byte limit exceeded");
        }
        // Nonstandard injected adapters keep their existing json/deadline contract.
        if (!("body" in response)) return response;
        const chunks: Uint8Array[] = [];
        let size = 0;
        if (response.body) {
          const reader = response.body.getReader();
          const cancelBody = () => {
            void reader.cancel().catch(() => {});
          };
          signal?.addEventListener("abort", cancelBody, { once: true });
          if (signal?.aborted) cancelBody();
          try {
            while (true) {
              const part = await reader.read();
              if (part.done) break;
              size += part.value.byteLength;
              if (size > this.bounds.maxResponseBytes) {
                void reader.cancel().catch(() => {});
                throw new Error("Upstream response byte limit exceeded");
              }
              chunks.push(part.value);
            }
          } finally {
            signal?.removeEventListener("abort", cancelBody);
            reader.releaseLock();
          }
        }
        if (response.ok || response.status === 304) {
          if ((this.blocked.get(provider) ?? 0) <= this.bounds.now()) {
            this.failures.delete(provider);
            this.blocked.delete(provider);
          }
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        return new Response(
          [204, 205, 304].includes(response.status) ? null : bytes,
          {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          },
        );
      } catch (error) {
        this.fail(provider);
        throw error;
      } finally {
        this.active--;
        this.counts.set(provider, (this.counts.get(provider) ?? 1) - 1);
      }
    })();
    this.flights.set(flightKey, work);
    const abortFlight = () => {
      if (this.flights.get(flightKey) === work) this.flights.delete(flightKey);
      this.fail(provider);
    };
    const cleanup = () => {
      signal?.removeEventListener("abort", abortFlight);
      if (this.flights.get(flightKey) === work) this.flights.delete(flightKey);
    };
    void work.then(cleanup, cleanup);
    signal?.addEventListener("abort", abortFlight, { once: true });
    const result = await work;
    return "clone" in result ? result.clone() : result;
  }
  private admissionLimitReached(
    provider: UpstreamProvider,
    now: number,
  ): boolean {
    const providerCalls = this.calls.filter(
      (call) => call.provider === provider,
    );
    const startsThisSecond = providerCalls.filter(
      (call) => call.at > now - 1000,
    ).length;
    const startsPerSecondLimit =
      provider === "met"
        ? Math.min(this.bounds.providerCallsPerSecond, 19)
        : this.bounds.providerCallsPerSecond;
    return (
      this.active >= this.bounds.globalConcurrency ||
      (this.counts.get(provider) ?? 0) >= this.bounds.providerConcurrency ||
      this.calls.length >= this.bounds.globalCallsPerMinute ||
      startsThisSecond >= startsPerSecondLimit ||
      providerCalls.length >= this.bounds.providerCallsPerMinute
    );
  }

  private fail(provider: UpstreamProvider, retryAfter = 0) {
    const failures = Math.min((this.failures.get(provider) ?? 0) + 1, 20);
    this.failures.set(provider, failures);
    this.blocked.set(
      provider,
      Math.max(
        this.blocked.get(provider) ?? 0,
        this.bounds.now() +
          Math.max(
            retryAfter,
            Math.min(
              this.bounds.maxBackoffMs,
              this.bounds.backoffMs * 2 ** (failures - 1),
            ),
          ),
      ),
    );
  }
}
export const defaultUpstreamControls = new UpstreamControls();
const injectedControls = new WeakMap<typeof fetch, UpstreamControls>();
export function controlsFor(fetcher?: typeof fetch): UpstreamControls {
  if (!fetcher || fetcher === fetch) return defaultUpstreamControls;
  let controls = injectedControls.get(fetcher);
  if (!controls) {
    controls = new UpstreamControls();
    injectedControls.set(fetcher, controls);
  }
  return controls;
}
const identities = new WeakMap<object, number>();
let nextIdentity = 0;
export function upstreamRequestKey(
  key: string,
  ...dependencies: Array<object | undefined>
): string {
  return (
    key +
    dependencies
      .map((value) => {
        if (!value) return "|default";
        let id = identities.get(value);
        if (!id) {
          id = ++nextIdentity;
          identities.set(value, id);
        }
        return "|" + id;
      })
      .join("")
  );
}
