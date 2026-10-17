import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRoute } from '../../server/providers/publicUniverse/transport';
import { parseCloseApproaches } from '../../server/providers/publicUniverse/contracts';

test('inclusive close-approach dates include timestamps through the final day under upstream text filtering', () => {
  const route = buildRoute({ kind: 'close-approaches', id: 'synthetic', from: '2029-04-01', to: '2029-04-30', limit: 10 });
  // Pinned data_access.py filters cd_iso >= date_min and cd_iso <= date_max.
  const sourceRows = ['2029-04-01T00:00:00', '2029-04-30T23:59:59.999999', '2029-05-01T00:00:00'];
  const selected = sourceRows.filter(at => at >= route.query.get('from')! && at <= route.query.get('to')!);
  assert.deepEqual(selected, sourceRows.slice(0, 2));
  const result = parseCloseApproaches({ object: 'synthetic', results: selected.map(cd_iso => ({ body: 'Earth', cd_jd: 2462259, cd_iso, source: 'Synthetic' })) }, 'synthetic', '2029-04-01', '2029-04-30');
  assert.equal(result.results.length, 2);
});
