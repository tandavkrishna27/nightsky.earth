import sys, tempfile, unittest, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/osm'))
import spot_runner as runner

class RunnerTests(unittest.TestCase):
    def test_logical_budget_counts_each_file_once_and_pending(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); (root/'raw').write_bytes(b'1234')
            budget=runner.Budget(root, max_bytes=8)
            self.assertEqual(budget.check(4),4)
            with self.assertRaises(ValueError): budget.check(5)
            budget.request(); budget.request()
            for _ in range(4): budget.request()
            with self.assertRaises(ValueError): budget.request()
    def test_deadline_and_one_active(self):
        with tempfile.TemporaryDirectory() as temp:
            budget=runner.Budget(Path(temp), clock=lambda:10)
            with budget.stage():
                with self.assertRaises(RuntimeError):
                    with budget.stage(): pass
            expired=runner.Budget(Path(temp), clock=lambda:10, started=-1000)
            with self.assertRaises(TimeoutError): expired.check()
    def test_rehearsal_is_exclusive_and_checkpoints_revalidated(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'wave'
            result=runner.rehearse(root)
            self.assertEqual(result['status'],'complete')
            self.assertEqual(len(result['sources']),3)
            self.assertEqual(runner.inspect_wave(root)['status'],'complete')
            with self.assertRaises(FileExistsError): runner.rehearse(root)
            next(root.glob('*/synthetic.json')).write_text('corrupt')
            with self.assertRaises(ValueError): runner.inspect_wave(root)
    def test_failure_stops_preserves_evidence_and_pending_is_uncertain(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'wave'; calls=[]
            def fail(source, folder, **kwargs):
                calls.append(source['id']); (folder/'partial').write_text('evidence'); raise ValueError('failure')
            result=runner.run_wave(root, acquire=fail, build=lambda *a,**k:None)
            self.assertEqual(result['status'],'failed'); self.assertEqual(len(calls),1)
            self.assertTrue((root/'monaco'/'partial').exists())
            self.assertEqual(runner.inspect_wave(root)['status'],'failed')
    def test_symlink_root_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); target=root/'target'; target.mkdir()
            try: (root/'link').symlink_to(target, target_is_directory=True)
            except OSError: self.skipTest('symlink privilege unavailable')
            with self.assertRaises(ValueError): runner.Budget(root/'link').check()

if __name__=='__main__': unittest.main()

class WindowsSupervisorTests(unittest.TestCase):
    @unittest.skipUnless(sys.platform=='win32','Windows Job enforcement requires Windows')
    def test_supervised_synthetic_worker_and_whole_root_disk(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); budget=runner.Budget(root)
            folder=root/'worker'; folder.mkdir()
            result=runner.supervise_worker(['--internal-worker','synthetic','--root',str(root),'--output',str(folder)],folder,budget)
            self.assertEqual(result['status'],'complete',result)
            self.assertTrue((folder/'synthetic-candidates.json').exists())
            (root/'prior').write_bytes(b'x'*4096)
            tiny=runner.Budget(root,max_bytes=100)
            with self.assertRaises(ValueError): runner.supervise_worker([],folder,tiny)

class RecoveryTests(unittest.TestCase):
    def test_interruption_is_uncertain_without_resumption(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'wave'
            def interrupted(source,folder,**kwargs):
                (folder/'interrupted.partial').write_bytes(b'kept')
                raise KeyboardInterrupt()
            with self.assertRaises(KeyboardInterrupt): runner.run_wave(root,acquire=interrupted,build=lambda *a,**k:None)
            result=runner.inspect_wave(root)
            self.assertEqual(result['status'],'uncertain'); self.assertFalse(result['resumeAllowed'])
            self.assertEqual(result['pendingStages'],[['monaco','acquisition']])
    def test_corrupt_journal_and_extra_files_rejected(self):
        for alteration in ['journal','extra','root']:
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp)/'wave'; runner.rehearse(root)
                if alteration=='journal': (root/'journal-001.json').write_text('{broken')
                elif alteration=='extra': (root/'extra').write_text('unexpected')
                else:
                    identity=json.loads((root/'identity.json').read_text()); identity['root']='elsewhere'
                    (root/'identity.json').write_text(json.dumps(identity))
                with self.assertRaises(ValueError): runner.inspect_wave(root)
    @unittest.skipUnless(sys.platform=='win32','Windows cleanup test')
    def test_timeout_stops_worker_and_releases_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); folder=root/'worker'; folder.mkdir()
            result=runner.supervise_worker(['--internal-worker','synthetic','--root',str(root),'--output',str(folder)],folder,runner.Budget(root),wall_seconds=.001)
            self.assertEqual(result['status'],'bounded-stop',result)
            folder.rename(root/'released')
    @unittest.skipIf(sys.platform=='win32','Linux unsupported-path test')
    def test_linux_supervisor_explicitly_unsupported(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(RuntimeError,'Windows-only'): runner.supervise_worker([],Path(temp),runner.Budget(Path(temp)))

class StrictLedgerTests(unittest.TestCase):
    def test_invalid_final_fields_and_forged_phase_order(self):
        for field,value in [('status','ready'),('httpRequests',True),('peakLogicalBytes',-1),('sources',[]),('enforcement','hard filesystem quota')]:
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp)/'wave'; runner.rehearse(root)
                report=json.loads((root/'report.json').read_text()); report[field]=value
                (root/'report.json').write_text(json.dumps(report))
                with self.assertRaises(ValueError): runner.inspect_wave(root)
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'wave'; runner.rehearse(root)
            (root/'report.json').unlink()
            journal=json.loads((root/'journal-001.json').read_text()); journal['phase']='build'
            (root/'journal-001.json').write_text(json.dumps(journal))
            with self.assertRaises(ValueError): runner.inspect_wave(root)

class ContainmentAndFinalPeakTests(unittest.TestCase):
    def test_exact_worker_traversal_repro_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            outer=Path(temp); wave=outer/'wave'; inside=wave/'inside'; inside.mkdir(parents=True)
            escaped=inside/'..'/'..'/'escaped'
            with self.assertRaises(ValueError): runner.worker_action('synthetic',wave,escaped)
            self.assertFalse((outer/'escaped').exists())
    def test_write_and_supervisor_traversal_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            outer=Path(temp); wave=outer/'wave'; inside=wave/'inside'; inside.mkdir(parents=True)
            budget=runner.Budget(wave)
            with self.assertRaises(ValueError): runner._write(inside/'..'/'..'/'escaped.json',{},budget)
            self.assertFalse((outer/'escaped.json').exists())
            if sys.platform=='win32':
                with self.assertRaises(ValueError): runner.supervise_worker([],inside/'..'/'..',budget)
                with self.assertRaises(ValueError): runner._safe('C:relative')
                with self.assertRaises(ValueError): runner._safe('\\relative')
    def test_acquired_path_traversal_stops_before_build(self):
        with tempfile.TemporaryDirectory() as temp:
            outer=Path(temp); external=outer/'external'; external.write_text('evidence')
            wave=outer/'wave'; calls=[]
            def acquire(source,folder,**kwargs):
                return dict(path=str(folder/'..'/'..'/'external'),synthetic=True)
            result=runner.run_wave(wave,acquire=acquire,build=lambda *a,**k:calls.append('build'))
            self.assertEqual(result['status'],'failed'); self.assertEqual(calls,[])
    def test_final_peak_includes_report_and_write_updates_peak(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); budget=runner.Budget(root)
            runner._write(root/'small.json',{'x':1},budget)
            self.assertGreaterEqual(budget.peak_bytes,runner.logical_bytes(root))
            wave=root/'wave'; result=runner.rehearse(wave)
            self.assertGreaterEqual(result['peakLogicalBytes'],runner.logical_bytes(wave))
            self.assertEqual(runner.inspect_wave(wave)['status'],'complete')

class WindowsAnchoredArtifactTests(unittest.TestCase):
    @unittest.skipUnless(sys.platform=='win32','Windows drive/root path semantics')
    def test_root_relative_and_drive_relative_artifacts_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); marker=root/'outside'; marker.write_bytes(b'kept')
            for relative in ['C:foo', '\\foo', str(marker)]:
                with self.assertRaises(ValueError):
                    runner._verify_artifacts(root,[dict(path=relative,bytes=4,sha256='0'*64)])
            self.assertEqual(marker.read_bytes(),b'kept')
