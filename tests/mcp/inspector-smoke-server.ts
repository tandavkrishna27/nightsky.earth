import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod4";

export function createSmokeServer(): McpServer {
  const server = new McpServer({ name: "nightsky-transport-smoke", version: "0.0.0" });
  server.registerTool(
    "echo",
    {
      description: "Return the supplied message for transport verification.",
      inputSchema: z.object({ message: z.string().min(1) }),
      outputSchema: z.object({ message: z.string() }),
    },
    async ({ message }) => ({
      content: [{ type: "text", text: message }],
      structuredContent: { message },
    }),
  );
  return server;
}

export function createMcpSmokeApp() {
  const app = createMcpExpressApp({ host: "0.0.0.0", allowedHosts: ["127.0.0.1"] });
  const mcpNodeHandler = toNodeHandler(createMcpHandler(() => createSmokeServer()));

  // The adapter installs express.json(); forwarding req.body avoids a second
  // read after the JSON middleware has consumed the request stream.
  app.all("/mcp", (req, res) => void mcpNodeHandler(req, res, req.body));
  app.get("/api/news", (_req, res) => res.json({ ok: true, source: "existing-site-route" }));
  return app;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4317);
  createMcpSmokeApp().listen(port, "127.0.0.1", () => {
    console.error(`NightSky MCP smoke server listening at http://127.0.0.1:${port}/mcp`);
  });
}
