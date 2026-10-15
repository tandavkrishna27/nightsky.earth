"""Tiny real NetCDF engineering fixtures; no retained-data performance claims."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock
import os
import time
import netCDF4
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2]/'scripts'/'era5'))
from read_chunks import read_grouped_chunk, digest
from measure_retained_decode import replay
from measure_retained_process import monitor, tree_bytes


class RetainedReplayTests(unittest.TestCase):
    def fixture(self, root):
        (root/'raw').mkdir(); (root/'decoded').mkdir()
        raw = root/'raw'/'fixture.nc'
        with netCDF4.Dataset(raw, 'w') as ds:
            ds.createDimension('valid_time', 4); ds.createDimension('latitude', 1); ds.createDimension('longitude', 1)
            t = ds.createVariable('valid_time', 'i4', ('valid_time',)); t.units = 'hours since 1991-03-01'; t[:] = [0, 1, 8784, 8785]
            ds.createVariable('latitude', 'f8', ('latitude',))[:] = [33]
            ds.createVariable('longitude', 'f8', ('longitude',))[:] = [79]
            ds.createVariable('number', 'i4').assignValue(0)
            ds.createVariable('expver', str, ('valid_time',))[:] = np.array(['0001']*4, dtype=object)
            cloud = ds.createVariable('tcc', 'f4', ('valid_time','latitude','longitude')); cloud.units = '1'; cloud.standard_name = 'cloud_area_fraction';
            for index, value in enumerate([0,.25,.5,1]): cloud[index,0,0] = value
        records = list(read_grouped_chunk(raw)); header = records[0]
        specs, parts = [], []
        for year in ['1991','1992']:
            name = 'fixture-'+year; rows = [r for r in records[1:] if r['atUtc'].startswith(year)]
            path = root/'decoded'/(name+'.jsonl')
            path.write_text(''.join(json.dumps(r,separators=(',', ':'))+'\n' for r in [dict(header,rowCount=2),*rows]), newline='\n')
            request = {'year':[year],'month':['03'],'day':['01'],'time':['00:00','01:00']}
            specs.append({'chunkId':name,'request':request})
            parts.append({'chunkId':name,'path':'decoded/'+path.name,'decodedSha256':digest(path),'decodedBytes':path.stat().st_size,'rawSha256':digest(raw)})
        manifest = {'chunks':[{'chunkId':'fixture','region':'test','request':dict(specs[0]['request'],year=['1991','1992']),'partitions':specs}],'cellCoverage':{'test':{'cells':[[33,79]]}}}
        canonical = json.dumps(manifest,sort_keys=True,separators=(',', ':')).encode()
        ledger = {'manifestSha256':hashlib.sha256(canonical).hexdigest(),'entries':[{'chunkId':'fixture','complete':True,'rawSha256':digest(raw),'rawBytes':raw.stat().st_size,'partitions':parts}]}
        (root/'manifest.json').write_text(json.dumps(manifest)); (root/'ledger.json').write_text(json.dumps(ledger))
        return raw

    def test_replay_compares_actual_clock_grid_revision_and_bytes(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); self.fixture(root)
            report = replay(root,'fixture',root/'fresh')
            self.assertTrue(report['byteIdentical']); self.assertEqual(report['sourceHours'],4)
            self.assertEqual(sum(p['rows'] for p in report['partitions']),4)
            with self.assertRaisesRegex(ValueError,'Fresh'):
                replay(root,'fixture',root/'fresh')

    def test_changed_retained_bytes_rejected_before_replay(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); raw = self.fixture(root)
            with raw.open('ab') as stream: stream.write(b'x')
            with self.assertRaisesRegex(ValueError,'Raw pin'):
                replay(root,'fixture',root/'fresh')

    def test_validly_repinned_manifest_cannot_relabel_actual_hours(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); self.fixture(root)
            manifest = json.loads((root/'manifest.json').read_text()); manifest['chunks'][0]['request']['day'] = ['02']
            ledger = json.loads((root/'ledger.json').read_text())
            ledger['manifestSha256'] = hashlib.sha256(json.dumps(manifest,sort_keys=True,separators=(',', ':')).encode()).hexdigest()
            (root/'manifest.json').write_text(json.dumps(manifest)); (root/'ledger.json').write_text(json.dumps(ledger))
            with self.assertRaisesRegex(ValueError,'source clock'):
                replay(root,'fixture',root/'fresh')

    def test_byte_scan_tolerates_only_file_disappearance(self):
        with mock.patch('measure_retained_process.os.walk',return_value=[('/unused',[],['temp'])]):
            with mock.patch('measure_retained_process.Path.stat',side_effect=FileNotFoundError):
                self.assertEqual(tree_bytes('/unused'),0)
            with mock.patch('measure_retained_process.Path.stat',side_effect=PermissionError):
                with self.assertRaises(PermissionError): tree_bytes('/unused')
        def denied(*args, **kwargs): kwargs['onerror'](PermissionError('directory enumeration denied'))
        with mock.patch('measure_retained_process.os.walk',side_effect=denied):
            with self.assertRaises(PermissionError): tree_bytes('/unused')

    @unittest.skipUnless(os.name == 'nt','Windows Job control fixture')
    def test_supervisor_drains_worker_and_spawned_child(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); (root/'tmp').mkdir(); output = root/'monitor'; output.mkdir()
            code = 'import subprocess,sys,json; subprocess.Popen([sys.executable,"-c","import time;time.sleep(30)"]); print(json.dumps({"fixture":True}))'
            report = monitor([sys._base_executable,'-c',code],output,time.time()+10,128*1024*1024)
            self.assertEqual(report['exitCode'],0); self.assertTrue(report['result']['fixture'])
            self.assertEqual(report['hardActiveProcessCeiling'],2)
            self.assertGreater(report['observedJobPeakCommitBytes'],0)


if __name__ == '__main__': unittest.main()
