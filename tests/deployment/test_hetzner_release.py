import importlib.machinery
import importlib.util
import pathlib
import os
import stat
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch, MagicMock

ROOT = pathlib.Path(__file__).resolve().parents[2]

def module(name):
    loader = importlib.machinery.SourceFileLoader(name.replace('-', '_'), str(ROOT / 'ops/hetzner' / name))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    result = importlib.util.module_from_spec(spec)
    loader.exec_module(result)
    return result

class ReleaseTests(unittest.TestCase):
    def test_same_digest_keeps_previous(self):
        release=module('nightsky-release')
        digest='sha256:'+'a'*64
        record={'current':digest,'previous':'sha256:'+'b'*64}
        with patch.object(release,'docker',side_effect=lambda *a,**k: '{"Os":"linux","Architecture":"arm64"}' if a[0]=='image' else ''), patch.object(release,'check_network'), patch.object(release,'check_disk'), patch.object(release,'probe'), patch.object(release,'write_record') as writer:
            release.activate('staging',digest,record)
        self.assertTrue(not writer.called or writer.call_args.args[1]==record)

    def test_stale_temporary_does_not_block_record(self):
        release=module('nightsky-release')
        with tempfile.TemporaryDirectory(dir=ROOT) as folder:
            base=pathlib.Path(folder)
            (base/'releases').mkdir()
            stale=base/'releases'/'staging.tmp'
            stale.write_text('stale')
            original_open=os.open
            def open_file(path,*args,**kwargs):
                return original_open(os.devnull,os.O_RDONLY) if pathlib.Path(path)==base/'releases' else original_open(path,*args,**kwargs)
            with patch.object(release,'BASE',base), patch.object(release.os,'O_DIRECTORY',0,create=True), patch.object(release.os,'fsync'), patch.object(release.os,'open',side_effect=open_file):
                release.write_record('staging',{'current':None,'previous':None})
            self.assertEqual(stale.read_text(),'stale')
            self.assertTrue((base/'releases'/'staging.json').is_file())

    def test_nginx_privacy_and_staging_restrictions(self):
        for env in ('staging','production'):
            text=(ROOT/'ops'/'hetzner'/f'nginx-{env}.conf').read_text()
            for setting in ('access_log off;', 'error_log /dev/null;', 'client_max_body_size 32k;', 'client_body_timeout 15s;', 'client_header_timeout 15s;'):
                self.assertIn(setting,text)
            if env=='staging':
                self.assertIn('deny all;',text)
                self.assertIn('http://172.30.81.2:5000',text)

    def test_probe_checks_published_port_without_proxy(self):
        release=module('nightsky-release')
        response=MagicMock()
        response.status=200
        response.read.return_value=b'{"service":"nightsky","status":"ok"}'
        opener=MagicMock()
        opener.open.return_value.__enter__.return_value=response
        with patch.object(release,'docker') as docker, patch.object(release.urllib.request,'build_opener',return_value=opener):
            release.probe('staging')
        docker.assert_called_once_with('exec','nightsky-staging','node','/app/ops/hetzner/probe.mjs',timeout=15)
        opener.open.assert_called_once_with('http://172.30.81.2:5000/health',timeout=5)
        response.read.assert_called_once_with(16385)

    def test_platform_failure_never_stops(self):
        release=module('nightsky-release')
        calls=[]
        def docker(*args, **kwargs):
            calls.append(args)
            return '{"Os":"linux","Architecture":"amd64"}' if args[0]=='image' else ''
        with patch.object(release,'docker',side_effect=docker), patch.object(release,'check_network'), patch.object(release,'check_disk'):
            with self.assertRaises(RuntimeError): release.activate('staging','sha256:'+'a'*64,{'current':None,'previous':None})
        self.assertFalse(any(call[0] in ('stop','rm','run') for call in calls))

    def test_first_deploy_failure_does_not_write_release(self):
        release=module('nightsky-release')
        with patch.object(release,'docker',side_effect=lambda *a,**k: '{"Os":"linux","Architecture":"arm64"}' if a[0]=='image' else ''), patch.object(release,'check_network'), patch.object(release,'check_disk'), patch.object(release,'probe',side_effect=RuntimeError('failed')), patch.object(release,'write_record') as record:
            with self.assertRaises(RuntimeError): release.activate('staging','sha256:'+'a'*64,{'current':None,'previous':None})
        record.assert_not_called()

    def test_untrusted_parents_and_symlinks_rejected(self):
        release=module('nightsky-release')
        for uid,mode in [(1,stat.S_IFDIR|0o755),(0,stat.S_IFDIR|0o777),(0,stat.S_IFLNK|0o700)]:
            fake=SimpleNamespace(st_uid=uid,st_mode=mode)
            with patch.object(pathlib.Path,'lstat',return_value=fake):
                with self.assertRaises(RuntimeError): release.secure(pathlib.Path('/etc/nightsky/staging.env'))

    def test_reject_commands(self):
        release = module('nightsky-release')
        for args in [[], ['deploy','other','sha256:'+'a'*64], ['deploy','production','latest'], ['rollback','staging','extra']]:
            with self.assertRaises(ValueError): release.parse(args)

    def test_dispatch_exact_grammar(self):
        dispatcher = module('nightsky-ssh-dispatch')
        self.assertEqual(dispatcher.parse('nightsky-release rollback staging'), ['rollback','staging'])
        for command in ['nightsky-release rollback staging; id', 'nightsky-release rollback staging\n', ' nightsky-release rollback staging', 'nightsky-release deploy production latest', 'nightsky-release rollback "staging"']:
            with self.assertRaises(ValueError): dispatcher.parse(command)

    def test_dispatch_key_environment_boundary(self):
        dispatcher=module('nightsky-ssh-dispatch')
        for restriction in ([], ['staging','extra'], ['other']):
            with self.assertRaises(ValueError): dispatcher.authorize('nightsky-release rollback staging',restriction)
        for env in ('staging','production'):
            command=f'nightsky-release deploy {env} sha256:'+('a'*64)
            self.assertEqual(dispatcher.authorize(command,[env]),['deploy',env,'sha256:'+'a'*64])
            other='production' if env=='staging' else 'staging'
            with self.assertRaises(ValueError): dispatcher.authorize(command,[other])

    def test_dispatch_execs_fixed_argv_without_shell(self):
        dispatcher=module('nightsky-ssh-dispatch')
        with patch.object(dispatcher.sys,'argv',['nightsky-ssh-dispatch','staging']), patch.dict(dispatcher.os.environ,{'SSH_ORIGINAL_COMMAND':'nightsky-release rollback staging'}), patch.object(dispatcher.os,'execve') as execute:
            dispatcher.main()
        self.assertEqual(execute.call_args.args[0],'/usr/bin/sudo')
        self.assertEqual(execute.call_args.args[1],['sudo','-n','--','/usr/local/sbin/nightsky-release','rollback','staging'])

    def test_pull_before_stop_and_restore(self):
        release = module('nightsky-release')
        calls=[]
        def docker(*args, **kwargs):
            calls.append(args)
            if args[0] == 'image': return '{"Os":"linux","Architecture":"arm64"}'
            if args[0] == 'ps': return 'nightsky-staging'
            return ''
        old='sha256:'+'b'*64
        new='sha256:'+'a'*64
        with patch.object(release,'docker',side_effect=docker), patch.object(release,'check_network'), patch.object(release,'check_disk'), patch.object(release,'probe',side_effect=[RuntimeError('unhealthy'),None]), patch.object(release,'write_record') as record:
            with self.assertRaises(RuntimeError): release.activate('staging',new,{'current':old,'previous':None})
        self.assertLess(next(i for i,x in enumerate(calls) if x[0]=='pull'),next(i for i,x in enumerate(calls) if x[0]=='stop'))
        runs=[x for x in calls if x[0]=='run']
        self.assertEqual(len(runs),2)
        self.assertIn(release.REPO+'@'+old,runs[-1])
        self.assertNotIn('--publish',runs[0])
        self.assertIn('172.30.81.2',runs[0])
        self.assertIn('--memory=768m',runs[0])
        record.assert_not_called()

    def test_run_retains_state_and_limits(self):
        release=module('nightsky-release')
        with patch.object(release,'docker') as docker:
            release.start('production','sha256:'+'a'*64)
        args=docker.call_args.args
        self.assertIn('/var/lib/nightsky/state/production/runtime:/state', args)
        self.assertIn('--log-opt=max-size=10m',args)
        self.assertIn('--log-opt=max-file=3',args)
        self.assertIn('--read-only',args)
        self.assertIn('/app/ops/hetzner/runtime-guard.mjs',args)
        self.assertIn('NIGHTSKY_DEPLOYMENT_ENV=production',args)
        self.assertIn('--user=10001:10001',args)

    def test_read_only_check_validates_without_mutations(self):
        release=module('nightsky-release')
        for env in ('staging','production'):
            with patch.object(release.sys,'argv',['nightsky-release','check',env]), patch.object(release.os,'geteuid',return_value=0,create=True), patch.object(release,'secure') as secure, patch.object(release,'check_runtime') as runtime, patch.object(release,'check_disk') as disk, patch.object(release,'check_network') as network, patch.object(release.os,'open',side_effect=AssertionError('must not create a lock')), patch.object(release,'read_record',side_effect=AssertionError('must not read records')), patch.object(release,'activate',side_effect=AssertionError('must not activate')), patch('builtins.print') as output:
                release.main()
            secure.assert_any_call(pathlib.Path('/etc/nightsky')/f'{env}.env',private=True)
            runtime.assert_called_once_with(env)
            disk.assert_called_once_with()
            network.assert_called_once_with(env)
            self.assertEqual(__import__('json').loads(output.call_args.args[0]),{'environment':env,'status':'ready','operation':'check'})

    def test_check_fails_closed_without_mutating_on_validation_failure(self):
        release=module('nightsky-release')
        for failing in ('secure','check_runtime','check_disk','check_network'):
            with patch.object(release.sys,'argv',['nightsky-release','check','staging']), patch.object(release.os,'geteuid',return_value=0,create=True), patch.object(release,'secure'), patch.object(release,'check_runtime'), patch.object(release,'check_disk'), patch.object(release,'check_network'), patch.object(release.os,'open',side_effect=AssertionError('must not create lock')), patch.object(release,'read_record',side_effect=AssertionError('must not read records')), patch('builtins.print') as output:
                getattr(release,failing).side_effect=RuntimeError('invalid preparation')
                with self.assertRaisesRegex(RuntimeError,'invalid preparation'): release.main()
            output.assert_not_called()
        with patch.object(release.sys,'argv',['nightsky-release','check','staging']), patch.object(release.os,'geteuid',return_value=1001,create=True), patch.object(release,'secure') as secure:
            with self.assertRaisesRegex(RuntimeError,'root required'): release.main()
        secure.assert_not_called()

    def test_check_grammar_and_environment_binding(self):
        release=module('nightsky-release')
        dispatcher=module('nightsky-ssh-dispatch')
        for env in ('staging','production'):
            self.assertEqual(release.parse(['check',env]),['check',env])
            self.assertEqual(dispatcher.authorize(f'nightsky-release check {env}',[env]),['check',env])
            other='production' if env=='staging' else 'staging'
            with self.assertRaisesRegex(ValueError,'SSH key is not authorized for that environment'):
                dispatcher.authorize(f'nightsky-release check {env}',[other])
        for args in [['check'],['check','other'],['check','staging','extra']]:
            with self.assertRaises(ValueError): release.parse(args)
        for suffix in ['; id','\n',' extra']:
            with self.assertRaises(ValueError): dispatcher.parse('nightsky-release check staging'+suffix)

    def test_runtime_directory_requires_dedicated_identity(self):
        release=module('nightsky-release')
        for uid,gid,mode in [(10001,10001,stat.S_IFDIR|0o700),(1000,1000,stat.S_IFDIR|0o700),(10001,1000,stat.S_IFDIR|0o700),(10001,10001,stat.S_IFLNK|0o700)]:
            with patch.object(release,'secure'), patch.object(pathlib.Path,'lstat',return_value=SimpleNamespace(st_uid=uid,st_gid=gid,st_mode=mode)):
                if uid==10001 and gid==10001 and stat.S_ISDIR(mode): release.check_runtime('staging')
                else:
                    with self.assertRaises(RuntimeError): release.check_runtime('staging')

    def test_runtime_directory_requires_node_owner(self):
        release=module('nightsky-release')
        for uid,mode in [(0,stat.S_IFDIR|0o700),(1000,stat.S_IFLNK|0o700),(1000,stat.S_IFDIR|0o777)]:
            with patch.object(release,'secure'), patch.object(pathlib.Path,'lstat',return_value=SimpleNamespace(st_uid=uid,st_mode=mode)):
                with self.assertRaises(RuntimeError): release.check_runtime('staging')

if __name__ == '__main__': unittest.main()
