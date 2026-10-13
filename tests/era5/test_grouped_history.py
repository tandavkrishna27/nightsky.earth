import calendar
import json
from pathlib import Path
import sys
import tempfile
import unittest
import netCDF4
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'era5'))
import grouped_history as grouped
import pilot
from read_chunks import read_chunk

def source(path, chunk, *, extra=False, revision='0001', omit=False):
    stamps = grouped.requested_clock(chunk)
    if omit: stamps = stamps[:-1]
    if extra: stamps.append('1993-01-01T00:00:00Z')
    from datetime import datetime, timezone
    values = [datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp() for s in stamps]
    with netCDF4.Dataset(path, 'w') as ds:
        for name, size in [('valid_time', len(values)), ('latitude', 2), ('longitude', 2)]: ds.createDimension(name, size)
        t = ds.createVariable('valid_time', 'i8', ('valid_time',)); t.units = 'seconds since 1970-01-01'; t.calendar = 'proleptic_gregorian'; t[:] = values
        ds.createVariable('latitude', 'f8', ('latitude',))[:] = [33,32.75]
        ds.createVariable('longitude', 'f8', ('longitude',))[:] = [78.75,79]
        ds.createVariable('number', 'i8').assignValue(0)
        ds.createVariable('expver', str)[...] = np.array(revision,dtype=object)
        cloud=ds.createVariable('tcc','f4',('valid_time','latitude','longitude')); cloud.units='1'; cloud.standard_name='cloud_area_fraction'; cloud[:]=np.full((len(values),2,2),.25,dtype=np.float32)

class GroupedTests(unittest.TestCase):
    def test_grouped_plan_has_exact_valid_leap_cartesian_dates_and_hard_bounds(self):
        plan=grouped.build_plan(1991,2020)
        self.assertEqual(len(plan['chunks']),30)
        for chunk in plan['chunks']:
            clock=grouped.requested_clock(chunk)
            self.assertEqual(len(clock),chunk['expectedHours'])
            self.assertLessEqual(len(clock),22320)
        feb=[c for c in plan['chunks'] if c['region']=='hanle' and c['request']['month']==['02']]
        self.assertEqual(sorted(len(c['request']['day']) for c in feb),[28,29])
        self.assertRaises(ValueError,grouped.build_plan,1990,2020)

    def test_offline_partitions_keep_single_raw_parent_and_legacy_decoder_bound(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'grouped'; plan=grouped.build_plan(1991,1992); sha=pilot.plan_digest(plan)
            grouped.prepare(root,plan,sha)
            chunk=next(c for c in plan['chunks'] if c['chunkId']=='hanle-01-1991-1992')
            raw=Path(directory)/'input.nc'; source(raw,chunk)
            with self.assertRaises(ValueError): list(read_chunk(raw))
            entry=grouped.import_existing(root,chunk['chunkId'],raw,plan,sha)
            self.assertEqual(len(list((root/'raw').glob('*.nc'))),1)
            self.assertEqual([p['chunkId'] for p in entry['partitions']],['hanle-1991-01','hanle-1992-01'])
            for p in entry['partitions']:
                header=json.loads((root/p['path']).read_text().splitlines()[0])
                self.assertEqual(header['sourceSha256'],entry['rawSha256'])
                self.assertEqual(header['rowCount'],744)
            self.assertEqual(grouped.import_existing(root,chunk['chunkId'],raw,plan,sha),entry)
            (root/entry['partitions'][0]['path']).write_text('changed')
            self.assertRaises(ValueError,grouped.verify_entry,root,entry)

    def test_clock_revision_and_digest_fail_closed_before_retention(self):
        for options in [{'extra':True},{'revision':'0005'}]:
            with self.subTest(options=options), tempfile.TemporaryDirectory() as directory:
                root=Path(directory)/'grouped'; plan=grouped.build_plan(1991,1992); sha=pilot.plan_digest(plan)
                grouped.prepare(root,plan,sha)
                chunk=next(c for c in plan['chunks'] if c['chunkId']=='hanle-01-1991-1992')
                raw=Path(directory)/'input.nc'; source(raw,chunk,**options)
                self.assertRaises(ValueError,grouped.import_existing,root,chunk['chunkId'],raw,plan,sha)
                self.assertFalse(list((root/'raw').glob('*.nc')))
                self.assertEqual(pilot.load_state(root,plan)[1]['entries'],[])
        with tempfile.TemporaryDirectory() as directory:
            plan=grouped.build_plan(1991,1992)
            self.assertRaises(ValueError,grouped.prepare,directory,plan,'0'*64)

    def test_missing_requested_hour_remains_counted_and_raw_tampering_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'grouped'; plan=grouped.build_plan(1991,1992); sha=pilot.plan_digest(plan)
            grouped.prepare(root,plan,sha)
            chunk=next(c for c in plan['chunks'] if c['chunkId']=='hanle-02-1992-1992')
            raw=Path(directory)/'input.nc'; source(raw,chunk,omit=True)
            entry=grouped.import_existing(root,chunk['chunkId'],raw,plan,sha)
            self.assertEqual(entry['partitions'][0]['missingSourceHours'],1)
            self.assertEqual(entry['partitions'][0]['expectedRows'],696)
            (root/'raw'/f"{chunk['chunkId']}.nc").write_bytes(b'changed')
            self.assertRaises(ValueError,grouped.verify_entry,root,entry)

    def test_unreviewed_extra_source_variable_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'grouped';plan=grouped.build_plan(1991,1992);sha=pilot.plan_digest(plan)
            grouped.prepare(root,plan,sha);chunk=plan['chunks'][0]
            raw=Path(directory)/'input.nc';source(raw,chunk)
            with netCDF4.Dataset(raw,'a') as ds:ds.createVariable('unreviewed','f4').assignValue(1)
            self.assertRaises(ValueError,grouped.import_existing,root,chunk['chunkId'],raw,plan,sha)

    def test_grouped_fake_transport_imports_once_and_recovery_stays_offline(self):
        from test_download import Adapter,Remote
        from unittest.mock import patch
        import download
        self.assertTrue(callable(getattr(grouped,'fetch_one',None)),'grouped bounded acquisition seam must exist')
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'grouped';plan=grouped.build_plan(1991,1992);sha=pilot.plan_digest(plan)
            grouped.prepare(root,plan,sha);chunk=plan['chunks'][0]
            raw=Path(directory)/'input.nc';source(raw,chunk);payload=raw.read_bytes()
            remote=Remote();remote.get_results=lambda:type('Results',(),{'location':'https://download.example/file','content_length':len(payload)})()
            adapter=Adapter(remote,blocks=(payload,));entry=grouped.fetch_one(root,chunk['chunkId'],plan,sha,adapter=adapter)
            self.assertEqual(adapter.submits,1);self.assertTrue(entry['complete'])
            again=Adapter();grouped.fetch_one(root,chunk['chunkId'],plan,sha,adapter=again);self.assertEqual(again.submits,0)
            ledger=pilot.read_json(root/'remote-ledger.json');ledger['entries'][0].update(state='uncertain',failurePhase='importing',stagedRawSha256=entry['rawSha256']);pilot.atomic_json(root/'remote-ledger.json',ledger)
            with patch.object(download,'CDSAdapter',side_effect=AssertionError('offline reconciliation')):
                self.assertEqual(grouped.reconcile(root,chunk['chunkId'],plan,sha)['state'],'complete')

    def test_grouped_acquisition_never_exceeds_four_durable_submission_intents(self):
        from test_download import Adapter
        self.assertTrue(callable(getattr(grouped,'fetch_one',None)),'grouped bounded acquisition seam must exist')
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'grouped';plan=grouped.build_plan(1991,1992);sha=pilot.plan_digest(plan)
            grouped.prepare(root,plan,sha)
            entries=[{'chunkId':c['chunkId'],'state':'complete'} for c in plan['chunks'][:4]]
            pilot.atomic_json(root/'remote-ledger.json',{'schemaVersion':1,'manifestSha256':sha,'entries':entries})
            adapter=Adapter(error=RuntimeError('must not submit'))
            self.assertRaises(ValueError,grouped.fetch_one,root,plan['chunks'][4]['chunkId'],plan,sha,adapter=adapter)
            self.assertEqual(adapter.submits,0)

if __name__=='__main__': unittest.main()
