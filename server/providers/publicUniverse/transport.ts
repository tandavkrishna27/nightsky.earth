import type { PersistentQuota } from '../quotaState';
import { randomUUID } from 'node:crypto';
import type { ReferenceDomain } from '../../../shared/nightsky/reference';
import { canonicalJson } from './referenceStore';
import { assertLocalNight, isSupportedStarterId } from './contracts';
export const PUBLIC_UNIVERSE_ORIGIN = 'https://api.sol.wickedsick.com';
export type TransportErrorCode = 'not-admitted' | 'quota' | 'rate-limit' | 'timeout' | 'size' | 'http' | 'invalid-response' | 'stale-selection' | 'busy' | 'closed' | 'cancelled';
export interface PublicUniverseDiagnostic {
    event: 'publicuniverse.request';
    requestId: string;
    category: 'catalogue' | 'discover' | 'night';
    phase: 'start' | 'quota-reserved' | 'headers' | 'body-read' | 'parsed' | 'timeout' | 'failure' | 'settled';
    elapsedMs: number;
    status?: number;
    responseBytes?: number;
    errorCode?: TransportErrorCode;
}
export class PublicUniverseTransportError extends Error {
    constructor(public readonly code: TransportErrorCode, public readonly status?: number) { super(code); }
}
export type PublicUniverseRequest = {
    kind: 'search';
    domain: ReferenceDomain;
    q: string;
    limit: number;
} | {
    kind: 'object';
    domain: ReferenceDomain;
    id: string;
} | {
    kind: 'discovery' | 'designations';
    id: string;
} | {
    kind: 'moons' | 'rings' | 'atmosphere';
    parentName: string;
} | {
    kind: 'meteor-shower';
    code: string;
} | {
    kind: 'close-approaches';
    id: string;
    from: string;
    to: string;
    limit: number;
} | {
    kind: 'exoplanet-host';
    id: string;
} | {
    kind: 'discover' | 'night';
    body: Record<string, string | number>;
};
function invalid(): never { throw new PublicUniverseTransportError('invalid-response'); }
function segment(id: string) {
    if (typeof id !== 'string' || !id || id.length > 160 || id === '.' || id === '..' || /[\u0000-\u001f]/.test(id))
        invalid();
    return encodeURIComponent(id);
}
export function buildRoute(r: PublicUniverseRequest): {
    method: 'GET' | 'POST';
    path: string;
    query: URLSearchParams;
    body?: string;
    category: 'catalogue' | 'discover' | 'night';
} {
    let path: string;
    const query = new URLSearchParams();
    let body: string | undefined;
    const limit = (v: number) => {
        if (!Number.isInteger(v) || v < 1 || v > 10)
            invalid();
        return String(v);
    };
    switch (r.kind) {
        case 'search': {
            if (typeof r.q !== 'string' || r.q.length < 1 || r.q.length > 100)
                invalid();
            const names = { 'solar-system': 'search', 'starter-targets': 'starter-targets', exoplanets: 'exoplanets' };
            if (!names[r.domain])
                invalid();
            path = '/api/v1/' + names[r.domain];
            query.set('q', r.q);
            query.set('limit', limit(r.limit));
            if (r.domain !== 'solar-system')
                query.set('offset', '0');
            break;
        }
        case 'object': {
            const names = { 'solar-system': 'objects', 'starter-targets': 'starter-targets', exoplanets: 'exoplanets' };
            if (!names[r.domain])
                invalid();
            path = '/api/v1/' + names[r.domain] + '/' + segment(r.id);
            break;
        }
        case 'discovery':
        case 'designations':
            path = '/api/v1/objects/' + segment(r.id) + '/' + r.kind;
            break;
        case 'moons':
        case 'rings':
        case 'atmosphere':
            path = '/api/v1/planets/' + segment(r.parentName) + '/' + r.kind;
            break;
        case 'meteor-shower':
            if (!/^[A-Z]{3}$/.test(r.code))
                invalid();
            path = '/api/v1/meteor-showers/' + r.code;
            break;
        case 'exoplanet-host':
            path = '/api/v1/exoplanet-hosts/' + segment(r.id);
            break;
        case 'close-approaches': {
            const date = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
            const days = (Date.parse(r.to) - Date.parse(r.from)) / 86400000;
            if (!date(r.from) || !date(r.to) || days < 0 || days > 30)
                invalid();
            path = '/api/v1/objects/' + segment(r.id) + '/close-approaches';
            query.set('from', r.from);
            // Upstream compares ISO timestamp text inclusively, not calendar dates.
            // Keep the public date bound while including its final fractional second.
            query.set('to', r.to + 'T23:59:59.999999999Z');
            query.set('body', 'Earth');
            query.set('limit', limit(r.limit));
            break;
        }
        case 'discover':
        case 'night': {
            const common = ['date', 'timezone', 'lat', 'lon', 'window_start_utc', 'window_end_utc', 'min_altitude_deg', 'sun_altitude_deg', 'min_moon_separation_deg'];
            const allowed = new Set([...common, ...(r.kind === 'discover' ? ['equipment_mode', 'preference', 'shortlist_limit', 'true_field_deg', 'max_catalogue_v_magnitude'] : ['targets'])]);
            if (!r.body || Object.keys(r.body).some(k => !allowed.has(k)) || Object.values(r.body).some(v => typeof v !== 'string' && (typeof v !== 'number' || !Number.isFinite(v))))
                invalid();
            for (const k of [...common.slice(0, 6), ...(r.kind === 'discover' ? ['equipment_mode', 'preference', 'shortlist_limit'] : ['targets'])])
                if (r.body[k] === undefined)
                    invalid();
            path = '/api/v1/observing/' + r.kind;
            body = canonicalJson(r.body);
            if (Buffer.byteLength(body) > 16384)
                throw new PublicUniverseTransportError('size');
            const b = r.body;
            const numberIn = (key: string, min: number, max: number, required = false) => {
                const value = b[key];
                if (value === undefined && !required)
                    return;
                if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
                    invalid();
            };
            numberIn('lat', -90, 90, true);
            numberIn('lon', -180, 180, true);
            numberIn('min_altitude_deg', 0, 90);
            numberIn('min_moon_separation_deg', 0, 180);
            if (b.sun_altitude_deg !== undefined && ![-6, -12, -18].includes(b.sun_altitude_deg as number))
                invalid();
            const second = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().replace('.000Z', 'Z') === v;
            if (typeof b.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.date) || !Number.isFinite(Date.parse(b.date)) || new Date(b.date).toISOString().slice(0, 10) !== b.date || typeof b.timezone !== 'string' || b.timezone.length > 100 || !second(b.window_start_utc) || !second(b.window_end_utc) || b.window_start_utc >= b.window_end_utc)
                invalid();
            try {
                assertLocalNight({ localNightDate: b.date as string, displayTimeZone: b.timezone as string, window: { startUtc: b.window_start_utc as string, endUtc: b.window_end_utc as string } });
            }
            catch {
                invalid();
            }
            if (r.kind === 'discover') {
                if (!['naked_eye', 'binocular', 'telescope'].includes(b.equipment_mode as string) || !['balanced', 'wide_field', 'stars', 'deep_sky', 'solar_system'].includes(b.preference as string))
                    invalid();
                numberIn('shortlist_limit', 1, 6, true);
                if (!Number.isInteger(b.shortlist_limit))
                    invalid();
                numberIn('true_field_deg', 0.01, 180);
                numberIn('max_catalogue_v_magnitude', -30, 30);
            }
            else {
                if (typeof b.targets !== 'string')
                    invalid();
                const ids = (b.targets as string).split(',');
                if (ids.length < 1 || ids.length > 6 || new Set(ids).size !== ids.length || ids.some(id => !isSupportedStarterId(id)))
                    invalid();
            }
            break;
        }
        default: return invalid();
    }
    query.sort();
    return { method: body === undefined ? 'GET' : 'POST', path, query, body, category: r.kind === 'discover' || r.kind === 'night' ? r.kind : 'catalogue' };
}
interface Options {
    quota: Pick<PersistentQuota, 'reserve' | 'setProviderState'>;
    quotaOwner: string;
    admitted: boolean;
    fetch?: typeof fetch;
    now?: () => number;
    setTimer?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
    clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
    /** Fixed metadata only; never request URLs, inputs, headers or response values. */
    onDiagnostic?: (event: PublicUniverseDiagnostic) => void | Promise<void>;
}
export interface TransportResult {
    value: unknown;
    retrievedAt: string;
    cacheControl: string | null;
}
export class PublicUniverseTransport {
    private flight?: {
        key: string;
        promise: Promise<TransportResult>;
        deadline: number;
    };
    private closed = false;
    private poisoned = false;
    private blockedUntil = 0;
    private starts: Array<{
        at: number;
        category: string;
    }> = [];
    private now: () => number;
    constructor(private options: Options) {
        this.now = options.now ?? Date.now;
        if (!options.quota || !options.quotaOwner)
            throw new Error('Dedicated quota required');
    }
    operationDeadline() { return this.now() + 15000; }
    async request(request: PublicUniverseRequest, options: {
        signal?: AbortSignal;
        deadline?: number;
    } = {}): Promise<TransportResult> {
        if (this.closed)
            throw new PublicUniverseTransportError('closed');
        if (!this.options.admitted)
            throw new PublicUniverseTransportError('not-admitted');
        const route = buildRoute(request), key = canonicalJson({ owner: this.options.quotaOwner, ...route, query: route.query.toString() });
        if (options.signal?.aborted)
            throw new PublicUniverseTransportError('cancelled');
        if (this.flight) {
            if (this.flight.key !== key)
                throw new PublicUniverseTransportError('busy');
            return this.wait(this.flight.promise, options.signal, Math.min(options.deadline ?? Infinity, this.flight.deadline));
        }
        const now = this.now();
        if (this.poisoned)
            throw new PublicUniverseTransportError('quota');
        if (this.blockedUntil > now)
            throw new PublicUniverseTransportError('rate-limit');
        this.starts = this.starts.filter(s => s.at > now - 60000);
        const own = this.starts.filter(s => s.category === route.category);
        const max = route.category === 'discover' ? 4 : route.category === 'night' ? 8 : 30;
        const spacing = route.category === 'discover' ? 15000 : route.category === 'night' ? 7500 : 0;
        if (this.starts.length >= 30 || own.length >= max || (own.length > 0 && now - own[own.length - 1].at < spacing))
            throw new PublicUniverseTransportError('rate-limit');
        const deadline = Math.min(options.deadline ?? now + 15000, now + 15000);
        if (deadline <= now)
            throw new PublicUniverseTransportError('timeout');
        // Reserve slot synchronously, including the durable reservation interval.
        const promise = Promise.resolve().then(() => this.dispatch(route, deadline));
        this.flight = { key, promise, deadline };
        void promise.finally(() => {
            if (this.flight?.promise === promise)
                this.flight = undefined;
        }).catch(() => { });
        return this.wait(promise, options.signal, deadline);
    }
    private async wait(p: Promise<TransportResult>, signal: AbortSignal | undefined, deadline: number): Promise<TransportResult> {
        let abort!: () => void;
        const cancelled = new Promise<never>((_, reject) => {
            abort = () => reject(new PublicUniverseTransportError('cancelled'));
            signal?.addEventListener('abort', abort, { once: true });
            if (signal?.aborted)
                abort();
        });
        let timer!: ReturnType<typeof setTimeout>;
        const timeout = new Promise<never>((_, reject) => { timer = (this.options.setTimer ?? setTimeout)(() => reject(new PublicUniverseTransportError('timeout')), Math.max(0, deadline - this.now())); });
        try {
            return structuredClone(await Promise.race([p, cancelled, timeout]));
        }
        finally {
            signal?.removeEventListener('abort', abort);
            (this.options.clearTimer ?? clearTimeout)(timer);
        }
    }
    private async dispatch(route: ReturnType<typeof buildRoute>, deadline: number): Promise<TransportResult> {
        const controller = new AbortController();
        const started = this.now(), requestId = randomUUID();
        let expired = false;
        let timeoutReported = false;
        const emit = (phase: PublicUniverseDiagnostic['phase'], extra: Pick<PublicUniverseDiagnostic, 'status' | 'responseBytes' | 'errorCode'> = {}) => {
            const elapsed = this.now() - started;
            const event: PublicUniverseDiagnostic = { event: 'publicuniverse.request', requestId, category: route.category, phase, elapsedMs: Number.isFinite(elapsed) ? Math.min(86400000, Math.max(0, Math.round(elapsed))) : 0, ...extra };
            try {
                const pending = this.options.onDiagnostic?.(event);
                if (pending) void Promise.resolve(pending).catch(() => undefined);
            } catch { /* Optional logging must not change request ownership or results. */ }
        };
        const timeout = () => { if (!timeoutReported) { timeoutReported = true; emit('timeout', { errorCode: 'timeout' }); } };
        emit('start');
        const timer = (this.options.setTimer ?? setTimeout)(() => { expired = true; timeout(); controller.abort(); }, Math.max(0, deadline - this.now()));
        const check = () => {
            if (expired || this.now() >= deadline)
                throw new PublicUniverseTransportError('timeout');
        };
        try {
            let reservation;
            try {
                reservation = await this.options.quota.reserve('publicuniverse', 1);
            }
            catch {
                throw new PublicUniverseTransportError('quota');
            }
            check();
            if (!reservation.allowed)
                throw new PublicUniverseTransportError('quota');
            emit('quota-reserved');
            this.starts.push({ at: this.now(), category: route.category });
            const response = await (this.options.fetch ?? fetch)(PUBLIC_UNIVERSE_ORIGIN + route.path + (route.query.size ? '?' + route.query : ''), { method: route.method, body: route.body, redirect: 'error', credentials: 'omit', headers: { Accept: 'application/json', ...(route.body ? { 'Content-Type': 'application/json' } : {}) }, signal: controller.signal });
            check();
            emit('headers', { status: response.status });
            if (response.redirected || (response.url && new URL(response.url).origin !== PUBLIC_UNIVERSE_ORIGIN))
                throw new PublicUniverseTransportError('http');
            if (response.status === 429) {
                void response.body?.cancel().catch(() => { });
                const raw = response.headers.get('Retry-After');
                const parsed = raw && /^\d+$/.test(raw) ? Number(raw) * 1000 : raw ? Date.parse(raw) - this.now() : 60000;
                this.blockedUntil = Math.max(this.blockedUntil, this.now() + Math.min(86400000, Math.max(1000, Number.isFinite(parsed) ? parsed : 60000)));
                try {
                    await this.options.quota.setProviderState('publicuniverse', { blockedUntil: this.blockedUntil });
                }
                catch {
                    this.poisoned = true;
                    throw new PublicUniverseTransportError('quota');
                }
                throw new PublicUniverseTransportError('rate-limit', 429);
            }
            if (!response.ok) {
                void response.body?.cancel().catch(() => { });
                throw new PublicUniverseTransportError('http', response.status);
            }
            if (Number(response.headers.get('Content-Length')) > 1048576) {
                void response.body?.cancel().catch(() => { });
                throw new PublicUniverseTransportError('size');
            }
            const reader = response.body?.getReader();
            const chunks: Uint8Array[] = [];
            let bytes = 0;
            const cancel = () => { void reader?.cancel().catch(() => { }); };
            controller.signal.addEventListener('abort', cancel, { once: true });
            try {
                if (reader)
                    while (true) {
                        const part = await reader.read();
                        check();
                        if (part.done)
                            break;
                        bytes += part.value.byteLength;
                        if (bytes > 1048576) {
                            cancel();
                            throw new PublicUniverseTransportError('size');
                        }
                        chunks.push(part.value);
                    }
            }
            finally {
                controller.signal.removeEventListener('abort', cancel);
                reader?.releaseLock();
            }
            check();
            emit('body-read', { responseBytes: bytes });
            let value: unknown;
            try {
                value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            }
            catch {
                throw new PublicUniverseTransportError('invalid-response');
            }
            emit('parsed');
            return { value, retrievedAt: new Date(this.now()).toISOString(), cacheControl: response.headers.get('Cache-Control') };
        }
        catch (error) {
            if (expired || this.now() >= deadline) {
                timeout();
                throw new PublicUniverseTransportError('timeout');
            }
            if (error instanceof PublicUniverseTransportError) {
                emit('failure', { errorCode: error.code });
                throw error;
            }
            emit('failure', { errorCode: 'http' });
            throw new PublicUniverseTransportError('http');
        }
        finally {
            (this.options.clearTimer ?? clearTimeout)(timer);
            emit('settled');
        }
    }
    async close() { this.closed = true; await this.flight?.promise.catch(() => { }); }
}
/** Cache only normalized reference successes; callers must renew/validate selections separately. */
export class ReferenceSuccessCache {
    private entries = new Map<string, {
        value: unknown;
        retrievedAt: string;
        expires: number;
    }>();
    private closed = false;
    constructor(private now: () => number = Date.now) { }
    put(key: string, value: unknown, retrievedAt: string, cacheControl: string | null, options: {
        method: 'GET' | 'POST';
        success: boolean;
        observing?: boolean;
    }) {
        if (this.closed || key.length > 2048 || options.method !== 'GET' || !options.success || options.observing)
            return;
        const directives = (cacheControl ?? '').toLowerCase();
        if (/(?:^|,)\s*(?:no-store|no-cache)\b/.test(directives))
            return;
        const maxAge = directives.match(/(?:^|,)\s*max-age\s*=\s*"?(\d+)/);
        const ttl = Math.min(86400000, maxAge ? Number(maxAge[1]) * 1000 : 3600000);
        if (ttl <= 0 || Buffer.byteLength(canonicalJson(value)) > 131072)
            return;
        this.entries.delete(key);
        while (this.entries.size >= 32)
            this.entries.delete(this.entries.keys().next().value!);
        // References have their own one-hour lifetime. Cache immutable records only;
        // the provider creates new local selections from these records on a cache hit.
        const recordsOnly = (v: unknown): unknown => Array.isArray(v) ? v.map(recordsOnly) : v !== null && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'selection').map(([k, item]) => [k, recordsOnly(item)])) : v;
        this.entries.set(key, { value: recordsOnly(value), retrievedAt, expires: this.now() + ttl });
    }
    get(key: string) {
        const e = this.entries.get(key);
        if (this.closed || !e || e.expires <= this.now()) {
            this.entries.delete(key);
            return undefined;
        }
        return structuredClone({ value: e.value, retrievedAt: e.retrievedAt });
    }
    close() { this.closed = true; this.entries.clear(); }
}
