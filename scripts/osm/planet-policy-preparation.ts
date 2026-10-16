/** Offline preparation only. Never reads payload bodies or creates policy/review grants. */
import {open,lstat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {buildRetainedSourceAdmissionPolicy} from './source-admission';
import {naturalEarthPolicy} from './natural-earth-policy';

export const PLANET_SOURCE=Object.freeze({
 url:'https://osm-planet-eu-central-1.s3.dualstack.eu-central-1.amazonaws.com/planet/pbf/2026/planet-261012.osm.pbf',
 edition:'planet-261012.osm.pbf',bytes:95380942829,
 versionId:'brLMq6.oGIcbk.3ciQgjtqIduCfYJMT1',
 etag:'"37619b1886c62145e6a0a6b31109b300-5686"',
 md5:'c51bb08eb9fc486d010aaa1a3424cabc',lastModified:'2026-10-15T19:22:44Z',
});
const proposedSourceSchema=z.strictObject({
 url:z.literal(PLANET_SOURCE.url),edition:z.literal(PLANET_SOURCE.edition),bytes:z.literal(PLANET_SOURCE.bytes),
 versionId:z.literal(PLANET_SOURCE.versionId),etag:z.literal(PLANET_SOURCE.etag),
 md5:z.literal(PLANET_SOURCE.md5),lastModified:z.literal(PLANET_SOURCE.lastModified),
});
const planetKey='OSM-planet-261012';
const boundaryKeys=['NE-v5.1.1-ADM0','NE-v5.1.1-ADM1'] as const;

/** No candidate argument can select the trusted inventory, supply evidence, or upgrade this report. */
export async function buildPlanetPolicyPreparation(proposedSource:unknown=PLANET_SOURCE){
 const source=proposedSourceSchema.parse(proposedSource);
 const policy=await buildRetainedSourceAdmissionPolicy();
 const policyStatus=(key:string)=>policy.sources.some(record=>record.key===key)?'present-requires-exact-subject-review' as const:'missing-from-retained-policy' as const;
 return {
  schemaVersion:1 as const,mode:'offline-policy-preparation' as const,
  acquisitionAuthorized:false as const,productionAdmitted:false as const,
  productionGateSupport:'implemented-fixed-policy-and-pinned-trust' as const,
  trustedPolicy:{policyId:policy.policyId,inventoryRoots:policy.inventoryRoots,sourceCount:policy.sources.length,modified:false as const},
  planet:{source,proposedSourceKey:planetKey,policyStatus:policyStatus(planetKey),
   rawSha256:null,nativeVintage:null,subjectSha256:null,recordSha256:null,trustedReviews:[],
   coverageClaim:'source-domain-only' as const,selectionPolicy:'named-complete-way-v1-polar85' as const,
   requiredReviewRoles:['source-provenance','payload-validation','rights-review','planet-domain','admission-approval'],
   proposedRequiredConditions:['exact-original-source-identity','licensor-authority','original-source-to-payload-chain',
    'mixed-output-compatibility-review','osm-contributor-attribution','attribution','licence-notice','modification-notice',
    'database-versus-produced-work','share-alike','machine-readable-offer','no-additional-restrictions'],
  },
  naturalEarth:{profile:naturalEarthPolicy.profile,commit:naturalEarthPolicy.commit,productionAdmitted:false as const,
   licence:naturalEarthPolicy.licence,
   layers:naturalEarthPolicy.layers.map((layer,index)=>({...layer,proposedSourceKey:boundaryKeys[index],policyStatus:policyStatus(boundaryKeys[index])})),
   providerConditionSupport:'implemented-operator-controlled-policy' as const,
   forbiddenSubstituteConditions:['geoboundaries-cc-by-4.0-attribution','geoboundaries-modification-and-edition-notice'],
   requirement:'The fixed operator policy includes two independently reviewed private Natural Earth subjects with actual original, licence and normalization-lineage pins. This report does not validate a source bundle or invocation. Use the exact reviewed bundles and bind actual normalized boundary bytes through the production admission envelope; changed subjects require fresh reviews.',
  },
  blockers:['planet-raw-sha256-unmeasured','planet-native-vintage-unobserved','operator-controlled-policy-revision-required',
   'trusted-subject-reviews-required',
   ...(boundaryKeys.some(key=>policyStatus(key)==='missing-from-retained-policy')?['natural-earth-trusted-provider-record-required']:[]),
   'real-source-production-admission-evidence-required'],
  postReceiptGates:[
   {id:'actual-raw-identity',requiresReceipt:true,action:'Verify exact received length and provider MD5; retain measured local SHA-256. Multipart ETag is not MD5. Never derive native vintage from the filename or HTTP date.'},
   {id:'native-payload-inspection',requiresReceipt:true,action:'Inspect the actual PBF header with the intended parser; retain schemaVersion 1 native-vintage-observation bound to exact raw bytes/SHA-256 and nativeVintage.'},
   {id:'planet-domain-descriptor',requiresReceipt:true,action:'Retain provider whole-world evidence and native observation with exact evidence pins. Create and reverify planet-domain-v1 via createPlanetDomainDescriptor on actual retained raw. It claims only source-domain-only.'},
   {id:'operator-inventory-policy-revision',requiresReceipt:true,action:'Review a pinned inventory root and source record for the actual dated planet, including exact recordSha256 and original ODbL conditions. Change the operator-controlled retained inventory/policy in code review; candidate files cannot select or overwrite it.'},
   {id:'trusted-subject-reviews',requiresReceipt:true,action:'Prepare the full actual source manifest, descriptor, intended use and rights bundle; calculate admissionSubjectDigest. Obtain independent source-provenance, payload-validation, rights-review, planet-domain and admission-approval receipts on that exact digest and independently allowlist their evidence pins. Any subject change invalidates receipts.'},
   {id:'actual-production-admission-envelope',requiresReceipt:true,action:'The production CLIs, producer and assembly invoke the fixed-policy production admission gate. After receipt, prepare the actual pinned envelope binding the exact raw manifest, assembly plan, source bundles, native evidence and subject-bound normalized boundary lineage. Fixed authority covers only two reviewed private Natural Earth boundary subjects; actual planet policy and subject reviews remain absent.'},
   {id:'separate-build-and-release',requiresReceipt:true,action:'Stop after receipt/native inspection and actual descriptor/review preparation. Request a separate bounded build authorization with refreshed disk/memory and nonoverlapping retained accounting. Complete scanned-policy and independent footprint evidence before searched coverage; public derivative offer, host fit and installation remain separate.'},
  ],
  assemblyPinMaxBytes:128*1024**2,
  serving:{preparationMachine:'Windows workstation',tinyServer:'2 CPU / 4 GB Hetzner',rawPlanetOnTinyServer:false as const,
   requirement:'Only an admitted immutable catalogue and required runtime assets may be considered after measured host disk/query/concurrency/rollback fit and concrete installation approval.'},
 };
}

/** Explicit metadata input only: bounded even if the opened file grows. No writes. */
async function readRequest(path:string){
 if((await lstat(path)).isSymbolicLink())throw new Error('Metadata symlink refused');
 const handle=await open(path,'r');
 try{
  const before=await handle.stat();if(!before.isFile()||before.size>65536)throw new Error('Metadata byte limit');
  const bytes=Buffer.alloc(65537);let count=0;
  while(count<bytes.length){const {bytesRead}=await handle.read(bytes,count,bytes.length-count,null);if(!bytesRead)break;count+=bytesRead;}
  const after=await handle.stat();
  if(count!==before.size||count>65536||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ino!==before.ino)throw new Error('Metadata mutation/byte limit');
  return JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes.subarray(0,count)));
 }finally{await handle.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length&&!(args.length===2&&args[0]==='--check'))throw new Error('Usage: planet-policy-preparation.ts [--check METADATA.json]');
 const report=await buildPlanetPolicyPreparation(args.length?await readRequest(args[1]):undefined);
 process.stdout.write(JSON.stringify(report,null,2)+'\n');
}
