import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, chmodSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function validateConfiguration(env) {
  const {TARGET_ENV:environment, HOST:host, PORT:port, DEPLOY_USER:user, DEPLOY_KEY:key, KNOWN_HOSTS:knownHosts}=env;
  assert.ok(['staging','production'].includes(environment),'invalid environment');
  assert.ok(typeof host==='string' && /^[a-zA-Z0-9][a-zA-Z0-9.-]{0,252}$/.test(host),'invalid host');
  assert.ok(typeof port==='string' && /^[0-9]{1,5}$/.test(port) && Number(port)>0 && Number(port)<65536,'invalid port');
  assert.equal(user,'nightsky-deploy','expected dedicated deployment account');
  assert.ok(typeof key==='string' && key.trim() && key.length<=16384,'missing or oversized private key');
  assert.ok(typeof knownHosts==='string' && knownHosts.length<=4096,'missing or oversized host identity');
  const expectedHost=Number(port)===22?host:`[${host}]:${Number(port)}`;
  const entry=knownHosts.trim().split(/\s+/);
  assert.equal(entry.length,3,'expected one verified host-key entry');
  assert.equal(entry[0],expectedHost,'host-key entry must match exact destination');
  assert.equal(entry[1],'ssh-ed25519','expected verified ED25519 host identity');
  assert.match(entry[2],/^[A-Za-z0-9+/]{40,200}={0,2}$/,'invalid host-key encoding');
  return {environment,host,port:String(Number(port)),user,key,knownHosts:knownHosts.trim()};
}

function transportFailure(result, phase) {
  if(result.error) return new Error(`${phase} SSH: local execution failed`);
  if(result.signal) return new Error(`${phase} SSH: process interrupted`);
  const stderr=typeof result.stderr==='string'?result.stderr:'';
  if(result.status===255) {
    if(/Permission denied \(publickey/.test(stderr) || /Load key .*error in libcrypto/.test(stderr)) return new Error(`${phase} SSH: public-key authentication rejected`);
    if(/Host key verification failed|REMOTE HOST IDENTIFICATION HAS CHANGED/.test(stderr)) return new Error(`${phase} SSH: host identity rejected`);
    if(/Connection (timed out|refused)|No route to host|Network is unreachable/.test(stderr)) return new Error(`${phase} SSH: connection failed`);
    return new Error(`${phase} SSH: transport rejected`);
  }
  return new Error(`${phase} SSH: remote command exited ${Number.isInteger(result.status)&&result.status>=0&&result.status<=255?result.status:'unknown'}`);
}

// Only fixed read-only commands are issued; no shell, image, release or provider operation.
export function checkAccess(env, run=spawnSync) {
  const config=validateConfiguration(env);
  const directory=mkdtempSync(join(tmpdir(),'nightsky-access-'));
  try {
    chmodSync(directory,0o700);
    const key=join(directory,'key'), hosts=join(directory,'known_hosts');
    writeFileSync(key,config.key.trimEnd()+'\n',{mode:0o600,flag:'wx'});
    writeFileSync(hosts,config.knownHosts+'\n',{mode:0o600,flag:'wx'});
    const args=['-F','/dev/null','-T','-i',key,'-p',config.port,'-o','BatchMode=yes','-o','IdentitiesOnly=yes','-o','StrictHostKeyChecking=yes','-o',`UserKnownHostsFile=${hosts}`,'-o','GlobalKnownHostsFile=/dev/null','-o','ConnectTimeout=20','-o','ConnectionAttempts=1','-o','ServerAliveInterval=10','-o','ServerAliveCountMax=2',`${config.user}@${config.host}`];
    const execute=environment=>run('/usr/bin/ssh',[...args,`nightsky-release check ${environment}`],{encoding:'utf8',timeout:45000,maxBuffer:65536,shell:false,env:{PATH:'/usr/bin:/bin',LANG:'C',LC_ALL:'C'}});
    const positive=execute(config.environment);
    if(positive.error || positive.signal || positive.status!==0) throw transportFailure(positive,'positive');
    let receipt;
    try { receipt=JSON.parse(positive.stdout); } catch { throw new Error('invalid positive access receipt'); }
    assert.deepEqual(receipt,{environment:config.environment,status:'ready',operation:'check'},'positive access receipt mismatch');
    const negative=execute(config.environment==='staging'?'production':'staging');
    if(negative.error || negative.signal || negative.status!==2) throw transportFailure(negative,'cross-environment');
    assert.equal(negative.stdout,'','cross-environment check returned unexpected output');
    assert.ok(['SSH key is not authorized for that environment','SSH key is not authorized for that environment\n'].includes(negative.stderr),'cross-environment denial mismatch');
    return {...receipt,crossEnvironmentDenied:true};
  } finally {
    rmSync(directory,{recursive:true,force:true});
  }
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(checkAccess(process.env))); }
  catch(error) {
    const safe=error instanceof Error && /^(positive|cross-environment) SSH: (local execution failed|process interrupted|public-key authentication rejected|host identity rejected|connection failed|transport rejected|remote command exited (unknown|[0-9]{1,3}))$/.test(error.message) ? error.message : 'configuration or receipt validation failed';
    console.error(`NightSky access check failed: ${safe}. No deployment was attempted.`); process.exitCode=1;
  }
}
