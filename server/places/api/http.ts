import { createHash } from 'node:crypto';
import type { ProviderQuota } from '../../providers/quotaTypes';
import { UpstreamControls } from '../../providers/upstreamControls';
export type ApiProviderId = 'geonames' | 'geoapify';
export type ApiAttemptStatus = 'not-configured' | 'quota-exhausted' | 'timeout' | 'unavailable' | 'invalid-response' | 'unsupported-query' | 'no-results' | 'success' | 'partial';
export class ApiProviderError extends Error {
    constructor(public readonly status: ApiAttemptStatus) {
        super(`Location provider ${status}.`);
        this.name = 'ApiProviderError';
    }
}
export interface ApiConfiguration {
    geometryEnabled?: boolean;
    geometrySourceAccepted?: boolean;
    geonamesUsername?: string;
    geoapifyApiKey?: string;
    userAgent: string;
    fetcher?: typeof fetch;
    now?: () => number;
    controls?: UpstreamControls;
    quota?: ProviderQuota & { setProviderState?(providerId: string, state: { disabled?: boolean; blockedUntil?: number }): Promise<void> };
}
const PARAMS: Record<string, string[]> = {
    '/searchJSON': ['q', 'name_equals', 'country', 'adminCode1', 'featureClass', 'featureCode', 'maxRows', 'startRow', 'style', 'lang'],
    '/getJSON': ['geonameId', 'style', 'lang'],
    '/timezoneJSON': ['lat', 'lng', 'radius'],
    '/v1/geocode/search': ['text', 'type', 'filter', 'lang', 'limit', 'format'],
    '/v2/place-details': ['id', 'features'],
    '/v2/places': ['categories', 'name', 'filter', 'bias', 'limit', 'offset', 'lang'],
};
/** All roles in a serving process share these queues, budgets and nonsecret keys. */
export class ApiHttpClient {
    private controls: UpstreamControls;
    private hourly: Partial<Record<ApiProviderId, number[]>> = {};
    private daily: Partial<Record<ApiProviderId, number[]>> = {};
    private lastStart: Partial<Record<ApiProviderId, number>> = {};
    private blockedUntil: Partial<Record<ApiProviderId, number>> = {};
    private disabled = new Set<ApiProviderId>();
    private pending: Partial<Record<ApiProviderId, number>> = {};
    private tails: Partial<Record<ApiProviderId, Promise<void>>> = {};
    private flights = new Map<string, Promise<unknown>>();
    private waiters = new Map<string, number>();
    constructor(private config: ApiConfiguration) {
        this.controls = new UpstreamControls({
            now: config.now ?? Date.now, providerConcurrency: 1, providerCallsPerSecond: 1000, providerCallsPerMinute: 30, maxResponseBytes: 262144
        });
    }
    async json(provider: ApiProviderId, path: string, query: Record<string, string>, deadline = Date.now() + 15000): Promise<unknown> {
        const expected = provider === 'geonames' ? ['/searchJSON', '/getJSON', '/timezoneJSON'] : ['/v1/geocode/search', '/v2/places', ...(this.config.geometryEnabled && this.config.geometrySourceAccepted ? ['/v2/place-details'] : [])];
        if (!expected.includes(path) || Object.keys(query).some(k => !PARAMS[path]?.includes(k)))
            throw new ApiProviderError('unsupported-query');
        if (path === '/v2/place-details' && (!query.id || query.id.length > 2048 || query.features !== 'details,details.full_geometry')) throw new ApiProviderError('unsupported-query');
        const credential = provider === 'geonames' ? this.config.geonamesUsername : this.config.geoapifyApiKey;
        if (!credential)
            throw new ApiProviderError('not-configured');
        const safeKey = createHash('sha256').update(provider + path + JSON.stringify(query)).digest('hex');
        const shared = this.flights.get(safeKey);
        if (shared) {
            const waiters = this.waiters.get(safeKey) ?? 1;
            if (waiters >= 8)
                throw new ApiProviderError('quota-exhausted');
            this.waiters.set(safeKey, waiters + 1);
            let timer: ReturnType<typeof setTimeout> | undefined;
            try {
                return structuredClone(await Promise.race([shared, new Promise<never>((_, reject) => {
                        timer = setTimeout(() => reject(new ApiProviderError('timeout')), Math.max(1, deadline - Date.now()));
                    })]));
            }
            finally {
                if (timer)
                    clearTimeout(timer);
                if (this.waiters.has(safeKey))
                    this.waiters.set(safeKey, this.waiters.get(safeKey)! - 1);
            }
        }
        if ((this.pending[provider] ?? 0) >= 8)
            throw new ApiProviderError('quota-exhausted');
        this.pending[provider] = (this.pending[provider] ?? 0) + 1;
        const previous = this.tails[provider] ?? Promise.resolve();
        let release!: () => void;
        this.tails[provider] = new Promise<void>(resolve => {
            release = resolve;
        });
        const operation = (async () => {
            let hasTurn = false;
            try {
                await Promise.race([previous, new Promise<never>((_, reject) => {
                        const timer = setTimeout(() => reject(new ApiProviderError('timeout')), Math.max(1, deadline - Date.now()));
                        void previous.finally(() => clearTimeout(timer));
                    })]);
                hasTurn = true;
                const delay = Math.max(0, (this.lastStart[provider] ?? -Infinity) + 1000 - (this.config.now ?? Date.now)());
                if (Date.now() + delay >= deadline)
                    throw new ApiProviderError('timeout');
                if (delay)
                    await new Promise(resolve => setTimeout(resolve, delay));
                return await this.request(provider, path, query, credential, safeKey, deadline);
            }
            finally {
                this.pending[provider]!--;
                if (hasTurn)
                    release();
                else
                    void previous.finally(release);
                this.flights.delete(safeKey);
                this.waiters.delete(safeKey);
            }
        })();
        this.flights.set(safeKey, operation);
        this.waiters.set(safeKey, 1);
        return structuredClone(await operation);
    }
    private async request(provider: ApiProviderId, path: string, query: Record<string, string>, credential: string, key: string, deadline: number): Promise<unknown> {
        const cost = path === '/v2/place-details' ? 2 : 1;
        const now = (this.config.now ?? Date.now)();
        const hourly = (this.hourly[provider] ?? []).filter(n => n > now - 3600000);
        const daily = (this.daily[provider] ?? []).filter(n => n > now - 86400000);
        if (this.disabled.has(provider))
            throw new ApiProviderError('unavailable');
        if ((this.blockedUntil[provider] ?? 0) > now || hourly.length + cost > (provider === 'geonames' ? 400 : 200) || daily.length + cost > (provider === 'geonames' ? 2000 : 1000))
            throw new ApiProviderError('quota-exhausted');
        if (this.config.quota) {
            let reservation;
            try { reservation = await this.config.quota.reserve(provider, cost); }
            catch { throw new ApiProviderError('quota-exhausted'); }
            if (!reservation.allowed) throw new ApiProviderError('quota-exhausted');
        }
        this.lastStart[provider] = now;
        this.hourly[provider] = [...hourly, ...Array<number>(cost).fill(now)];
        this.daily[provider] = [...daily, ...Array<number>(cost).fill(now)];
        const url = new URL(path, provider === 'geonames' ? 'https://secure.geonames.org' : 'https://api.geoapify.com');
        for (const [k, v] of Object.entries(query))
            url.searchParams.set(k, v);
        url.searchParams.set(provider === 'geonames' ? 'username' : 'apiKey', credential);
        if (Buffer.byteLength(url.toString()) > 8192)
            throw new ApiProviderError('unsupported-query');
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
                controller.abort();
                reject(new ApiProviderError('timeout'));
            }, Math.max(1, Math.min(5000, deadline - Date.now())));
        });
        try {
            const work = (async () => {
                const fetchOperation = () => this.controls.fetch(provider, key, async () => {
                    const response = await (this.config.fetcher ?? fetch)(url, {
                    headers: {
                        'User-Agent': this.config.userAgent, Accept: 'application/json'
                    }, signal: controller.signal, redirect: 'error'
                    });
                    // Persist status as soon as headers arrive: controls buffer the body.
                    try {
                        if (response.status === 401 || response.status === 403) {
                            this.disabled.add(provider);
                            await this.config.quota?.setProviderState?.(provider, { disabled: true });
                        }
                        if (response.status === 429) {
                            const raw = response.headers.get('Retry-After');
                            const delay = raw && /^\d+$/.test(raw.trim()) ? Number(raw) * 1000 : raw ? Date.parse(raw) - now : 60000;
                            this.blockedUntil[provider] = now + Math.max(60000, Number.isFinite(delay) ? delay : 60000);
                            await this.config.quota?.setProviderState?.(provider, { blockedUntil: this.blockedUntil[provider] });
                        }
                    } catch (error) {
                        void response.body?.cancel().catch(() => {});
                        throw error;
                    }
                    return response;
                }, controller.signal);
                const response = this.config.controls ? await this.config.controls.fetch(provider, key, fetchOperation, controller.signal) : await fetchOperation();
                if (response.status === 429) {
                    throw new ApiProviderError('quota-exhausted');
                }
                if (!response.ok)
                    throw new ApiProviderError('unavailable');
                const text = await response.text();
                if (Buffer.byteLength(text) > 262144)
                    throw new ApiProviderError('invalid-response');
                try {
                    return JSON.parse(text);
                }
                catch {
                    throw new ApiProviderError('invalid-response');
                }
            })();
            return await Promise.race([work, timeout]);
        }
        catch (error) {
            if (error instanceof ApiProviderError)
                throw error;
            throw new ApiProviderError('unavailable');
        }
        finally {
            if (timer)
                clearTimeout(timer);
        }
    }
}


