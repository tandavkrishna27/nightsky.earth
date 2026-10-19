import { constants } from 'node:fs';
import { lstat, open, readFile, realpath, rename, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, parse } from 'node:path';
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
export interface VerifiedProviderUsage {
    verifiedAllowance: true;
    verifiedAllAccountUsage: true;
    allConsumersQuiesced: true;
    /** Evidence must establish the configured allowance as well as all shared-account usage. */
    evidence: string;
    observedAt: number;
    usedLast24Hours: number;
    usedCurrentMonth: number;
}
interface Entry { accountLabel: string; buckets: Record<string, number>; months: Record<string, number>; disabled: boolean; blockedUntil: number; imported?: { policy: QuotaPolicy; usage: VerifiedProviderUsage } }
interface Checkpoint { version: 1; lastNow: number; entries: Record<string, Entry> }
export interface PersistentQuota extends ProviderQuota {
    /** Add only to an existing checkpoint while holding its exclusive lock; never resets an entry. */
    addVerifiedProvider(policy: QuotaPolicy, usage: VerifiedProviderUsage): Promise<void>;
    /** Operator must verify the entire configured budget is unused before creating a fresh checkpoint. */
    initializeVerifiedBudget(attestation: { verifiedUnusedBudget: true; evidence: string }): Promise<void>;
    initializeVerifiedUsage(usage: Record<string, VerifiedProviderUsage>): Promise<void>;
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
const nonnegative = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const exactKeys = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v,k));
function validImport(value: unknown): value is NonNullable<Entry['imported']> {
    if (!record(value) || !exactKeys(value,['policy','usage']) || !record(value.policy) || !record(value.usage)) return false;
    const p=value.policy, u=value.usage;
    return (exactKeys(p,['providerId','accountLabel','hourlyLimit','dailyLimit']) || exactKeys(p,['providerId','accountLabel','hourlyLimit','dailyLimit','monthlyLimit'])) && safeName(p.providerId) && safeName(p.accountLabel) && positive(p.hourlyLimit) && positive(p.dailyLimit) && (p.monthlyLimit === undefined || positive(p.monthlyLimit)) &&
        exactKeys(u,['verifiedAllowance','verifiedAllAccountUsage','allConsumersQuiesced','evidence','observedAt','usedLast24Hours','usedCurrentMonth']) &&
        u.verifiedAllowance===true && u.verifiedAllAccountUsage===true && u.allConsumersQuiesced===true && typeof u.evidence==='string' && u.evidence.trim().length>=8 && u.evidence.length<=500 && validTime(u.observedAt) && nonnegative(u.usedLast24Hours) && nonnegative(u.usedCurrentMonth);
}
const samePolicy = (a: QuotaPolicy,b: QuotaPolicy) => a.providerId===b.providerId && a.accountLabel===b.accountLabel && a.hourlyLimit===b.hourlyLimit && a.dailyLimit===b.dailyLimit && a.monthlyLimit===b.monthlyLimit;
async function exists(path: string) { try { await lstat(path); return true; } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false; throw e; } }
/** Check every ancestor and target: no symlink/junction traversal, network paths or alternate streams. */
async function safePath(path: string) {
    const normalized = path.replace(/\\/g, '/');
    if (normalized.startsWith('//') || (process.platform === 'win32' && !/^[a-zA-Z]:[\\/]$/.test(parse(path).root))) throw new Error('Unsafe quota path.');
    if (!isAbsolute(path) || path.startsWith('\\\\') || path.includes('\0') || path.slice(parse(path).root.length).includes(':')) throw new Error('Unsafe quota path.');
    let cursor = dirname(path);
    for (;;) {
        const stat = await lstat(cursor);
        if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe quota directory.');
        const parent = dirname(cursor); if (parent === cursor) break; cursor = parent;
    }
    const actual = await realpath(dirname(path));
    // Windows 8.3 spellings expand through realpath without traversing a link.
    // Ancestor lstat checks above reject links; compare identities rather than names.
    const requestedDirectory = await lstat(dirname(path), { bigint: true });
    const canonicalDirectory = await lstat(actual, { bigint: true });
    if (requestedDirectory.isSymbolicLink() || canonicalDirectory.isSymbolicLink() ||
        !requestedDirectory.isDirectory() || !canonicalDirectory.isDirectory() ||
        requestedDirectory.dev !== canonicalDirectory.dev || requestedDirectory.ino !== canonicalDirectory.ino) throw new Error('Unsafe quota directory.');
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
        if (Object.hasOwn(value,'imported') && (!validImport(value.imported) || value.imported.policy.providerId!==id || value.imported.policy.accountLabel!==value.accountLabel || value.imported.usage.observedAt > raw.lastNow)) throw Error('Invalid imported quota accounting.');
    }
    for (const p of policies) { const entry = raw.entries[p.providerId] as unknown as Entry | undefined; if (!entry || entry.accountLabel !== p.accountLabel || (entry.imported && !samePolicy(entry.imported.policy,p))) throw new Error('Quota account configuration changed.'); }
    return raw as unknown as Checkpoint;
}

export async function createPersistentQuota(options: { path: string; now: () => number; policies: QuotaPolicy[]; /** Offline fault injection only; never set by runtime configuration. */ initializationFault?: () => Promise<void> }): Promise<PersistentQuota> {
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
    async function initialize(next: Checkpoint) {
        let createdMarker: {dev: bigint; ino: bigint} | undefined;
        const markerBytes=`Verified budget initialization.\n${token}\n`;
        try {
            await ownership();
            const marker = await open(path + '.initialized', constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
            const markerStat = await marker.stat({bigint:true}); createdMarker={dev:markerStat.dev,ino:markerStat.ino};
            try { await marker.writeFile(markerBytes); await marker.sync(); } finally { await marker.close(); }
            mayInitialize = false;
            await options.initializationFault?.();
            await persist(next);
        } catch (e) {
            // Only undo our own marker if no checkpoint or pending write exists.
            // A renamed checkpoint or stranded .tmp is ambiguous and remains fail-closed.
            if(createdMarker)try{
                if(!(await exists(path))&&!(await exists(path+'.tmp'))){
                    const current=await lstat(path+'.initialized',{bigint:true});
                    if(current.isFile()&&!current.isSymbolicLink()&&current.nlink===BigInt(1)&&current.dev===createdMarker.dev&&current.ino===createdMarker.ino&&(await readFile(path+'.initialized','utf8'))===markerBytes)
                        await unlink(path+'.initialized');
                }
            }catch{/* Preserve ambiguous state for operator recovery. */}
            failed = true; throw new Error('Quota initialization failed.');
        }
    }
    return {
        addVerifiedProvider(policyInput, usageInput) { return serialize(async () => {
            const p = structuredClone(policyInput), u = structuredClone(usageInput);
            const now = options.now();
            if (!checkpoint || failed || closed || policies.length >= 16 || Object.hasOwn(checkpoint.entries, p.providerId) ||
                !validImport({policy:p,usage:u}) ||
                !safeName(p.providerId) || !safeName(p.accountLabel) || !positive(p.hourlyLimit) || !positive(p.dailyLimit) || (p.monthlyLimit !== undefined && !positive(p.monthlyLimit)) ||
                u?.verifiedAllowance !== true || u.verifiedAllAccountUsage !== true || u.allConsumersQuiesced !== true || typeof u.evidence !== 'string' || u.evidence.trim().length < 8 || u.evidence.length > 500 ||
                !validTime(now) || now < checkpoint.lastNow || !validTime(u.observedAt) || u.observedAt > now || now-u.observedAt > 300000 ||
                new Date(u.observedAt).toISOString().slice(0,7) !== new Date(now).toISOString().slice(0,7) ||
                !nonnegative(u.usedLast24Hours) || !nonnegative(u.usedCurrentMonth) ||
                // On the first UTC day the rolling window can include the prior month.
                (new Date(now).getUTCDate() > 1 && u.usedCurrentMonth < u.usedLast24Hours)) throw Error('Verified provider allowance and complete usage required; existing entries cannot be replaced.');
            const next = structuredClone(checkpoint); next.lastNow = now;
            // Conservatively age all imported rolling usage from import time, including its hourly charge.
            next.entries[p.providerId] = {accountLabel:p.accountLabel, buckets:u.usedLast24Hours ? {[String(Math.floor(now/MINUTE))]:u.usedLast24Hours} : {},
                months:u.usedCurrentMonth ? {[new Date(now).toISOString().slice(0,7)]:u.usedCurrentMonth} : {}, disabled:false, blockedUntil:0, imported:{policy:p,usage:u}};
            try { await persist(next); policies.push(p); } catch { failed=true; throw Error('Quota provider import persistence failed.'); }
        }); },
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
            await initialize(next);
        }); },
        initializeVerifiedUsage(usageInput) { return serialize(async () => {
            const usage=structuredClone(usageInput), now=options.now();
            if (!mayInitialize || checkpoint || failed || closed || !validTime(now) || !record(usage) || !exactKeys(usage,policies.map(p=>p.providerId))) throw Error('Fresh checkpoint and complete verified usage required.');
            const entries: Record<string, Entry> = {};
            for (const p of policies) {
                const u=usage[p.providerId];
                if (!validImport({policy:p,usage:u}) || u.observedAt>now || now-u.observedAt>300000 ||
                    new Date(u.observedAt).toISOString().slice(0,7)!==new Date(now).toISOString().slice(0,7) ||
                    (new Date(now).getUTCDate()>1 && u.usedCurrentMonth<u.usedLast24Hours)) throw Error('Fresh verified allowance and complete usage required.');
                entries[p.providerId]={accountLabel:p.accountLabel,buckets:u.usedLast24Hours?{[String(Math.floor(now/MINUTE))]:u.usedLast24Hours}:{},months:u.usedCurrentMonth?{[new Date(now).toISOString().slice(0,7)]:u.usedCurrentMonth}:{},disabled:false,blockedUntil:0,imported:{policy:p,usage:u}};
            }
            await initialize({version:1,lastNow:now,entries});
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
