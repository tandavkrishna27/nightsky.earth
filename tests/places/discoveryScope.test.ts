import test from "node:test";
import assert from "node:assert/strict";

// Missing defaults, permissive unknown keys, and incorrect branch admission are observable contract regressions.
async function contracts() { return import("../../shared/nightsky/discovery"); }
test("discovery contract module is available", async () => {
  let moduleAvailable = false;
  try { moduleAvailable = typeof (await contracts()).normalizeDiscoveryInput === "function"; } catch {}
  assert.equal(moduleAvailable, true);
});
test("legacy defaults remain radius 50, minimum zero and limit five", async () => {
  const d = await contracts();
  assert.equal(d.searchDiscoveryInputSchema.parse({placeId:"place:v1:city"}).limit, 5);
  assert.deepEqual(d.normalizeDiscoveryInput({placeId:"place:v1:city"}), {origins:[{placeId:"place:v1:city",radiusKm:50,minimumDistanceKm:0}],originMode:"any",includeRegionIds:[],excludeRegionIds:[],regionMode:"any"});
});
test("scope defaults and explicit combination modes survive normalization", async () => {
  const d = await contracts();
  assert.deepEqual(d.normalizeDiscoveryInput({scope:{includeRegionIds:["region:v1:IND"]}}), {origins:[],originMode:"any",includeRegionIds:["region:v1:IND"],excludeRegionIds:[],regionMode:"any"});
  const scope = d.normalizeDiscoveryInput({scope:{origins:[{placeId:"place:v1:city",radiusKm:1,minimumDistanceKm:1}],originMode:"all",includeRegionIds:["region:v1:IND"],excludeRegionIds:["region:v1:IND"],regionMode:"all"}});
  assert.equal(scope.originMode,"all"); assert.equal(scope.regionMode,"all"); assert.deepEqual(scope.excludeRegionIds,["region:v1:IND"]);
});
test("bounds, mutual exclusions, malformed identifiers and unknown keys are rejected", async () => {
  const {searchDiscoveryInputSchema:s} = await contracts();
  const origin = {placeId:"place:v1:city"};
  for (const value of [{},{scope:{}},{scope:{excludeRegionIds:["region:v1:IND"]}},{scope:{includeRegionIds:["region:v1:IND"]},placeId:origin.placeId},{scope:{includeRegionIds:["region:v1:IND"]},radiusKm:50},{placeId:origin.placeId,extra:1},{scope:{origins:[{...origin,extra:1}]}},{scope:{origins:[origin],extra:1}},{placeId:"arbitrary"},{scope:{includeRegionIds:["IND"]}},{placeId:origin.placeId,limit:0},{placeId:origin.placeId,limit:11},{placeId:origin.placeId,limit:1.5},{placeId:origin.placeId,categories:[]},{placeId:origin.placeId,categories:["unknown"]},{placeId:origin.placeId,categories:Array(7).fill("park")}, ...[0,301,NaN,Infinity].map(radiusKm=>({placeId:origin.placeId,radiusKm})), ...[0,301,NaN,Infinity].map(radiusKm=>({scope:{origins:[{...origin,radiusKm}]}})), ...[-1,51,Infinity].map(minimumDistanceKm=>({scope:{origins:[{...origin,minimumDistanceKm}]}})),{scope:{origins:Array(6).fill(origin)}},{scope:{includeRegionIds:Array(6).fill("region:v1:IND")}},{scope:{origins:[origin],excludeRegionIds:Array(6).fill("region:v1:IND")}},{scope:{origins:[{...origin,catalogueRevision:" "}]}},{scope:{origins:[origin],originMode:"both"}},{scope:{includeRegionIds:["region:v1:IND"],regionMode:"both"}}]) {
    assert.equal(s.safeParse(value).success,false,JSON.stringify(value));
  }
});
test("maximum admitted scope and inclusive radius/limit boundaries are accepted", async () => {
  const {searchDiscoveryInputSchema:s} = await contracts();
  assert.equal(s.safeParse({scope:{origins:Array(5).fill({placeId:"place:v1:city",radiusKm:300,minimumDistanceKm:300}),includeRegionIds:Array(5).fill("region:v1:IND"),excludeRegionIds:Array(5).fill("region:v1:IND")},categories:["park","viewpoint","protected-area","campground","beach","other"],limit:10}).success,true);
  assert.equal(s.safeParse({placeId:"place:v1:city",radiusKm:1,limit:1}).success,true);
});

test("five included and five excluded API regions retain all ten selected references", async () => {
  const { discoveryScopeSchema: schema } = await contracts();
  const refs = Array.from({ length: 11 }, (_, index) => ({ regionId: `region:v1:scope:${index}`, sourceRevision: index.toString(16).padStart(64, '0') }));
  const scope = { includeRegionIds: refs.slice(0, 5).map(r => r.regionId), excludeRegionIds: refs.slice(5, 10).map(r => r.regionId), regionSelections: refs.slice(0, 10) };
  assert.equal(schema.safeParse(scope).success, true);
  assert.equal(schema.parse(scope).regionSelections?.length, 10);
  assert.equal(schema.safeParse({ ...scope, regionSelections: refs }).success, false);
  assert.equal(schema.safeParse({ ...scope, includeRegionIds: refs.slice(0, 6).map(r => r.regionId) }).success, false);
  assert.equal(schema.safeParse({ ...scope, excludeRegionIds: refs.slice(5, 11).map(r => r.regionId) }).success, false);
});
test("region and details inputs enforce versioned selection and bounded names", async () => {
  const d=await contracts();
  for(const value of [{},{placeId:"place:v1:site"},{placeQuery:"site",placeId:"place:v1:site",catalogueRevision:"edition"},{placeQuery:"site",catalogueRevision:"edition"},{placeQuery:"site",displayTimeZone:"UTC"},{placeId:"place:v1:site",catalogueRevision:"edition",countryCode:"IND"},{placeQuery:" "},{placeQuery:"x".repeat(161)},{placeQuery:"site",countryCode:"IN"},{placeQuery:"site",extra:true}]) assert.equal(d.getObservingLocationDetailsInputSchema.safeParse(value).success,false);
  assert.equal(d.getObservingLocationDetailsInputSchema.safeParse({placeId:"place:v1:site",catalogueRevision:"edition",displayTimeZone:"UTC"}).success,true);
  assert.equal(d.getObservingLocationDetailsInputSchema.safeParse({placeQuery:"site",countryCode:"IND"}).success,true);
  for(const value of [{regionQuery:" "},{regionQuery:"x".repeat(161)},{regionQuery:"state",countryCode:"ind"},{regionQuery:"state",adminLevel:2},{regionQuery:"state",extra:true}]) assert.equal(d.resolveObservingRegionInputSchema.safeParse(value).success,false);
  assert.equal(d.resolveObservingRegionInputSchema.safeParse({regionQuery:"state",countryCode:"IND",adminLevel:1}).success,true);
});
test("new result retains legacy coverage and rejects provenance budget overflow", async () => {
  const d=await contracts();
  const source={name:"Fixture",url:"https://example.org",attribution:"Synthetic",dataClass:"catalog"};
  const result={availability:{status:"available",reason:"Fixture"},sources:[source],caveats:[],candidates:[],sortBasis:"source-completeness-then-name-id",coverage:"Installed footprint only",discoveryCoverage:{footprintStatus:"covered",searchCompleteness:"complete",mappedFeatureCompleteness:"unknown",catalogueRevision:"edition"},queryScope:{includeRegionIds:["region:v1:IND"]},originBasis:[]};
  assert.equal(d.searchDiscoveryResultSchema.parse(result).coverage,"Installed footprint only");
  assert.equal(d.searchDiscoveryResultSchema.safeParse({...result,sources:Array(65).fill(source)}).success,false);
  assert.equal(d.searchDiscoveryResultSchema.safeParse({...result,caveats:Array(21).fill("Unknown access")}).success,false);
  for(const value of [{...result.discoveryCoverage,mappedFeatureCompleteness:"complete"},{...result.discoveryCoverage,catalogueRevision:""},{...result.discoveryCoverage,extra:true}]) assert.equal(d.discoveryCoverageSchema.safeParse(value).success,false);
  const candidate={placeId:"place:v1:site",name:"Site",category:"park",latitude:90,longitude:180,accessEvidence:{status:"unknown"},sources:[source],caveats:[],catalogueRevision:"edition"};
  assert.equal(d.candidateRefSchema.safeParse(candidate).success,true);
  for(const value of [{...candidate,catalogueRevision:""},{...candidate,latitude:91},{...candidate,sources:Array(5).fill(source)},{...candidate,originDistances:Array(6).fill({placeId:"place:v1:city",distanceKm:1})},{...candidate,originDistances:[{placeId:"place:v1:city",distanceKm:-1}]},{...candidate,sourceCompleteness:1}]) assert.equal(d.candidateRefSchema.safeParse(value).success,false);
  assert.equal(d.searchDiscoveryResultSchema.safeParse({...result,candidates:Array(11).fill(candidate)}).success,false);
  const region={regionId:"region:v1:IND",name:"India",countryCode:"IND",adminLevel:0,boundaryRevision:"boundary-edition",sources:[source]};
  assert.equal(d.regionRefSchema.safeParse(region).success,true);
  assert.equal(d.resolveObservingRegionResultSchema.safeParse({availability:result.availability,sources:[source],matches:Array(6).fill(region),selectionRequired:true}).success,false);
  assert.equal(d.getObservingLocationDetailsResultSchema.safeParse({availability:result.availability,sources:[source],matches:Array(6).fill(candidate),selectionRequired:true}).success,false);
});
test("named discovery lookups reject numeric coordinate pairs", async () => {
 const d=await contracts();
 for(const query of ["12.34, 56.78","lat=12 lon=56"]){
  assert.equal(d.getObservingLocationDetailsInputSchema.safeParse({placeQuery:query}).success,false);
  assert.equal(d.resolveObservingRegionInputSchema.safeParse({regionQuery:query}).success,false);
 }
});
test("budget stops require explanation and truncation cannot claim complete ranking", async()=>{
 const d=await contracts();
 assert.equal(d.discoveryCoverageSchema.safeParse({footprintStatus:"partial",searchCompleteness:"budget-limited",mappedFeatureCompleteness:"unknown",catalogueRevision:"edition"}).success,false);
 const source={name:"Fixture",url:"https://example.org",attribution:"Synthetic",dataClass:"catalog"};
 const result={availability:{status:"partial",reason:"Stopped"},sources:[source],candidates:[],sortBasis:"minimum-distance",coverage:"Partial",discoveryCoverage:{footprintStatus:"covered",searchCompleteness:"complete",mappedFeatureCompleteness:"unknown",catalogueRevision:"edition"},queryScope:{origins:[{placeId:"place:v1:city"}]},originBasis:[],truncationReason:"Query budget"};
 assert.equal(d.searchDiscoveryResultSchema.safeParse(result).success,false);
});
