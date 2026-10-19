import { API_SOURCE_ENV_KEYS, apiSourceManifestSchema, validateApiSourceManifest } from '../../server/operations/apiSourceManifest';
import { validateOperatorReleaseClosure } from './operatorClosure';
/** Offline operator admission only. Never mutates runtime, reads environment or contacts hosts. */
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { lstat, open, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { constants } from 'node:fs';
import express from 'express';
import { pluginListenerConfiguration, pluginToolMode, pluginRegionalConfiguration, pluginGlobalConfiguration, pluginDiscoveryMode, pluginApiHistoryConfiguration } from '../../server/plugin';
import { configureMcpProxyTrust } from '../../server/mcp/proxyTrust';
import { parseWeatherConfiguration } from '../../server/providers/weather/configuration';
import { climateArtifactConfiguration } from '../../server/providers/climate/configuration';
const text = z.string().min(1).max(4096).refine(v => !/[\x00-\x1f\x7f]/.test(v));
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const bytes = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const evidence = text.nullable();
const envKeys = [...API_SOURCE_ENV_KEYS, 'NIGHTSKY_API_HISTORY_CACHE_DIRECTORY', 'NIGHTSKY_API_HISTORY_ADMISSION', 'NIGHTSKY_WEATHER_PROVIDERS', 'NIGHTSKY_WEATHER_ADMITTED_PROVIDERS', 'NIGHTSKY_QUOTA_STATE_PATH', 'NIGHTSKY_DISCOVERY_MODE', 'NODE_ENV', 'HOST', 'PORT', 'NIGHTSKY_MCP_TOOL_MODE', 'NIGHTSKY_MCP_ALLOWED_HOSTS', 'NIGHTSKY_MCP_TRUSTED_PROXIES', 'MET_NORWAY_USER_AGENT', 'NIGHTSKY_GEONAMES_INDEX', 'NIGHTSKY_OSM_CANDIDATE_INDEX', 'NIGHTSKY_OSM_CANDIDATE_SHA256', 'NIGHTSKY_OSM_CANDIDATE_MAX_BYTES', 'NIGHTSKY_OSM_REGIONAL_MANIFEST', 'NIGHTSKY_OSM_REGIONAL_SHA256', 'NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST', 'NIGHTSKY_GLOBAL_CATALOGUE_SHA256', 'NIGHTSKY_CLIMATE_ARTIFACT', 'NIGHTSKY_CLIMATE_SHA256', 'NIGHTSKY_ERA5_RELEASE_MANIFEST', 'NIGHTSKY_ERA5_RELEASE_SHA256'] as const;
const runtimeSchema = z.object(Object.fromEntries(envKeys.map(k => [k, text.optional()]))).strict();
const discoveryEvidence = z.object({ mode: z.enum(['api', 'catalogue', 'regional', 'legacy']), providers: z.array(z.enum(['geonames', 'geoapify'])).max(2), configurationEvidence: evidence, policyEvidence: evidence, budgetEvidence: evidence }).strict();
const weatherId = z.enum(['met','weatherapi','openweather','seventimer']);
const weatherIds = z.array(weatherId).min(1).max(4).refine(v=>new Set(v).size===v.length);
const weatherEvidence = z.object({providers:weatherIds,admittedProviders:z.array(weatherId).max(4).refine(v=>new Set(v).size===v.length),liveVerifiedProviders:z.array(weatherId).max(4).refine(v=>new Set(v).size===v.length),configurationEvidence:evidence,policyEvidence:evidence,budgetEvidence:evidence}).strict().refine(v=>[...v.admittedProviders,...v.liveVerifiedProviders].every(id=>v.providers.includes(id)));
const release = z.object({ profile: z.literal('api-only-v1').optional(), id: text, sourceCommit: z.string().regex(/^[a-f0-9]{40}$/), imageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/), architecture: z.enum(['amd64', 'arm64']), packageVersion: z.string().regex(/^\d+\.\d+\.\d+$/), artifactIds: z.array(text).max(10000), discovery: discoveryEvidence.optional(), weather: weatherEvidence.optional() }).strict();
const lineageValidation=z.object({scratchDirectory:text,budgets:z.object({maxInputBytes:bytes.positive().max(64*1024**3),maxMemoryBytes:bytes.min(16*1024**2).max(2*1024**3),maxScratchBytes:bytes.positive().max(32*1024**3),maxOutputBytes:bytes.positive().max(32*1024**3),maxDurationMs:bytes.positive().max(60*60*1000)}).strict()}).strict();
export const operatorConfigSchema = z.object({ schemaVersion: z.literal(1), sourceManifest: apiSourceManifestSchema.optional(), lineageValidation:lineageValidation.optional(), status: z.enum(['template', 'selected']), endpoints: z.object({ production: evidence, staging: evidence, privacy: evidence, terms: evidence, support: evidence }).strict(), topology: z.object({ kind: z.enum(['direct', 'single-rewriting-proxy']), headerRewriteEvidence: evidence, restrictedBackendEvidence: evidence }).strict(), runtimeEnvironment: runtimeSchema, releases: z.object({ current: release.nullable(), rollback: release.nullable() }).strict(), artifacts: z.array(z.object({ id: text, kind: z.enum(['geonames', 'osm-single', 'osm-regional', 'global-catalogue', 'climate-legacy', 'era5-release', 'component']), path: text, sha256: hash, bytes: bytes, version: text }).strict()).max(10000), budget: z.object({ processes: z.number().int().min(1).max(64), memoryBytes: bytes, diskAvailableBytes: bytes, currentBytes: bytes, rollbackBytes: bytes, scratchBytes: bytes, reserveBytes: bytes, maxArtifactBytes: bytes.max(16 * 1024 ** 3), capacityEvidence: evidence, rollbackEvidence: evidence }).strict().nullable(), ownerEvidence: z.object({ identity: evidence, policies: evidence, retention: evidence, host: evidence, providerBudget: evidence }).strict() }).strict();
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
    const needsSourceManifest = [c.releases.current,c.releases.rollback].some(r=>r?.profile==='api-only-v1');
    if(needsSourceManifest && !c.sourceManifest) missing('API_SOURCE_MANIFEST_MISSING');
    if(c.sourceManifest){
        try {
            const manifest=validateApiSourceManifest(c.sourceManifest);
            if(API_SOURCE_ENV_KEYS.some(key=>manifest.current.environment[key]!==e[key])) fail('API_SOURCE_RUNTIME_MISMATCH');
            for(const selection of ['current','rollback'] as const){
                const selected=c.releases[selection];
                if(selected?.profile==='api-only-v1'){
                    if(!selected.discovery || selected.discovery.providers.slice().sort().join(',')!==manifest[selection].discoveryProviders.slice().sort().join(',')) fail('API_SOURCE_DISCOVERY_MISMATCH');
                    const weather=parseWeatherConfiguration(manifest[selection].environment);
                    const providers=weather.providers??['met'],admitted=weather.admitted;
                    const receipt=selected.weather;
                    const same=(a:string[],b:string[])=>a.slice().sort().join(',')===b.slice().sort().join(',');
                    if(receipt ? !same(receipt.providers,providers)||!same(receipt.admittedProviders,admitted) : !same(providers,['met'])||admitted.length>0) fail('API_SOURCE_WEATHER_MISMATCH');
                }
            }
        } catch { fail('API_SOURCE_MANIFEST_INVALID'); }
    }
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
        pluginApiHistoryConfiguration(e);
        parseWeatherConfiguration(e);
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
    if (e.NIGHTSKY_API_HISTORY_CACHE_DIRECTORY !== undefined || e.NIGHTSKY_API_HISTORY_ADMISSION !== undefined) missing('API_HISTORY_ADMISSION_RESOURCE_VALIDATION_PENDING');
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
        if (previous) fail('ARTIFACT_PATH_ALIAS');
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
    let currentMode = 'legacy';
    try { currentMode = pluginDiscoveryMode(e); } catch { fail('DISCOVERY_CONFIGURATION_INVALID'); }
    if (current?.discovery && current.discovery.mode !== currentMode) fail('DISCOVERY_RELEASE_MODE_MISMATCH');
    let weatherConfiguration: ReturnType<typeof parseWeatherConfiguration> | undefined;
    try { weatherConfiguration = parseWeatherConfiguration(e); } catch { fail('WEATHER_CONFIGURATION_INVALID'); }
    for (const r of [current,rollback]) if(r) {
        const w = r.weather;
        if(r===current && (weatherConfiguration?.providers || w) && (!w || w.providers.join(',')!==(weatherConfiguration?.providers??['met']).join(','))) missing('WEATHER_RELEASE_CONFIGURATION_MISMATCH');
        if(r===current && w && w.admittedProviders.slice().sort().join(',')!==(weatherConfiguration?.admitted??[]).slice().sort().join(',')) fail('WEATHER_RELEASE_ADMISSION_MISMATCH');
        if(w?.providers.some(id=>id!=='met')) {
            if(!e.NIGHTSKY_QUOTA_STATE_PATH) missing('WEATHER_QUOTA_CONFIGURATION_MISSING');
            if(c.budget?.processes!==1) fail('WEATHER_SINGLE_PROCESS_REQUIRED');
            if(!w.configurationEvidence||!w.policyEvidence||!w.budgetEvidence||w.providers.some(id=>id!=='met'&&!w.admittedProviders.includes(id))) missing('WEATHER_ADMISSION_EVIDENCE_MISSING');
        }
    }
    const geographyKinds = ['geonames', 'osm-single', 'osm-regional', 'global-catalogue'];
    for (const r of [current, rollback]) if (r) {
        const mode = r === current ? currentMode : r.discovery?.mode ?? 'legacy';
        const assigned = c.artifacts.filter(a => r.artifactIds.includes(a.id));
        if (r.profile === 'api-only-v1') {
            const localKinds = [...geographyKinds, 'climate-legacy', 'era5-release'];
            const localSettings = ['NIGHTSKY_GEONAMES_INDEX', ...pairs.flatMap(([path, digest]) => [path, digest]), 'NIGHTSKY_API_HISTORY_CACHE_DIRECTORY', 'NIGHTSKY_API_HISTORY_ADMISSION'] as const;
            if (mode !== 'api' || assigned.some(a => localKinds.includes(a.kind)) || (r === current && localSettings.some(key => e[key] !== undefined))) fail('API_ONLY_PROFILE_CONFLICT');
        }
        if (mode === 'api') {
            if (!e.NIGHTSKY_QUOTA_STATE_PATH) missing('API_QUOTA_CONFIGURATION_MISSING');
            const d = r.discovery;
            if (!d || d.providers.length < 1 || new Set(d.providers).size !== d.providers.length || !d.configurationEvidence || !d.policyEvidence || !d.budgetEvidence) missing('API_PROVIDER_EVIDENCE_MISSING');
            if (c.budget?.processes !== 1) fail('API_SINGLE_PROCESS_REQUIRED');
            if (assigned.some(a => geographyKinds.includes(a.kind))) fail('API_GEOGRAPHY_ARTIFACT_CONFLICT');
        } else if ((e.NIGHTSKY_MCP_TOOL_MODE ?? 'full') === 'full' && r === rollback) {
            const expected = mode === 'catalogue' ? ['global-catalogue'] : mode === 'regional' ? ['osm-regional'] : ['osm-single', 'osm-regional', 'global-catalogue'];
            if (!assigned.some(a => a.kind === 'geonames') || !assigned.some(a => expected.includes(a.kind))) missing('ROLLBACK_PRODUCT_INVENTORY_MISSING');
        }
        if ((e.NIGHTSKY_MCP_TOOL_MODE ?? 'full') === 'full' && r === rollback && r.profile !== 'api-only-v1' && !assigned.some(a => ['climate-legacy', 'era5-release'].includes(a.kind))) missing('ROLLBACK_PRODUCT_INVENTORY_MISSING');
    }
    if ((e.NIGHTSKY_MCP_TOOL_MODE ?? 'full') === 'full') {
        if ((currentMode === 'api' && current?.profile !== 'api-only-v1') || (rollback?.discovery?.mode === 'api' && rollback.profile !== 'api-only-v1')) missing('API_HISTORY_ROUTE_NOT_ADMITTED');
        const geographyMissing = currentMode !== 'api' && (!e.NIGHTSKY_GEONAMES_INDEX || !pairs.slice(0, 3).some(([k]) => e[k]));
        if (!e.MET_NORWAY_USER_AGENT || !e.MET_NORWAY_USER_AGENT.includes('nightsky.earth2026@gmail.com') || geographyMissing || (current?.profile !== 'api-only-v1' && !pairs.slice(3).some(([k]) => e[k]))) missing('FULL_MODE_INPUTS_MISSING');
    }
    const b = c.budget;
    if (!b)
        missing('RESOURCE_BUDGET_MISSING');
    else {
        if (!b.memoryBytes || !b.maxArtifactBytes || !b.capacityEvidence || !b.rollbackEvidence)
            missing('CAPACITY_EVIDENCE_MISSING');
        if(c.lineageValidation&&(b.scratchBytes<c.lineageValidation.budgets.maxScratchBytes*2||b.memoryBytes<c.lineageValidation.budgets.maxMemoryBytes))fail('LINEAGE_VALIDATION_BUDGET_UNRESERVED');
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
    if(!invalid&&b&&c.lineageValidation){try{await (await import('./operatorLineageClosure')).prepareLineageScratch(artifactRoot,c.lineageValidation);}catch{fail('LINEAGE_VALIDATION_SCRATCH_INVALID');}}
    if (!invalid && b) for (const r of [current, rollback]) if (r) { try { await validateOperatorReleaseClosure(artifactRoot, c.artifacts.filter(a => r.artifactIds.includes(a.id)), {maxTotalBytes:r===current?b.currentBytes:b.rollbackBytes,maxArtifactBytes:b.maxArtifactBytes,...(c.lineageValidation?{lineageValidation:{...c.lineageValidation,scratchDirectory:(await import('node:path')).join(c.lineageValidation.scratchDirectory,r===current?'current':'rollback')}}:{})}); } catch { fail('RELEASE_CLOSURE_INVALID'); } }
    findings.push('HOST_CHECKS_NOT_PERFORMED');
    return output();
}
