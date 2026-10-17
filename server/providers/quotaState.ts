import { constants } from 'node:fs';
import { lstat, open, readFile, realpath, rename, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, parse, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ProviderQuota } from './quotaTypes';

export interface QuotaPolicy {
    providerId: string;
    /** Stable, nonsecret account identity; changing an API key does not change this label. */
    accountLabel: string;
    hourlyLimit: number;
    dailyLimit: number;
    monthlyLimit?: number;
}
interface Entry { accountLabel: string; buckets: Record<string, number>; months: Record<string, number>; disabled: boolean; blockedUntil: number }
interface Checkpoint { version: 1; lastNow: number; entries: Record<string, Entry> }
export interface PersistentQuota extends ProviderQuota {
    /** Operator must verify the entire configured budget is unused before creating a fresh checkpoint. */
    initializeVerifiedBudget(attestation: { verifiedUnusedBudget: true; evidence: string }): Promise<void>;
    setProviderState(providerId: string, state: { disabled?: boolean; blockedUntil?: number }): Promise<void>;
    close(): Promise<void>;
}
const MAX_BYTES = 4 * 1024 * 1024;
const MINUTE = 60_000;
const DAY = 86_400_000;
const safeName = (s: unknown): s is string => typeof s === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_. -]{0,79}$/.test(s) && !['__proto__', 'constructor', 'prototype'].includes(s);
const positive = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) > 0;
const validTime = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= 8_640_000_000_000_000;
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
async function exists(path: string) { try { await lstat(path); return true; } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false; throw e; } }
/** Check every ancestor and target: no symlink/junction traversal, network paths or alternate streams. */
async function safePath(path: string) {
    if (!isAbsolute(path) || path.startsWith('\\\\') || path.includes('\0') || path.slice(parse(path).root.length).includes(':')) throw new Error('Unsafe quota path.');
    let cursor = dirname(path);
    for (;;) {
        const stat = await lstat(cursor);
        if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe quota directory.');
        const parent = dirname(cursor); if (parent === cursor) break; cursor = parent;
    }
    const actual = await realpath(dirname(path));
    if (resolve(actual).toLowerCase() !== resolve(dirname(path)).toLowerCase()) throw new Error('Unsafe quota directory.');
    for (const target of [path, path + '.lock', path + '.initialized', path + '.tmp']) {
        if (await exists(target)) { const stat = await lstat(target); if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink > 1) throw new Error('Unsafe quota target.'); }
    }
}
function validate(raw: unknown, policies: QuotaPolicy[]): Checkpoint {
    if (!record(raw) || raw.version !== 1 || !validTime(raw.lastNow) || !record(raw.entries)) throw new Error('Invalid quota checkpoint.');
    for (const [id, value] of Object.entries(raw.entries)) {
        if (!safeName(id) || !record(value) || !safeName(value.accountLabel) || !record(value.buckets) || !record(value.months) || typeof value.disabled !== 'boolean' || !validTime(value.blockedUntil)) throw new Error('Invalid quota entry.');
        if (Object.keys(value.buckets).length > 1500 || Object.keys(value.months).length > 2) throw new Error('Oversized quota history.');
        for (const [minute, count] of Object.entries(value.buckets)) if (!/^\d{1,12}$/.test(minute) || !positive(count) || Number(minute) * MINUTE > raw.lastNow) throw new Error('Invalid quota bucket.');
        for (const [month, count] of Object.entries(value.months)) if (!/^\d{4}-\d{2}$/.test(month) || !positive(count)) throw new Error('Invalid quota month.');
    }
    for (const p of policies) { const entry = raw.entries[p.providerId] as unknown as Entry | undefined; if (!entry || entry.accountLabel !== p.accountLabel) throw new Error('Quota account configuration changed.'); }
    return raw as unknown as Checkpoint;
}

export async function createPersistentQuota(options: { path: string; now: () => number; policies: QuotaPolicy[] }): Promise<PersistentQuota> {
    const path = options.path;
    const policies = structuredClone(options.policies);
    if (policies.length === 0 || policies.length > 16 || new Set(policies.map(p => p.providerId)).size !== policies.length || policies.some(p => !safeName(p.providerId) || !safeName(p.accountLabel) || !positive(p.hourlyLimit) || !positive(p.dailyLimit) || (p.monthlyLimit !== undefined && !positive(p.monthlyLimit)))) throw new Error('Invalid quota policies.');
    await safePath(path);
    const token = randomUUID();
    const lock = await open(path + '.lock', constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    try { await lock.writeFile(JSON.stringify({ pid: process.pid, token })); await lock.sync(); } catch (e) { await lock.close(); throw e; }
    let closed = false;
    let failed = false;
    let checkpoint: Checkpoint | undefined;
    let mayInitialize = false;
    let tail: Promise<unknown> = Promise.resolve();
    const serialize = <T>(work: () => Promise<T>): Promise<T> => { const next = tail.then(work); tail = next.catch(() => {}); return next; };
    async function ownership() {
        if (closed || failed) throw new Error('Quota unavailable.');
        await safePath(path);
        if (checkpoint) {
            if (!(await exists(path)) || (await lstat(path)).size > MAX_BYTES || await readFile(path, 'utf8') !== JSON.stringify(checkpoint)) throw new Error('Quota checkpoint changed.');
        }
        const owner = JSON.parse(await readFile(path + '.lock', 'utf8'));
        if (owner.token !== token) throw new Error('Quota ownership lost.');
    }
    async function persist(next: Checkpoint) {
        await ownership();
        const bytes = JSON.stringify(next);
        if (Buffer.byteLength(bytes) > MAX_BYTES) throw new Error('Quota checkpoint too large.');
        // Fixed temporary name plus exclusive creation also fails closed after an interrupted write.
        const file = await open(path + '.tmp', constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
        try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
        await rename(path + '.tmp', path); // Node uses replace-existing semantics on Windows.
        // POSIX directory fsync makes the replacement durable; Windows does not expose directory fsync.
        if (process.platform !== 'win32') { const dir = await open(dirname(path), 'r'); try { await dir.sync(); } finally { await dir.close(); } }
        checkpoint = next;
    }
    try {
        if (await exists(path)) {
            const stat = await lstat(path);
            if (stat.size > MAX_BYTES) throw new Error('Oversized quota checkpoint.');
            checkpoint = validate(JSON.parse(await readFile(path, 'utf8')), policies);
            if (!(await exists(path + '.initialized'))) throw new Error('Missing quota initialization marker.');
        } else mayInitialize = !(await exists(path + '.initialized'));
    } catch { failed = true; }
    return {
        reserve(providerId, cost) { return serialize(async () => {
            if (!checkpoint || failed || closed || !positive(cost)) return { allowed: false, reason: 'quota-state-unavailable' };
            const policy = policies.find(p => p.providerId === providerId);
            if (!policy) return { allowed: false, reason: 'quota-provider-unconfigured' };
            try {
                const now = options.now();
                if (!validTime(now) || now < checkpoint.lastNow) { failed = true; return { allowed: false, reason: 'quota-clock-rollback' }; }
                const next = structuredClone(checkpoint); next.lastNow = now;
                const entry = next.entries[providerId];
                const month = new Date(now).toISOString().slice(0, 7);
                let hour = 0, day = 0;
                for (const [bucket, count] of Object.entries(entry.buckets)) {
                    const end = (Number(bucket) + 1) * MINUTE;
                    if (end + DAY <= now) delete entry.buckets[bucket]; else { day += count; if (end + 3_600_000 > now) hour += count; }
                }
                for (const oldMonth of Object.keys(entry.months)) if (oldMonth !== month) delete entry.months[oldMonth];
                if (entry.disabled || entry.blockedUntil > now || hour + cost > policy.hourlyLimit || day + cost > policy.dailyLimit || (policy.monthlyLimit !== undefined && (entry.months[month] ?? 0) + cost > policy.monthlyLimit)) {
                    await persist(next); return { allowed: false, reason: entry.disabled ? 'quota-provider-disabled' : 'quota-exhausted' };
                }
                const bucket = String(Math.floor(now / MINUTE)); entry.buckets[bucket] = (entry.buckets[bucket] ?? 0) + cost; entry.months[month] = (entry.months[month] ?? 0) + cost;
                await persist(next); return { allowed: true, reason: 'quota-reserved' };
            } catch { failed = true; return { allowed: false, reason: 'quota-persistence-failed' }; }
        }); },
        initializeVerifiedBudget(attestation) { return serialize(async () => {
            if (!mayInitialize || checkpoint || failed || closed || attestation?.verifiedUnusedBudget !== true || typeof attestation.evidence !== 'string' || attestation.evidence.trim().length < 8 || attestation.evidence.length > 500) throw new Error('Verified unused budget attestation required; existing state cannot be reset.');
            const now = options.now(); if (!validTime(now)) throw new Error('Invalid quota clock.');
            const next: Checkpoint = { version: 1, lastNow: now, entries: Object.fromEntries(policies.map(p => [p.providerId, { accountLabel: p.accountLabel, buckets: {}, months: {}, disabled: false, blockedUntil: 0 }])) };
            try {
                await ownership();
                const marker = await open(path + '.initialized', constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
                try { await marker.writeFile('Verified unused budget initialization.\n'); await marker.sync(); } finally { await marker.close(); }
                mayInitialize = false; await persist(next);
            } catch (e) { failed = true; throw new Error('Quota initialization failed.'); }
        }); },
        setProviderState(providerId, state) { return serialize(async () => {
            if (!checkpoint || !policies.some(p => p.providerId === providerId) || (state.disabled !== undefined && typeof state.disabled !== 'boolean') || (state.blockedUntil !== undefined && !validTime(state.blockedUntil))) throw new Error('Invalid provider state.');
            try { const now = options.now(); if (!validTime(now) || now < checkpoint.lastNow) throw new Error('Quota clock rollback.'); const next = structuredClone(checkpoint); next.lastNow = now; if (state.disabled !== undefined) next.entries[providerId].disabled = state.disabled; if (state.blockedUntil !== undefined) next.entries[providerId].blockedUntil = state.blockedUntil; await persist(next); } catch { failed = true; throw new Error('Quota provider state persistence failed.'); }
        }); },
        close() { return serialize(async () => {
            if (closed) return;
            closed = true; await lock.close();
            try { const owner = JSON.parse(await readFile(path + '.lock', 'utf8')); if (owner.token === token) await unlink(path + '.lock'); } catch { /* Lost lock is never removed. */ }
        }); }
    };
}


