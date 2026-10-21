/** Bounded selected-record diagnostic. Does not initialize or replenish quota. */
import {lstat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPersistentQuota} from '../server/providers/quotaState';
import {PUBLIC_UNIVERSE_QUOTA_POLICY, publicUniverseQuotaPath} from '../server/providers/publicUniverse/configuration';
import {createPublicUniverseProvider} from '../server/providers/publicUniverse';
import {PUBLIC_UNIVERSE_ORIGIN} from '../server/providers/publicUniverse/transport';

export const PLAN = Object.freeze({requests:4,deadlineMs:300000,maxResponseBytes:1048576,totalResponseBytes:4194304,retries:0,domains:['bsc5p','openngc']});

async function regular(path:string) {
  const stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1) throw Error('Existing regular quota files required.');
}

export async function runPublicUniverseDiagnostic(env:Record<string,string|undefined>, transport:typeof fetch=fetch) {
  const path=publicUniverseQuotaPath(env);
  if(!path) throw Error('Dedicated quota path required.');
  await regular(path); await regular(path+'.initialized');
  const quota=await createPersistentQuota({path,now:Date.now,policies:[PUBLIC_UNIVERSE_QUOTA_POLICY]});
  const began=Date.now(), deadline=began+PLAN.deadlineMs;
  let attempts=0,totalBytes=0;
  const usedSearches=new Set<string>(),allowedDetails=new Set<string>();
  const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{
    const url=new URL(String(input));
    const search=url.pathname==='/api/v1/starter-targets';
    if(url.origin!==PUBLIC_UNIVERSE_ORIGIN||url.username||url.password||url.port||init?.method!=='GET'||
      !/^\/api\/v1\/starter-targets(?:\/(?:bsc5p%3Ahr\d+|openngc%3A(?:NGC|IC)\d+))?$/.test(url.pathname)||
      (search ? (url.searchParams.size!==3||!['bsc5p:hr617','openngc:NGC1976'].includes(url.searchParams.get('q')??'')||url.searchParams.get('limit')!=='10'||url.searchParams.get('offset')!=='0'||usedSearches.has(url.searchParams.get('q')!)) : (url.search!==''||!allowedDetails.delete(url.pathname)))||
      attempts>=PLAN.requests||Date.now()>=deadline) throw Error('Diagnostic request refused.');
    if(search) usedSearches.add(url.searchParams.get('q')!);
    attempts++;
    const signal=AbortSignal.any([AbortSignal.timeout(Math.max(1,deadline-Date.now())),...(init?.signal?[init.signal]:[])]);
    const response=await transport(url,{...init,redirect:'error',signal});
    if(response.redirected||Number(response.headers.get('content-length'))>PLAN.maxResponseBytes){await response.body?.cancel();throw Error('Response size rejected.');}
    if(!response.body) throw Error('Missing response body.');
    const reader=response.body.getReader(),chunks:Uint8Array[]=[];let bytes=0;
    try { for(;;){signal.throwIfAborted();const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;
      if(bytes>PLAN.maxResponseBytes||totalBytes+bytes>PLAN.totalResponseBytes) throw Error('Response budget exceeded.');chunks.push(part.value);}
    } finally {await reader.cancel().catch(()=>{});reader.releaseLock();}
    totalBytes+=bytes;
    return new Response(Buffer.concat(chunks),{status:response.status,headers:response.headers});
  }) as typeof fetch;
  const provider=createPublicUniverseProvider({quota,quotaOwner:'nightsky-publicuniverse',admitted:true,scope:'starter-only',fetcher});
  const records:Array<{domain:string;searchStatus:string;searchErrorCode?:string;searchReason?:string;searchTotal?:number|null;returnedIds?:string[];detailStatus?:string;detailErrorCode?:string;source?:string;sourceSnapshotSha256?:string;licence?:string;licenceUrl?:string;attribution?:string;modifications?:string;selectedIdentityDigest?:string;revisionAssociation?:string}>=[];
  try {
    for(const [source,query,expectedId] of [['bsc5p','bsc5p:hr617','bsc5p:hr617'],['openngc','openngc:NGC1976','openngc:NGC1976']] as const){
      if(Date.now()>=deadline)break;
      const search=await provider.searchReferenceObjects({domain:'starter-targets',query,limit:10});
      const match=search.data?.matches.find(row=>row.upstreamId===expectedId);
      const entry:typeof records[number]={domain:source,searchStatus:search.status};
      if(search.errorCode) entry.searchErrorCode=search.errorCode;
      if(search.reason) entry.searchReason=search.reason;
      if(search.data){entry.searchTotal=search.data.total;entry.returnedIds=search.data.matches.slice(0,10).map(row=>row.upstreamId);}
      if(match?.selection) entry.selectedIdentityDigest=match.selection.revision;
      if(match?.selection) allowedDetails.add('/api/v1/starter-targets/'+encodeURIComponent(match.upstreamId));
      const foundCredit=match?.sources[0];
      if(foundCredit){
        entry.source=foundCredit.url;
        entry.sourceSnapshotSha256=foundCredit.hash??undefined;
        entry.licence=foundCredit.licence??undefined;
        entry.licenceUrl=foundCredit.licenceUrl??undefined;
        entry.attribution=foundCredit.attribution??undefined;
        entry.modifications=foundCredit.modifications??undefined;
      }
      if(match?.selection && attempts<PLAN.requests && Date.now()<deadline){
        const detail=await provider.getReferenceDetails({kind:'selected-object',...match.selection,sections:[]});
        entry.detailStatus=detail.status;
        if(detail.errorCode) entry.detailErrorCode=detail.errorCode;
        const credit=detail.sources[0];
        if(credit){
          entry.source=credit.url;
          entry.sourceSnapshotSha256=credit.hash??undefined;
          entry.licence=credit.licence??undefined;
          entry.licenceUrl=credit.licenceUrl??undefined;
          entry.attribution=credit.attribution??undefined;
          entry.modifications=credit.modifications??undefined;
        }
        entry.revisionAssociation=detail.data?.record?.remoteRevisionAssociation;
      }
      records.push(entry);
      if(search.status!=='available') break;
    }
    return {attempts,totalBytes,elapsedMs:Date.now()-began,records,limitations:['Selected-record diagnostic only; no full-catalogue rights or observing accuracy claim.','No raw provider responses retained.']};
  } finally {try {await provider.close();} finally {await quota.close();}}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length===3&&process.argv[2]==='--plan') console.log(JSON.stringify(PLAN));
  else if(process.argv.length===3&&process.argv[2]==='--live') runPublicUniverseDiagnostic(process.env).then(x=>console.log(JSON.stringify(x)),()=>{console.error('Public Universe diagnostic stopped. No automatic retry.');process.exitCode=1;});
  else {console.error('Use --plan or --live.');process.exitCode=1;}
}
