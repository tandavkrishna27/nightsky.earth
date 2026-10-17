import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDarkSkySitesEvidence, runDarkSkySitesVisibleWorkflow, type DarkSkySitesEvidence } from '../../server/providers/lightPollution/darkSkySitesBrowser';
const point={candidateId:'a',latitude:17.612345,longitude:78.563456};
// Synthetic labeled evidence. These labels have NOT been established in the live UI.
const text='Coordinates: 17.612345, 78.563456\nDataset: VIIRS model\nYear: 2025\nMonth: 7\nSQM: 18.4\nBortle: 8-9\nCoverage: verified\nAttribution: DarkSkySites / model owner';
const evidence=(overrides:Partial<DarkSkySitesEvidence>={}):DarkSkySitesEvidence=>({selectedText:text,previousSelectedText:'old',selectedCount:1,previousSelectionGeneration:1,coordinatePrecision:'exact',selectionGeneration:2,completedGeneration:2,exactCoordinateEvidence:'17.612345, 78.563456',...overrides});
test('retains synthetic dataset, range, attribution and exact association',()=>{const r=parseDarkSkySitesEvidence(point,evidence());assert.equal(r.status,'available');assert.equal(r.sqm,18.4);assert.deepEqual(r.bortleClasses,[8,9]);assert.deepEqual(r.dataset,{label:'VIIRS model',id:null,year:2025,month:7});assert.equal(r.attribution,'DarkSkySites / model owner');assert.equal(r.sourceId,'darkskysites');assert.equal(r.transport,'browser');});
for(const [name,changes] of [
 ['stale card despite moving hover',{selectedText:'old',previousSelectedText:'old'}],
 ['rounded selected coordinates',{exactCoordinateEvidence:'17.61, 78.56'}],
 ['missing exact evidence',{exactCoordinateEvidence:null}],
 ['out of order completion',{completedGeneration:1}],
 ['multiple selected cards',{selectedCount:2}],
 ['challenge',{selectedText:'Verify you are human'}],
 ['missing dataset',{selectedText:text.replace('Dataset: VIIRS model\n','')}],
 ['missing coverage',{selectedText:text.replace('Coverage: verified\n','')}],
 ['unverified zero',{selectedText:text.replace('SQM: 18.4','SQM: 0').replace('Coverage: verified','Coverage: unverified_zero')}],
] as const)test(`rejects ${name}`,()=>{const r=parseDarkSkySitesEvidence(point,evidence(changes));assert.equal(r.status,'unavailable');assert.equal(r.sqm,null);assert.equal(r.bortleClasses,null);});
test('two points sharing rounded labels cannot reuse metrics',()=>{for(const latitude of [17.612345,17.612346])assert.equal(parseDarkSkySitesEvidence({...point,latitude},evidence({exactCoordinateEvidence:'17.61, 78.56'})).status,'unavailable');});
test('rejects exact text belonging to a different selected point',()=>assert.equal(parseDarkSkySitesEvidence({...point,latitude:17.612346},evidence()).status,'unavailable'));
test('observed control workflow requires marker selection and rejects absent binding',async()=>{const actions:string[]=[];const r=await runDarkSkySitesVisibleWorkflow(point,{
 clickButton:async name=>{actions.push(name);},fillTextbox:async(name,value)=>{actions.push(`${name}=${value}`);},selectRequestedMarker:async()=>{actions.push('marker');},readSelectedEvidence:async()=>evidence({exactCoordinateEvidence:null}),
 });assert.deepEqual(actions,['Enter GPS coordinates','Coordinates=17.612345, 78.563456','Go to Location','marker']);assert.equal(r.status,'unavailable');});
test('cancelled workflow performs no browser actions',async()=>{const c=new AbortController();c.abort();const fail=async()=>{throw Error('unexpected action');};const r=await runDarkSkySitesVisibleWorkflow(point,{clickButton:fail,fillTextbox:fail,selectRequestedMarker:fail,readSelectedEvidence:fail},c.signal);assert.equal(r.errorCode,'browser_cancelled');});

test('rounded labels remain unusable even when numerically equal to requested coordinates',()=>{const r=parseDarkSkySitesEvidence({...point,latitude:17.61,longitude:78.56},evidence({selectedText:text.replace('17.612345, 78.563456','17.61, 78.56'),exactCoordinateEvidence:'17.61, 78.56',coordinatePrecision:'rounded'}));assert.equal(r.status,'unavailable');});
test('a changed card with the previous selection generation is stale',()=>assert.equal(parseDarkSkySitesEvidence(point,evidence({previousSelectionGeneration:2})).status,'unavailable'));


test('cancellation settles while a port action is pending and prevents subsequent actions',async()=>{
 const controller=new AbortController();let release!:()=>void;let started!:()=>void;
 const entered=new Promise<void>(resolve=>{started=resolve;});const pending=new Promise<void>(resolve=>{release=resolve;});
 const actions:string[]=[];
 const running=runDarkSkySitesVisibleWorkflow(point,{
  clickButton:async name=>{actions.push(name);started();await pending;},
  fillTextbox:async()=>{actions.push('fill');},selectRequestedMarker:async()=>{actions.push('marker');},readSelectedEvidence:async()=>evidence(),
 },controller.signal);
 await entered;controller.abort();
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{const result=await Promise.race([running,new Promise<'still pending'>(resolve=>{timer=setTimeout(()=>resolve('still pending'),30);})]);assert.notEqual(result,'still pending');if(result!=='still pending')assert.equal(result.errorCode,'browser_cancelled');}
 finally{clearTimeout(timer);release();await running;}
 assert.deepEqual(actions,['Enter GPS coordinates']);
});
test('missing dataset month remains null without inventing a date',()=>{const result=parseDarkSkySitesEvidence(point,evidence({selectedText:text.replace('Month: 7\n','')}));assert.equal(result.status,'available');assert.equal(result.dataset.month,null);assert.equal(result.dataset.year,2025);});
