import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'era5'))
import global_acquisition as g


def packet():
    row = json.loads((Path(__file__).resolve().parents[2] / 'docs/operations/data-pilot-evidence/2026-10-16-grouped-global-baseline-plan.json').read_text())['results'][0]['prefix'][0]
    return g.build_packet([row], source_pins={'frozenPlan': 'a'*64, 'reconciliation': 'b'*64}, runtime_pins={'python': 'fixture', 'code': 'c'*64}, asset_hosts=['assets.example'])


class Response:
    def __init__(self, body, status=200, headers=None):
        self.body = body; self.status = status
        self.headers = headers or {'Content-Length': str(len(body))}
    def blocks(self):
        for i in range(0, len(self.body), 65536): yield self.body[i:i+65536]
    def close(self): pass


class Transport:
    fixture_only = True
    def __init__(self, body=b'fixture'):
        self.body = body; self.submits = 0; self.polls = 0; self.opens = 0
    def submit(self, dataset, request, **kwargs):
        self.submits += 1
        return Response(b'{"jobId":"job-1"}')
    def status(self, job, **kwargs):
        self.polls += 1
        return Response(b'{"status":"successful"}')
    def result(self, job, **kwargs):
        return Response(json.dumps({'url':'https://assets.example/data','size':len(self.body)}).encode())
    def open_asset(self, url, **kwargs):
        assert kwargs['authenticated'] is False and kwargs['redirects'] is False
        self.opens += 1
        return Response(self.body)


class GlobalTests(unittest.TestCase):
    def test_disk_sampler_accepts_disappearing_stage_but_not_permission_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);stage=root/'state.pending';stage.write_bytes(b'abc')
            original=Path.stat;original_is_file=Path.is_file;removed=[False]
            def race(path,*args,**kwargs):
                # Path.is_file uses cached/native metadata on newer Python;
                # counting internal stat calls does not reliably trigger a race.
                if path==stage and not removed[0]:
                    removed[0]=True;stage.unlink()
                    raise FileNotFoundError('ordinary atomic replacement')
                return original_is_file(path,*args,**kwargs)
            with patch.object(Path,'is_file',race): self.assertEqual(g.tree_bytes(root),0)
            self.assertTrue(removed[0])
            stage.write_bytes(b'abc')
            def denied(path,*args,**kwargs):
                if path==stage: raise PermissionError('must not suppress')
                return original(path,*args,**kwargs)
            with patch.object(Path,'stat',denied),self.assertRaises(PermissionError): g.tree_bytes(root)

    def test_global_packet_rejects_identity_cell_and_partition_mutation(self):
        p = packet(); self.assertEqual(p['jobs'][0]['tileId'], '100:213')
        for field, value in [('sha256','0'*64),('expectedCells',['era5:0:0']),('partitions',[])]:
            row = copy.deepcopy(p['jobs'][0]); row[field] = value
            with self.assertRaises(ValueError):
                g.build_packet([row], source_pins=p['sourcePins'], runtime_pins=p['runtimePins'], asset_hosts=p['assetHosts'])

    def test_submission_uncertainty_consumes_claim_across_output_roots(self):
        class Broken(Transport):
            def submit(self, *args, **kwargs):
                self.submits += 1; raise RuntimeError('lost receipt')
        with tempfile.TemporaryDirectory() as tmp:
            p=packet(); t=Broken(); authority=Path(tmp)/'authority'
            with self.assertRaises(RuntimeError): g.run_fixture(authority,Path(tmp)/'one',p,t)
            with self.assertRaises(ValueError): g.run_fixture(authority,Path(tmp)/'two',p,t)
            self.assertEqual(t.submits,1)
            state=json.loads((authority/g.identity(p)/'state.json').read_text())
            self.assertEqual(state['submissions'],1)
            self.assertEqual(state['jobs'][0]['phase'],'submit-uncertain')

    def test_metadata_limit_is_charged_and_never_resubmitted(self):
        class Huge(Transport):
            def submit(self,*args,**kwargs):
                self.submits+=1; return Response(b'x'*(g.METADATA_LIMIT+1))
        with tempfile.TemporaryDirectory() as tmp:
            p=packet(); t=Huge(); authority=Path(tmp)/'authority'
            with self.assertRaises(ValueError): g.run_fixture(authority,Path(tmp)/'one',p,t)
            state=json.loads((authority/g.identity(p)/'state.json').read_text())
            self.assertGreater(state['metadataBytes'],0)
            with self.assertRaises(ValueError): g.run_fixture(authority,Path(tmp)/'one',p,t)
            self.assertEqual(t.submits,1)

    def test_exact_asset_size_and_host_reject_before_decode(self):
        class BadHost(Transport):
            def result(self,*args,**kwargs): return Response(b'{"url":"https://evil.example/data","size":7}')
        class BadSize(Transport):
            def open_asset(self,*args,**kwargs): return Response(b'short',headers={'Content-Length':'7'})
        for t in [BadHost(),BadSize()]:
            with self.subTest(kind=type(t).__name__), tempfile.TemporaryDirectory() as tmp:
                with self.assertRaises(ValueError): g.run_fixture(Path(tmp)/'a',Path(tmp)/'o',packet(),t)
                self.assertFalse(list((Path(tmp)/'o').rglob('ledger.json')))

    def test_live_entry_fails_before_transport_or_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError): g.run_live(Path(tmp)/'a',Path(tmp)/'o',packet(),Transport())
            self.assertEqual(list(Path(tmp).iterdir()),[])

    def test_live_adapter_uses_separate_tokenless_session_and_no_redirects(self):
        class Session:
            def __init__(self):
                self.headers={};self.cookies={};self.calls=[]
            def request(self,*args,**kwargs):
                self.calls.append((args,kwargs))
                response=Response(b'{}');response.status_code=200;response.iter_content=lambda size:iter([b'{}'])
                return response
            def close(self): pass
        sessions=[]
        def factory():
            result=Session();sessions.append(result);return result
        adapter=g.LiveTransport('test-token',factory)
        adapter.submit('reanalysis-era5-single-levels',{},timeout=3).close()
        adapter.open_asset('https://assets.example/data',timeout=3,authenticated=False,redirects=False).close()
        self.assertEqual(sessions[0].headers,{'PRIVATE-TOKEN':'test-token'})
        self.assertEqual(sessions[1].headers,{})
        self.assertFalse(sessions[1].trust_env)
        self.assertFalse(sessions[1].calls[0][1]['allow_redirects'])

    @unittest.skipUnless(importlib.util.find_spec('netCDF4'), 'retained ERA5 environment required')
    def test_worldwide_decode_keeps_parent_children_and_nulls(self):
        import netCDF4
        import numpy as np
        from datetime import datetime
        with tempfile.TemporaryDirectory() as tmp:
            p=packet();row=p['jobs'][0];raw=Path(tmp)/'fixture.nc'
            with netCDF4.Dataset(raw,'w') as ds:
                for name,size in [('valid_time',48),('latitude',2),('longitude',2)]: ds.createDimension(name,size)
                t=ds.createVariable('valid_time','i8',('valid_time',));t.units='seconds since 1970-01-01';t[:]=[datetime.fromisoformat(f'1990-12-{d}T{h:02}:00:00+00:00').timestamp() for d in [30,31] for h in range(24)]
                ds.createVariable('latitude','f8',('latitude',))[:]=[-40,-39.75]
                ds.createVariable('longitude','f8',('longitude',))[:]=[-73.5,-73.25]
                ds.createVariable('number','i8').assignValue(0)
                ds.createVariable('expver',str)[...]=np.array('0001',dtype=object)
                c=ds.createVariable('tcc','f4',('valid_time','latitude','longitude'));c.units='1';c.standard_name='cloud_area_fraction';values=np.full((48,2,2),.25,dtype=np.float32);values[0,0,0]=np.nan;c[:]=values
            result=g.run_fixture(Path(tmp)/'authority',Path(tmp)/'output',p,Transport(raw.read_bytes()))
            self.assertTrue(result['complete'])
            entry=result['jobs'][0]['lineage'];self.assertEqual(entry['sourceRows'],48)
            child=entry['partitions'][0];self.assertEqual(child['rawSha256'],hashlib.sha256(raw.read_bytes()).hexdigest())
            lines=(Path(tmp)/'output'/row['sha256']/child['path']).read_text().splitlines()
            self.assertIsNone(json.loads(lines[1])['values'][0])
            for variable,values in [('latitude',[-40.25,-40]),('valid_time',np.arange(48))]:
                with netCDF4.Dataset(raw,'a') as ds: ds.variables[variable][:]=values
                with self.assertRaises(ValueError): g.run_fixture(Path(tmp)/('authority-'+variable),Path(tmp)/('output-'+variable),p,Transport(raw.read_bytes()))
                # Restore coordinates so the second case isolates timestamps.
                with netCDF4.Dataset(raw,'a') as ds: ds.variables['latitude'][:]=[-40,-39.75]

    def test_allowance_rejects_wrong_packet_before_credentials(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'allowance.json';path.write_text('{}')
            with self.assertRaises(ValueError): g.read_allowance(path,hashlib.sha256(path.read_bytes()).hexdigest(),packet(),Path(tmp)/'o')

    def test_overlay_admits_exact_replacements_and_retained_owner_remainder(self):
        evidence=Path(__file__).resolve().parents[2]/'docs/operations/data-pilot-evidence'
        fixture=json.loads((evidence/'2026-10-16-history-ownership-replan-fixture.json').read_text())
        overlay=json.loads((evidence/'2026-10-16-history-ownership-replan.json').read_text())
        with tempfile.TemporaryDirectory() as tmp:
            sources={'frozenPlan':fixture['plan'],'reconciliation':fixture['reconciliation'],'ownershipOverlay':overlay}
            p=packet();paths={k:str(Path(tmp)/(k+'.json')) for k in sources}
            def write():
                for k in sources:
                    if k=='reconciliation': sources[k]['frozenPlanSha256']=p['sourcePins']['frozenPlan']
                    if k=='ownershipOverlay':
                        sources[k]['frozenPlanSha256']=p['sourcePins']['frozenPlan']
                        sources[k]['reconciliationSha256']=p['sourcePins']['reconciliation']
                    Path(paths[k]).write_text(g.canonical(sources[k]))
                    p['sourcePins'][k]=hashlib.sha256(Path(paths[k]).read_bytes()).hexdigest()
            p['jobs']=copy.deepcopy(overlay['replacements']);write()
            g.verify_sources(p,paths)
            # An exact old owner may resume only outside the replaced day.
            tile=fixture['plan']['tiles'][1];row=copy.deepcopy(p['jobs'][0])
            row.update({k:tile[k] for k in ['tileId','expectedCells','requiredCells','fillerCells']})
            row['request']['area']=tile['area'];row['request']['day']=['31'];row['scalarCellHours']=len(row['expectedCells'])*24
            row['sha256']=g.identity({k:row[k] for k in ['dataset','revision','member','request']})
            p['jobs']=[row];g.verify_sources(p,paths)
            row['request']['day']=['30'];row['sha256']=g.identity({k:row[k] for k in ['dataset','revision','member','request']})
            with self.assertRaises(ValueError): g.verify_sources(p,paths)
            p['jobs']=copy.deepcopy(overlay['replacements'])
            original=copy.deepcopy(sources)
            def shrink_filler_rectangle(s):
                changed=s['ownershipOverlay']['replacements'][-1]
                changed['request']['area'][3]=49.5;changed['area'][3]=49.5
                removed=[c for c in changed['expectedCells'] if c.endswith(':49.75')]
                changed['expectedCells']=[c for c in changed['expectedCells'] if c not in removed]
                changed['fillerCells']=[c for c in changed['fillerCells'] if c not in removed]
                changed['scalarCellHours']=96
                changed['sha256']=g.identity({k:changed[k] for k in ['dataset','revision','member','request']})
                s['ownershipOverlay']['removedFillerCells']=sorted(s['ownershipOverlay']['removedFillerCells']+removed)
                p['jobs']=copy.deepcopy(s['ownershipOverlay']['replacements'])
            sources=copy.deepcopy(original);shrink_filler_rectangle(sources);write()
            with self.assertRaises(ValueError): g.verify_sources(p,paths)
            p['jobs']=copy.deepcopy(overlay['replacements'])
            mutations=[
                lambda s:s['ownershipOverlay']['ownerOverrides'][0]['overrides'].clear(),
                lambda s:s['ownershipOverlay']['replacements'].pop(),
                lambda s:s['ownershipOverlay']['replacements'].append(copy.deepcopy(s['ownershipOverlay']['replacements'][0])),
                lambda s:s['ownershipOverlay']['removedFillerCells'].clear(),
                lambda s:s['reconciliation']['cells'][0]['hoursUtc'].pop(),
                lambda s:s['ownershipOverlay']['resolvedBlockedTileIds'].append('100:213'),
                lambda s:s['ownershipOverlay']['replacements'][0]['requiredCells'].clear(),
            ]
            for mutate in mutations:
                sources=copy.deepcopy(original);mutate(sources);write()
                with self.assertRaises(ValueError): g.verify_sources(p,paths)
            sources=copy.deepcopy(original);write()
            p['jobs'][0]['request']['day']=['31']
            p['jobs'][0]['sha256']=g.identity({k:p['jobs'][0][k] for k in ['dataset','revision','member','request']})
            with self.assertRaises(ValueError): g.verify_sources(p,paths)

    def test_source_pins_bind_frozen_ownership_and_reconciled_missing_masks(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=packet();row=p['jobs'][0]
            plan=dict(tiles=[dict(tileId=row['tileId'],area=row['request']['area'],expectedCells=row['expectedCells'],requiredCells=row['requiredCells'],fillerCells=row['fillerCells'],overrides=[])],calendarTemplates=[{k:row['request'][k] for k in ['year','month','day','time']}])
            paths={k:str(Path(tmp)/(k+'.json')) for k in ['frozenPlan','reconciliation']}
            Path(paths['frozenPlan']).write_text(g.canonical(plan));p['sourcePins']['frozenPlan']=hashlib.sha256(Path(paths['frozenPlan']).read_bytes()).hexdigest()
            receipt=dict(frozenPlanSha256=p['sourcePins']['frozenPlan'],blockedTiles=[],updatedOverrides=[])
            def write_receipt():
                Path(paths['reconciliation']).write_text(g.canonical(receipt));p['sourcePins']['reconciliation']=hashlib.sha256(Path(paths['reconciliation']).read_bytes()).hexdigest()
            write_receipt();g.verify_sources(p,paths)
            acceptance=Path(tmp)/'provider.json'
            accepted=dict(packetSha256=g.identity(p),acceptedRequestSha256=[row['sha256']],currentProviderFormReviewed=True)
            acceptance.write_text(g.canonical(accepted))
            allowance=dict(schemaVersion=1,allowExecution=True,packetSha256=g.identity(p),outputRoot=str(Path(tmp)/'out'),authorityRoot=str(Path(tmp)/'authority'),sourcePaths=paths,providerAcceptance=dict(path=str(acceptance),sha256=hashlib.sha256(acceptance.read_bytes()).hexdigest()))
            owner=Path(tmp)/'owner.json';owner.write_text(g.canonical(allowance));owner_sha=hashlib.sha256(owner.read_bytes()).hexdigest()
            with patch.object(g,'installed_runtime',return_value=p['runtimePins']):
                self.assertEqual(g.read_allowance(owner,owner_sha,p,Path(tmp)/'out')['authorityRoot'],str(Path(tmp)/'authority'))
                acceptance.write_text('{}')
                with self.assertRaises(ValueError): g.read_allowance(owner,owner_sha,p,Path(tmp)/'out')
            receipt['blockedTiles']=[{'tileId':row['tileId']}];write_receipt()
            with self.assertRaises(ValueError): g.verify_sources(p,paths)
            receipt['blockedTiles']=[];receipt['updatedOverrides']=[dict(tileId=row['tileId'],overrides=[dict(template=0,shapes=[])])];write_receipt()
            with self.assertRaises(ValueError): g.verify_sources(p,paths)
            Path(paths['reconciliation']).write_text('{}')
            with self.assertRaises(ValueError): g.verify_sources(p,paths)

    @unittest.skipUnless(os.name=='nt','live supervisor requires Windows')
    def test_supervisor_launches_suspended_inside_job_with_original_deadline(self):
        class Job:
            def __init__(self,*limits): self.limits=limits;self.assigned=False
            def assign_resume(self,child): self.assigned=True
            def stop(self): pass
            def drain(self,**kwargs): pass
            def close(self): pass
        class Child:
            returncode=0
            def poll(self): return 0
            def wait(self,**kwargs): pass
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);p=packet();packet_path=root/'packet.json';packet_path.write_text(g.canonical(p))
            allowance_path=root/'owner.json';allowance_path.write_text('{}')
            fake=type('Supervisor',(),{'WindowsJob':Job,'rss_bytes':lambda child:0})
            with patch.dict(sys.modules,{'global_source_supervisor':fake}), patch.object(g,'read_allowance',return_value={'authorityRoot':str(root/'authority')}), patch.object(g.shutil,'disk_usage',return_value=type('Disk',(),{'free':200*1024**3})), patch.object(g.subprocess,'Popen',return_value=Child()) as popen:
                g.supervise(packet_path,hashlib.sha256(packet_path.read_bytes()).hexdigest(),allowance_path,'0'*64,root/'output')
                self.assertEqual(popen.call_args.kwargs['creationflags'],4)
                self.assertEqual(popen.call_args.args[0][0],sys._base_executable)
                self.assertTrue(Path(str(allowance_path)+'.consumed').exists())
                with self.assertRaises(ValueError): g.supervise(packet_path,hashlib.sha256(packet_path.read_bytes()).hexdigest(),allowance_path,'0'*64,root/'output')
            class BadJob(Job):
                def assign_resume(self,child): raise ValueError('assignment failed')
            class Suspended(Child):
                killed=False
                def poll(self): return None if not self.killed else 1
                def kill(self): self.killed=True
            child=Suspended();fake.WindowsJob=BadJob
            second=root/'second-owner.json';second.write_text('{}')
            with patch.dict(sys.modules,{'global_source_supervisor':fake}), patch.object(g,'read_allowance',return_value={'authorityRoot':str(root/'authority')}), patch.object(g.shutil,'disk_usage',return_value=type('Disk',(),{'free':200*1024**3})), patch.object(g.subprocess,'Popen',return_value=child):
                with self.assertRaisesRegex(ValueError,'assignment failed'): g.supervise(packet_path,hashlib.sha256(packet_path.read_bytes()).hexdigest(),second,'0'*64,root/'second-output')
                self.assertTrue(child.killed)

    def test_poll_allowance_and_shared_deadline_do_not_reset(self):
        class Queued(Transport):
            def status(self,*args,**kwargs):
                self.polls+=1; return Response(b'{"status":"queued"}')
        for elapsed in [0,1801]:
            with tempfile.TemporaryDirectory() as tmp:
                now=[1000.]; t=Queued()
                def clock(): return now[0]
                def sleep(seconds): now[0]+=seconds
                if elapsed:
                    original=t.submit
                    def submit(*args,**kwargs):
                        response=original(*args,**kwargs); now[0]+=elapsed; return response
                    t.submit=submit
                with self.assertRaises(ValueError): g.run_fixture(Path(tmp)/'a',Path(tmp)/'o',packet(),t,clock=clock,sleep=sleep)
                self.assertLessEqual(t.polls,20)
                self.assertEqual(t.polls,0 if elapsed else 20)
                self.assertEqual(t.submits,1)


if __name__ == '__main__': unittest.main()
