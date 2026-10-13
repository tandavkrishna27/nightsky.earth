import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { createServer } from 'node:http';
import express from 'express';
import { mountMcpRoute } from '../server/mcp/route';
import { GeoNamesPlaceIndex, loadGeoNamesPlaceIndex } from '../server/places/geonames';

const script = fileURLToPath(import.meta.url);
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const index = new GeoNamesPlaceIndex([
  [1266425, 'Kodaikanal', 'Kodaikanal', '', 10.239, 77.49, 'IN', 'India', 36501, 'Asia/Kolkata'],
  [1262463, 'Munnar', 'Munnar', '', 10.088, 77.062, 'IN', 'India', 10000, 'Asia/Kolkata'],
  [1270426, 'Hanle', 'Hanle', '', 32.78, 78.96, 'IN', 'India', 1000, 'Asia/Kolkata'],
], 'rollback named-place fixture');

async function worker(kind: string) {
  const app = express(); app.use(express.json({ limit: '32kb' }));
  const placeIndex = kind === 'climate' ? await loadGeoNamesPlaceIndex() : index;
  assert.ok(placeIndex, 'Reviewed installed GeoNames index required for climate vintage matching.');
  mountMcpRoute(app, { placeIndex, fetcher: async () => { throw Error('External request forbidden.'); } });
  const server = createServer(app).listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-11-25' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: {
        name: kind === 'candidate' ? 'search_observing_locations' : 'get_clear_sky_climatology',
        arguments: { placeId: 'place:v1:geonames:1266425', ...(kind === 'climate' ? { month: 1 } : {}) },
      } }), signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200);
    const body = await response.text(); const event = body.split('\n').find(line => line.startsWith('data: '));
    const payload = JSON.parse(event ? event.slice(6) : body); assert.equal(payload.error, undefined);
    // A failure must never expose the serving artifact path or numeric climate statistics.
    for (const key of ['NIGHTSKY_OSM_CANDIDATE_INDEX', 'NIGHTSKY_CLIMATE_ARTIFACT']) {
      if (process.env[key]) assert.equal(body.includes(process.env[key]!), false);
    }
    console.log(JSON.stringify(payload.result));
  } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
}

async function verify() {
  const value = (flag: string) => { const position = process.argv.indexOf(flag); return position < 0 ? undefined : process.argv[position + 1]; };
  const sources = [
    { kind: 'candidate', path: resolve(value('--candidate') ?? 'tests/osm/fixtures/real-three-boxes/candidates.json'), sha256: value('--candidate-sha256') ?? '7d07f347d8e5dfff06cdfc59a72e262b61760528bd5cac14b091f75e26f23755' },
    { kind: 'climate', path: resolve(value('--climate') ?? '.data/era5/tiles-2025-v3/manifest.json'), sha256: value('--climate-sha256') ?? '9ffc58e9033984b235241525471d4e5b6571a6f1640147502b57d014c31181e8' },
  ];
  const directory = await mkdtemp(join(tmpdir(), 'nightsky-offline-rollback-'));
  try {
    const evidence = [];
    for (const source of sources) {
      assert.match(source.sha256, /^[a-f0-9]{64}$/);
      const bytes = await readFile(source.path); assert.equal(hash(bytes), source.sha256, 'Trusted source digest mismatch.');
      const corrupt = join(directory, `${source.kind}-corrupt.json`); await writeFile(corrupt, Buffer.concat([bytes, Buffer.from('\n')]));
      const run = async (path: string) => {
        const env = { ...process.env, NIGHTSKY_OSM_CANDIDATE_INDEX: '', NIGHTSKY_CLIMATE_ARTIFACT: '', NIGHTSKY_MCP_ALLOWED_HOSTS: '127.0.0.1' };
        Object.assign(env, source.kind === 'candidate' ? { NIGHTSKY_OSM_CANDIDATE_INDEX: path, NIGHTSKY_OSM_CANDIDATE_SHA256: source.sha256, NIGHTSKY_OSM_CANDIDATE_MAX_BYTES: '2097152' } : { NIGHTSKY_CLIMATE_ARTIFACT: path, NIGHTSKY_CLIMATE_SHA256: source.sha256 });
        const { stdout } = await promisify(execFile)(process.execPath, ['--import', 'tsx', script, '--worker', source.kind], { env, timeout: 20000, maxBuffer: 1024 * 1024 });
        return JSON.parse(stdout.trim());
      };
      const previous = await run(source.path); const rejected = await run(corrupt); const restored = await run(source.path);
      assert.deepEqual(restored, previous);
      if (source.kind === 'candidate') { assert.ok(previous.structuredContent.candidates.length > 0); assert.equal(rejected.isError, true); assert.equal(rejected.structuredContent, undefined); }
      else { assert.equal(previous.structuredContent.availability.status, 'partial'); assert.equal(previous.structuredContent.summary.validEligibleSamples, 294); assert.equal(rejected.structuredContent.availability.status, 'unavailable'); assert.equal(rejected.structuredContent.summary, undefined); }
      assert.equal(hash(await readFile(source.path)), source.sha256);
      evidence.push({ kind: source.kind, sha256: source.sha256, freshProcesses: 3, previous: 'accepted', corrupt: 'rejected', restored: 'identical', sourceUnchanged: true });
    }
    console.log(JSON.stringify({ scope: 'offline real-source rollback rehearsal; no host promotion', evidence }, null, 2));
  } finally { assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep)); await rm(directory, { recursive: true, force: true }); }
}
if (process.argv[1] && resolve(process.argv[1]) === script) {
  const position = process.argv.indexOf('--worker');
  if (position >= 0) await worker(process.argv[position + 1]); else await verify();
}
