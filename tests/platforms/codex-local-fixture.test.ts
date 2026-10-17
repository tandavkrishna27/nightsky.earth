import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { createFixtureServer } from '../../scripts/complete-model-journey-test';

test('fixture binds requested loopback port for repeatable package connection', async()=>{
 const probe=createServer().listen(0,'127.0.0.1'); await once(probe,'listening');
 const port=(probe.address() as {port:number}).port; await new Promise<void>(r=>probe.close(()=>r()));
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'ns-port-')),{mode:'api',port});
 try { assert.equal(server.endpoint,`http://127.0.0.1:${port}/mcp`); } finally {await server.close();}
});
test('preparation binds complete package to verified offline endpoint then closes it', async()=>{
 assert.ok(existsSync('scripts/prepare-codex-local-fixture.ts'),'prepare entrypoint exists');
 const {prepareCodexLocalFixture}=await import('../../scripts/prepare-codex-local-fixture');
 const root=mkdtempSync(join(tmpdir(),'ns-prepare-'));
 const report=await prepareCodexLocalFixture(root,0);
 assert.equal(report.toolNames.length,14); assert.equal(report.skillNames.length,5);
 assert.equal(report.externalAttempts,0); assert.equal(report.hostInstallationVerified,false);
 const config=JSON.parse(readFileSync(join(root,'plugin','mcp.json'),'utf8'));
 assert.equal(config.mcpServers.nightsky.url,report.endpoint);
 await assert.rejects(fetch(report.endpoint));
});
