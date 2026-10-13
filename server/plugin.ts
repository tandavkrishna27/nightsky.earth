/** Standalone assistant backend: no website, Vite or legacy news proxy. */
import express, { type ErrorRequestHandler } from "express";
import { createServer } from "node:http";
import { isIP } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mountHealthRoute, type HealthDependencies } from "./health";
import { mountMcpRoute, type McpRouteDependencies } from "./mcp/route";
import { requestLogging } from "./requestLogging";
export interface PluginAppDependencies extends McpRouteDependencies {
    health?: HealthDependencies;
    log?: (line: string) => void;
}
export function createNightSkyPluginApp(dependencies: PluginAppDependencies = {}) {
    const app = express();
    app.disable("x-powered-by");
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
export async function startNightSkyPlugin() {
    const { host, port } = pluginListenerConfiguration({ HOST: process.env.HOST, PORT: process.env.PORT });
    const allowedHosts = process.env.NIGHTSKY_MCP_ALLOWED_HOSTS?.split(",").map(value => value.trim()).filter(Boolean);
    const app = createNightSkyPluginApp({ allowedHosts: allowedHosts?.length ? allowedHosts : undefined });
    const server = createServer(app);
    await new Promise<void>((done, reject) => { server.once("error", reject); server.listen(port, host, () => { server.off("error", reject); done(); }); });
    console.log("NightSky plugin listener ready.");
    return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    startNightSkyPlugin().catch(() => { console.error("NightSky plugin startup failed. Check the configured listener and local artifacts."); process.exitCode = 1; });
}
