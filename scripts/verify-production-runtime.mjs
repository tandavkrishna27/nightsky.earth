import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const probe = createServer().listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const child = spawn(process.execPath, ["dist/index.js"], { env: { ...process.env, NODE_ENV: "production", PORT: String(port), NIGHTSKY_MCP_ALLOWED_HOSTS: "127.0.0.1" }, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => { output = (output + chunk.toString()).slice(-4096); });
const base = `http://127.0.0.1:${port}`;
try {
  let health;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Built service exited during startup: ${output}`);
    try { health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) }); if (health.ok) break; } catch { /* startup is bounded below */ }
    await delay(100);
  }
  assert.ok(health?.ok, `Built service did not become live: ${output}`);
  const status = await health.json();
  assert.equal(status.service, "nightsky");
  assert.equal(status.status, "ok");
  assert.equal(status.probe, "liveness");
  assert.deepEqual(Object.keys(status).sort(), ["components", "probe", "service", "status", "uptimeSeconds"]);
  const call = async (id, method, params) => {
    const response = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id, method, params }), signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    const body = await response.text();
    const data = body.split("\n").find((line) => line.startsWith("data: "));
    const rpc = JSON.parse(data ? data.slice(6) : body);
    assert.equal(rpc.error, undefined);
    return rpc.result;
  };
  const initialized = await call(1, "initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "production-runtime-check", version: "1" } });
  assert.equal(initialized.serverInfo.name, "nightsky-earth");
  const listed = await call(2, "tools/list", {});
  for (const name of ["resolve_place", "get_clear_sky_climatology", "plan_observing_session", "compare_observing_options", "recommend_specialist_tools"]) assert.ok(listed.tools.some((tool) => tool.name === name));
  const suggested = await call(3, "tools/call", { name: "recommend_specialist_tools", arguments: { activity: "general-stargazing" } });
  assert.equal(suggested.isError, undefined);
  assert.ok(suggested.structuredContent.recommendations.length > 0);
  console.log(`Production runtime verified: health, MCP initialization, ${listed.tools.length} tools, and structured recommendations; no upstream provider calls.`);
} finally {
  if (child.exitCode === null) {
    const exited = once(child, "exit");
    child.kill();
    await Promise.race([exited, delay(3000)]);
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
}
