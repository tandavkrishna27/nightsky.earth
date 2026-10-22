import { climateArtifactConfiguration, selectConfiguredClimateProvider } from "../providers/climate/configuration";
import { loadGeoNamesPlaceIndex } from "../places/geonames";
import type { Express, RequestHandler } from "express";
import { hostHeaderValidation } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { createNightSkyMcpServer } from "./index";
import type { NightSkyDependencies } from "./registerTools";
import { SubjectRateLimiter } from "./metadata";
import { validateMcpForwardedClient } from "./proxyTrust";
import { loadOsmCandidateIndex } from "../places/osmCandidates";
import { mcpRequestDiagnostics, type McpDiagnosticSink } from "./requestDiagnostics";

export interface McpRouteDependencies extends NightSkyDependencies {
  /** Host names only, without ports. Keep loopback-only until a reviewed host is selected. */
  allowedHosts?: string[];
  maxRequestsPerWindow?: number;
  /** Per-IP budget for all MCP traffic except individual tools/call requests. */
  maxProtocolRequestsPerWindow?: number;
  onMcpDiagnostic?: McpDiagnosticSink;
  rateWindowMs?: number;
  maxConcurrentRequests?: number;
  /** Shared across clients, including hosts with multiple egress IPs. */
  maxGlobalRequestsPerWindow?: number;
  maxRateLimitKeys?: number;
  /** Supplemental untrusted assistant subject budget; IP/global limits remain. */
  maxSubjectRequestsPerWindow?: number;
}

export function mountMcpRoute(app: Express, dependencies: McpRouteDependencies = {}): void {
  // Successful indexes live for this route. Missing/failed reads can recover,
  // while all callers of an in-flight read share the same bounded artifact.
  const configuredLoader = dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex;
  let sharedIndexPromise: ReturnType<typeof loadGeoNamesPlaceIndex> | undefined;
  const placeIndexLoader = () => {
    if (dependencies.placeIndex) return Promise.resolve(dependencies.placeIndex);
    if (!sharedIndexPromise) {
      const pending = Promise.resolve().then(() => configuredLoader());
      sharedIndexPromise = pending;
      void pending.then(index => {
        if (!index && sharedIndexPromise === pending) sharedIndexPromise = undefined;
      }, () => {
        if (sharedIndexPromise === pending) sharedIndexPromise = undefined;
      });
    }
    return sharedIndexPromise;
  };
  dependencies = { ...dependencies, placeIndexLoader };
  const osmPath = process.env.NIGHTSKY_OSM_CANDIDATE_INDEX ?? ".data/osm/candidates.json";
  const osmSha256 = process.env.NIGHTSKY_OSM_CANDIDATE_SHA256;
  const osmMaxBytesValue = process.env.NIGHTSKY_OSM_CANDIDATE_MAX_BYTES;
  const osmMaxBytes = osmMaxBytesValue === undefined ? undefined : Number(osmMaxBytesValue);
  const configuredOsmLoader = dependencies.osmCandidateIndexLoader ?? (() => loadOsmCandidateIndex(osmPath, {expectedSha256:osmSha256,maxArtifactBytes:osmMaxBytes}));
  let sharedOsmPromise: ReturnType<typeof loadOsmCandidateIndex> | undefined;
  const osmCandidateIndexLoader = () => {
    if (dependencies.osmCandidateIndex) return Promise.resolve(dependencies.osmCandidateIndex);
    if (!sharedOsmPromise) {
      const pending = Promise.resolve().then(() => configuredOsmLoader());
      sharedOsmPromise = pending;
      void pending.then(index => {
        if (!index && sharedOsmPromise === pending) sharedOsmPromise = undefined;
      }, () => {
        if (sharedOsmPromise === pending) sharedOsmPromise = undefined;
      });
    }
    return sharedOsmPromise;
  };
  dependencies = { ...dependencies, osmCandidateIndexLoader };
  // Keep one reader and its bounded artifact cache across stateless MCP servers.
  if (!dependencies.discoveryProvider && !dependencies.climateProvider && !dependencies.plannerServices?.getClimatology) {
    const environment = {NIGHTSKY_CLIMATE_ARTIFACT:process.env.NIGHTSKY_CLIMATE_ARTIFACT,NIGHTSKY_CLIMATE_SHA256:process.env.NIGHTSKY_CLIMATE_SHA256,NIGHTSKY_ERA5_RELEASE_MANIFEST:process.env.NIGHTSKY_ERA5_RELEASE_MANIFEST,NIGHTSKY_ERA5_RELEASE_SHA256:process.env.NIGHTSKY_ERA5_RELEASE_SHA256};
    climateArtifactConfiguration(environment);
    let providerPromise: Promise<NonNullable<NightSkyDependencies["climateProvider"]>> | undefined;
    const configured = dependencies;
    dependencies = { ...dependencies, climateProvider: { getClimatology: async (placeId, month) => {
      const provider = await (providerPromise ??= (async () => {
        const index = configured.placeIndex ?? await placeIndexLoader();
        if (!index) throw new Error("The local GeoNames place index is unavailable.");
        return selectConfiguredClimateProvider(index, environment);
      })().catch(error => { providerPromise = undefined; throw error; }));
      return provider.getClimatology(placeId, month);
    } } };
  }
  const allowedHosts = dependencies.allowedHosts ?? ["127.0.0.1", "localhost", "[::1]"];
  const rateWindowMs = dependencies.rateWindowMs ?? dependencies.rateLimit?.windowMs ?? 60_000;
  const maxRequests = dependencies.maxRequestsPerWindow ?? dependencies.rateLimit?.maxRequests ?? 60;
  const maxProtocolRequests = dependencies.maxProtocolRequestsPerWindow ?? 120;
  const maxConcurrent = dependencies.maxConcurrentRequests ?? 20;
  const maxGlobalRequests = dependencies.maxGlobalRequestsPerWindow ?? 600;
  const maxRateLimitKeys = dependencies.maxRateLimitKeys ?? 10_000;
  const subjectLimiter = new SubjectRateLimiter({ maxRequests: dependencies.maxSubjectRequestsPerWindow, maxKeys: maxRateLimitKeys, windowMs: rateWindowMs });
  for (const value of [rateWindowMs, maxRequests, maxProtocolRequests, maxConcurrent, maxGlobalRequests, maxRateLimitKeys]) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError("MCP limits must be positive safe integers.");
  }
  let globalCounter = { count: 0, resetAt: 0 };
  let activeRequests = 0;
  const counters = new Map<string, { toolCount: number; protocolCount: number; resetAt: number }>();
  const validateHost = hostHeaderValidation(allowedHosts);
  const diagnostics = mcpRequestDiagnostics(dependencies.onMcpDiagnostic);


  const controls: RequestHandler[] = [
    diagnostics.middleware,
    diagnostics.gate(validateHost, 'host-rejected'),
    diagnostics.gate(validateMcpForwardedClient, 'proxy-rejected'),
    (req, res, next) => {
      if (activeRequests >= maxConcurrent) {
        diagnostics.reason(res, 'concurrency-limit');
        res.status(503).json({ jsonrpc: "2.0", error: { code: -32000, message: "NightSky is busy. Try again shortly." }, id: null });
        return;
      }
      const now = Date.now();
      if (globalCounter.resetAt <= now) globalCounter = { count: 0, resetAt: now + rateWindowMs };
      if (globalCounter.count >= maxGlobalRequests) {
        diagnostics.reason(res, 'global-limit');
        res.set("Retry-After", String(Math.max(1, Math.ceil((globalCounter.resetAt - now) / 1000))));
        res.status(429).json({ jsonrpc: "2.0", error: { code: -32000, message: "Request limit reached. Try again shortly." }, id: null });
        return;
      }
      const key = req.ip || "unknown";
      let counter = counters.get(key);
      if (!counter || counter.resetAt <= now) {
        if (!counter && counters.size >= maxRateLimitKeys) {
          counters.forEach((entry, entryKey) => { if (entry.resetAt <= now) counters.delete(entryKey); });
          if (counters.size >= maxRateLimitKeys) {
            diagnostics.reason(res, 'key-limit');
            res.set("Retry-After", String(Math.max(1, Math.ceil(rateWindowMs / 1000))));
            res.status(429).json({ jsonrpc: "2.0", error: { code: -32000, message: "Request limit reached. Try again shortly." }, id: null });
            return;
          }
        }
        counter = { toolCount: 0, protocolCount: 0, resetAt: now + rateWindowMs };
        counters.set(key, counter);
      }
      // Batches belong to the protocol bucket and are rejected before dispatch.
      const isToolCall = !Array.isArray(req.body) && req.body?.method === "tools/call";
      if (isToolCall ? counter.toolCount >= maxRequests : counter.protocolCount >= maxProtocolRequests) {
        diagnostics.reason(res, isToolCall ? 'tool-limit' : 'protocol-limit');
        res.set("Retry-After", String(Math.max(1, Math.ceil((counter.resetAt - now) / 1000))));
        res.status(429).json({ jsonrpc: "2.0", error: { code: -32000, message: "Request limit reached. Try again shortly." }, id: null });
        return;
      }
      if (isToolCall) {
        const admission = subjectLimiter.admit(req.body?.params?._meta, now);
        if (!admission.allowed) {
          diagnostics.reason(res, 'subject-limit');
          res.set("Retry-After", String(admission.retryAfterSeconds ?? 1));
          res.status(429).json({ jsonrpc: "2.0", error: { code: -32000, message: "Request limit reached. Try again shortly." }, id: null });
          return;
        }
      }
      if (isToolCall) counter.toolCount += 1;
      else counter.protocolCount += 1;
      globalCounter.count += 1;
      if (Array.isArray(req.body)) {
        res.status(400).json({ jsonrpc: "2.0", error: { code: -32600, message: "Batch requests are not supported." }, id: null });
        return;
      }
      activeRequests += 1;
      next();
    },
  ];

  app.all("/mcp", ...controls, (req, res) => {
    // Transport completion can precede abort-ignoring tool work settlement.
    // Keep its admission until both finish, including after client disconnect.
    let transportDone = false, pendingWork = 0, released = false;
    const releaseAdmission = () => {
      if (transportDone && pendingWork === 0 && !released) {
        released = true; activeRequests = Math.max(0, activeRequests - 1);
      }
    };
    const retainToolWork = () => {
      if (released) throw new Error("Request work already closed.");
      pendingWork++; let done = false;
      return () => { if (!done) { done = true; pendingWork--; releaseAdmission(); } };
    };
    // An explicit text presentation lets hosts that cannot display MCP Apps
    // use the complete text result. The planner also excludes OpenWeather
    // when the card is off, preserving its linked-logo display requirement.
    const requestDependencies = req.query.presentation === 'text'
      ? { ...dependencies, resultCardPrototype: false }
      : dependencies;
    const mcpHandler = toNodeHandler(createMcpHandler(() => createNightSkyMcpServer(requestDependencies, retainToolWork)));
    void Promise.resolve().then(() => mcpHandler(req, res, req.body))
      .catch(() => {
        diagnostics.reason(res, 'handler-failure');
        if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "NightSky could not complete the request." }, id: null });
      })
      .finally(() => { transportDone = true; releaseAdmission(); });
  });
}
