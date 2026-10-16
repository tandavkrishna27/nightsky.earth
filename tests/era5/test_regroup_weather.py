import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'era5'))
import global_acquisition as g
import regroup_weather as weather

EVIDENCE = Path(__file__).resolve().parents[2] / 'docs/operations/data-pilot-evidence'


def original():
    jobs = json.loads((EVIDENCE / '2026-10-16-grouped-global-baseline-plan.json').read_text())['results'][0]['prefix']
    return g.build_packet(jobs, source_pins={'frozenPlan': 'a'*64, 'reconciliation': 'b'*64},
                          runtime_pins={'python': 'fixture'}, asset_hosts=['assets.example'])


class RegroupWeatherTests(unittest.TestCase):
    def test_exact_27_plus_3_proposal_preserves_prefix_and_limits(self):
        packet = original(); before = copy.deepcopy(packet)
        jobs, mapping = weather.regroup(packet)
        self.assertEqual(packet, before)
        self.assertEqual(len(jobs), 27)
        self.assertEqual(jobs[1]['request']['year'], list(map(str, range(1991, 2018))))
        self.assertEqual(jobs[2]['request']['year'], ['2018', '2019', '2020'])
        self.assertEqual([jobs[i] for i in [0, 3, 24, 25, 26]], [packet['jobs'][i] for i in [0, 2, 13, 14, 15]])
        self.assertEqual(sum(len(j['partitions']) for j in jobs), 363)
        self.assertEqual(sum(j['scalarCellHours'] for j in jobs), 1052544)
        self.assertEqual(mapping[1]['replacementRows'], [2, 3])
        weather.prove_equivalence(packet['jobs'], jobs)
        self.assertEqual(g.LIMITS['submissions'], 16)
        with self.assertRaises(ValueError):
            g.build_packet(jobs, source_pins=packet['sourcePins'], runtime_pins=packet['runtimePins'], asset_hosts=packet['assetHosts'])

    def test_equal_totals_do_not_prove_exact_clocks_or_classifications(self):
        packet = original(); jobs, _ = weather.regroup(packet)
        for mutate in [lambda rows: rows.pop(), lambda rows: rows.append(copy.deepcopy(rows[0])),
                       lambda rows: rows[1].update(requiredCells=rows[1]['fillerCells'], fillerCells=rows[1]['requiredCells'])]:
            changed = copy.deepcopy(jobs); mutate(changed)
            with self.assertRaises(ValueError): weather.prove_equivalence(packet['jobs'], changed)
        # Same valid shape and number of hours, but one year was substituted.
        changed = copy.deepcopy(jobs)
        row = changed[1]; row['request']['year'][-1] = '2018'
        row['partitions'][-1]['year'] = '2018'
        row['sha256'] = g.identity({k: row[k] for k in ['dataset', 'revision', 'member', 'request']})
        with self.assertRaises(ValueError): weather.prove_equivalence(packet['jobs'], changed)

    def test_provider_claims_are_never_inherited(self):
        packet = original(); packet['jobs'][1]['providerAcceptance'] = 'accepted'
        packet['jobs'][1]['currentProviderFormReviewed'] = True
        with self.assertRaises(ValueError): weather.regroup(packet)

    def test_output_is_exclusive_and_proposal_is_rejected_by_executor(self):
        packet = original(); jobs, mapping = weather.regroup(packet)
        proposal = weather.build_proposal(packet, jobs, mapping, {'fixture': True})
        self.assertEqual(proposal['limits'], packet['limits'])
        self.assertEqual(proposal['budgetReview']['proposedSubmissions'], 27)
        self.assertEqual(proposal['budgetReview']['submissionsDelta'], 11)
        self.assertFalse(proposal['executionEligible'])
        self.assertEqual(proposal['sourcePins'], packet['sourcePins'])
        self.assertEqual(proposal['runtimePins'], packet['runtimePins'])
        with self.assertRaises(ValueError): g.validate_packet(proposal)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'proposal.json'
            weather.write_proposal(path, proposal)
            with self.assertRaises(FileExistsError): weather.write_proposal(path, proposal)

    def test_committed_proposal_matches_exact_historical_packet_and_code(self):
        receipt = json.loads((EVIDENCE / '2026-10-16-global-acquisition-overlay-preparation-v3.json').read_text())
        packet = g.build_packet(original()['jobs'], source_pins=receipt['sourcePins'], runtime_pins=receipt['runtimePins'],
                                asset_hosts=['cds.climate.copernicus.eu', 'object-store.os-api.cci2.ecmwf.int'])
        self.assertEqual(g.identity(packet), receipt['packet']['sha256'])
        proposed = json.loads((EVIDENCE / '2026-10-16-weather-regrouping-proposal.json').read_text())
        jobs, mapping = weather.regroup(packet)
        self.assertEqual(proposed, weather.build_proposal(packet, jobs, mapping, proposed['sourceProof']))


if __name__ == '__main__': unittest.main()
