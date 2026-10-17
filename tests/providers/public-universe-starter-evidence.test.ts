import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicUniverseProvider } from '../../server/providers/publicUniverse';
import { syntheticSource } from '../fixtures/public-universe/synthetic';

test('starter search and details retain the frame, epoch and motion context of catalogue coordinates', async () => {
  const astrometry = { status: 'supported', frame: 'FK5', equinox: 'J2000.0', reference_epoch_jyear: 2000,
    observation_epoch_jyear: 2000, motion_model: 'linear_angular_proper_motion',
    pm_ra_cosdec_arcsec_per_year: -0.5, pm_dec_arcsec_per_year: -1.2 };
  // SYNTHETIC identity and values, not measured or computed observing evidence.
  const row = { id: 'bsc5p:hr2491', name: 'Synthetic bright star', source: 'bsc5p', aliases: [],
    families: ['bright_star'], object_type: 'star', ra_deg: 101.2, dec_deg: -16.7, astrometry };
  const provider = createPublicUniverseProvider({ admitted: true, quotaOwner: 'synthetic',
    quota: { reserve: async () => ({ allowed: true, reason: 'synthetic' }), setProviderState: async () => {} },
    fetcher: async url => new Response(JSON.stringify(new URL(String(url)).searchParams.has('q')
      ? { available: true, results: [row], total: 1, limit: 10, offset: 0, sources: { bsc5p: syntheticSource }, coverage: 'Synthetic sample' }
      : { ...row, provenance: syntheticSource })),
  });
  try {
    const search = await provider.searchReferenceObjects({ domain: 'starter-targets', query: 'Synthetic' });
    assert.equal(search.status, 'available');
    assert.deepEqual(search.data?.matches[0].astrometry, astrometry);
    const details = await provider.getReferenceDetails({ kind: 'selected-object', ...search.data!.matches[0].selection!, sections: [] });
    assert.equal(details.status, 'available');
    assert.deepEqual(details.data?.record?.astrometry, astrometry);
    assert.equal(details.data?.record?.measurements.find(value => value.name === 'right-ascension')?.value, 101.2);
  } finally { await provider.close(); }
});
