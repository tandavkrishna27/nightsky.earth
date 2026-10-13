import assert from "node:assert/strict";
import test from "node:test";
import { boundedToolRegistration, guardToolCallback } from "../../server/mcp/toolResults";
import { MAX_STRUCTURED_RESULT_BYTES } from "../../shared/nightsky/common";
import { once } from "node:events";
import { createServer } from "node:http";
import express from "express";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import * as z from "zod4";
test("tool result guard counts UTF-8 bytes and preserves callback arguments/context", async () => {
    const context = { mcpReq: { _meta: { "openai/subject": "request-only" } } };
    const callback = guardToolCallback(async (input: {
        value: string;
    }, ctx: typeof context) => {
        assert.equal(ctx, context);
        return { structuredContent: { value: input.value }, content: [] };
    });
    const below = await callback({ value: "valid" }, context);
    assert.deepEqual(below, { structuredContent: { value: "valid" }, content: [] });
    const overflow = await callback({ value: "🌙".repeat(MAX_STRUCTURED_RESULT_BYTES / 4) }, context);
    assert.equal(overflow.isError, true);
    assert.match(JSON.stringify(overflow), /Too much evidence/);
    assert.equal("structuredContent" in overflow, false);
    assert.deepEqual(await callback({ value: "recovered" }, context), { structuredContent: { value: "recovered" }, content: [] });
});
test("tool result guard returns safe errors without secrets, paths or stack", async () => {
    const callback = guardToolCallback(async () => { throw Error("/private/artifact.json token=secret-marker stack trace"); });
    const result = await callback();
    assert.equal(result.isError, true);
    assert.doesNotMatch(JSON.stringify(result), /private|secret-marker|stack trace/);
});
test("actual MCP registration rejects oversized evidence safely and recovers without losing metadata context", async () => {
    const app = express();
    app.use(express.json({ limit: "32kb" }));
    const handler = toNodeHandler(createMcpHandler(() => {
        const server = new McpServer({ name: "offline-result-budget", version: "1" }, { capabilities: { tools: {} } });
        boundedToolRegistration(server).registerTool("fixture", { inputSchema: z.strictObject({ huge: z.boolean(), fail: z.boolean().optional() }), outputSchema: z.strictObject({ value: z.string() }), annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false } }, async (input, context) => {
            assert.equal(context.mcpReq._meta?.["test/context"], "preserved");
            if (input.fail)
                throw Error("secret-marker /private/path");
            const structuredContent = { value: input.huge ? "x".repeat(MAX_STRUCTURED_RESULT_BYTES) : "recovered" };
            return { structuredContent, content: [{ type: "text", text: "fixture" }] };
        });
        return server;
    }));
    app.post("/mcp", (req, res) => { void handler(req, res, req.body); });
    const server = createServer(app).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    let id = 0;
    const call = async (args: {
        huge: boolean;
        fail?: boolean;
    }) => {
        const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name: "fixture", arguments: args, _meta: { "test/context": "preserved" } } }) });
        const body = await response.text();
        const data = body.split("\n").find(line => line.startsWith("data: "));
        return { body, result: JSON.parse(data ? data.slice(6) : body).result };
    };
    try {
        const huge = await call({ huge: true });
        assert.equal(huge.result.isError, true);
        assert.match(huge.body, /Too much evidence/);
        assert.equal(huge.result.structuredContent, undefined);
        const failed = await call({ huge: false, fail: true });
        assert.equal(failed.result.isError, true);
        assert.doesNotMatch(failed.body, /secret-marker|private\/path/);
        const recovered = await call({ huge: false });
        assert.equal(recovered.result.structuredContent.value, "recovered");
    }
    finally {
        server.closeAllConnections();
        await new Promise<void>(done => server.close(() => done()));
    }
});
