import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'/'era5'))
import pilot
import tempfile
import history
import download
from unittest.mock import patch
from test_download import Adapter
class HistoricalPlanTests(unittest.TestCase):
    def test_multiyear_has_single_boundary_and_leap_february(self):
        plan=pilot.build_historical_plan(1991,1992)
        self.assertEqual(len(plan['chunks']),52)
        feb=next(c for c in plan['chunks'] if c['chunkId']=='hanle-1992-02')
        self.assertEqual(feb['expectedHours'],696)
        self.assertEqual(plan['observingNightStart'],'1991-01-01')
        self.assertEqual(plan['observingNightEnd'],'1992-12-31')
        self.assertEqual(plan['sampleKind'],'sample-only')
    def test_prepare_requires_reviewed_digest_and_keeps_existing_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            plan=pilot.build_historical_plan(1991,1992)
            self.assertRaises(ValueError,history.prepare,directory,1991,1992,'0'*64)
            self.assertFalse((Path(directory)/'manifest.json').exists())
            history.prepare(directory,1991,1992,pilot.plan_digest(plan))
            self.assertEqual(len(pilot.load_state(directory,plan)[0]['chunks']),52)
            self.assertRaises(ValueError,pilot.load_state,directory)
    def test_historical_request_is_exact_and_uncertain_submission_is_not_repeated(self):
        with tempfile.TemporaryDirectory() as directory:
            plan=pilot.build_historical_plan(1991,1992)
            history.prepare(directory,1991,1992,pilot.plan_digest(plan))
            adapter=Adapter(error=RuntimeError('private source error'))
            for _ in range(2):
                with self.assertRaises(ValueError): download._run_one(directory,'hanle-1991-01',adapter,approved_plan=plan)
            self.assertEqual(adapter.submits,1)
            self.assertNotIn('private source error',(Path(directory)/'remote-ledger.json').read_text())
    def test_historical_request_respects_its_reviewed_retained_budget(self):
        with tempfile.TemporaryDirectory() as directory:
            plan=pilot.build_historical_plan(1991,1992)
            history.prepare(directory,1991,1992,pilot.plan_digest(plan))
            adapter=Adapter(error=RuntimeError('stop after budget preflight'))
            with patch.object(pilot,'check_inventory',return_value={'retainedRawBytes':300*1024*1024,'scratchBytes':400*1024*1024}):
                with self.assertRaises(ValueError): download._run_one(directory,'hanle-1991-01',adapter,approved_plan=plan)
            self.assertEqual(adapter.submits,1)
    def test_historical_completed_local_checkpoint_reconciles_without_network_and_unblocks_next_job(self):
        from test_pilot import hanle_fixture
        import netCDF4
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'history'
            plan=pilot.build_historical_plan(1991,1992)
            history.prepare(root,1991,1992,pilot.plan_digest(plan))
            source=Path(directory)/'fixture.nc'
            hanle_fixture(source)
            with netCDF4.Dataset(source,'a') as ds: ds.variables['valid_time'].units='hours since 1991-01-01 00:00:00'
            with pilot.writer_lock(root): local=pilot._checkpoint_existing_locked(root,'hanle-1991-01',source,approved_plan=plan)
            remote={'schemaVersion':1,'manifestSha256':pilot.plan_digest(plan),'entries':[{'chunkId':'hanle-1991-01','state':'uncertain','requestId':'fixture-id','failurePhase':'importing','stagedRawSha256':local['rawSha256']}]}
            pilot.atomic_json(root/'remote-ledger.json',remote)
            with patch.object(download,'CDSAdapter',side_effect=AssertionError('must stay offline')):
                result=download.reconcile_local(root,'hanle-1991-01',approved_plan=plan)
            self.assertEqual(result['state'],'complete')
            adapter=Adapter(error=RuntimeError('stop after next submit'))
            with self.assertRaises(ValueError): download._run_one(root,'hanle-1991-02',adapter,approved_plan=plan)
            self.assertEqual(adapter.submits,1)
    def test_baseline_is_exact_period_and_job_gate(self):
        plan=pilot.build_historical_plan(1991,2020)
        self.assertEqual(len(plan['chunks']),724)
        self.assertEqual(plan['sampleKind'],'baseline-1991-2020')
        self.assertRaises(ValueError,pilot.build_historical_plan,1990,2020)
        self.assertRaises(ValueError,pilot.build_historical_plan,2021,2020)
if __name__=='__main__': unittest.main()
