import importlib.util, hashlib, tempfile, unittest, zipfile
from pathlib import Path
import netCDF4
import numpy as np
spec=importlib.util.spec_from_file_location('point',Path(__file__).resolve().parents[2]/'scripts/era5/point_timeseries.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
CLOCK=['1990-12-30T00:00:00Z','1990-12-30T01:00:00Z']
def fixture(root, values=(.2,.4), times=(0,3600), units='(0 - 1)', coord=32, extra=False, dims=False, nested=False):
    nc=root/'input.nc'
    with netCDF4.Dataset(nc,'w') as ds:
        ds.createDimension('valid_time',2)
        t=ds.createVariable('valid_time','i8',('valid_time',));t.units='seconds since 1990-12-30';t.calendar='proleptic_gregorian';t[:]=times
        for name,value,unit in [('latitude',coord,'degrees_north'),('longitude',48.75,'degrees_east')]:
            v=ds.createVariable(name,'f8');v.units=unit;v.assignValue(value)
        c=ds.createVariable('tcc','f4',() if dims else ('valid_time',),fill_value=-999.);c.units=units;c.standard_name='cloud_area_fraction';c[:]=values[0] if dims else values
        if nested: ds.createGroup('hidden').createVariable('expver','i4').assignValue(1)
        if extra: ds.createVariable('number','i4').assignValue(0)
    raw=root/'input.zip'
    with zipfile.ZipFile(raw,'w') as z:z.write(nc,'data.nc')
    return raw
class PointTests(unittest.TestCase):
    def decode(self,path,**kw):return p.decode_point(path,hashlib.sha256(path.read_bytes()).hexdigest(),32,48.75,CLOCK,**kw)
    def test_truthful_provenance_and_missing(self):
        with tempfile.TemporaryDirectory() as d:
            rows=self.decode(fixture(Path(d),values=(-999,float('nan'))))
            self.assertIsNone(rows[0]['member']);self.assertIsNone(rows[0]['experimentVersions']);self.assertFalse(rows[0]['historicalAdmission']);self.assertEqual([r['values'] for r in rows[1:]],[[None],[None]])
    def test_reject_schema_clock_units_coordinates_provenance_range(self):
        with tempfile.TemporaryDirectory() as d:
            for kw in [dict(times=(0,0)),dict(times=(0,7200)),dict(units='%'),dict(coord=32.1),dict(extra=True),dict(nested=True),dict(dims=True),dict(values=(0,1.1))]:
                with self.subTest(kw=kw),self.assertRaises(ValueError):self.decode(fixture(Path(d),**kw))
    def test_archive_hash_limits_and_immutable_output(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);raw=fixture(root)
            with self.assertRaises(ValueError):self.decode(raw,raw_limit=1)
            with self.assertRaises(ValueError):p.decode_point(raw,'0'*64,32,48.75,CLOCK)
            out=root/'out.jsonl';p.export_point(raw,out,hashlib.sha256(raw.read_bytes()).hexdigest(),32,48.75,CLOCK)
            original=out.read_bytes()
            with self.assertRaises(FileExistsError):p.export_point(raw,out,hashlib.sha256(raw.read_bytes()).hexdigest(),32,48.75,CLOCK)
            self.assertEqual(original,out.read_bytes())
            for name in ['../bad.nc','/bad.nc','dir/bad.nc','bad.txt']:
                with zipfile.ZipFile(raw,'w') as z:z.writestr(name,b'bad')
                with self.assertRaises(ValueError):self.decode(raw)
            raw.write_bytes(b'bad')
            with self.assertRaises(ValueError):self.decode(raw)

class ArchiveTests(PointTests):
    def test_multiple_symlink_crc_and_expansion(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);raw=fixture(root)
            with zipfile.ZipFile(raw,'a') as z:z.writestr('extra.nc',b'x')
            with self.assertRaises(ValueError):self.decode(raw)
            entry=zipfile.ZipInfo('link.nc');entry.create_system=3;entry.external_attr=0o120777<<16
            with zipfile.ZipFile(raw,'w') as z:z.writestr(entry,b'x')
            with self.assertRaises(ValueError):self.decode(raw)
            with zipfile.ZipFile(raw,'w',compression=zipfile.ZIP_DEFLATED) as z:z.writestr('bomb.nc',b'0'*100000)
            with self.assertRaises(ValueError):self.decode(raw)
            raw=fixture(root);body=bytearray(raw.read_bytes());body[40]^=1;raw.write_bytes(body)
            with self.assertRaises(ValueError):self.decode(raw)
    def test_legacy_decoder_rejects_archive(self):
        legacy_spec=importlib.util.spec_from_file_location('legacy',Path(__file__).resolve().parents[2]/'scripts/era5/read_chunks.py')
        legacy=importlib.util.module_from_spec(legacy_spec);legacy_spec.loader.exec_module(legacy)
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises((ValueError,OSError)):list(legacy.read_chunk(fixture(Path(d))))
    def test_source_hardlink_and_nonregular_rejected(self):
        import os
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);raw=fixture(root);link=root/'linked.zip';os.link(raw,link)
            with self.assertRaises(ValueError):self.decode(raw)
            with self.assertRaises(ValueError):p.checked_read(root,1024)
    def test_legacy_scientific_validator_rejects_quarantine_records(self):
        validation_spec=importlib.util.spec_from_file_location('validation',Path(__file__).resolve().parents[2]/'scripts/era5/sample_validate.py')
        validation=importlib.util.module_from_spec(validation_spec);validation_spec.loader.exec_module(validation)
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):validation.validate_records(self.decode(fixture(Path(d))))

class OutputAncestryTests(PointTests):
    def test_reparse_output_parent_rejected_without_writes(self):
        from unittest.mock import patch
        from types import SimpleNamespace
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);raw=fixture(root);out=root/'out.jsonl'
            real_lstat=Path.lstat
            def lstat(path,*a,**kw):
                info=real_lstat(path,*a,**kw)
                if path==out.parent.absolute():
                    return SimpleNamespace(st_mode=info.st_mode,st_file_attributes=1024)
                return info
            records=self.decode(raw)
            with patch.object(p,'decode_point',return_value=records), patch.object(Path,'lstat',lstat):
                with self.assertRaises(ValueError):
                    p.export_point(raw,out,hashlib.sha256(raw.read_bytes()).hexdigest(),32,48.75,CLOCK)
            self.assertFalse(out.exists());self.assertFalse(list(root.glob('.point-*')))

if __name__=='__main__':unittest.main()
