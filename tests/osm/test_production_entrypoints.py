"""Production boundary tests; all inputs are tiny reserved-domain fixtures."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts/osm'))
import global_source as raw
import test_global_source_pipeline as fixtures


class ProductionEntrypoints(unittest.TestCase):
    def setUp(self):
        self.fixture=fixtures.Pipeline();self.fixture.setUp();self.addCleanup(self.fixture.doCleanups)
        self.manifest=self.fixture.manifest([self.fixture.node()])
        self.path=self.fixture.root/'manifest.json';self.path.write_text(json.dumps(self.manifest),encoding='utf8')

    def test_raw_cli_requires_admission_before_creating_output(self):
        out=self.fixture.root/'out'
        result=subprocess.run([sys.executable,str(Path(raw.__file__)),str(self.path),str(out)],capture_output=True,timeout=10)
        self.assertNotEqual(result.returncode,0);self.assertIn(b'--admission',result.stderr);self.assertFalse(out.exists())

    def test_manifest_cannot_self_select_an_admission_or_trust_policy(self):
        for key in ('admission','trustedPolicy','trustedReviews','fixture'):
            with self.subTest(key=key),self.assertRaisesRegex(ValueError,'schema'):
                raw.validate_manifest({**self.manifest,key:True})

    def test_snapshot_is_preserved_in_checkpoint_completion_and_resume(self):
        phases=[];snapshot='a'*64
        out=raw.build(self.manifest,self.fixture.root/'out',admission_check=phases.append,admission_snapshot=snapshot)
        for name in ('checkpoint.json','complete.json'):
            self.assertEqual(json.loads((out/name).read_text())['admissionSnapshotSha256'],snapshot)
        self.assertEqual(phases,['raw-before','raw-after'])
        with self.assertRaisesRegex(ValueError,'admission identity'):
            raw.build(self.manifest,out,resume=True,admission_check=lambda _:None,admission_snapshot='b'*64)
        raw.build(self.manifest,out,resume=True,admission_check=phases.append,admission_snapshot=snapshot)
        self.assertEqual(phases[-1],'resume')
        # An unbound library call cannot resume an admitted production output.
        with self.assertRaisesRegex(ValueError,'admission identity'):
            raw.build(self.manifest,out,resume=True)

    def test_revoked_or_mutated_admission_before_completion_never_completes(self):
        out=self.fixture.root/'out'
        def reject(phase):
            if phase=='raw-after':raise ValueError('changed admission snapshot')
        with self.assertRaisesRegex(ValueError,'changed admission'):
            raw.build(self.manifest,out,admission_check=reject,admission_snapshot='a'*64)
        self.assertFalse((out/'complete.json').exists())
        self.assertTrue((out/'checkpoint.json').exists())
        self.assertTrue((out/'lineage.jsonl').exists())

    def test_restored_raw_bytes_with_changed_file_witness_fail_closed(self):
        path=Path(self.manifest['sources'][0]['path']);original=path.read_bytes();before=path.stat()
        def mutate(_):
            path.write_bytes(original+b' ');path.write_bytes(original)
            os.utime(path,ns=(before.st_atime_ns,before.st_mtime_ns+1000000))
        out=self.fixture.root/'out'
        with self.assertRaisesRegex(ValueError,'changed between passes'):
            raw.build(self.manifest,out,hook=mutate,admission_check=lambda _:None,admission_snapshot='a'*64)
        self.assertFalse((out/'complete.json').exists())

    @unittest.skipUnless(os.name=='nt','Windows production deny-write/delete leases')
    def test_windows_raw_leases_prevent_write_and_delete_without_second_copy(self):
        path=Path(self.manifest['sources'][0]['path']);body=path.read_bytes()
        with raw.admitted_raw_leases(self.manifest['sources']):
            self.assertEqual(path.read_bytes(),body)
            with self.assertRaises(OSError):path.write_bytes(body)
            with self.assertRaises(OSError):path.unlink()
        path.write_bytes(body)

    def test_production_stage_commands_carry_same_snapshot_and_exact_manifest(self):
        from supervised_membership_assembly import production_commands
        commands=production_commands(self.path,self.fixture.root/'job',self.fixture.root/'plan.json','b'*64,self.path.read_bytes(),'selected-references','node',sys.executable,self.fixture.root/'admission.json','c'*64,'d'*64)
        self.assertEqual(len(commands),3)
        for command in commands:
            self.assertIn('--admission',command);self.assertIn('d'*64,command)
        self.assertEqual(commands[1][2],str(self.path))
        self.assertIn('--manifest',commands[2])
        self.assertIn('selected-references',commands[1])

    def test_legacy_direct_bridge_rejects_before_creating_any_job(self):
        from global_source_supervisor import pipeline
        regions=self.fixture.root/'regions.jsonl';regions.write_bytes(b'')
        footprints=self.fixture.root/'footprints.jsonl';footprints.write_bytes(b'')
        root=self.fixture.root/'job'
        with self.assertRaisesRegex(ValueError,'Production source policy requires'):
            pipeline(self.path,root,regions,footprints,{})
        self.assertFalse(root.exists())

    def test_assembly_library_rejects_missing_production_admission_before_job(self):
        from supervised_membership_assembly import assembly_pipeline
        from test_membership_assembly import Assembly
        _,plan,save=Assembly().setup_plan(self.fixture)
        root=self.fixture.root/'job'
        with self.assertRaises((ValueError,TypeError,RuntimeError)):
            assembly_pipeline(self.path,root,plan,save(),dict(wallSeconds=30,rssBytes=256*1024**2,commitBytes=512*1024**2,diskBytes=20000000,freeBytes=0,maxProcesses=2))
        self.assertFalse(root.exists())


if __name__=='__main__':unittest.main()
