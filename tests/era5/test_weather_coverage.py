import copy
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'era5'))
import global_acquisition as g
import weather_coverage as w


def fixture():
    cells = ['era5:0:0', 'era5:0:0.25', 'era5:0.25:0', 'era5:0.25:0.25']
    template = dict(year=['1991'], month=['01'], day=['01', '02'], time=['00:00', '01:00'])
    tile = dict(tileId='a', area=[.25, 0, 0, .25], expectedCells=cells,
                requiredCells=cells[:2], fillerCells=cells[2:], overrides=[])
    request = dict(product_type=['reanalysis'], variable=['total_cloud_cover'],
                   data_format='netcdf', download_format='unarchived', area=tile['area'],
                   **dict(template, day=['02']))
    ident = dict(dataset='reanalysis-era5-single-levels', revision='0001', member=0, request=request)
    row = dict(ident, sha256=g.identity(ident), tileId='a', expectedCells=cells,
               requiredCells=cells[:2], fillerCells=cells[2:], expectedHours=2,
               scalarCellHours=8, partitions=[dict(year='1991', month='01', expectedHours=2)])
    sources = dict(frozenPlan=dict(tiles=[tile], calendarTemplates=[template]),
                   reconciliation=dict(frozenPlanSha256='a'*64, cells=[], updatedOverrides=[], blockedTiles=[]))
    return row, sources, {'frozenPlan': 'a'*64, 'reconciliation': 'b'*64}


def retain_first_day(sources):
    tile = sources['frozenPlan']['tiles'][0]
    sources['reconciliation']['cells'] = [dict(cellId=cell, tileId='a',
        ownership='required' if cell in tile['requiredCells'] else 'filler',
        hoursUtc=['1991-01-01T00:00:00Z', '1991-01-01T01:00:00Z']) for cell in tile['expectedCells']]
    sources['reconciliation']['updatedOverrides'] = [dict(tileId='a', overrides=[dict(template=0, shapes=[dict(days=['02'], time=['00:00', '01:00'])])])]


class WeatherCoverageTests(unittest.TestCase):
    def test_last_owner_deadline_expiry_cannot_return_success(self):
        row, sources, pins = fixture()
        now = [0.0]
        original = w._overrides
        def late(*args):
            result = original(*args)
            now[0] = w.MAX_SECONDS + 1
            return result
        with patch.object(w.time, 'monotonic', side_effect=lambda: now[0]), patch.object(w, '_overrides', side_effect=late):
            with self.assertRaisesRegex(ValueError, 'deadline'):
                w.prove_sources([row], sources, pins)

    def test_prefix_incomplete_reports_full_missing_and_remainder(self):
        row, sources, pins = fixture()
        proof = w.prove_sources([row], sources, pins)
        self.assertEqual(proof['selectedScopeTotals']['fullMissingRequiredCellHours'], 8)
        self.assertEqual(proof['selectedScopeTotals']['selectedRequiredCellHours'], 4)
        self.assertEqual(proof['selectedScopeTotals']['remainderRequiredCellHours'], 4)
        self.assertFalse(proof['ownerAudits'][0]['completeSelectedOwner'])
        self.assertFalse(proof['baselineCompletionClaim'])

    def test_exact_retained_subtraction_including_null_observations(self):
        # Reconciliation retains hours for null and numeric observations equally;
        # no scalar values are used to decide reacquisition permission.
        row, sources, pins = fixture()
        retain_first_day(sources)
        proof = w.prove_sources([row], sources, pins)
        self.assertTrue(proof['retainedDisjoint'])
        self.assertTrue(proof['ownerAudits'][0]['completeSelectedOwner'])
        self.assertEqual(proof['selectedScopeTotals']['retainedRequiredCellHours'], 4)
        self.assertEqual(proof['selectedScopeTotals']['fullMissingRequiredCellHours'], 4)

    def test_missing_or_unjustified_override_fails(self):
        row, sources, pins = fixture()
        retain_first_day(sources)
        sources['reconciliation']['updatedOverrides'] = []
        with self.assertRaisesRegex(ValueError, 'template-minus-retained'):
            w.prove_sources([row], sources, pins)
        row, sources, pins = fixture()
        sources['frozenPlan']['tiles'][0]['overrides'] = [dict(template=0, shapes=[])]
        with self.assertRaisesRegex(ValueError, 'template-minus-retained'):
            w.prove_sources([row], sources, pins)

    def test_positive_retained_owner_audited_when_not_selected(self):
        row, sources, pins = fixture()
        retained = copy.deepcopy(sources['frozenPlan']['tiles'][0])
        retained['tileId'] = 'retained'
        retained['expectedCells'] = [c.replace('era5:', 'other:') for c in retained['expectedCells']]
        retained['requiredCells'] = retained['expectedCells'][:2]
        retained['fillerCells'] = retained['expectedCells'][2:]
        sources['frozenPlan']['tiles'].append(retained)
        sources['reconciliation']['cells'] = [dict(cellId=cell, tileId='retained', ownership='required' if cell in retained['requiredCells'] else 'filler', hoursUtc=['1991-01-01T00:00:00Z']) for cell in retained['expectedCells']]
        sources['reconciliation']['updatedOverrides'] = [dict(tileId='retained', overrides=[dict(template=0, shapes=[dict(days=['01'], time=['01:00']), dict(days=['02'], time=['00:00', '01:00'])])])]
        proof = w.prove_sources([row], sources, pins)
        self.assertEqual(proof['auditedOwnerIds'], ['a', 'retained'])
        self.assertEqual(proof['ownerAudits'][1]['retainedRequiredCellHours'], 2)
        self.assertEqual(proof['selectedScopeTotals']['retainedRequiredCellHours'], 0)

    def test_duplicate_invalid_retained_and_cross_owner_classification_fail(self):
        for mutate in (
            lambda s: s['reconciliation']['cells'].append(copy.deepcopy(s['reconciliation']['cells'][0])),
            lambda s: s['reconciliation']['cells'][0]['hoursUtc'].append('1991-01-01T00:00:00Z'),
            lambda s: s['reconciliation']['cells'][0]['hoursUtc'].__setitem__(0, '1991-01-01T00:30:00Z'),
            lambda s: s['reconciliation']['cells'][0]['hoursUtc'].__setitem__(0, '1991-02-30T00:00:00Z'),
            lambda s: s['reconciliation']['cells'][0].__setitem__('ownership', 'filler'),
            lambda s: s['reconciliation']['cells'][0].__setitem__('tileId', 'other'),
            lambda s: s['frozenPlan']['tiles'].append(dict(s['frozenPlan']['tiles'][0], tileId='duplicate')),
        ):
            row, sources, pins = fixture()
            retain_first_day(sources)
            mutate(sources)
            with self.assertRaises(ValueError):
                w.prove_sources([row], sources, pins)

    def test_duplicate_selected_and_retained_reacquisition_fail(self):
        row, sources, pins = fixture()
        with self.assertRaisesRegex(ValueError, 'Duplicate selected'):
            w.prove_sources([row, row], sources, pins)
        retain_first_day(sources)
        row['request']['day'] = ['01']
        row['sha256'] = g.identity({k: row[k] for k in ('dataset', 'revision', 'member', 'request')})
        with self.assertRaisesRegex(ValueError, 'includes retained'):
            w.prove_sources([row], sources, pins)

    def test_actual_overlay_positive_audit_keeps_transferred_day_separate(self):
        row, ordinary, pins = fixture()
        evidence = Path(__file__).resolve().parents[2] / 'docs/operations/data-pilot-evidence'
        sources = json.loads((evidence / '2026-10-16-history-ownership-replan-fixture.json').read_text())
        sources['frozenPlan'] = sources.pop('plan')
        sources.pop('note')
        sources['frozenPlan']['tiles'].append(ordinary['frozenPlan']['tiles'][0])
        sources['ownershipOverlay'] = json.loads((evidence / '2026-10-16-history-ownership-replan.json').read_text())
        sources['reconciliation']['frozenPlanSha256'] = pins['frozenPlan']
        sources['ownershipOverlay']['frozenPlanSha256'] = pins['frozenPlan']
        sources['ownershipOverlay']['reconciliationSha256'] = pins['reconciliation']
        proof = w.prove_sources([row], sources, pins)
        overlay = proof['ownershipOverlayAudit']
        self.assertEqual(overlay['transferredRequiredCellHours'], 312)
        self.assertEqual(overlay['transferredFillerCellHours'], 264)
        self.assertEqual(overlay['retainedExcludedCellHours'], 96)
        self.assertEqual(overlay['removedFillerCellHours'], 96)
        self.assertEqual(len(proof['auditedOwnerIds']), 9)
        with self.assertRaisesRegex(ValueError, 'Selected overlay ownership'):
            w.prove_sources(sources['ownershipOverlay']['replacements'], sources, pins)


if __name__ == '__main__':
    unittest.main()
