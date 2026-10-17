"""Offline admission and process-boundary tests; never read real credentials."""
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import subprocess
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/era5'))
import timeseries_sample as live
import sample_executor as core
import timeseries_executor as contract
from test_timeseries_executor import Transport


class Tests(unittest.TestCase):
    def setup_allowance(self, directory):
        output = Path(directory) / 'output'
        allowance = Path(directory) / 'allowance.json'
        allowance.write_text(json.dumps(live.allowance_template(output)))
        return allowance, output

    def no_credentials(self, key, default=None):
        if key == 'CDSAPI_KEY': raise AssertionError('credential access')
        return default

    def test_default_and_preflight_are_offline(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            with patch.object(live.os.environ, 'get', side_effect=self.no_credentials):
                with contextlib.redirect_stdout(io.StringIO()) as stream:
                    live.main([])
                self.assertEqual(json.loads(stream.getvalue())['planSha256'],
                                 '95edd1dddef2cd942e66089f3d6f85760d5ffd8876f7f4e32a6646be794a5322')
                live.preflight(allowance, output)
            self.assertFalse(output.exists())
            self.assertFalse(Path(str(allowance) + '.consumed.json').exists())

    def test_allowance_strict_types_limits_request_output_and_legacy_rejection(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            good = json.loads(allowance.read_text())
            for field, value in [('maxPolls', 61), ('maxSubmissions', True),
                                 ('maxScratchBytes', 134217729), ('planSha256', core.identity()),
                                 ('outputRoot', str(Path(directory) / 'other')),
                                 ('request', {})]:
                with self.subTest(field=field):
                    allowance.write_text(json.dumps(dict(good, **{field: value})))
                    with self.assertRaises(ValueError): live.preflight(allowance, output)
            allowance.write_text(json.dumps(dict(planSha256=core.identity(), allowExecution=True,
                maxSubmissions=1, maxRawBytes=2097152, outputRoot=str(output))))
            with self.assertRaises(ValueError): live.preflight(allowance, output)

    def test_consumption_burns_allowance_and_uncertain_resume_cannot_submit(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            live.consume_allowance(allowance, output)
            with self.assertRaises(FileExistsError): live.consume_allowance(allowance, output)
            output.mkdir()
            (output / 'checkpoint.json').write_text(json.dumps(dict(identity=contract.identity(),
                phase='submission-uncertain')))
            with self.assertRaises(ValueError): live.preflight(allowance, output, resume=True)

    def test_worker_rejects_missing_containment_before_credential_or_claim(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            with patch.object(live, 'require_containment', side_effect=ValueError('no containment')):
                with patch.object(live.os.environ, 'get', side_effect=self.no_credentials):
                    with self.assertRaisesRegex(ValueError, 'containment'):
                        live.execute(allowance, output)
            self.assertFalse(Path(str(allowance) + '.consumed.json').exists())

    def test_contained_worker_uses_real_state_machine_and_quarantines_unknown(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            transport = Transport()
            with patch.object(live, 'require_containment'), patch.object(live, 'require_handoff', return_value=live.time.time()+1800), patch.object(live, 'require_runtime'), patch.object(live, 'make_adapter', return_value=transport):
                with patch.dict(live.os.environ, {'CDSAPI_KEY': 'synthetic-token'}):
                    state = live.execute(allowance, output)
            self.assertEqual(state['phase'], 'downloaded-unvalidated')
            self.assertEqual(state['identity'], '95edd1dddef2cd942e66089f3d6f85760d5ffd8876f7f4e32a6646be794a5322')
            self.assertEqual(transport.submissions, 1)
            self.assertNotIn('validation', state)
            self.assertFalse((output / 'validation.json').exists())

    def test_parent_startup_deadline_persists_and_known_job_resume_never_extends(self):
        class Interrupted(Transport):
            def status(self, *args, **kwargs): raise KeyboardInterrupt()
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            real_run = core._run
            def run_with_fixture_clock(*args, **kwargs):
                return real_run(*args, clock=lambda: 1010, **kwargs)
            with patch.object(live, 'require_containment'), patch.object(live, 'require_handoff', return_value=2800), patch.object(live, 'require_runtime'), patch.object(live, 'make_adapter', return_value=Interrupted()):
                with patch.dict(live.os.environ, {'CDSAPI_KEY': 'synthetic-token'}), patch.object(core, '_run', side_effect=run_with_fixture_clock):
                    with self.assertRaises(KeyboardInterrupt): live.execute(allowance, output)
            state = json.loads((output / 'checkpoint.json').read_text())
            self.assertEqual(state['deadline'], 2800)  # parent began at1000; startup cost10
            state['nextPoll'] = 1100
            (output / 'checkpoint.json').write_text(json.dumps(state))
            resumed = Transport()
            result = core._run(output, resumed, clock=lambda: 1100, resume=True,
                               contract=contract, deadline_cap=2900)
            self.assertEqual(result['deadline'], 2800)
            self.assertEqual(resumed.submissions, 0)

    def test_core_clips_resume_to_earlier_cap_and_expired_cap_never_submits(self):
        class Interrupted(Transport):
            def status(self, *args, **kwargs): raise KeyboardInterrupt()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'output'
            with self.assertRaises(KeyboardInterrupt):
                core._run(output, Interrupted(), clock=lambda: 1000,
                          contract=contract, deadline_cap=2700)
            state = json.loads((output / 'checkpoint.json').read_text())
            state['nextPoll'] = 1100
            (output / 'checkpoint.json').write_text(json.dumps(state))
            result = core._run(output, Transport(), clock=lambda: 1100,
                               resume=True, contract=contract, deadline_cap=2600)
            self.assertEqual(result['deadline'], 2600)
            self.assertEqual(json.loads((output / 'checkpoint.json').read_text())['deadline'], 2600)
        for cap in (999, 3000, True, float('inf')):
            with self.subTest(cap=cap), tempfile.TemporaryDirectory() as directory:
                transport = Transport()
                with self.assertRaises(ValueError):
                    core._run(directory, transport, clock=lambda: 1000,
                              contract=contract, deadline_cap=cap)
                self.assertEqual(transport.submissions, 0)

    def test_parent_assigns_suspended_process_and_cleans_up_on_deadline(self):
        events = []
        class Job:
            def __init__(self, memory, processes):
                self_memory = memory
                if (self_memory, processes) != (536870912, 1): raise AssertionError('limits')
                events.append('job')
            def assign_resume(self, child): events.append('assigned')
            def stop(self): events.append('stop')
            def drain(self, timeout): events.append('drain')
            def close(self): events.append('close')
        class Child:
            returncode = None
            stdin = io.BytesIO()
            def poll(self): return self.returncode
            def kill(self): events.append('kill'); self.returncode = 1
            def wait(self, timeout): events.append('wait')
        def spawn(argv, **kwargs):
            self.assertEqual(kwargs['creationflags'], 4)
            self.assertNotIn('env', kwargs)  # native inheritance; parent never reads token
            self.assertEqual(argv[1], '-I')
            self.assertEqual(argv[0], sys._base_executable)
            events.append('suspended')
            return Child()
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            with patch.object(live, 'job_class', return_value=Job), patch.object(live.subprocess, 'Popen', side_effect=spawn):
                with patch.object(live.time, 'monotonic', side_effect=[0, 1801]), patch.object(live.os.environ, 'get', side_effect=self.no_credentials):
                    with self.assertRaisesRegex(ValueError, 'deadline'): live.supervise(allowance, output)
        self.assertEqual(events, ['job', 'suspended', 'assigned', 'stop', 'kill', 'wait', 'drain', 'close'])

    def test_invalid_allowance_never_spawns(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            allowance.write_text('{}')
            with patch.object(live.subprocess, 'Popen', side_effect=AssertionError('spawn')):
                with self.assertRaises(ValueError): live.supervise(allowance, output)

    def test_parent_rejects_exit_after_original_deadline(self):
        class Job:
            def __init__(self, *args): pass
            def assign_resume(self, child): pass
            def stop(self): pass
            def drain(self, timeout): pass
            def close(self): pass
        class Child:
            stdin = io.BytesIO()
            returncode = 0
            def poll(self): return 0
            def wait(self, timeout): pass
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            output.mkdir()
            with patch.object(live, 'job_class', return_value=Job), patch.object(live.subprocess, 'Popen', return_value=Child()):
                with patch.object(live.time, 'monotonic', side_effect=[0, 1801]):
                    with self.assertRaisesRegex(ValueError, 'deadline'): live.supervise(allowance, output)

    def test_claim_precedes_missing_credential_and_cannot_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            with patch.object(live, 'require_containment'), patch.object(live, 'require_handoff'), patch.object(live, 'require_runtime'), patch.object(live.os.environ, 'get', return_value=None):
                with self.assertRaisesRegex(ValueError, 'CDSAPI_KEY'): live.execute(allowance, output)
            self.assertTrue(Path(str(allowance) + '.consumed.json').exists())
            with self.assertRaises(FileExistsError): live.preflight(allowance, output)

    def test_missing_dependency_fails_before_claim_or_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            with patch.object(live, 'require_containment'), patch.object(live, 'require_handoff'), patch.object(live.importlib.util, 'find_spec', return_value=None):
                with patch.object(live.os.environ, 'get', side_effect=self.no_credentials):
                    with self.assertRaisesRegex(ValueError, 'requests'): live.execute(allowance, output)
            self.assertFalse(Path(str(allowance) + '.consumed.json').exists())

    def test_control_duplicate_keys_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'control.json'
            path.write_text('{"allowExecution":false,"allowExecution":true}')
            with self.assertRaises(ValueError): live.read_json(path)

    def test_worker_os_limits_reject_absent_or_weak_containment(self):
        class Query:
            argtypes = None
            def __init__(self, flags, active, memory, success):
                self.values = flags, active, memory, success
            def __call__(self, handle, info, pointer, size, needed):
                flags, active, memory, success = self.values
                pointer._obj.basic.flags = flags
                pointer._obj.basic.active = active
                pointer._obj.jobMemory = memory
                return success
        for values in [(0, 0, 0, False), (0x208, 1, 536870912, True),
                       (0x2208, 2, 536870912, True), (0x2208, 1, 536870913, True)]:
            kernel = type('Kernel', (), {'QueryInformationJobObject': Query(*values)})()
            with patch.object(live.ctypes, 'WinDLL', return_value=kernel, create=True):
                with patch.object(live.os, 'name', 'nt'):
                    with self.assertRaises(ValueError): live.require_containment()
        kernel = type('Kernel', (), {'QueryInformationJobObject': Query(0x2208, 1, 536870912, True)})()
        with patch.object(live.ctypes, 'WinDLL', return_value=kernel, create=True), patch.object(live.os, 'name', 'nt'):
            live.require_containment()

    @unittest.skipUnless(os.name == 'nt', 'native Windows Job primitive')
    def test_native_job_contains_inert_worker_and_terminates_blocked_child(self):
        # No live wrapper/credential path: child only verifies kernel limits and
        # blocks. Environment is deliberately empty and stdout is fixture data.
        with tempfile.TemporaryDirectory() as directory:
            script = Path(directory) / 'inert.py'
            receipt = Path(directory) / 'contained.txt'
            script.write_text('import sys,time\nfrom pathlib import Path\n'
                + 'sys.path.insert(0, ' + repr(str(Path(live.__file__).parent)) + ')\n'
                + 'import timeseries_sample\ntimeseries_sample.require_containment()\n'
                + 'timeseries_sample.require_handoff()\n'
                # Publish only after the receipt is closed: existence alone must
                # never expose a just-created, not-yet-written file to the parent.
                + 'receipt=Path(sys.argv[1])\nstaging=receipt.with_suffix(".tmp")\n'
                + 'staging.write_text("contained")\nstaging.replace(receipt)\ntime.sleep(60)\n')
            job = live.job_class()(536870912, 1)
            child = None
            try:
                child = subprocess.Popen([sys._base_executable, '-I', str(script), str(receipt)],
                    env={}, creationflags=4, stdin=subprocess.PIPE,
                    stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                self.assertFalse(receipt.exists())
                job.assign_resume(child)
                child.stdin.write(json.dumps(dict(parentPid=os.getpid(), planSha256=contract.identity(),
                    deadlineMonotonic=live.time.monotonic()+30,
                    deadlineWall=live.time.time()+30,
                    sitePackages=live.sysconfig.get_path('purelib'))).encode())
                child.stdin.close()
                limit = live.time.monotonic() + 5
                while not receipt.exists() and child.poll() is None and live.time.monotonic() < limit:
                    live.time.sleep(.01)
                self.assertTrue(receipt.exists(), child.stderr.read().decode() if child.poll() is not None else 'no receipt')
                self.assertEqual(receipt.read_text(), 'contained')
                self.assertIsNone(child.poll())
            finally:
                try:
                    job.stop()
                    if child is not None:
                        child.wait(timeout=3)
                    job.drain(timeout=3)
                finally:
                    job.close()
                    if child is not None: child.stderr.close()
            self.assertIsNotNone(child.returncode)

    def test_direct_worker_rejects_missing_parent_handoff_before_claim(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance, output = self.setup_allowance(directory)
            with patch.object(live, 'require_containment'), patch.object(live.sys, 'stdin', io.StringIO('')):
                with patch.object(live.os.environ, 'get', side_effect=self.no_credentials):
                    with self.assertRaises(ValueError): live.execute(allowance, output)
            self.assertFalse(Path(str(allowance) + '.consumed.json').exists())


if __name__ == '__main__': unittest.main()
