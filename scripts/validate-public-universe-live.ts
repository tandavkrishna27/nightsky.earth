/** Bounded selected-record diagnostic. Does not initialize or replenish quota. */
import {lstat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPersistentQuota} from '../server/providers/quotaState';
import {PUBLIC_UNIVERSE_QUOTA_POLICY, publicUniverseQuotaPath} from '../server/providers/publicUniverse/configuration';
import {createPublicUniverseProvider,REVIEWED_STARTER_SOURCES} from '../server/providers/publicUniverse';
import {PUBLIC_UNIVERSE_ORIGIN} from '../server/providers/publicUniverse/transport';
import {starterSearchResponseSchema} from '../server/providers/publicUniverse/contracts';

export const PLAN = Object.freeze({requests:4,deadlineMs:300000,maxResponseBytes:1048576,totalResponseBytes:4194304,retries:0,domains:['bsc5p','openngc']});

async function regular(path:string) {
  const stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1) throw Error('Existing regular quota files required.');
}

export async function runPublicUniverseDiagnostic(env:Record<string,string|undefined>, transport:typeof fetch=fetch, maxRequests:1|2|4=4) {
  const path=publicUniverseQuotaPath(env);
  if(!path) throw Error('Dedicated quota path required.');
  await regular(path); await regular(path+'.initialized');
  const quota=await createPersistentQuota({path,now:Date.now,policies:[PUBLIC_UNIVERSE_QUOTA_POLICY]});
  const began=Date.now(), deadline=began+PLAN.deadlineMs;
  let attempts=0,totalBytes=0;
  const usedSearches=new Set<string>(),allowedDetails=new Set<string>();
  type PinChecks={snapshot:boolean;sourceUrl:boolean;licence:boolean;licenceUrl:boolean;attribution:boolean};
  type SearchDiagnostic={httpStatus:number;responseBytes:number;schemaStatus:'valid'|'invalid'|'not-json';issuePaths?:string[];resultCount?:number;expectedIdPresent?:boolean;pinChecks?:PinChecks};
  const searchDiagnostics=new Map<string,SearchDiagnostic>();
  const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{
    const url=new URL(String(input));
    const search=url.pathname==='/api/v1/starter-targets';
    if(url.origin!==PUBLIC_UNIVERSE_ORIGIN||url.username||url.password||url.port||init?.method!=='GET'||
      !/^\/api\/v1\/starter-targets(?:\/(?:bsc5p%3Ahr\d+|openngc%3A(?:NGC|IC)\d+))?$/.test(url.pathname)||
      (search ? (url.searchParams.size!==3||!['bsc5p:hr617','openngc:NGC1976'].includes(url.searchParams.get('q')??'')||url.searchParams.get('limit')!=='10'||url.searchParams.get('offset')!=='0'||usedSearches.has(url.searchParams.get('q')!)) : (url.search!==''||!allowedDetails.delete(url.pathname)))||
      attempts>=maxRequests||Date.now()>=deadline) throw Error('Diagnostic request refused.');
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
    const body=Buffer.concat(chunks);
    if(search){
      const query=url.searchParams.get('q')!;
      const diagnostic:SearchDiagnostic={httpStatus:response.status,responseBytes:bytes,schemaStatus:'not-json'};
      try {
        const parsed=starterSearchResponseSchema.safeParse(JSON.parse(body.toString('utf8')));
        diagnostic.schemaStatus=parsed.success?'valid':'invalid';
        if(!parsed.success) diagnostic.issuePaths=parsed.error.issues.slice(0,12).map(issue=>{
          const first=issue.path[0];
          const section=typeof first==='string'&&['available','results','total','limit','offset','sources','coverage'].includes(first)?first:'other';
          return section+':'+issue.code;
        });
        else {
          diagnostic.resultCount=parsed.data.results.length;
          const row=parsed.data.results.find(item=>item.id===query);
          diagnostic.expectedIdPresent=!!row;
          if(row){
            const source=parsed.data.sources[row.source],reviewed=REVIEWED_STARTER_SOURCES[row.source];
            if(source&&reviewed) diagnostic.pinChecks={snapshot:source.snapshot_sha256===reviewed.snapshot,sourceUrl:source.source_url===reviewed.sourceUrl,licence:source.license===reviewed.licence,licenceUrl:source.license_url===reviewed.licenceUrl,attribution:source.attribution===reviewed.attribution};
          }
        }
      } catch { /* Only the fixed diagnostic status is retained. */ }
      searchDiagnostics.set(query,diagnostic);
    }
    return new Response(body,{status:response.status,headers:response.headers});
  }) as typeof fetch;
  const provider=createPublicUniverseProvider({quota,quotaOwner:'nightsky-publicuniverse',admitted:true,scope:'starter-only',fetcher});
  const records:Array<{domain:string;searchStatus:string;searchErrorCode?:string;searchReason?:string;httpStatus?:number;responseBytes?:number;schemaStatus?:'valid'|'invalid'|'not-json';schemaIssuePaths?:string[];resultCount?:number;expectedIdPresent?:boolean;pinChecks?:PinChecks;searchTotal?:number|null;detailStatus?:string;detailErrorCode?:string;source?:string;sourceSnapshotSha256?:string;licence?:string;licenceUrl?:string;attribution?:string;modifications?:string;selectedIdentityDigest?:string;revisionAssociation?:string}>=[];
  try {
    for(const [source,query,expectedId] of [['bsc5p','bsc5p:hr617','bsc5p:hr617'],['openngc','openngc:NGC1976','openngc:NGC1976']] as const){
      if(attempts>=maxRequests||Date.now()>=deadline)break;
      const search=await provider.searchReferenceObjects({domain:'starter-targets',query,limit:10});
      const match=search.data?.matches.find(row=>row.upstreamId===expectedId);
      const entry:typeof records[number]={domain:source,searchStatus:search.status};
      const diagnostic=searchDiagnostics.get(query);
      if(diagnostic){entry.httpStatus=diagnostic.httpStatus;entry.responseBytes=diagnostic.responseBytes;entry.schemaStatus=diagnostic.schemaStatus;entry.schemaIssuePaths=diagnostic.issuePaths;entry.resultCount=diagnostic.resultCount;entry.expectedIdPresent=diagnostic.expectedIdPresent;entry.pinChecks=diagnostic.pinChecks;}
      if(search.errorCode) entry.searchErrorCode=search.errorCode;
      if(search.reason) entry.searchReason=search.reason;
      if(search.data) entry.searchTotal=search.data.total;
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
      if(match?.selection && attempts<maxRequests && Date.now()<deadline){
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
  else if(process.argv.length===3&&process.argv[2]==='--diagnose-bsc') runPublicUniverseDiagnostic(process.env,fetch,1).then(x=>console.log(JSON.stringify(x)),()=>{console.error('Public Universe diagnostic stopped. No automatic retry.');process.exitCode=1;});
  else if(process.argv.length===3&&process.argv[2]==='--diagnose-bsc-detail') runPublicUniverseDiagnostic(process.env,fetch,2).then(x=>console.log(JSON.stringify(x)),()=>{console.error('Public Universe diagnostic stopped. No automatic retry.');process.exitCode=1;});
  else if(process.argv.length===3&&process.argv[2]==='--live') runPublicUniverseDiagnostic(process.env).then(x=>console.log(JSON.stringify(x)),()=>{console.error('Public Universe diagnostic stopped. No automatic retry.');process.exitCode=1;});
  else {console.error('Use --plan, --diagnose-bsc, --diagnose-bsc-detail or --live.');process.exitCode=1;}
}
