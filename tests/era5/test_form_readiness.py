"""Offline adversarial checks; observations below are synthetic, never provider evidence."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'era5'))
import form_readiness as form

PROPOSAL = Path(__file__).resolve().parents[2] / 'docs/operations/data-pilot-evidence/2026-10-16-weather-regrouping-proposal.json'
PIN = '5482a483a50dd6870ac1b6e1bb061bfdfdc303596b7bee273fdab93e8ff846dd'


def fixture():
    proposal = json.loads(PROPOSAL.read_bytes())
    evidence = dict(schemaVersion=1, kind='weather-form-observations-v1',
                    observedDate='2026-10-16', url=form.DOWNLOAD_URL,
                    proposalSha256=PIN, orderedRequestSha256=[j['sha256'] for j in proposal['jobs']],
                    sourcePins=proposal['sourcePins'], blocker=None, observations=[])
    for index, job in enumerate(proposal['jobs'], 1):
        evidence['observations'].append(dict(proposalRow=index, requestSha256=job['sha256'],
            observedAt='2026-10-16T12:00:00+05:30', state='enabled',
            generatedDataset=job['dataset'], generatedRequest=copy.deepcopy(job['request']),
            submitControl='enabled', validationMessages=[], limits=[]))
    return evidence


class FormReadinessTests(unittest.TestCase):
    def validate(self, evidence):
        return form.validate(PROPOSAL, PIN, evidence, observed_date='2026-10-16')

    def test_exact_full_comparison_counts_enabled_without_granting_authority(self):
        evidence = fixture(); before = copy.deepcopy(evidence)
        report = self.validate(evidence)
        self.assertEqual(report['comparedRows'], 27)
        self.assertEqual(report['enabledRows'], 27)
        self.assertTrue(report['allRequestsCompared'])
        self.assertEqual(report['missingRows'], [])
        self.assertEqual(evidence, before)
        self.assertNotIn('currentProviderFormReviewed', report)
        self.assertNotIn('allowance', report)
        self.assertFalse(report['executionEligible'])

    def test_equal_count_year_and_area_substitution_cannot_compare(self):
        for key, value in [('year', ['1991']), ('area', [-39.5, -73.5, -39.75, -73.25])]:
            evidence = fixture()
            evidence['observations'][0]['generatedRequest'][key] = value
            with self.assertRaisesRegex(ValueError, 'generated request'):
                self.validate(evidence)

    def test_extra_or_missing_generated_key_and_dataset_substitution_rejected(self):
        for mutate in [lambda row: row['generatedRequest'].update(grid=[0.25, 0.25]),
                       lambda row: row['generatedRequest'].pop('data_format'),
                       lambda row: row.update(generatedDataset='reanalysis-era5-pressure-levels')]:
            evidence = fixture(); mutate(evidence['observations'][0])
            with self.assertRaisesRegex(ValueError, 'generated request'):
                self.validate(evidence)

    def test_missing_row_reports_exact_gap_without_count_only_acceptance(self):
        evidence = fixture(); del evidence['observations'][1]
        report = self.validate(evidence)
        self.assertEqual(report['comparedRows'], 26)
        self.assertEqual(report['missingRows'], [2])
        self.assertFalse(report['allRequestsCompared'])

    def test_duplicate_substituted_or_reordered_row_rejected(self):
        for mutate in [lambda rows: rows.__setitem__(1, copy.deepcopy(rows[0])),
                       lambda rows: rows[1].update(requestSha256=rows[0]['requestSha256']),
                       lambda rows: rows.reverse()]:
            evidence = fixture(); mutate(evidence['observations'])
            with self.assertRaises(ValueError): self.validate(evidence)

    def test_exact_source_and_ordered_identity_pins_required(self):
        for mutate in [lambda e: e['sourcePins'].update(frozenPlan='a'*64),
                       lambda e: e['orderedRequestSha256'].reverse(),
                       lambda e: e.update(proposalSha256='a'*64)]:
            evidence = fixture(); mutate(evidence)
            with self.assertRaises(ValueError): self.validate(evidence)
        with self.assertRaisesRegex(ValueError, 'hash'):
            form.validate(PROPOSAL, 'a'*64, fixture(), observed_date='2026-10-16')

    def test_login_blocker_does_not_erase_exact_generated_code_comparison(self):
        evidence = fixture()
        for row in evidence['observations']:
            row.update(state='login-required', submitControl='disabled',
                       validationMessages=['Login/register to submit request'])
        report = self.validate(evidence)
        self.assertEqual(report['comparedRows'], 27)
        self.assertEqual(report['enabledRows'], 0)
        self.assertEqual(report['loginRequiredRows'], 27)
        self.assertTrue(report['allRequestsCompared'])
        self.assertFalse(report['allSubmitControlsEnabled'])

    def test_disabled_control_preserves_actual_limit_and_error(self):
        evidence = fixture()
        evidence['observations'][0].update(state='disabled', submitControl='disabled',
            validationMessages=['Request too large.'], limits=['Cost 133920 over 121000 limit.'])
        report = self.validate(evidence)
        self.assertEqual(report['disabledRows'], 1)
        self.assertEqual(report['rows'][0]['limits'], ['Cost 133920 over 121000 limit.'])

    def test_blocked_packet_does_not_infer_inspection_for_absent_rows(self):
        evidence = fixture(); evidence.update(observations=[], blocker='Login page only')
        report = self.validate(evidence)
        self.assertEqual(report['comparedRows'], 0)
        self.assertEqual(report['missingRows'], list(range(1, 28)))
        self.assertFalse(report['allRequestsCompared'])

    def test_uninspected_rows_cannot_supply_generated_code_or_enabled_controls(self):
        evidence = fixture()
        evidence['observations'][0].update(state='uninspected')
        with self.assertRaises(ValueError): self.validate(evidence)
        evidence['observations'][0].update(generatedDataset=None, generatedRequest=None,
                                           submitControl='unavailable')
        report = self.validate(evidence)
        self.assertEqual(report['comparedRows'], 26)

    def test_stale_undated_and_inconsistent_control_claims_rejected(self):
        for update in [dict(observedAt='2026-10-15T12:00:00Z'), dict(observedAt='2026-10-15'),
                       dict(observedAt='2026-10-16T12:00:00'), dict(submitControl='disabled'),
                       dict(currentProviderFormReviewed=True), dict(state='accepted')]:
            evidence = fixture(); evidence['observations'][0].update(update)
            with self.assertRaises(ValueError): self.validate(evidence)
        for update in [dict(currentProviderFormReviewed=True), dict(allowance='approved')]:
            evidence = fixture(); evidence.update(update)
            with self.assertRaises(ValueError): self.validate(evidence)

    def test_date_only_evidence_retains_day_precision_without_invented_time(self):
        evidence = fixture(); evidence['observedDate'] = '2026-10-17'
        for row in evidence['observations']:
            row.update(observedAt='2026-10-17', state='login-required', submitControl='disabled',
                       validationMessages=['Login/register to submit request'])
        report = form.validate(PROPOSAL, PIN, evidence, observed_date='2026-10-17')
        self.assertEqual(report['comparedRows'], 27)
        self.assertEqual(report['enabledRows'], 0)
        self.assertFalse(report['executionEligible'])
        self.assertEqual(report['rows'][0]['observedAt'], '2026-10-17')
        self.assertEqual(report['rows'][0]['observationPrecision'], 'day')

    def test_instant_is_compared_after_conversion_to_asia_calcutta_date(self):
        evidence = fixture(); evidence['observedDate'] = '2026-10-17'
        evidence['observations'] = evidence['observations'][:1]
        for stamp in ['2026-10-16T18:30:00Z', '2026-10-16T23:59:00+01:00',
                      '2026-10-18T00:29:59+06:00']:
            with self.subTest(stamp=stamp):
                evidence['observations'][0]['observedAt'] = stamp
                report = form.validate(PROPOSAL, PIN, evidence, observed_date='2026-10-17')
                self.assertEqual(report['rows'][0]['observationPrecision'], 'instant')
                self.assertEqual(report['rows'][0]['observedAt'], stamp)
        for stamp in ['2026-10-16T18:29:59Z', '2026-10-17T18:30:00Z',
                      '2026-10-17T00:00:00+06:00', '2026-10-17T12:00:00']:
            with self.subTest(stamp=stamp):
                evidence['observations'][0]['observedAt'] = stamp
                with self.assertRaises(ValueError):
                    form.validate(PROPOSAL, PIN, evidence, observed_date='2026-10-17')

    def test_day_precision_requires_canonical_date(self):
        for stamp in ['20261016', '2026-10-16 ', '2026-10-16Z', '2026-10-16 12:00:00']:
            evidence = fixture(); evidence['observations'][0]['observedAt'] = stamp
            with self.subTest(stamp=stamp), self.assertRaises(ValueError):
                self.validate(evidence)

    def test_read_only_validator_does_not_modify_proposal_or_executor_cap(self):
        before = PROPOSAL.read_bytes()
        self.validate(fixture())
        self.assertEqual(PROPOSAL.read_bytes(), before)
        self.assertEqual(hashlib.sha256(before).hexdigest(), PIN)
        import global_acquisition as g
        self.assertEqual(g.LIMITS['submissions'], 16)

    def test_retained_browser_record_has_27_exact_comparisons_and_no_submit_acceptance(self):
        evidence_path = PROPOSAL.parent / '2026-10-17-cds-form-observations.json'
        evidence, digest = form.read_json(evidence_path)
        report = form.validate(PROPOSAL, PIN, evidence, observed_date='2026-10-17')
        report['observationsSha256'] = digest
        retained, _ = form.read_json(PROPOSAL.parent / '2026-10-17-cds-form-comparison.json')
        self.assertEqual(report, retained)
        self.assertEqual(report['comparedRows'], 27)
        self.assertEqual(report['loginRequiredRows'], 27)
        self.assertEqual(report['missingRows'], [])
        self.assertEqual(report['enabledRows'], 0)
        self.assertTrue(report['allRequestsCompared'])
        self.assertFalse(report['allSubmitControlsEnabled'])
        self.assertFalse(report['executionEligible'])

    def test_authenticated_browser_record_passes_all_form_checks_without_authority(self):
        evidence, digest = form.read_json(PROPOSAL.parent / '2026-10-17-cds-authenticated-observations.json')
        report = form.validate(PROPOSAL, PIN, evidence, observed_date='2026-10-17')
        report['observationsSha256'] = digest
        retained, _ = form.read_json(PROPOSAL.parent / '2026-10-17-cds-authenticated-comparison.json')
        self.assertEqual(report, retained)
        self.assertEqual(report['comparedRows'], 27)
        self.assertEqual(report['enabledRows'], 27)
        self.assertEqual(report['disabledRows'], 0)
        self.assertEqual(report['loginRequiredRows'], 0)
        self.assertEqual(report['missingRows'], [])
        self.assertTrue(report['allRequestsCompared'])
        self.assertTrue(report['allSubmitControlsEnabled'])
        self.assertFalse(report['executionEligible'])
        self.assertEqual({r['observationPrecision'] for r in report['rows']}, {'instant'})
        self.assertTrue(all('CC-BY licence: Accepted' in r['validationMessages'] for r in report['rows']))
        self.assertNotIn('currentProviderFormReviewed', report)
        import global_acquisition as g
        self.assertEqual(g.LIMITS['submissions'], 16)

    def test_file_inputs_reject_duplicate_json_keys_nonfinite_and_oversize(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'observations.json'
            for body in [b'{"schemaVersion":1,"schemaVersion":1}', b'{"cost":NaN}',
                         b' ' * (1024 * 1024 + 1)]:
                path.write_bytes(body)
                with self.assertRaises(ValueError): form.read_json(path)

    def test_cli_reports_blocker_and_binds_observation_file_hash(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'observations.json'
            evidence = fixture(); evidence.update(observations=[], blocker='Login required')
            body = json.dumps(evidence).encode(); path.write_bytes(body)
            result = subprocess.run([sys.executable, str(Path(form.__file__)), '--proposal',
                str(PROPOSAL), '--proposal-sha256', PIN, '--observations', str(path),
                '--observed-date', '2026-10-16'], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            report = json.loads(result.stdout)
            self.assertEqual(report['comparedRows'], 0)
            self.assertEqual(report['observationsSha256'], hashlib.sha256(body).hexdigest())
            self.assertEqual(report['blocker'], 'Login required')


if __name__ == '__main__': unittest.main()
