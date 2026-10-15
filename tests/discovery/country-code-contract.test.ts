import assert from "node:assert/strict";
import test from "node:test";
import * as z from "zod4";
import express from "express";
import { once } from "node:events";
import { createServer } from "node:http";
import { mountMcpRoute } from "../../server/mcp/route";
import {
  getObservingLocationDetailsInputSchema,
  resolveObservingRegionInputSchema,
} from "../../shared/nightsky/discovery";

const cases = [
  { name: "location details", schema: getObservingLocationDetailsInputSchema, query: { placeQuery: "Fiction Park" } },
  { name: "region resolution", schema: resolveObservingRegionInputSchema, query: { regionQuery: "United Kingdom" } },
];

for (const { name, schema, query } of cases) {
  test(`${name} advertises the uppercase ISO3 country filter to tool callers`, () => {
    const json = z.toJSONSchema(schema);
    const country = json.properties!.countryCode as { pattern?: string; description?: string };
    assert.equal(country.pattern, "^[A-Z]{3}$");
    assert.match(country.description ?? "", /uppercase.*ISO3/);
    assert.match(country.description ?? "", /GBR/);
    assert.match(country.description ?? "", /IND/);
    assert.match(country.description ?? "", /USA/);
  });

  test(`${name} preserves ISO3 validation and optional filters`, () => {
    assert.equal(schema.safeParse(query).success, true);
    for (const countryCode of ["GBR", "IND", "USA"]) {
      assert.equal(schema.parse({ ...query, countryCode }).countryCode, countryCode);
    }
    for (const countryCode of ["GB", "IN", "US", "gbr", "Gbr", " GBR", "GBR ", "GBRR", "G1R", ""]) {
      const result = schema.safeParse({ ...query, countryCode });
      assert.equal(result.success, false, countryCode);
      if (!result.success) {
        const issue = result.error.issues.find(issue => issue.path[0] === "countryCode");
        assert.ok(issue);
        assert.match(issue.message, /uppercase ISO3 country code/);
      }
    }
  });
}

test("tools/list publishes ISO3 guidance for both discovery country filters", async () => {
  const app = express();
  app.use(express.json());
  mountMcpRoute(app, { allowedHosts: ["127.0.0.1"] });
  const server = createServer(app).listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    assert.equal(response.status, 200);
    const body = await response.text();
    const event = body.split("\n").find(line => line.startsWith("data: "));
    const payload = JSON.parse(event ? event.slice(6) : body);
    assert.equal(payload.error, undefined);
    for (const name of ["get_observing_location_details", "resolve_observing_region"]) {
      const tool = payload.result.tools.find((tool: { name: string }) => tool.name === name);
      assert.ok(tool, name);
      assert.equal(tool.inputSchema.properties.countryCode.pattern, "^[A-Z]{3}$");
      assert.match(tool.inputSchema.properties.countryCode.description, /uppercase.*ISO3.*GBR.*IND.*USA/);
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
