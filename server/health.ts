import type { Express } from "express";

export type HealthComponent = "placeIndex" | "candidateIndex" | "lightPollution";
export type HealthState = "ready" | "unavailable";
export interface HealthDependencies {
  /** Local, synchronous readiness only. Never contact upstream providers from a health probe. */
  checks?: Partial<Record<HealthComponent, () => HealthState>>;
}

/** A liveness probe by default; configured local checks make this a readiness probe. */
export function mountHealthRoute(app: Express, dependencies: HealthDependencies = {}): void {
  const startedAt = Date.now();
  app.get("/health", (_req, res) => {
    const components: Partial<Record<HealthComponent, HealthState>> = {};
    for (const name of ["placeIndex", "candidateIndex", "lightPollution"] as const) {
      const check = dependencies.checks?.[name];
      if (!check) continue;
      try { components[name] = check() === "ready" ? "ready" : "unavailable"; }
      catch { components[name] = "unavailable"; }
    }
    const ready = Object.values(components).every((state) => state === "ready");
    res.set("Cache-Control", "no-store").status(ready ? 200 : 503).json({
      service: "nightsky", status: ready ? "ok" : "unavailable",
      probe: Object.keys(components).length ? "readiness" : "liveness",
      uptimeSeconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)), components,
    });
  });
}
