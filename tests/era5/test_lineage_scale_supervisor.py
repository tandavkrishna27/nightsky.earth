"""Offline configuration and containment regression fixtures; no scale run."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[2] / 'scripts/era5/measure_lineage_scale.py'
spec = importlib.util.spec_from_file_location('lineage_scale_supervisor', SCRIPT)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class Configuration(unittest.TestCase):
    def config(self, root):
        worker = root / 'scripts/era5/verify-lineage-scale.ts'
        worker.parent.mkdir(parents=True)
        worker.write_text('// synthetic fixture', encoding='utf-8')
        (root / 'package-lock.json').write_text('{}', encoding='utf-8')
        bundle = root / 'worker.mjs'
        bundle.write_text('// bundled synthetic fixture', encoding='utf-8')
        interpreter = Path(sys.executable).resolve()
        value = dict(repository=str(root), node=str(interpreter), output=str(root / 'output'),
                     pins=[dict(path=name, sha256=runner.digest(root / name)) for name in
                           ['scripts/era5/verify-lineage-scale.ts', 'package-lock.json']],
                     workerArguments=[], workerBundle=str(bundle), runtimePins=[
                         dict(path=str(interpreter), sha256=runner.digest(interpreter)),
                         dict(path=str(bundle), sha256=runner.digest(bundle))])
        config = root / 'config.json'
        config.write_text(json.dumps(value), encoding='utf-8')
        return config, value

    def test_pins_and_strict_arguments(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            path, value = self.config(root)
            self.assertEqual(runner.load_config(path, runner.digest(path)), value)
            with self.assertRaisesRegex(ValueError, 'Pinned proof'):
                runner.load_config(path, '0' * 64)
            value['workerArguments'] = ['--output=elsewhere']
            path.write_text(json.dumps(value), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'replace proof output'):
                runner.load_config(path, runner.digest(path))

    def test_changed_source_and_missing_dependency_pin(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            path, value = self.config(root)
            (root / 'package-lock.json').write_text('changed', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'source pin mismatch'):
                runner.load_config(path, runner.digest(path))
            value['pins'] = value['pins'][:1]
            path.write_text(json.dumps(value), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'dependency pins'):
                runner.load_config(path, runner.digest(path))

    def test_tree_accounting_rejects_hardlinks(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'one').write_bytes(b'abc')
            self.assertEqual(runner.tree_bytes(root), 3)
            os.link(root / 'one', root / 'two')
            with self.assertRaisesRegex(ValueError, 'Hardlinked'):
                runner.tree_bytes(root)

    def test_runtime_mutation_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            path, value = self.config(root)
            Path(value['workerBundle']).write_text('changed', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'Runtime pin'):
                runner.load_config(path, runner.digest(path))

    @unittest.skipUnless(os.name == 'nt', 'Windows Job containment only')
    def test_job_setup_failure_preserves_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            _, config = self.config(root)
            disk = type('Disk', (), dict(free=256 * 1024**3))()
            with patch.object(runner, 'WindowsJob', side_effect=OSError('synthetic setup failure')), \
                 patch.object(runner.shutil, 'disk_usage', return_value=disk):
                result = runner.run(config)
            self.assertEqual(result['status'], 'bounded-stop')
            self.assertIn('setup failure', result['reason'])
            self.assertTrue((Path(config['output']) / 'supervisor-report.json').exists())

    @unittest.skipUnless(os.name == 'nt', 'Windows Job containment only')
    def test_assignment_failure_kills_suspended_worker_and_preserves_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            _, config = self.config(root)
            child = unittest.mock.Mock()
            child.poll.return_value = None
            job = unittest.mock.Mock()
            job.assign_resume.side_effect = ValueError('synthetic assignment failure')
            disk = type('Disk', (), dict(free=256 * 1024**3))()
            with patch.object(runner, 'WindowsJob', return_value=job), \
                 patch.object(runner.subprocess, 'Popen', return_value=child) as launch, \
                 patch.object(runner.shutil, 'disk_usage', return_value=disk):
                result = runner.run(config)
            self.assertEqual(result['status'], 'bounded-stop')
            self.assertIn('assignment failure', result['reason'])
            self.assertEqual(launch.call_args.kwargs['creationflags'], 4)
            job.stop.assert_called_once()
            child.kill.assert_called_once()
            child.wait.assert_called_once_with(timeout=3)
            job.drain.assert_called_once_with(timeout=3)
            job.close.assert_called_once()
            self.assertTrue((Path(config['output']) / 'supervisor-report.json').exists())

    @unittest.skipUnless(os.name == 'nt', 'Windows Job containment only')
    def test_cleanup_failure_still_reports_and_attempts_drain(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            _, config = self.config(root)
            child = unittest.mock.Mock()
            child.poll.return_value = None
            job = unittest.mock.Mock()
            job.assign_resume.side_effect = ValueError('synthetic launch failure')
            job.stop.side_effect = OSError('synthetic stop failure')
            disk = type('Disk', (), dict(free=256 * 1024**3))()
            with patch.object(runner, 'WindowsJob', return_value=job), \
                 patch.object(runner.subprocess, 'Popen', return_value=child), \
                 patch.object(runner.shutil, 'disk_usage', return_value=disk):
                result = runner.run(config)
            self.assertEqual(result['status'], 'bounded-stop')
            self.assertIn('job termination failed', result['reason'])
            job.drain.assert_called_once_with(timeout=3)
            job.close.assert_called_once()
            self.assertTrue((Path(config['output']) / 'supervisor-report.json').exists())


if __name__ == '__main__':
    unittest.main()
