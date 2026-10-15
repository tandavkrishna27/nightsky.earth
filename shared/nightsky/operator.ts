/** Offline operator admission only. Never mutates runtime, reads environment or contacts hosts. */
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { lstat, open, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { constants } from 'node:fs';
import express from 'express';
import { pluginListenerConfiguration, pluginToolMode, pluginRegionalConfiguration, pluginGlobalConfiguration } from '../../server/plugin';
import { configureMcpProxyTrust } from '../../server/mcp/proxyTrust';
import { climateArtifactConfiguration } from '../../server/providers/climate/configuration';
const text = z.string().min(1).max(4096).refine(v => !/[\x00-\x1f\x7f]/.test(v));
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const bytes = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const evidence = text.nullable();
const envKeys = ['NODE_ENV', 'HOST', 'PORT', 'NIGHTSKY_MCP_TOOL_MODE', 'NIGHTSKY_MCP_ALLOWED_HOSTS', 'NIGHTSKY_MCP_TRUSTED_PROXIES', 'MET_NORWAY_USER_AGENT', 'NIGHTSKY_GEONAMES_INDEX', 'NIGHTSKY_OSM_CANDIDATE_INDEX', 'NIGHTSKY_OSM_CANDIDATE_SHA256', 'NIGHTSKY_OSM_CANDIDATE_MAX_BYTES', 'NIGHTSKY_OSM_REGIONAL_MANIFEST', 'NIGHTSKY_OSM_REGIONAL_SHA256', 'NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST', 'NIGHTSKY_GLOBAL_CATALOGUE_SHA256', 'NIGHTSKY_CLIMATE_ARTIFACT', 'NIGHTSKY_CLIMATE_SHA256', 'NIGHTSKY_ERA5_RELEASE_MANIFEST', 'NIGHTSKY_ERA5_RELEASE_SHA256'] as const;
const runtimeSchema = z.object(Object.fromEntries(envKeys.map(k => [k, text.optional()]))).strict();
const release = z.object({ id: text, sourceCommit: z.string().regex(/^[a-f0-9]{40}$/), imageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/), architecture: z.enum(['amd64', 'arm64']), packageVersion: z.string().regex(/^\d+\.\d+\.\d+$/), artifactIds: z.array(text).max(10000) }).strict();
export const operatorConfigSchema = z.object({ schemaVersion: z.literal(1), status: z.enum(['template', 'selected']), endpoints: z.object({ production: evidence, staging: evidence, privacy: evidence, terms: evidence, support: evidence }).strict(), topology: z.object({ kind: z.enum(['direct', 'single-rewriting-proxy']), headerRewriteEvidence: evidence, restrictedBackendEvidence: evidence }).strict(), runtimeEnvironment: runtimeSchema, releases: z.object({ current: release.nullable(), rollback: release.nullable() }).strict(), artifacts: z.array(z.object({ id: text, kind: z.enum(['geonames', 'osm-single', 'osm-regional', 'global-catalogue', 'climate-legacy', 'era5-release', 'component']), path: text, sha256: hash, bytes: bytes, version: text }).strict()).max(10000), budget: z.object({ processes: z.number().int().min(1).max(64), memoryBytes: bytes, diskAvailableBytes: bytes, currentBytes: bytes, rollbackBytes: bytes, scratchBytes: bytes, reserveBytes: bytes, maxArtifactBytes: bytes.max(16 * 1024 ** 3), capacityEvidence: evidence, rollbackEvidence: evidence }).strict().nullable(), ownerEvidence: z.object({ identity: evidence, policies: evidence, retention: evidence, host: evidence, providerBudget: evidence }).strict() }).strict();
export type OperatorConfig = z.infer<typeof operatorConfigSchema>;
export type OperatorArtifact = OperatorConfig['artifacts'][number];
export type OperatorResult = {
    status: 'invalid' | 'incomplete-owner-inputs' | 'offline-pass';
    findings: string[];
    hostChecksPerformed: false;
    deploymentReady: false;
    officialAccepted: false;
};
/** Produces a reviewable selection only; callers must separately authorize any promotion. */
export function selectRelease(input: unknown, selection: 'current' | 'rollback') { const parsed = operatorConfigSchema.safeParse(input); if (!parsed.success) throw Error('Release selection invalid.'); const selected = parsed.data.releases[selection]; if (!selected)
    throw Error('Release selection incomplete.'); return structuredClone(selected); }
function productionUrl(raw: string) { const u = new URL(raw); if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || !u.hostname.includes('.') || /(^|\.)(example\.(com|org|net)|localhost|invalid)$/.test(u.hostname) || u.hostname.endsWith('.test') || u.hostname.endsWith('.local') || /^\d+[.]/.test(u.hostname))
    throw Error('url'); return u; }
/** Reads fixed chunks; refuses links in all path components and changed inode/size/time. */
async function checkArtifact(root: string, a: OperatorArtifact, max: number) { if (a.bytes > max || isAbsolute(a.path) || a.path.includes('\\') || a.path.split('/').some(p => !p || p === '..' || p === '.' || p.includes(':')))
    throw Error('artifact'); const base = await realpath(root); let cursor = base; for (const part of a.path.split('/')) {
    cursor = resolve(cursor, part);
    const s = await lstat(cursor);
    if (s.isSymbolicLink())
        throw Error('link');
} const canonical = await realpath(cursor); const rel = relative(base, canonical); if (isAbsolute(rel) || rel === '..' || rel.startsWith('..' + sep))
    throw Error('containment'); const h = await open(cursor, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); try {
    const before = await h.stat();
    if (!before.isFile() || before.size !== a.bytes)
        throw Error('size');
    const digest = createHash('sha256');
    const buffer = Buffer.alloc(64 * 1024);
    let count = 0;
    while (true) {
        const { bytesRead } = await h.read(buffer, 0, Math.min(buffer.length, max - count + 1), null);
        if (!bytesRead)
            break;
        count += bytesRead;
        if (count > max || count > a.bytes)
            throw Error('bound');
        digest.update(buffer.subarray(0, bytesRead));
    }
    const after = await h.stat();
    const pathAfter = await lstat(cursor);
    if (count !== a.bytes || digest.digest('hex') !== a.sha256 || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || before.ino !== pathAfter.ino || pathAfter.isSymbolicLink())
        throw Error('mutation');
}
finally {
    await h.close();
} }
export async function operatorPreflight(input: unknown, artifactRoot: string): Promise<OperatorResult> {
    const findings: string[] = [];
    let invalid = false, incomplete = false;
    const fail = (code: string) => { invalid = true; findings.push(code); };
    const missing = (code: string) => { incomplete = true; findings.push(code); };
    const output = (): OperatorResult => ({ status: invalid ? 'invalid' : incomplete ? 'incomplete-owner-inputs' : 'offline-pass', findings: Array.from(new Set(findings)), hostChecksPerformed: false, deploymentReady: false, officialAccepted: false });
    const parsed = operatorConfigSchema.safeParse(input);
    if (!parsed.success) {
        fail('CONFIG_SCHEMA_INVALID');
        return output();
    }
    const c = parsed.data, e = c.runtimeEnvironment as Partial<Record<typeof envKeys[number], string>>;
    if (c.status === 'template')
        missing('TEMPLATE_NOT_DEPLOYABLE');
    for (const v of Object.values(c.ownerEvidence))
        if (!v)
            missing('OWNER_EVIDENCE_MISSING');
    let prod: URL | undefined, stage: URL | undefined;
    for (const [key, value] of Object.entries(c.endpoints)) {
        if (!value) {
            missing('ENDPOINT_MISSING');
            continue;
        }
        try {
            const u = productionUrl(value);
            if (key === 'production')
                prod = u;
            if (key === 'staging')
                stage = u;
            if ((key === 'production' || key === 'staging') && u.pathname !== '/mcp')
                fail('MCP_URL_PATH_INVALID');
        }
        catch {
            fail('PRODUCTION_URL_INVALID');
        }
    }
    if (prod && stage && prod.hostname === stage.hostname)
        fail('STAGING_NOT_DISTINCT');
    try {
        pluginListenerConfiguration(e);
        pluginToolMode(e);
        pluginRegionalConfiguration(e);
        climateArtifactConfiguration(e);
        pluginGlobalConfiguration(e);
        configureMcpProxyTrust(express(), e.NIGHTSKY_MCP_TRUSTED_PROXIES);
    }
    catch {
        fail('RUNTIME_CONTRACT_INVALID');
    }
    for (const k of ['NODE_ENV', 'HOST', 'PORT', 'NIGHTSKY_MCP_TOOL_MODE', 'NIGHTSKY_MCP_ALLOWED_HOSTS'] as const)
        if (!e[k])
            missing('RUNTIME_SETTING_MISSING');
    if (e.NODE_ENV && e.NODE_ENV !== 'production')
        fail('NODE_ENV_INVALID');
    const hosts = e.NIGHTSKY_MCP_ALLOWED_HOSTS?.split(',') ?? [];
    if (hosts.some(h => h !== h.trim() || !/^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(h)))
        fail('ALLOWED_HOSTS_INVALID');
    if (prod && !hosts.includes(prod.hostname) || stage && !hosts.includes(stage.hostname))
        fail('ENDPOINT_ALLOWLIST_MISMATCH');
    if (c.topology.kind === 'direct' && e.NIGHTSKY_MCP_TRUSTED_PROXIES)
        fail('PROXY_TOPOLOGY_CONFLICT');
    if (c.topology.kind === 'single-rewriting-proxy' && (!e.NIGHTSKY_MCP_TRUSTED_PROXIES || !c.topology.headerRewriteEvidence || !c.topology.restrictedBackendEvidence))
        missing('PROXY_EVIDENCE_MISSING');
    const pairs = [['NIGHTSKY_OSM_CANDIDATE_INDEX', 'NIGHTSKY_OSM_CANDIDATE_SHA256', 'osm-single'], ['NIGHTSKY_OSM_REGIONAL_MANIFEST', 'NIGHTSKY_OSM_REGIONAL_SHA256', 'osm-regional'], ['NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST', 'NIGHTSKY_GLOBAL_CATALOGUE_SHA256', 'global-catalogue'], ['NIGHTSKY_CLIMATE_ARTIFACT', 'NIGHTSKY_CLIMATE_SHA256', 'climate-legacy'], ['NIGHTSKY_ERA5_RELEASE_MANIFEST', 'NIGHTSKY_ERA5_RELEASE_SHA256', 'era5-release']] as const;
    if (e.NIGHTSKY_CLIMATE_ARTIFACT && e.NIGHTSKY_ERA5_RELEASE_MANIFEST)
        fail('CLIMATE_SELECTION_CONFLICT');
    if (e.NIGHTSKY_OSM_CANDIDATE_MAX_BYTES && (!/^\d+$/.test(e.NIGHTSKY_OSM_CANDIDATE_MAX_BYTES) || Number(e.NIGHTSKY_OSM_CANDIDATE_MAX_BYTES) > 512 * 1024 ** 2 || Number(e.NIGHTSKY_OSM_CANDIDATE_MAX_BYTES) < 1))
        fail('OSM_BYTE_LIMIT_INVALID');
    const current = c.releases.current, rollback = c.releases.rollback;
    if (!current || !rollback)
        missing('RELEASE_TUPLE_MISSING');
    if (current && rollback && (current.id === rollback.id || current.imageDigest === rollback.imageDigest || current.architecture !== rollback.architecture))
        fail('RELEASE_TUPLE_CONFLICT');
    const ids = new Set<string>();
    const paths = new Map<string, OperatorArtifact>();
    for (const a of c.artifacts) {
        if (ids.has(a.id))
            fail('ARTIFACT_ID_CONFLICT');
        ids.add(a.id);
        const previous = paths.get(a.path.toLowerCase());
        if (previous && (previous.sha256 !== a.sha256 || previous.bytes !== a.bytes || previous.version !== a.version || previous.kind !== a.kind)) fail('ARTIFACT_PATH_CONFLICT');
        paths.set(a.path.toLowerCase(), a);
    }
    for (const r of [current, rollback])
        if (r) {
            if (new Set(r.artifactIds).size !== r.artifactIds.length || r.artifactIds.some(id => !ids.has(id)))
                fail('RELEASE_INVENTORY_INVALID');
        }
    if (c.artifacts.some(a => !current?.artifactIds.includes(a.id) && !rollback?.artifactIds.includes(a.id))) fail('ARTIFACT_UNASSIGNED');
    const active = c.artifacts.filter(a => current?.artifactIds.includes(a.id));
    for (const [pathKey, hashKey, kind] of pairs) {
        const path = e[pathKey], digest = e[hashKey];
        if (path !== undefined || digest !== undefined) {
            if (!path || !digest || !/^[a-f0-9]{64}$/.test(digest))
                fail('ARTIFACT_PIN_INVALID');
            else if (!active.some(a => a.kind === kind && a.path === path && a.sha256 === digest))
                fail('RUNTIME_INVENTORY_MISMATCH');
        }
    }
    if (e.NIGHTSKY_GEONAMES_INDEX && !active.some(a => a.kind === 'geonames' && a.path === e.NIGHTSKY_GEONAMES_INDEX))
        fail('GEONAMES_INVENTORY_MISMATCH');
    if (e.NIGHTSKY_MCP_TOOL_MODE === 'full') {
        const previousArtifacts = c.artifacts.filter(a => rollback?.artifactIds.includes(a.id));
        if (!previousArtifacts.some(a => a.kind === 'geonames') || !previousArtifacts.some(a => ['osm-single', 'osm-regional', 'global-catalogue'].includes(a.kind)) || !previousArtifacts.some(a => ['climate-legacy', 'era5-release'].includes(a.kind))) missing('ROLLBACK_PRODUCT_INVENTORY_MISSING');
        if (!e.MET_NORWAY_USER_AGENT || !e.MET_NORWAY_USER_AGENT.includes('nightsky.earth2026@gmail.com') || !e.NIGHTSKY_GEONAMES_INDEX || !pairs.slice(0, 3).some(([k]) => e[k]) || !pairs.slice(3).some(([k]) => e[k]))
            missing('FULL_MODE_INPUTS_MISSING');
    }
    const b = c.budget;
    if (!b)
        missing('RESOURCE_BUDGET_MISSING');
    else {
        if (!b.memoryBytes || !b.maxArtifactBytes || !b.capacityEvidence || !b.rollbackEvidence)
            missing('CAPACITY_EVIDENCE_MISSING');
        const combined = BigInt(b.currentBytes) + BigInt(b.rollbackBytes) + BigInt(b.scratchBytes) + BigInt(b.reserveBytes);
        if (combined > BigInt(b.diskAvailableBytes))
            fail('COMBINED_DISK_BUDGET_EXCEEDED');
        for (const [r, limit] of [[current, b.currentBytes], [rollback, b.rollbackBytes]] as const)
            if (r && c.artifacts.filter(a => r.artifactIds.includes(a.id)).reduce((n, a) => n + BigInt(a.bytes), BigInt(0)) > BigInt(limit))
                fail('RELEASE_DISK_BUDGET_EXCEEDED');
        if (!invalid)
            for (const a of c.artifacts) {
                try {
                    await checkArtifact(artifactRoot, a, b.maxArtifactBytes);
                }
                catch {
                    fail('ARTIFACT_VERIFICATION_FAILED');
                }
            }
    }
    findings.push('HOST_CHECKS_NOT_PERFORMED');
    return output();
}
