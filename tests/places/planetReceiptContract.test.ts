import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {PLANET_SOURCE} from '../../scripts/osm/planet-policy-preparation';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('offline receipt and operator-policy preparation bind the same retained dated planet', () => {
  // A socket trap makes accidental acquisition in the default CLI a failing test.
  const probe = `import socket, runpy, sys\nsys.path.insert(0, 'scripts/osm')\ndef refused(*args, **kwargs): raise AssertionError('offline CLI opened network')\nsocket.create_connection=refused\nsocket.getaddrinfo=refused\nrunpy.run_path('scripts/osm/planet_receipt.py',run_name='__main__')`;
  const result = spawnSync('python', ['-c', probe], {cwd: root, encoding: 'utf8', timeout: 15000, maxBuffer: 256 * 1024});
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.mode, 'offline-preflight');
  for (const key of ['url', 'edition', 'bytes', 'versionId', 'etag', 'md5', 'lastModified'] as const) {
    assert.equal(receipt.source[key], PLANET_SOURCE[key], `Receipt/policy identity drift: ${key}`);
  }
  const evidence = JSON.parse(readFileSync(new URL('../../docs/operations/data-pilot-evidence/planet-identity-capacity-s3-20261016.json', import.meta.url), 'utf8'));
  const head = evidence.responses.find((row: {method: string}) => row.method === 'HEAD');
  const checksum = evidence.responses.find((row: {method: string}) => row.method === 'GET');
  assert.equal(head.url, PLANET_SOURCE.url);
  assert.ok(head.headers.includes(`Content-Length: ${PLANET_SOURCE.bytes}\r\n`));
  assert.ok(head.headers.includes(`ETag: ${PLANET_SOURCE.etag}\r\n`));
  assert.ok(head.headers.includes(`x-amz-version-id: ${PLANET_SOURCE.versionId}\r\n`));
  const lastModified = head.headers.match(/(?:^|\r\n)Last-Modified: ([^\r\n]+)\r\n/);
  assert.ok(lastModified);
  assert.equal(new Date(lastModified[1]).toISOString(), PLANET_SOURCE.lastModified.replace('Z', '.000Z'));
  assert.equal(checksum.body, `${PLANET_SOURCE.md5}  ${PLANET_SOURCE.edition}\n`);
});
