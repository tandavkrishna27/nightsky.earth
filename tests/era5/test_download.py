import sys
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/era5'))
import pilot
try:
    import download
except ImportError:
    download = None

class Remote:
    request_id = '01234567-89ab-cdef-0123-456789abcdef'
    def __init__(self, statuses=('successful',), error=None): self.states=iter(statuses); self.error=error
    @property
    def status(self):
        if self.error: raise self.error
        return next(self.states)
    def get_results(self):
        return type('Results', (), {'location':'https://download.example/file?secret=SIGNED', 'content_length':4})()
class Adapter:
    def __init__(self, remote=None, error=None, blocks=(b'CDF1',)):
        self.remote=remote or Remote(); self.error=error; self.submits=0; self.blocks=blocks
    def submit(self, dataset, request):
        self.submits+=1
        if self.error: raise self.error
        return self.remote
    def open_download(self, url, deadline):
        return Response(self.blocks)
class Response:
    status_code=200
    headers={}
    def __init__(self, blocks): self.blocks=blocks; self.closed=False
    def iter_content(self, chunk_size): yield from self.blocks
    def close(self): self.closed=True

class DownloadTests(unittest.TestCase):
    def setUp(self):
        self.assertIsNotNone(download, 'bounded downloader implementation is missing')
        self.temp=tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name); pilot.prepare(self.root)
    def test_success_holds_one_writer_through_import_and_records_separate_timings(self):
        def importer(root, chunk, source, **kwargs):
            self.assertTrue((root/'.writer.lock').exists())
            self.assertEqual(source.read_bytes(), b'CDF1')
            return {'chunkId':chunk, 'complete':True, 'processingSeconds':0.1}
        result=download.fetch_one(self.root, 'hanle-2025-02', Adapter(), importer=importer)
        self.assertTrue(result['complete']); self.assertGreaterEqual(result['queueSeconds'],0)
        self.assertGreaterEqual(result['downloadSeconds'],0)
        self.assertFalse((self.root/'.writer.lock').exists())
        self.assertNotIn('SIGNED', (self.root/'remote-ledger.json').read_text())
    def test_uncertain_submit_blocks_duplicate_across_invocations(self):
        adapter=Adapter(error=RuntimeError('TOKEN https://evil/?secret=SIGNED'))
        for _ in range(2):
            with self.assertRaisesRegex(ValueError, 'review'): download.fetch_one(self.root,'hanle-2025-02',adapter)
        self.assertEqual(adapter.submits,1)
        text=(self.root/'remote-ledger.json').read_text()
        self.assertNotIn('TOKEN',text); self.assertNotIn('SIGNED',text)
    def test_unknown_queue_blocks_all_other_chunks(self):
        adapter=Adapter(Remote(statuses=('surprise',)))
        with self.assertRaises(ValueError): download.fetch_one(self.root,'hanle-2025-02',adapter)
        with self.assertRaises(ValueError): download.fetch_one(self.root,'hanle-2025-03',adapter)
        self.assertEqual(adapter.submits,1)
    def test_stream_overflow_never_imports_and_removes_partial(self):
        adapter=Adapter(blocks=(b'123',b'45'))
        with patch.object(download,'MAX_RAW_BYTES',4):
            with self.assertRaises(ValueError): download.fetch_one(self.root,'hanle-2025-02',adapter)
        self.assertFalse(list(self.root.glob('*.download')))
    def test_invalid_chunk_and_active_writer_never_submit(self):
        adapter=Adapter()
        with self.assertRaises(ValueError): download.fetch_one(self.root,'unknown',adapter)
        with pilot.writer_lock(self.root):
            with self.assertRaises(ValueError): download.fetch_one(self.root,'hanle-2025-02',adapter)
        self.assertEqual(adapter.submits,0)
    def test_http_asset_rejected_before_download(self):
        download_url='http://download.example/file'
        remote=Remote()
        remote.get_results=lambda: type('Results',(),{'location':download_url,'content_length':4})()
        with self.assertRaises(ValueError): download.fetch_one(self.root,'hanle-2025-02',Adapter(remote))
    def test_declared_size_mismatch_never_imports(self):
        with self.assertRaises(ValueError): download.fetch_one(self.root,'hanle-2025-02',Adapter(blocks=(b'12',)))
    def test_elapsed_deadline_stops_queue_without_second_submit(self):
        clock=iter([0,0,0,0,1801,1801,1801])
        adapter=Adapter(Remote(statuses=('accepted','successful')))
        with patch.object(download.time,'monotonic',side_effect=lambda:next(clock)):
            with self.assertRaises(ValueError): download.fetch_one(self.root,'hanle-2025-02',adapter)
        self.assertEqual(adapter.submits,1)

class TransportTests(unittest.TestCase):
    def test_metadata_body_bound_closes_response(self):
        response=Response((b'123',b'45'))
        with self.assertRaises(ValueError): download.bounded_response(response,4,download.time.monotonic())
        self.assertTrue(response.closed)
    def test_metadata_status_does_not_expose_private_error(self):
        response=Response((b'TOKEN SIGNED',)); response.status_code=401
        with self.assertRaises(ValueError) as caught: download.bounded_response(response,1024,download.time.monotonic())
        self.assertNotIn('TOKEN',str(caught.exception)); self.assertTrue(response.closed)
    def test_missing_or_invalid_https_credentials_are_rejected(self):
        for url in ['http://host/x','https://user:password@host/x','https://host/x#secret']:
            with self.assertRaises(ValueError): download.https_url(url)
    def test_actual_importer_creates_verified_checkpoint_without_nested_lock(self):
        from test_pilot import hanle_fixture
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'pilot'; pilot.prepare(root)
            source=Path(directory)/'fixture.nc'; hanle_fixture(source)
            payload=source.read_bytes()
            remote=Remote()
            remote.get_results=lambda:type('Results',(),{'location':'https://download.example/file','content_length':len(payload)})()
            result=download.fetch_one(root,'hanle-2025-01',Adapter(remote,blocks=(payload,)))
            self.assertTrue(result['complete'])
            self.assertEqual(pilot.status(root)['completedChunks'],1)
            retry=Adapter()
            self.assertEqual(download.fetch_one(root,'hanle-2025-01',retry)['rawSha256'],result['rawSha256'])
            self.assertEqual(retry.submits,0)

class RealClientFixtureTests(unittest.TestCase):
    def test_pinned_client_submit_poll_and_asset_use_bounded_sessions_without_auth_on_asset(self):
        import requests
        calls=[]
        started=download.time.monotonic()
        def request(session,method,url,**kwargs):
            calls.append((method,url,kwargs))
            response=requests.Response(); response.status_code=200
            response.url=url; response.request=requests.Request(method,url).prepare()
            if url.endswith('/messages'): body={}
            elif url.endswith('/processes/reanalysis-era5-single-levels'): body={'id':'reanalysis-era5-single-levels'}
            elif url.endswith('/execution'): body={'links':[{'rel':'monitor','href':'https://cds.climate.copernicus.eu/api/retrieve/v1/jobs/fixture-id'}]}
            elif url.endswith('/results'): body={'asset':{'value':{'href':'https://assets.example/file?signed=PRIVATE','file:size':4,'type':'application/netcdf'}}}
            elif '/jobs/' in url: body={'status':'successful','links':[{'rel':'self','href':'https://cds.climate.copernicus.eu/api/retrieve/v1/jobs/fixture-id'}]}
            else:
                self.assertNotIn('PRIVATE-TOKEN',kwargs.get('headers',{}))
                body=None
            payload=b'CDF1' if body is None else __import__('json').dumps(body).encode()
            response._content=payload; response._content_consumed=True
            return response
        with patch('cdsapi.api.get_url_key_verify',return_value=('https://cds.climate.copernicus.eu/api','fixture-token',True)),patch.object(requests.Session,'request',request):
            adapter=download.CDSAdapter(started)
            remote=adapter.submit('reanalysis-era5-single-levels',{'variable':['total_cloud_cover']})
            self.assertEqual(remote.request_id,'fixture-id')
            self.assertEqual(remote.status,'successful')
            before_resume=len(calls)
            recovered=adapter.resume('fixture-id')
            self.assertEqual(recovered.request_id,'fixture-id')
            self.assertEqual([row[0].lower() for row in calls[before_resume:]],['get'])
            results=remote.get_results()
            self.assertEqual(results.content_length,4)
            response=adapter.open_download(results.location,started)
            self.assertEqual(response.content,b'CDF1')
        posts=[row for row in calls if row[0].lower()=='post']
        self.assertEqual(len(posts),1)
        for _,_,kwargs in calls:
            self.assertTrue(kwargs['stream']); self.assertFalse(kwargs['allow_redirects']); self.assertTrue(kwargs['verify'])

class ReconcileTests(unittest.TestCase):
    def test_crash_after_local_import_can_reconcile_without_network_or_resubmit(self):
        from test_pilot import hanle_fixture
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'pilot'; pilot.prepare(root)
            source=Path(directory)/'fixture.nc'; hanle_fixture(source)
            local=pilot.checkpoint_existing(root,'hanle-2025-01',source)
            plan,_=pilot.load_state(root)
            entry={'chunkId':'hanle-2025-01','state':'importing','requestId':'fixture-id',
                'stagedRawSha256':local['rawSha256']}
            pilot.atomic_json(root/'remote-ledger.json',{'schemaVersion':1,'manifestSha256':pilot.plan_digest(plan),'entries':[entry]})
            self.assertTrue(hasattr(download,'reconcile_local'),'verified reconciliation missing')
            result=download.reconcile_local(root,'hanle-2025-01')
            self.assertEqual(result['state'],'complete')
            self.assertEqual(pilot.read_json(root/'remote-ledger.json')['entries'][0]['state'],'complete')
    def test_unknown_submission_cannot_be_cleared_by_local_checkpoint(self):
        self.assertTrue(hasattr(download,'reconcile_local'),'verified reconciliation missing')
        from test_pilot import hanle_fixture
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/'pilot'; pilot.prepare(root)
            source=Path(directory)/'fixture.nc'; hanle_fixture(source)
            local=pilot.checkpoint_existing(root,'hanle-2025-01',source)
            plan,_=pilot.load_state(root)
            for fields in [{'state':'submitting'},{'state':'uncertain','requestId':'fixture-id'},
                {'state':'uncertain','requestId':'fixture-id','stagedRawSha256':'a'*64}]:
                entry=dict(fields,chunkId='hanle-2025-01')
                pilot.atomic_json(root/'remote-ledger.json',{'schemaVersion':1,'manifestSha256':pilot.plan_digest(plan),'entries':[entry]})
                with self.assertRaises(ValueError): download.reconcile_local(root,'hanle-2025-01')


class ResumeKnownTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name); plan=pilot.prepare(self.root)
        self.journal={'schemaVersion':1,'manifestSha256':pilot.plan_digest(plan),'entries':[
            {'chunkId':'hanle-2025-02','state':'queued','requestId':'fixture-id','submitSeconds':0.2}]}
        pilot.atomic_json(self.root/'remote-ledger.json',self.journal)
    def test_known_job_is_resumed_without_post_under_shared_lock(self):
        self.assertTrue(hasattr(download,'resume_known'),'known-job recovery missing')
        adapter=Adapter(); adapter.remote.request_id='fixture-id'
        adapter.resume=lambda request_id: adapter.remote
        def importer(root,chunk,source,**kwargs):
            self.assertTrue((root/'.writer.lock').exists())
            return {'chunkId':chunk,'complete':True}
        result=download.resume_known(self.root,'hanle-2025-02',adapter,importer=importer)
        self.assertTrue(result['complete']); self.assertEqual(adapter.submits,0)
        self.assertEqual(pilot.read_json(self.root/'remote-ledger.json')['entries'][0]['state'],'complete')
    def test_unproven_and_untracked_states_cannot_resume(self):
        self.assertTrue(hasattr(download,'resume_known'),'known-job recovery missing')
        for state,fields in [('submitting',{}),('downloading',{'requestId':'fixture-id'}),
            ('importing',{'requestId':'fixture-id'}),('uncertain',{}),
            ('uncertain',{'requestId':'fixture-id','failurePhase':'importing'})]:
            self.journal['entries']=[dict(fields,chunkId='hanle-2025-02',state=state)]
            pilot.atomic_json(self.root/'remote-ledger.json',self.journal)
            with self.assertRaises(ValueError): download.resume_known(self.root,'hanle-2025-02',Adapter())
    def test_known_job_resume_failure_preserves_identity_and_redacts(self):
        self.assertTrue(hasattr(download,'resume_known'),'known-job recovery missing')
        adapter=Adapter()
        def fail(request_id): raise RuntimeError('TOKEN SIGNED')
        adapter.resume=fail
        with self.assertRaises(ValueError) as caught: download.resume_known(self.root,'hanle-2025-02',adapter)
        entry=pilot.read_json(self.root/'remote-ledger.json')['entries'][0]
        self.assertEqual(entry['requestId'],'fixture-id'); self.assertEqual(entry['state'],'uncertain')
        self.assertNotIn('TOKEN',str(caught.exception)); self.assertEqual(adapter.submits,0)

if __name__=='__main__': unittest.main()
