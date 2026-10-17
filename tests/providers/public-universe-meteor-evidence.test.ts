import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicUniverseProvider } from '../../server/providers/publicUniverse';

test('source-shaped meteor rows retain nullable orbital and radiant evidence through final normalization', async () => {
  // SYNTHETIC row with the named columns emitted by pinned SELECT *; not live data.
  const parameterSet = {
    iau_no: 4, ad_no: 1, code: 'GEM', name: 'Synthetic Geminids', source: 'Synthetic',
    dra_deg_per_day: null, ddec_deg_per_day: 0.2, a_au: null, q_au: 0.14,
    e: null, peri_deg: null, node_deg: null, incl_deg: null, n_members: null,
    shower_group: null, technique: null,
  };
  const provider = createPublicUniverseProvider({ admitted: true, quotaOwner: 'synthetic',
    quota: { reserve: async () => ({ allowed: true, reason: 'synthetic' }), setProviderState: async () => {} },
    fetcher: async () => new Response(JSON.stringify({ iau_no: 4, code: 'GEM', name: 'Synthetic Geminids', status_label: null, parameter_sets: [parameterSet], parent: null })),
  });
  try {
    const result = await provider.getReferenceDetails({ kind: 'meteor-shower', code: 'GEM' });
    assert.equal(result.status, 'available', JSON.stringify(result));
    assert.deepEqual(result.data?.meteor?.parameter_sets[0], parameterSet);
  } finally { await provider.close(); }
});
