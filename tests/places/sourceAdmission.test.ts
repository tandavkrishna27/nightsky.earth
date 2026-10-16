import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, mkdir, access} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {buildRetainedSourceAdmissionInventory, buildRetainedSourceAdmissionPolicy, admissionSubjectDigest, validateSourceAdmission, validateSourceAdmissionFiles, verifyPlanetDomainFile, sourceAdmissionBundleSchema, retainedSourceEvidencePin, sourceAdmissionOutputPath} from '../../scripts/osm/source-admission';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const pin=(name:string)=>({path:`synthetic/${name}.json`,bytes:64,sha256:hash(name)});
async function scratchDirectory(prefix:string,parent=resolve('.cache')) {await mkdir(parent,{recursive:true});return mkdtemp(join(parent,prefix));}
// Entirely fictional review evidence; these are no permission or source grants.
function fixture(kind:'boundary'|'osm-extract'='boundary') {
 const payload={url:'https://example.org/immutable/edition-1/data',bytes:1234,sha256:hash('payload'),identityEvidence:pin('payload-identity')};
 const source={key:'SYN-ADM0',kind,edition:'synthetic-edition-1',manifest:pin('manifest'),recordSha256:hash('record'),originalSource:{identity:'Fictional author, asset 1 revision 1',url:'https://example.org/asset/1/revision/1',provenanceEvidence:pin('provenance')},payload,effectiveClip:kind==='boundary'?{status:'not-applicable',reason:'Administrative membership geometry is not an extraction clip'}:{status:'bound',payload:{url:'https://example.org/immutable/edition-1/clip',bytes:123,sha256:hash('clip'),identityEvidence:pin('clip-identity')},associationEvidence:pin('association'),boundPayloadSha256:payload.sha256,procedure:'Fictional exact extraction build procedure revision 1'},intendedUse:{purpose:'Fictional transformed public database',transformRevision:'synthetic-transform-1',distribution:'public',outputLicence:'ODbL-1.0'},rights:{classification:'derivative-database',licensor:'Fictional author',licenceId:'ODbL-1.0',licenceEvidence:pin('licence'),notices:[{text:'Fictional attribution and modification notice',destination:'https://example.org/releases/1/notices'}],conditions:[{id:'attribution',evidence:pin('notice')},{id:'licence-notice',evidence:pin('terms')},{id:'modification-notice',evidence:pin('modifications')},{id:'share-alike',evidence:pin('share-alike')},{id:'machine-readable-offer',evidence:pin('offer')}],offer:{url:'https://example.org/releases/1/database',sha256:hash('output'),bytes:55,retentionPolicy:'Fictional immutable availability policy'}}};
 source.rights.conditions.push(...['database-versus-produced-work','no-additional-restrictions','exact-original-source-identity','licensor-authority','original-source-to-payload-chain','mixed-output-compatibility-review',...(kind==='boundary'?['geoboundaries-cc-by-4.0-attribution','geoboundaries-modification-and-edition-notice']:['osm-contributor-attribution'])].map(id=>({id,evidence:pin(id)})));
 const subjectSha256=admissionSubjectDigest(source);
 const roles=['source-provenance','payload-validation','rights-review','admission-approval',...(kind==='osm-extract'?['effective-clip']:[])];
 const reviews=roles.map(role=>({role,subjectSha256,reviewer:'fictional-reviewer',reviewedAt:'2026-10-16T00:00:00Z',decision:'approve',evidence:pin(role)}));
 const policy={schemaVersion:1,policyId:'fictional-test-policy-not-source-permission',inventoryRoots:[pin('fictional-policy-root')],sources:[{key:'SYN-ADM0',kind,edition:'synthetic-edition-1',recordSha256:hash('record'),originalLicenceId:'ODbL-1.0',disposition:'reviewable',requiredConditions:['attribution','licence-notice','modification-notice','share-alike','machine-readable-offer','database-versus-produced-work','no-additional-restrictions','exact-original-source-identity','licensor-authority','original-source-to-payload-chain','mixed-output-compatibility-review',...(kind==='boundary'?['geoboundaries-cc-by-4.0-attribution','geoboundaries-modification-and-edition-notice']:['osm-contributor-attribution'])]}]};
 return {bundle:{schemaVersion:1,source,reviews},trust:{schemaVersion:1,trustedReviews:reviews.map(r=>({role:r.role,subjectSha256,reviewer:r.reviewer,evidence:r.evidence}))},policy};
}
function freshFictionalReceipts(bundle:ReturnType<typeof fixture>['bundle']) {const subjectSha256=admissionSubjectDigest(bundle.source);for(const review of bundle.reviews)review.subjectSha256=subjectSha256;return {schemaVersion:1,trustedReviews:bundle.reviews.map(r=>({role:r.role,subjectSha256,reviewer:r.reviewer,evidence:r.evidence}))};}
test('all 429 immutable layers receive source-specific dispositions and IND claims remain unmeasured',async()=>{
 const inventory=await buildRetainedSourceAdmissionInventory();
 assert.equal(inventory.layers.length,429);assert.equal(inventory.summary.admitted,0);assert.equal(inventory.summary.quarantined,429);
 assert.equal(inventory.retainedManifest.sha256,retainedSourceEvidencePin.sha256);
 assert.equal(inventory.summary.licenceLabels,18);
 const ind=inventory.layers.find((r:any)=>r.sourceKey==='IND-ADM0')!;
 assert.equal(ind.payloadIdentity.status,'pointer-claim-only');assert.equal(ind.payloadIdentity.measuredSha256,null);
 assert.equal(ind.payloadIdentity.claimedSha256,'6072f345d9c50dc497f052638318ae739165c455c6b945cbeb6e5f15ff9bc303');
 assert.ok(ind.gaps.includes('metadata-identity-conflict'));assert.equal(ind.originalDeclaration.boundaryType,'ADM1');
 const pol=inventory.layers.find((r:any)=>r.sourceKey==='POL-ADM0')!;assert.ok(pol.gaps.includes('ambiguous-original-licence'));
 const tw=inventory.layers.find((r:any)=>r.sourceKey==='TWN-ADM0')!;assert.ok(tw.requiredConditions.includes('historical-asset-redistribution-grant'));
 const odbl=inventory.layers.filter((r:any)=>r.licenceProfile.id==='ODbL-1.0');assert.equal(odbl.length,168);assert.ok(odbl.every((r:any)=>r.requiredConditions.includes('machine-readable-offer')));
 const pd=inventory.layers.find((r:any)=>r.sourceKey==='ATA-ADM0')!;assert.ok(pd.requiredConditions.includes('public-domain-jurisdiction-and-authority'));assert.equal(pd.effectiveClip.status,'not-applicable');
 assert.equal(inventory.network.requests,0);assert.deepEqual(inventory.cdsAssetHostAllowlist,[]);
 assert.equal(inventory.osmExtracts.length,8);assert.equal(inventory.osmExtracts.reduce((sum:any,s:any)=>sum+s.payloadIdentity.httpListedBytes,0),85563268782);
 assert.ok(inventory.osmExtracts.every((s:any)=>s.effectiveClip.status==='unresolved-provider-build-association'&&s.payloadIdentity.measuredSha256===null));
});
test('review declarations cannot admit without separately trusted exact receipts',()=>{
 const {bundle,trust,policy}=fixture();assert.equal(validateSourceAdmission(bundle,trust,policy).disposition,'prepared-for-separate-acquisition-review');
 const untrusted=validateSourceAdmission(bundle,{schemaVersion:1,trustedReviews:[]},policy);assert.equal(untrusted.disposition,'quarantined');assert.ok(untrusted.gaps.includes('untrusted-review:admission-approval'));
 const declared=structuredClone(bundle);declared.reviews=[];assert.equal(validateSourceAdmission(declared,trust,policy).disposition,'quarantined');
});
test('any exact source, payload, use or rights change invalidates previous approvals',()=>{
 const {bundle,trust,policy}=fixture();for(const change of [(b:any)=>b.source.edition='other',(b:any)=>b.source.payload.sha256=hash('other'),(b:any)=>b.source.originalSource.identity='other',(b:any)=>b.source.intendedUse.outputLicence='other',(b:any)=>b.source.rights.notices[0].text='other']){const changed=structuredClone(bundle);change(changed);const result=validateSourceAdmission(changed,trust,policy);assert.equal(result.disposition,'quarantined');assert.ok(result.gaps.includes('stale-review:admission-approval'));}
});
test('OSM extraction requires effective clip association to the exact source payload and its own review',()=>{
 const {bundle,trust,policy}=fixture('osm-extract');assert.equal(validateSourceAdmission(bundle,trust,policy).gaps.length,0);
 const wrong=structuredClone(bundle);(wrong.source.effectiveClip as any).boundPayloadSha256=hash('wrong');assert.ok(validateSourceAdmission(wrong,trust,policy).gaps.includes('effective-clip-payload-mismatch'));
 const missing=structuredClone(bundle);missing.source.effectiveClip={status:'not-applicable',reason:'not available'};assert.ok(validateSourceAdmission(missing,trust,policy).gaps.includes('effective-clip-required'));
});
test('licence profile conditions cannot be waived by metadata or generic approval',()=>{
 const {bundle,trust,policy}=fixture();bundle.source.rights.conditions=bundle.source.rights.conditions.filter(c=>c.id!=='machine-readable-offer');assert.ok(validateSourceAdmission(bundle,trust,policy).gaps.includes('missing-condition:machine-readable-offer'));
 bundle.source.rights.licenceId='unreviewed';assert.ok(validateSourceAdmission(bundle,trust,policy).gaps.includes('unsupported-licence-profile'));
});
test('boundary provider attribution and mixed database compatibility remain mandatory',()=>{
 const {bundle,trust,policy}=fixture();bundle.source.rights.conditions=bundle.source.rights.conditions.filter(c=>c.id!=='geoboundaries-cc-by-4.0-attribution'&&c.id!=='mixed-output-compatibility-review');const result=validateSourceAdmission(bundle,trust,policy);assert.ok(result.gaps.includes('missing-condition:geoboundaries-cc-by-4.0-attribution'));assert.ok(result.gaps.includes('missing-condition:mixed-output-compatibility-review'));
});
test('trusted retained policy prevents licence downgrade even with fresh ordinary approval receipts',async()=>{
 const policy=await buildRetainedSourceAdmissionPolicy(),original=policy.sources.find(source=>source.originalLicenceId==='ODbL-1.0'&&source.kind==='boundary')!;
 const {bundle}=fixture();Object.assign(bundle.source,{key:original.key,kind:original.kind,edition:original.edition,recordSha256:original.recordSha256});bundle.source.rights.licenceId='CC0-1.0';bundle.source.rights.conditions=bundle.source.rights.conditions.filter(c=>!['share-alike','machine-readable-offer'].includes(c.id));bundle.source.rights.conditions.push(...['dedicator-authority','third-party-rights-review','no-endorsement'].map(id=>({id,evidence:pin(id)})));
 const result=validateSourceAdmission(bundle,freshFictionalReceipts(bundle),policy);assert.equal(result.disposition,'quarantined');assert.ok(result.gaps.includes('policy-original-licence-mismatch'));assert.ok(result.gaps.includes('missing-policy-condition:share-alike'));assert.ok(result.gaps.includes('missing-policy-condition:machine-readable-offer'));
});
test('trusted policy rejects renamed sources, substituted record hashes and editions despite new receipts',()=>{
 const {bundle,policy}=fixture();for(const [field,value,gap]of [['key','renamed','policy-source-not-found'],['recordSha256',hash('substitute'),'policy-record-mismatch'],['edition','another-edition','policy-edition-mismatch']] as const){const changed=structuredClone(bundle);changed.source[field]=value;const result=validateSourceAdmission(changed,freshFictionalReceipts(changed),policy);assert.equal(result.disposition,'quarantined');assert.ok(result.gaps.includes(gap));}
 assert.throws(()=>validateSourceAdmission(bundle,freshFictionalReceipts(bundle),undefined));
});
test('POL and TWN blocked original grants cannot be replaced by supported licence declarations and ordinary receipts',async()=>{
 const policy=await buildRetainedSourceAdmissionPolicy();for(const key of ['POL-ADM0','TWN-ADM0']){const original=policy.sources.find(source=>source.key===key)!;const {bundle}=fixture();Object.assign(bundle.source,{key:original.key,kind:original.kind,edition:original.edition,recordSha256:original.recordSha256});bundle.source.rights.licenceId='CC0-1.0';bundle.source.rights.conditions.push(...['dedicator-authority','third-party-rights-review','no-endorsement'].map(id=>({id,evidence:pin(id)})));const result=validateSourceAdmission(bundle,freshFictionalReceipts(bundle),policy);assert.equal(result.disposition,'quarantined');assert.ok(result.gaps.includes('policy-source-blocked'));assert.ok(result.gaps.includes('policy-original-licence-mismatch'));}
});
test('strict bounded schema rejects unexpected approval, unsafe paths, secret URLs and unbounded payloads',()=>{
 const {bundle}=fixture();for(const change of [(b:any)=>b.approved=true,(b:any)=>b.source.manifest.path='../escape.json',(b:any)=>b.source.payload.url='https://example.org/data?token=secret',(b:any)=>b.source.payload.url='https://user:password@example.org/data',(b:any)=>b.source.payload.bytes=Number.MAX_SAFE_INTEGER,(b:any)=>b.source.payload.url='https://example.org/latest/data']){const bad=structuredClone(bundle);change(bad);assert.equal(sourceAdmissionBundleSchema.safeParse(bad).success,false);}
});
test('offline file gate verifies metadata pins, exact manifest membership and receipt contents',async()=>{
 const dir=await scratchDirectory('source-admission-test-');
 const {bundle,trust}=fixture();
 const evidencePins=[bundle.source.manifest,bundle.source.originalSource.provenanceEvidence,bundle.source.payload.identityEvidence,bundle.source.rights.licenceEvidence,...bundle.source.rights.conditions.map(c=>c.evidence),...bundle.reviews.map(r=>r.evidence)];
 const records=[{sourceKey:bundle.source.key,kind:bundle.source.kind,edition:bundle.source.edition,recordSha256:bundle.source.recordSha256,payload:{url:bundle.source.payload.url,bytes:bundle.source.payload.bytes,sha256:bundle.source.payload.sha256}}];
 for(let i=0;i<evidencePins.length;i++){
  const p=evidencePins[i];const review=bundle.reviews.find(r=>r.evidence===p);
  const data=JSON.stringify(p===bundle.source.manifest?{schemaVersion:1,kind:'source-admission-manifest',records}:review?{schemaVersion:1,role:review.role,subjectSha256:'pending',reviewer:review.reviewer,reviewedAt:review.reviewedAt,decision:review.decision}:{scope:'Fictional review evidence'});
  p.path=`evidence-${i}.json`;p.bytes=Buffer.byteLength(data);p.sha256=hash(data);await writeFile(join(dir,p.path),data);
 }
 // Bind receipts after all source metadata pins are frozen.
 const subject=admissionSubjectDigest(bundle.source);
 for(const r of bundle.reviews){r.subjectSha256=subject;const data=JSON.stringify({schemaVersion:1,role:r.role,subjectSha256:subject,reviewer:r.reviewer,reviewedAt:r.reviewedAt,decision:r.decision});r.evidence.bytes=Buffer.byteLength(data);r.evidence.sha256=hash(data);await writeFile(join(dir,r.evidence.path),data);}
 trust.trustedReviews=bundle.reviews.map(r=>({role:r.role,subjectSha256:r.subjectSha256,reviewer:r.reviewer,evidence:r.evidence}));
 const bp=join(dir,'bundle.json'),tp=join(dir,'trust.json');await writeFile(bp,JSON.stringify(bundle));await writeFile(tp,JSON.stringify(trust));
 const checked=await validateSourceAdmissionFiles(bp,tp);assert.equal(checked.disposition,'quarantined');assert.ok(checked.gaps.includes('policy-source-not-found'));
 const originalSecond=bundle.reviews[1].evidence;bundle.reviews[1].evidence=bundle.reviews[0].evidence;trust.trustedReviews[1].evidence=bundle.reviews[0].evidence;await writeFile(bp,JSON.stringify(bundle));await writeFile(tp,JSON.stringify(trust));await assert.rejects(validateSourceAdmissionFiles(bp,tp),/receipt content mismatch/);bundle.reviews[1].evidence=originalSecond;trust.trustedReviews[1].evidence=originalSecond;await writeFile(bp,JSON.stringify(bundle));await writeFile(tp,JSON.stringify(trust));
 const receipt=bundle.reviews[0],originalReceipt=await readFile(join(dir,receipt.evidence.path),'utf8');const forged=originalReceipt.replace('fictional-reviewer','untrusted-person');receipt.evidence.bytes=Buffer.byteLength(forged);receipt.evidence.sha256=hash(forged);await writeFile(join(dir,receipt.evidence.path),forged);await writeFile(bp,JSON.stringify(bundle));await writeFile(tp,JSON.stringify(trust));await assert.rejects(validateSourceAdmissionFiles(bp,tp),/receipt content mismatch/);receipt.evidence.bytes=Buffer.byteLength(originalReceipt);receipt.evidence.sha256=hash(originalReceipt);await writeFile(join(dir,receipt.evidence.path),originalReceipt);await writeFile(bp,JSON.stringify(bundle));await writeFile(tp,JSON.stringify(trust));
 const metadata=join(dir,bundle.source.originalSource.provenanceEvidence.path);await writeFile(metadata,'tampered');await assert.rejects(validateSourceAdmissionFiles(bp,tp),/pin|checksum/);
 // A re-pinned source manifest that names another payload must still fail membership.
 const other=fixture();records[0].payload.sha256=hash('wrong');const changed=JSON.stringify({schemaVersion:1,kind:'source-admission-manifest',records});other.bundle.source.manifest={path:'wrong-manifest.json',bytes:Buffer.byteLength(changed),sha256:hash(changed)};await writeFile(join(dir,'wrong-manifest.json'),changed);await writeFile(bp,JSON.stringify(other.bundle));await assert.rejects(validateSourceAdmissionFiles(bp,tp),/manifest membership/);
});
test('inventory CLI writes a bounded complete packet once and refuses overwrite or workspace escape',async()=>{
 const absentParent=join(await scratchDirectory('source-admission-clean-parent-'),'initially-absent');await assert.rejects(access(absentParent),{code:'ENOENT'});
 const dir=await scratchDirectory('source-admission-cli-',absentParent),output=join(dir,'inventory.json');
 const command=(path:string)=>spawnSync(process.execPath,['--import','tsx','scripts/osm/source-admission.ts','inventory',path],{encoding:'utf8',timeout:10000});
 assert.equal(command(output).status,0);const value=JSON.parse(await readFile(output,'utf8'));assert.equal(value.layers.length,429);assert.equal(value.osmExtracts.length,8);
 assert.notEqual(command(output).status,0);assert.notEqual(command('../source-admission-escape.json').status,0);
});
test('output path gate rejects Windows streams, devices and aliases on every platform before opening a file',()=>{
 assert.equal(sourceAdmissionOutputPath('.cache/ordinary-result.json'),resolve('.cache/ordinary-result.json'));
 assert.equal(sourceAdmissionOutputPath(resolve('.cache/ordinary-result.json')),resolve('.cache/ordinary-result.json'));
 for(const path of ['.cache/existing.json:stream','.cache/parent:stream/result.json','.cache/CON','.cache/nul.json','.cache/COM1.log','.cache/lpt9.any','.cache/COM¹.txt','.cache/CONOUT$','.cache/NUL .txt','.cache/parent./result.json','.cache/parent /result.json','.cache/result.json.','.cache/result.json ','.cache/control\u0001.json','.cache/control\u0000.json','.cache/parent/../result.json','C:relative.json','\\\\?\\C:\\result.json','\\\\.\\NUL','.cache//result.json']) assert.throws(()=>sourceAdmissionOutputPath(path),/Unsafe output|traversal/);
});
test('retained public artifact identity and regenerated inventory survive LF and Windows CRLF checkout',async()=>{
 const dir=await scratchDirectory('source-admission-line-endings-');await mkdir(join(dir,'docs','operations'),{recursive:true});
 for(const name of ['geography-source-metadata-evidence.json','geography-admission-resolution-evidence.json']){const data=(await readFile(resolve('docs','operations',name),'utf8')).replaceAll('\r\n','\n');await writeFile(join(dir,'docs','operations',name),data);}
 const lf=await buildRetainedSourceAdmissionInventory(dir);assert.equal(lf.retainedManifest.bytes,2480339);assert.equal(lf.retainedManifest.sha256,'e84cf663e02aa0fed3cd0bcb424d423f06a1bab6f4b119bf104d8c7371b23ffb');
 for(const name of ['geography-source-metadata-evidence.json','geography-admission-resolution-evidence.json']){const path=join(dir,'docs','operations',name);await writeFile(path,(await readFile(path,'utf8')).replaceAll('\n','\r\n'));}
 assert.deepEqual(await buildRetainedSourceAdmissionInventory(dir),lf);
});

async function domainReadFixture(){
 const dir=await scratchDirectory('source-admission-metered-'),raw={bytes:1234,sha256:hash('synthetic body identity')},nativeVintage='2026-10-17T00:00:00Z';
 const observation=JSON.stringify({schemaVersion:1,kind:'native-vintage-observation',raw,nativeVintage}),provider='p'.repeat(140000);
 const observationPin={path:'vintage.json',bytes:Buffer.byteLength(observation),sha256:hash(observation)},providerPin={path:'provider.txt',bytes:Buffer.byteLength(provider),sha256:hash(provider)};
 const descriptor={schemaVersion:1,kind:'planet-domain-v1',sourceUrl:'https://example.org/immutable/fictional.osm',edition:'fictional-1',provider:'Synthetic metadata only',providerWholeWorldEvidence:providerPin,providerObject:{version:'synthetic-version',etag:'synthetic-etag',md5:'a'.repeat(32)},raw,nativeVintage,nativeVintageEvidence:observationPin,domain:{west:-180,south:-90,east:180,north:90},selectionPolicy:'named-complete-way-v1-polar85',coverageClaim:'source-domain-only'};
 const body=JSON.stringify(descriptor),path=join(dir,'domain.json'),pin={bytes:Buffer.byteLength(body),sha256:hash(body)};
 await writeFile(path,body);await writeFile(join(dir,observationPin.path),observation);await writeFile(join(dir,providerPin.path),provider);
 return {dir,path,pin,lengths:[pin.bytes,observationPin.bytes,providerPin.bytes]};
}
test('trusted metadata hooks charge every physical linked read while distinct bytes deduplicate',async()=>{
 const f=await domainReadFixture(),reads:number[]=[];let checkpoints=0;
 const accounting={bytes:0,ceiling:32*1024**2,paths:new Map<string,number>(),onRead(bytes:number){reads.push(bytes);},checkpoint(){checkpoints++;}};
 await verifyPlanetDomainFile(f.path,f.pin,accounting);await verifyPlanetDomainFile(f.path,f.pin,accounting);
 assert.deepEqual(reads,[...f.lengths,...f.lengths]);assert.equal(accounting.bytes,f.lengths.reduce((a,b)=>a+b,0));assert.equal(accounting.paths.size,3);
 // Three bounded reads for the140kB linked provider file, plus before-open and
 // final checks for every artifact on both passes. Short I/O may add checks.
 assert.ok(checkpoints>=22);
});
test('trusted read hook exhaustion rejects before metadata allocation or body reads',async()=>{
 const f=await domainReadFixture(),original=Buffer.alloc;let matchingAllocations=0,reads=0;
 Buffer.alloc=((size:number,...args:any[])=>{if(size===f.pin.bytes)matchingAllocations++;return original(size,...args);}) as typeof Buffer.alloc;
 try{
  await assert.rejects(verifyPlanetDomainFile(f.path,f.pin,{bytes:0,ceiling:32*1024**2,paths:new Map(),onRead(bytes){assert.equal(bytes,f.pin.bytes);reads++;throw new Error('physical-read-exhausted');}}),/physical-read-exhausted/);
  assert.equal(reads,1);assert.equal(matchingAllocations,0);
 }finally{Buffer.alloc=original;}
});
test('trusted metadata checkpoint can stop before opening an absent descriptor',async()=>{
 const f=await domainReadFixture();let checkpoints=0;
 await assert.rejects(verifyPlanetDomainFile(join(f.dir,'absent.json'),f.pin,{bytes:0,ceiling:32*1024**2,paths:new Map(),checkpoint(){checkpoints++;throw new Error('shared-deadline');}}),/shared-deadline/);
 assert.equal(checkpoints,1);
});
