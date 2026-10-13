/** Untrusted assistant hints: never authorization, authentication or telemetry. */
import { createHmac, randomBytes } from "node:crypto";
import type { HostLocationHint } from "../places/geonames";
function object(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
/** Read no location fields unless the tool input explicitly opts in. */
export function consentedHostLocation(metadata: unknown, consent: boolean): HostLocationHint | undefined {
    if (!consent)
        return undefined;
    const location = object(object(metadata)?.["openai/userLocation"]);
    const latitude = location?.latitude;
    const longitude = location?.longitude;
    if (typeof latitude !== "number" || typeof longitude !== "number" || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180)
        return undefined;
    return { latitude: Math.round(latitude * 100) / 100, longitude: Math.round(longitude * 100) / 100 };
}
export function deriveSubjectRateKey(subject: string, salt: Uint8Array): string {
    return createHmac("sha256", salt).update(subject).digest("hex");
}
/** Bounded route-local fixed windows. Only salted digests are retained. */
export class SubjectRateLimiter {
    private readonly salt = randomBytes(32);
    private readonly entries = new Map<string, {
        count: number;
        resetAt: number;
    }>();
    private readonly maxRequests: number;
    private readonly maxKeys: number;
    private readonly windowMs: number;
    constructor(options: {
        maxRequests?: number;
        maxKeys?: number;
        windowMs?: number;
    } = {}) {
        this.maxRequests = options.maxRequests ?? 60;
        this.maxKeys = options.maxKeys ?? 10000;
        this.windowMs = options.windowMs ?? 60000;
        for (const value of [this.maxRequests, this.maxKeys, this.windowMs])
            if (!Number.isSafeInteger(value) || value <= 0)
                throw new TypeError("Subject limits must be positive safe integers.");
    }
    get keyCount(): number { return this.entries.size; }
    admit(metadata: unknown, now: number): {
        allowed: boolean;
        retryAfterSeconds?: number;
    } {
        const subject = object(metadata)?.["openai/subject"];
        // Missing, oversized or malformed hints cannot create counter state.
        if (typeof subject !== "string" || !subject.length || subject.length > 128 || /[\u0000-\u001f\u007f]/.test(subject))
            return { allowed: true };
        const key = deriveSubjectRateKey(subject, this.salt);
        let entry = this.entries.get(key);
        if (!entry || entry.resetAt <= now) {
            if (!entry && this.entries.size >= this.maxKeys) {
                this.entries.forEach((storedEntry, storedKey) => { if (storedEntry.resetAt <= now)
                    this.entries.delete(storedKey); });
                if (this.entries.size >= this.maxKeys)
                    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(this.windowMs / 1000)) };
            }
            entry = { count: 0, resetAt: now + this.windowMs };
            this.entries.set(key, entry);
        }
        if (entry.count >= this.maxRequests)
            return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
        entry.count++;
        return { allowed: true };
    }
}
