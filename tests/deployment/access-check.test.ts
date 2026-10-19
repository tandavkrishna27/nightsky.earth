import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, statSync} from 'node:fs';
import {checkAccess, validateConfiguration} from '../../scripts/deployment/check-access.mjs';
const config={TARGET_ENV:'staging',HOST:'37.27.221.101',PORT:'22',DEPLOY_USER:'nightsky-deploy',DEPLOY_KEY:'private-test-key',KNOWN_HOSTS:'37.27.221.101 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPCAt43gLRYOLIIA3NNc6OokcNEquDcUHaB9mZTubXQQ'};
const good={status:0,stdout:'{"environment":"staging","status":"ready","operation":"check"}\n',stderr:''};
const denied={status:2,stdout:'',stderr:'SSH key is not authorized for that environment\n'};
test('access check uses secure files, strict bounded SSH and opposite environment, then cleans up',()=>{
 let calls=0;let key='';let hosts='';
 const result=checkAccess(config, (file:string,args:string[],options:any)=>{
  assert.equal(file,'/usr/bin/ssh');assert.equal(options.timeout,45000);assert.equal(options.maxBuffer,65536);assert.equal(options.shell,false);
  assert.ok(args.includes('StrictHostKeyChecking=yes'));assert.ok(args.includes('IdentitiesOnly=yes'));assert.ok(args.includes('BatchMode=yes'));assert.ok(args.includes('ConnectionAttempts=1'));
  key=args[args.indexOf('-i')+1];hosts=args.find(v=>v.startsWith('UserKnownHostsFile='))!.split('=')[1];
  assert.equal(readFileSync(key,'utf8'),'private-test-key\n');assert.ok(readFileSync(hosts,'utf8').includes('ssh-ed25519'));
  if(process.platform!=='win32')assert.equal(statSync(key).mode&0o777,0o600);
  assert.equal(options.env.DEPLOY_KEY,undefined);
  assert.equal(args.at(-1),`nightsky-release check ${calls++===0?'staging':'production'}`);
  return calls===1?good:denied;
 });
 assert.deepEqual(result,{environment:'staging',status:'ready',operation:'check',crossEnvironmentDenied:true});assert.equal(calls,2);assert.equal(existsSync(key),false);assert.equal(existsSync(hosts),false);
});
test('invalid configuration never starts SSH',()=>{
 for(const override of [{TARGET_ENV:'other'},{HOST:'-oProxyCommand=bad'},{HOST:'host;evil'},{PORT:'65536'},{PORT:'0'},{PORT:'22;evil'},{DEPLOY_USER:'root'},{DEPLOY_USER:'user@host'},{DEPLOY_KEY:''},{KNOWN_HOSTS:'placeholder'},{KNOWN_HOSTS:config.KNOWN_HOSTS+'\n@cert-authority *.example ssh-rsa AAAA'}])assert.throws(()=>validateConfiguration({...config,...override}));
});
test('positive receipt requires exact shape, environment, success and clean transport',()=>{
 for(const response of [{...good,status:255},{...good,error:new Error('secret detail')},{...good,signal:'SIGTERM'},{...good,stdout:'{}'},{...good,stdout:good.stdout+good.stdout},{...good,stdout:good.stdout.replace('staging','production')},{...good,stdout:'{"environment":"staging","status":"ready","operation":"check","extra":true}'}]){
  let calls=0;assert.throws(()=>checkAccess(config,()=>{calls++;return response;}));assert.equal(calls,1);
 }
});
test('negative check requires specific exit and denial, never arbitrary connection failure',()=>{
 for(const response of [{...denied,status:255},{...denied,stderr:'connection timed out'},{...denied,stdout:'unexpected'},{...denied,stderr:denied.stderr+'extra'},{...denied,stderr:denied.stderr+'\n'},{...denied,status:0}]){
  let calls=0;assert.throws(()=>checkAccess(config,()=>++calls===1?good:response));assert.equal(calls,2);
 }
});
test('SSH exceptions still remove private temporary files',()=>{
 let key='';
 assert.throws(()=>checkAccess(config,(_file:string,args:string[])=>{key=args[args.indexOf('-i')+1];throw new Error('transport failure');}));
 assert.ok(key);assert.equal(existsSync(key),false);
});
test('workflow is manual protected and serial, without deployment or publication',()=>{
 const s=readFileSync('.github/workflows/nightsky-access-check.yml','utf8');
 for(const value of ['workflow_dispatch:','environment: ${{ inputs.environment }}','group: nightsky-hetzner-host','cancel-in-progress: false','check-access.mjs','secrets.NIGHTSKY_DEPLOY_SSH_KEY','vars.NIGHTSKY_DEPLOY_KNOWN_HOSTS','persist-credentials: false'])assert.ok(s.includes(value),value);
 for(const value of ['push:','pull_request:','packages: write','docker pull','nightsky-release deploy'])assert.ok(!s.includes(value),value);
 for(const match of s.matchAll(/uses: ([^\n]+)/g))assert.match(match[1].trim(),/@[a-f0-9]{40}$/);
});

test('safe transport diagnostics distinguish authentication and host identity without echoing stderr',()=>{
  for(const [stderr,kind] of [
    ['Permission denied (publickey).\nprivate marker','public-key authentication rejected'],
    ['Host key verification failed.\nprivate marker','host identity rejected'],
    ['Connection timed out\nprivate marker','connection failed'],
  ]) assert.throws(()=>checkAccess(config,()=>({status:255,stdout:'',stderr})),new RegExp(`positive SSH: ${kind}$`));
});
