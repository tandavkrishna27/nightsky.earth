/** Offline preparation only. Never installs a host plugin or invokes a model. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import { buildLocalPluginPackage } from './build-local-plugin-package';
import { createFixtureServer, fixtureClockStart } from './complete-model-journey-test';

export function validateFixtureSessionSeconds(value=600) {
 if(!Number.isSafeInteger(value) || value<1 || value>1800)throw Error('Session seconds must be an integer from 1 to 1800');
 return value;
}
export async function prepareCodexLocalFixture(out:string, port=8765, serve=false, sessionSeconds=600) {
 validateFixtureSessionSeconds(sessionSeconds);
 if (!Number.isInteger(port) || port<0 || port>65535) throw Error('Invalid loopback port');
 const root=resolve(out);
 const server=await createFixtureServer(root,{mode:'api',port});
 try {
  const tools=await server.rpc('tools/list',{});
  const toolNames=tools.result.tools.map((tool:{name:string})=>tool.name).sort();
  if(toolNames.length!==14) throw Error('Expected fourteen tools');
  const probe=await server.rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fictionvale'}});
  if(probe.result.isError || !probe.result.structuredContent.matches.length) throw Error('Offline resolution failed');
  const pkg=buildLocalPluginPackage({host:'codex',endpoint:server.endpoint});
  const files=unzipSync(pkg.zip);
  const skillNames=Object.keys(files).filter(p=>/^skills\/[^/]+\/SKILL.md$/.test(p)).sort();
  if(skillNames.length!==5 || server.externalAttempts()!==0) throw Error('Offline inventory failed');
  mkdirSync(root,{recursive:true});
  for(const [path,bytes] of Object.entries(files)) {
   const target=join(root,'plugin',path); mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,bytes);
  }
  writeFileSync(join(root,'nightsky-codex-local-rehearsal.zip'),pkg.zip);
  const {zip,...packageReport}=pkg;
  writeFileSync(join(root,'package-report.json'),JSON.stringify(packageReport,null,2)+'\n');
  const report={version:JSON.parse(new TextDecoder().decode(files['plugin.json'])).version,endpoint:server.endpoint,sha256:pkg.sha256,toolNames,skillNames,fixtureMode:'api',fixtureAttempts:server.fixtureAttempts(),externalAttempts:server.externalAttempts(),hostInstallationVerified:false,nativeSkillLoadingVerified:false,synthetic:true,fixtureClock:{start:fixtureClockStart,basis:'advancing simulated clock; independent of host wall clock; expiry enforced'},sessionSeconds,listenerRunning:serve};
  writeFileSync(join(root,'preparation-report.json'),JSON.stringify(report,null,2)+'\n');
  if(serve) {
   server.beginCase('native-preflight');
   console.log(JSON.stringify({...report,notice:`One case, twelve MCP calls maximum. Listener stops after ${sessionSeconds} seconds or Ctrl+C. Synthetic clock and provider fixtures only; use the October 15 rehearsal date, not current tonight.`}));
   await new Promise<void>(done=>{
    const finish=()=>{clearTimeout(timer);process.off('SIGINT',finish);process.off('SIGTERM',finish);done();};
    const timer=setTimeout(finish,sessionSeconds*1000);process.once('SIGINT',finish);process.once('SIGTERM',finish);
   });
   writeFileSync(join(root,'listener-report.json'),JSON.stringify({externalAttempts:server.externalAttempts(),fixtureAttempts:server.fixtureAttempts(),traces:server.budget.traces,listenerRunning:false},null,2)+'\n');
  }
  writeFileSync(join(root,'preparation-report.json'),JSON.stringify({...report,listenerRunning:false},null,2)+'\n');
  return {...report,listenerRunning:false};
 } finally {await server.close();}
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const args=process.argv.slice(2);let serve=false,port=8765,sessionSeconds=600,out='dist/codex-local-preparation-20261017';const seen=new Set<string>();
 for(let i=0;i<args.length;i++) {
  const flag=args[i];if(seen.has(flag))throw Error('Duplicate option');seen.add(flag);
  if(flag==='--serve')serve=true;
  else if(flag==='--out' && args[i+1] && !args[i+1].startsWith('--'))out=args[++i];
  else if(flag==='--port' && /^\d+$/.test(args[i+1]??''))port=Number(args[++i]);
  else if(flag==='--session-seconds' && /^\d+$/.test(args[i+1]??''))sessionSeconds=validateFixtureSessionSeconds(Number(args[++i]));
  else throw Error('Expected --serve, --out directory, --port number or --session-seconds number (1..1800)');
 }
 console.log(JSON.stringify(await prepareCodexLocalFixture(out,port,serve,sessionSeconds),null,2));
}
