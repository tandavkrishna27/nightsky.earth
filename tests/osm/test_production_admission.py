import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]/'scripts/osm'))
import production_admission as admission


class ProductionAdmissionBridgeTests(unittest.TestCase):
    def result(self, manifest, envelope, phase='raw-before'):
        return dict(schemaVersion=1, productionAdmitted=True, phase=phase,
                    snapshotSha256='a'*64, manifest=dict(path=str(manifest), bytes=2, sha256='1'*64),
                    assemblyPlan=dict(path=str(manifest), bytes=2, sha256='1'*64),
                    admission=dict(path=str(envelope), bytes=2, sha256='2'*64),
                    metadataPins=[], geometryPins=[],
                    codePins=[admission._pin(admission.REPO/path) for path in admission.CODE_FILES]+[admission._pin(admission.LOADER)])

    def test_fixed_local_code_loader_and_phase_are_bound_and_rechecked(self):
        with tempfile.TemporaryDirectory() as folder:
            manifest=Path(folder)/'manifest.json';manifest.write_text('{}')
            envelope=Path(folder)/'admission.json';envelope.write_text('{}')
            result=self.result(manifest,envelope)
            calls=[]
            def gate(command, request):
                calls.append((command,json.loads(request)))
                return 0,json.dumps(result).encode(),b''
            with patch.object(admission,'_run_gate',side_effect=gate):
                checked=admission.verify_production_admission(manifest,envelope,'b'*64,'raw-before',expected_snapshot='a'*64)
            self.assertEqual(checked['snapshotSha256'],'a'*64)
            command,request=calls[0]
            self.assertIn(str(admission.safe_path(admission.SCRIPT)),command)
            self.assertIn(admission.safe_path(admission.LOADER).as_uri(),command)
            self.assertEqual(request['phase'],'raw-before')
            self.assertNotIn('policy',request);self.assertNotIn('trust',request)
            self.assertEqual(request['expectedSnapshot'],'a'*64)
            self.assertEqual(len(admission.production_admission_retained_paths(checked)),len(admission.CODE_FILES)+3)

    def test_unknown_phase_missing_pin_and_candidate_context_are_not_execution_paths(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError,'file and SHA-256 required'):
                admission.verify_production_admission(folder,None,None,'preflight')
            with self.assertRaises(ValueError):
                admission.verify_production_admission(folder,folder,'0'*64,'unknown')
            with self.assertRaises(ValueError):
                admission.verify_production_admission(folder,folder,'bad','preflight')
            with self.assertRaises(TypeError):
                admission.verify_production_admission(folder,folder,'0'*64,'preflight',policy={})

    def test_refusal_invalid_response_wrong_phase_code_and_stale_snapshot_fail_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            manifest=Path(folder)/'manifest.json';manifest.write_text('{}')
            envelope=Path(folder)/'admission.json';envelope.write_text('{}')
            valid=self.result(manifest,envelope)
            wrong_phase={**valid,'phase':'resume'}
            wrong_code={**valid,'codePins':[]}
            stale={**valid,'snapshotSha256':'c'*64}
            cases=[(2,b'{"productionAdmitted":false,"error":"trusted reviews missing"}'),(0,b'not-json'),
                   (0,json.dumps(wrong_phase).encode()),(0,json.dumps(wrong_code).encode()),
                   (0,json.dumps(stale).encode())]
            for status,body in cases:
                with self.subTest(status=status,body=body[:100]):
                    with patch.object(admission,'_run_gate',return_value=(status,body,b'')):
                        with self.assertRaises(ValueError):
                            admission.verify_production_admission(manifest,envelope,'b'*64,'raw-before',expected_snapshot='a'*64)

    def test_changed_executable_context_after_child_does_not_issue_snapshot(self):
        with tempfile.TemporaryDirectory() as folder:
            manifest=Path(folder)/'manifest.json';manifest.write_text('{}')
            envelope=Path(folder)/'admission.json';envelope.write_text('{}')
            result=self.result(manifest,envelope)
            real_pin=admission._pin
            changed=[False]
            def pin(path,*args,**kwargs):
                result=real_pin(path,*args,**kwargs)
                if changed[0] and Path(path)==admission.SCRIPT:
                    result['sha256']='e'*64
                return result
            def gate(*args):
                changed[0]=True
                return 0,json.dumps(result).encode(),b''
            with patch.object(admission,'_pin',side_effect=pin):
                with patch.object(admission,'_run_gate',side_effect=gate):
                    with self.assertRaisesRegex(ValueError,'executable context changed'):
                        admission.verify_production_admission(manifest,envelope,'b'*64,'raw-before')

    def test_membership_dependency_mutations_during_gate_refuse_snapshot(self):
        dependencies=('scripts/osm/membership-assembly.ts','scripts/osm/boundary-metadata.ts',
                      'scripts/osm/partitioned-boundaries.ts','scripts/osm/geographic-geometry.ts',
                      'scripts/osm/build-source-catalogue.ts','scripts/osm/source-build-config.ts',
                      'scripts/osm/build-streamed-catalogue.ts','scripts/osm/normalized-input-bytes.ts',
                      'server/places/catalogueFormat.ts','shared/nightsky/discovery.ts',
                      'shared/nightsky/common.ts','shared/nightsky/places.ts')
        with tempfile.TemporaryDirectory() as folder:
            manifest=Path(folder)/'manifest.json';manifest.write_text('{}')
            envelope=Path(folder)/'admission.json';envelope.write_text('{}')
            for dependency in dependencies:
                with self.subTest(dependency=dependency):
                    result=self.result(manifest,envelope,phase='assembly-before')
                    original=admission._pin
                    changed=False
                    def pin(path,*args,**kwargs):
                        value=original(path,*args,**kwargs)
                        if changed and Path(path)==admission.REPO/dependency:
                            value['sha256']='e'*64
                        return value
                    def gate(*args):
                        nonlocal changed
                        changed=True
                        return 0,json.dumps(result).encode(),b''
                    with patch.object(admission,'_pin',side_effect=pin):
                        with patch.object(admission,'_run_gate',side_effect=gate):
                            with self.assertRaisesRegex(ValueError,'executable context changed'):
                                admission.verify_production_admission(manifest,envelope,'b'*64,'assembly-before')

    def test_bounded_synthetic_subprocess_output_is_stopped(self):
        executable=getattr(sys,'_base_executable',sys.executable)
        with self.assertRaisesRegex(ValueError,'output exceeded'):
            admission._run_gate([executable,'-I','-S','-B','-c',
                'import sys;sys.stdout.write("x"*(1024*1024+1));sys.stdout.flush()'],'unused')

    def test_actual_fixed_node_entry_refuses_missing_envelope_without_outputs(self):
        with tempfile.TemporaryDirectory() as folder:
            manifest=Path(folder)/'manifest.json';manifest.write_text('{}')
            envelope=Path(folder)/'absent-admission.json'
            with self.assertRaises(ValueError):
                admission.verify_production_admission(manifest,envelope,'0'*64,'preflight')
            self.assertEqual(list(Path(folder).iterdir()),[manifest])

    @unittest.skipUnless(os.name=='nt','Windows Job process ceiling')
    def test_actual_gate_uses_only_python_and_node_under_two_process_job(self):
        from global_source_supervisor import WindowsJob
        code='''import sys,json,os
from pathlib import Path
sys.path.insert(0,sys.argv[1])
import production_admission as p
root=Path(sys.argv[2]);calls=[];original=p._run_gate
def gate(command,request):
    result=original(command,request)
    calls.append(dict(exitCode=result[0],stdout=result[1].decode(errors='replace')[:1200],stderr=result[2].decode(errors='replace')[:1200]))
    return result
p._run_gate=gate
try:
    p.verify_production_admission(root/'manifest.json',root/'missing.json','0'*64,'preflight')
    error='UNEXPECTED-ADMISSION'
except Exception as exc:
    error=type(exc).__name__+': '+str(exc)[:1200]
payload=json.dumps(dict(error=error,calls=calls)).encode()
assert len(payload)<=4096
with (root/'child-result.json').open('xb') as handle:
    handle.write(payload);handle.flush();os.fsync(handle.fileno())
'''
        with tempfile.TemporaryDirectory(prefix='production-gate-cold-temp-') as folder:
            root=admission.safe_path(folder)
            (root/'manifest.json').write_text('{}')
            environment={key:value for key,value in os.environ.items()
                         if key.upper() in ('SYSTEMROOT','WINDIR','PATH')}
            environment.update(TEMP=str(root),TMP=str(root))
            job=WindowsJob(4*1024**3,2)
            process=None
            try:
                process=subprocess.Popen([getattr(sys,'_base_executable',sys.executable),
                    '-I','-S','-B','-c',code,str(admission.REPO/'scripts/osm'),str(root)],
                    env=environment,creationflags=4,stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
                job.assign_resume(process)
                process.wait(timeout=20)
            finally:
                try:
                    if process is not None and process.poll() is None:
                        try:job.stop()
                        finally:
                            if process.poll() is None:process.kill()
                            process.wait(timeout=3)
                    job.drain(timeout=3)
                finally:
                    job.close()
                    if process is not None:process._handle.Close()
            self.assertEqual(process.returncode,0)
            diagnostic=json.loads((root/'child-result.json').read_text())
            self.assertEqual(diagnostic['calls'][0]['exitCode'],2,diagnostic)
            self.assertFalse(json.loads(diagnostic['calls'][0]['stdout'])['productionAdmitted'])
            self.assertIn('missing.json',diagnostic['error'])
            self.assertNotIn('spawn UNKNOWN',diagnostic['calls'][0]['stderr'])


if __name__=='__main__':
    unittest.main()
