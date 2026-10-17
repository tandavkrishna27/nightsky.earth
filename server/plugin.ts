/** Standalone assistant backend: no website, Vite or legacy news proxy. */
import express, { type ErrorRequestHandler } from "express";
import { createServer } from "node:http";
import { isIP } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mountHealthRoute, type HealthDependencies } from "./health";
import { mountMcpRoute, type McpRouteDependencies } from "./mcp/route";
import { requestLogging } from "./requestLogging";
import { configureMcpProxyTrust } from "./mcp/proxyTrust";
import { loadRegionalOsmProvider } from "./places/regionalOsm";
import { loadCatalogueFiles } from "./places/catalogueFiles";
import { createGlobalCatalogue } from "./places/globalCatalogue";
import { loadGeoNamesPlaceIndex } from "./places/geonames";
import { climateArtifactConfiguration } from "./providers/climate/configuration";
import { createApiServices } from "./places/api/configuration";
import { createPersistentQuota, type PersistentQuota } from "./providers/quotaState";
import { createConfiguredWeatherCollection, parseWeatherConfiguration, PROVIDER_QUOTA_POLICIES } from "./providers/weather/configuration";
const runtimeCleanup = new WeakMap<express.Express, () => Promise<void>>();
/** Call after closing the listener when embedding the configured app. */
export async function closeConfiguredNightSkyPluginApp(app: express.Express) { await runtimeCleanup.get(app)?.(); }
export interface PluginAppDependencies extends McpRouteDependencies {
    trustedProxyAddresses?: string;
    health?: HealthDependencies;
    log?: (line: string) => void;
}
export function pluginRegionalConfiguration(environment: { NIGHTSKY_OSM_REGIONAL_MANIFEST?: string; NIGHTSKY_OSM_REGIONAL_SHA256?: string; NIGHTSKY_OSM_CANDIDATE_INDEX?: string }): { path: string; expectedSha256: string } | undefined {
    const path = environment.NIGHTSKY_OSM_REGIONAL_MANIFEST;
    const expectedSha256 = environment.NIGHTSKY_OSM_REGIONAL_SHA256;
    if (path === undefined && expectedSha256 === undefined) return undefined;
    if (!path?.trim() || path.length > 4096 || /[\x00-\x1f\x7f]/.test(path) || !expectedSha256 || !/^[a-f0-9]{64}$/i.test(expectedSha256) || environment.NIGHTSKY_OSM_CANDIDATE_INDEX !== undefined) {
        throw Error("Invalid regional candidate configuration.");
    }
    return { path, expectedSha256: expectedSha256.toLowerCase() };
}
export function pluginGlobalConfiguration(environment: {NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST?: string; NIGHTSKY_GLOBAL_CATALOGUE_SHA256?: string; NIGHTSKY_OSM_REGIONAL_MANIFEST?: string; NIGHTSKY_OSM_REGIONAL_SHA256?: string; NIGHTSKY_OSM_CANDIDATE_INDEX?: string}): {path:string;expectedSha256:string}|undefined {
    const path=environment.NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST, expectedSha256=environment.NIGHTSKY_GLOBAL_CATALOGUE_SHA256;
    if(path===undefined&&expectedSha256===undefined) return undefined;
    if(!path?.trim()||path.length>4096||/[\x00-\x1f\x7f]/.test(path)||!expectedSha256||!/^[a-f0-9]{64}$/i.test(expectedSha256)||environment.NIGHTSKY_OSM_REGIONAL_MANIFEST!==undefined||environment.NIGHTSKY_OSM_REGIONAL_SHA256!==undefined||environment.NIGHTSKY_OSM_CANDIDATE_INDEX!==undefined) throw Error("Invalid global catalogue configuration.");
    return {path,expectedSha256:expectedSha256.toLowerCase()};
}
export function createNightSkyPluginApp(dependencies: PluginAppDependencies = {}) {
    if (dependencies.weatherProvider && dependencies.weatherCollection) throw Error("Conflicting weather provider configuration.");
    const app = express();
    app.disable("x-powered-by");
    configureMcpProxyTrust(app, dependencies.trustedProxyAddresses);
    app.use(requestLogging(dependencies.log ?? (line => console.log(line))));
    app.use(express.json({ limit: "32kb" }));
    mountHealthRoute(app, dependencies.health);
    mountMcpRoute(app, dependencies);
    app.use((_req, res) => res.status(404).json({ message: "Not found." }));
    const errors: ErrorRequestHandler = (error, _req, res, _next) => {
        const requested = error?.status ?? error?.statusCode;
        const status = Number.isInteger(requested) && requested >= 400 && requested <= 599 ? requested : 500;
        if (!res.headersSent)
            res.status(status).json({ message: status < 500 ? "Invalid request." : "Internal Server Error" });
    };
    app.use(errors);
    return app;
}
export function pluginListenerConfiguration(environment: {
    HOST?: string;
    PORT?: string;
}) {
    const host = environment.HOST ?? "127.0.0.1", rawPort = environment.PORT ?? "5000";
    const port = Number(rawPort);
    if (!/^\d+$/.test(rawPort) || !Number.isSafeInteger(port) || port < 1 || port > 65535 || host.length > 253 || (!isIP(host) && !/^[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?$/.test(host)))
        throw Error("Invalid plugin listener configuration.");
    return { host, port };
}
export function pluginToolMode(environment: { NIGHTSKY_MCP_TOOL_MODE?: string }): "full" | "resolver-only" {
    const mode = environment.NIGHTSKY_MCP_TOOL_MODE ?? "full";
    if (mode !== "full" && mode !== "resolver-only") throw Error("Invalid MCP tool mode.");
    return mode;
}
/** Explicit API mode rejects stale geography-file configuration rather than loading it. */
export function pluginDiscoveryMode(environment: Record<string, string | undefined>): "api" | "catalogue" | "regional" | "legacy" {
    const mode = environment.NIGHTSKY_DISCOVERY_MODE ?? "legacy";
    if (!["api", "catalogue", "regional", "legacy"].includes(mode)) throw Error("Invalid discovery mode.");
    if (mode === "api" && Object.keys(environment).some(key => /^(NIGHTSKY_GEONAMES_INDEX|NIGHTSKY_OSM_|NIGHTSKY_GLOBAL_CATALOGUE_)/.test(key) && environment[key] !== undefined)) throw Error("API discovery mode conflicts with local geography configuration.");
    if (mode === "catalogue" && !environment.NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST) throw Error("Catalogue discovery mode requires an explicit manifest.");
    if (mode === "regional" && !environment.NIGHTSKY_OSM_REGIONAL_MANIFEST) throw Error("Regional discovery mode requires an explicit manifest.");
    return mode as "api" | "catalogue" | "regional" | "legacy";
}
/** Shared production artifact loading; callers own listener lifecycle. */
export async function createConfiguredNightSkyPluginApp(overrides: Pick<PluginAppDependencies, "fetcher" | "log"> = {}) {
    climateArtifactConfiguration({NIGHTSKY_CLIMATE_ARTIFACT:process.env.NIGHTSKY_CLIMATE_ARTIFACT,NIGHTSKY_CLIMATE_SHA256:process.env.NIGHTSKY_CLIMATE_SHA256,NIGHTSKY_ERA5_RELEASE_MANIFEST:process.env.NIGHTSKY_ERA5_RELEASE_MANIFEST,NIGHTSKY_ERA5_RELEASE_SHA256:process.env.NIGHTSKY_ERA5_RELEASE_SHA256});
    const weatherConfig = parseWeatherConfiguration(process.env);
    let quota: PersistentQuota | undefined;
    try {
    if (weatherConfig.quotaPath) quota = await createPersistentQuota({path:weatherConfig.quotaPath, now:Date.now, policies:PROVIDER_QUOTA_POLICIES});
    const weatherCollection = createConfiguredWeatherCollection(process.env,{quota,fetcher:overrides.fetcher});
    const finish = (app: express.Express) => { let closing: Promise<void> | undefined; runtimeCleanup.set(app, () => closing ??= quota?.close() ?? Promise.resolve()); return app; };
    const allowedHosts = process.env.NIGHTSKY_MCP_ALLOWED_HOSTS?.split(",").map(value => value.trim()).filter(Boolean);
    const toolMode = pluginToolMode({ NIGHTSKY_MCP_TOOL_MODE: process.env.NIGHTSKY_MCP_TOOL_MODE });
    const discoveryMode = pluginDiscoveryMode(process.env);
    if (discoveryMode === "api") {
        const services = createApiServices({
            geonamesUsername: process.env.NIGHTSKY_GEONAMES_USERNAME,
            geoapifyApiKey: process.env.NIGHTSKY_GEOAPIFY_API_KEY,
            userAgent: process.env.NIGHTSKY_LOCATION_USER_AGENT ?? "NightSky.earth/1.0 (nightsky.earth2026@gmail.com)",
            fetcher: overrides.fetcher,
            quota: quota ?? { reserve: async () => ({allowed:false,reason:"quota-state-unavailable"}) },
        });
        return finish(createNightSkyPluginApp({ ...services, weatherCollection, allowedHosts: allowedHosts?.length ? allowedHosts : undefined, toolMode, trustedProxyAddresses: process.env.NIGHTSKY_MCP_TRUSTED_PROXIES, ...overrides }));
    }
    const global = pluginGlobalConfiguration({NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST:process.env.NIGHTSKY_GLOBAL_CATALOGUE_MANIFEST,NIGHTSKY_GLOBAL_CATALOGUE_SHA256:process.env.NIGHTSKY_GLOBAL_CATALOGUE_SHA256,NIGHTSKY_OSM_REGIONAL_MANIFEST:process.env.NIGHTSKY_OSM_REGIONAL_MANIFEST,NIGHTSKY_OSM_REGIONAL_SHA256:process.env.NIGHTSKY_OSM_REGIONAL_SHA256,NIGHTSKY_OSM_CANDIDATE_INDEX:process.env.NIGHTSKY_OSM_CANDIDATE_INDEX});
    const regional = pluginRegionalConfiguration({ NIGHTSKY_OSM_REGIONAL_MANIFEST: process.env.NIGHTSKY_OSM_REGIONAL_MANIFEST, NIGHTSKY_OSM_REGIONAL_SHA256: process.env.NIGHTSKY_OSM_REGIONAL_SHA256, NIGHTSKY_OSM_CANDIDATE_INDEX: process.env.NIGHTSKY_OSM_CANDIDATE_INDEX });
    const candidateProvider = regional && toolMode === "full" ? await loadRegionalOsmProvider(regional.path, { expectedSha256: regional.expectedSha256 }) : undefined;
    // Explicit pins are verified before the listener starts, including resolver-only rehearsals.
    const files = global ? await loadCatalogueFiles(global.path,{expectedSha256:global.expectedSha256}) : undefined;
    const placeIndex = files ? await loadGeoNamesPlaceIndex() : undefined;
    if(files && !placeIndex) throw Error("Global catalogue requires the local GeoNames place index.");
    const catalogue = files && placeIndex ? createGlobalCatalogue(files,{cities:placeIndex}) : undefined;
    return finish(createNightSkyPluginApp({ weatherCollection, catalogue, regionIndex:catalogue?.regions, placeIndex, allowedHosts: allowedHosts?.length ? allowedHosts : undefined, toolMode, candidateProvider, trustedProxyAddresses: process.env.NIGHTSKY_MCP_TRUSTED_PROXIES, ...overrides }));
    } catch (error) { await quota?.close(); throw error; }
}
export async function startNightSkyPlugin(options: { gracefulSignals?: boolean; shutdownTimeoutMs?: number } = {}) {
    const { host, port } = pluginListenerConfiguration({ HOST: process.env.HOST, PORT: process.env.PORT });
    const app = await createConfiguredNightSkyPluginApp();
    const server = createServer(app);
    server.once("close", () => { void closeConfiguredNightSkyPluginApp(app); });
    try { await new Promise<void>((done, reject) => { server.once("error", reject); server.listen(port, host, () => { server.off("error", reject); done(); }); }); }
    catch (error) { await closeConfiguredNightSkyPluginApp(app); throw error; }
    if (options.gracefulSignals) {
        let shuttingDown = false;
        const remove = () => { process.off("SIGTERM", shutdown); process.off("SIGINT", shutdown); };
        const shutdown = () => {
            if (shuttingDown) return;
            shuttingDown = true;
            // If draining cannot finish, leave ownership for conservative crash recovery.
            const timer = setTimeout(() => { console.error("NightSky plugin shutdown did not finish; retain quota state for recovery."); process.exit(1); }, options.shutdownTimeoutMs ?? 10_000);
            server.close(() => {
                void closeConfiguredNightSkyPluginApp(app).then(() => { clearTimeout(timer); remove(); }, () => { console.error("NightSky plugin quota cleanup failed; retain quota state for recovery."); process.exit(1); });
            });
        };
        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
        server.once("close", remove);
    }
    console.log("NightSky plugin listener ready.");
    return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    startNightSkyPlugin({gracefulSignals:true}).catch(() => { console.error("NightSky plugin startup failed. Check the configured listener, source mode and provider configuration."); process.exitCode = 1; });
}
