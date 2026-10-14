import copy, hashlib, sys, tempfile, time, unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/osm'))
import spot_manifest as manifest
import spot_acquisition as acquisition

class Reply(BytesIO):
    def __init__(self, body, source, **changes):
        super().__init__(body)
        self.status = changes.pop('status', 200)
        self.url = changes.pop('url', source['url'])
        self.headers = {'Content-Length': str(source['declaredBytes']), 'ETag': source['etag'], **changes}
    def geturl(self): return self.url

class AcquisitionTests(unittest.TestCase):
    def test_manifest_exact_pins_and_digest(self):
        value = copy.deepcopy(manifest.DEFAULT_MANIFEST)
        self.assertEqual(manifest.load_manifest(value), value)
        self.assertEqual(len(manifest.manifest_digest(value)), 64)
        for key, bad in [('url', value['sources'][0]['url']+'?x=1'), ('declaredBytes', 1), ('etag', 'changed'), ('expectedVintage', 'changed')]:
            altered = copy.deepcopy(value); altered['sources'][0][key] = bad
            with self.assertRaises(ValueError): manifest.load_manifest(altered)
        with self.assertRaises(ValueError): manifest.load_manifest({'version':1,'sources':value['sources'][:1]})

    def run_acquire(self, folder, body=None, head_changes=None, get_changes=None, callback=None):
        source = manifest.PINNED_SOURCES[0]
        body = b'x' * source['declaredBytes'] if body is None else body
        replies = iter([Reply(b'', source, **(head_changes or {})), Reply(body, source, **(get_changes or {}))])
        calls = []
        def opener(request, timeout):
            calls.append(request.method); return next(replies)
        with patch.object(acquisition, 'validate_source_header', return_value={'vintage':source['expectedVintage']}):
            result = acquisition.acquire_source(source, folder, opener=opener, budget_check=callback)
        return result, calls

    def test_no_implicit_network(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError, 'opener'): acquisition.acquire_source(manifest.PINNED_SOURCES[0], folder)

    def test_success_hash_and_exclusive_promotion(self):
        with tempfile.TemporaryDirectory() as folder:
            checks=[]
            result,calls=self.run_acquire(folder, callback=checks.append)
            path=Path(result['path'])
            self.assertEqual(calls,['HEAD','GET'])
            self.assertEqual(result['sha256'],hashlib.sha256(path.read_bytes()).hexdigest())
            self.assertEqual(result['bytes'],manifest.PINNED_SOURCES[0]['declaredBytes'])
            self.assertIn(0, checks)
            with self.assertRaises(FileExistsError): self.run_acquire(folder)

    def test_http_rejection_and_partial_evidence(self):
        for changes in [{'status':302}, {'url':'https://example.com/'}, {'Content-Length':'1'}, {'ETag':'bad'}, {'Content-Encoding':'gzip'}]:
            with tempfile.TemporaryDirectory() as folder:
                with self.assertRaises(ValueError): self.run_acquire(folder, head_changes=changes)
                self.assertEqual(list(Path(folder).iterdir()), [])
                with self.assertRaises(ValueError): self.run_acquire(folder, get_changes=changes)
                self.assertFalse((Path(folder)/'monaco.osm.pbf').exists())
        for body in [b'short', b'x'*(manifest.PINNED_SOURCES[0]['declaredBytes']+1)]:
            with tempfile.TemporaryDirectory() as folder:
                with self.assertRaises(ValueError): self.run_acquire(folder, body=body)
                self.assertTrue((Path(folder)/'monaco.osm.pbf.partial').exists())
                self.assertFalse((Path(folder)/'monaco.osm.pbf').exists())

    def test_deadline_and_budget_stop(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaises(TimeoutError): acquisition.acquire_source(manifest.PINNED_SOURCES[0],folder,opener=lambda *a,**k: None,deadline=time.monotonic()-1)
        with tempfile.TemporaryDirectory() as folder:
            def refused(size): raise ValueError('budget')
            with self.assertRaisesRegex(ValueError,'budget'): self.run_acquire(folder,callback=refused)

    def test_header_failure_preserves_staging(self):
        source=manifest.PINNED_SOURCES[0]
        with tempfile.TemporaryDirectory() as folder:
            replies=iter([Reply(b'',source),Reply(b'x'*source['declaredBytes'],source)])
            with patch.object(acquisition,'validate_source_header',side_effect=ValueError('header mismatch')):
                with self.assertRaisesRegex(ValueError,'header mismatch'):
                    acquisition.acquire_source(source,folder,opener=lambda *args,**kwargs: next(replies))
            self.assertTrue((Path(folder)/'monaco.osm.pbf.partial').exists())
            self.assertFalse((Path(folder)/'monaco.osm.pbf').exists())

    def test_duplicate_http_headers_are_rejected(self):
        from http.client import HTTPMessage
        source=manifest.PINNED_SOURCES[0]
        for method in ('HEAD','GET'):
            for name, value in [('Content-Length',str(source['declaredBytes'])),('ETag',source['etag']),('Content-Encoding','identity')]:
                with self.subTest(method=method,name=name), tempfile.TemporaryDirectory() as folder:
                    replies=[Reply(b'',source),Reply(b'',source)]
                    headers=HTTPMessage()
                    for key, val in replies[0 if method=='HEAD' else 1].headers.items(): headers[key]=val
                    if name=='Content-Encoding': headers[name]=value
                    headers[name]=value
                    replies[0 if method=='HEAD' else 1].headers=headers
                    with self.assertRaisesRegex(ValueError,'duplicate'):
                        acquisition.acquire_source(source,folder,opener=lambda *a,**k: replies.pop(0))
                    self.assertEqual(list(Path(folder).iterdir()),[])

    def test_symlink_root_or_ancestor_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            parent=Path(folder); target=parent/'target'; target.mkdir()
            (target/'child').mkdir()
            link=parent/'link'
            try: link.symlink_to(target,target_is_directory=True)
            except OSError as error: self.skipTest(f'Symlink creation privilege unavailable: {error}')
            for root in (link,link/'child'):
                with self.assertRaisesRegex(ValueError,'reparse|symlink'):
                    acquisition.acquire_source(manifest.PINNED_SOURCES[0],root,opener=lambda *a,**k: None)

    def test_reparse_root_is_rejected_before_resolution(self):
        from types import SimpleNamespace
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            original=Path.lstat
            def stat(path,*args,**kwargs):
                if path==root: return SimpleNamespace(st_mode=0,st_file_attributes=0x400)
                return original(path,*args,**kwargs)
            with patch.object(Path,'lstat',stat):
                with self.assertRaisesRegex(ValueError,'reparse|symlink'):
                    acquisition.acquire_source(manifest.PINNED_SOURCES[0],root,opener=lambda *a,**k: None)

    def test_real_synthetic_header_vintage(self):
        import osmium
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'synthetic.osm.pbf'
            header=osmium.io.Header(); header.set('osmosis_replication_timestamp',manifest.PINNED_SOURCES[0]['expectedVintage'])
            writer=osmium.SimpleWriter(str(path),header=header); writer.close()
            staged=path.with_suffix('.pbf.partial'); path.rename(staged); path=staged
            self.assertEqual(acquisition.validate_source_header(path,manifest.PINNED_SOURCES[0])['vintage'],manifest.PINNED_SOURCES[0]['expectedVintage'])
            with self.assertRaises(ValueError): acquisition.validate_source_header(path,{**manifest.PINNED_SOURCES[0],'expectedVintage':'wrong'})

if __name__ == '__main__': unittest.main()
