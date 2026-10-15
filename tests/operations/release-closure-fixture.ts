import {createHash} from 'node:crypto';
const sha=(body:string)=>createHash('sha256').update(body).digest('hex');
const stamp="2026-10-13T18:00:00Z";
export function releaseClosureSample(){
 const period={startNight:"2025-01-01",endNight:"2025-12-31",kind:"sample-only"};const versions={builder:"fictional-tile-fixture",astronomy:"2.1.19",timezone:"fictional-node-icu-tz"};
 const tiles=[77,77.25,77.5].map(longitude=>({schemaVersion:2,methodVersion:"dark-cloud-v1",unit:"fraction",sourceDoi:"10.24381/cds.adbb2d47",thresholds:[0.1,0.25,0.5],period,versions,key:`era5:10.25:${longitude}|Asia/Kolkata`,mapping:{cellId:`era5:10.25:${longitude}`,latitude:10.25,longitude,timeZone:"Asia/Kolkata"},bins:Array.from({length:288},()=>({expected:1,valid:1,counts:[1,1,1],sum:.05,yearsMask:1,badYearsMask:0})),yearMonthly:[Array.from({length:12},()=>({expected:24,valid:24}))]}));
 const manifest={schemaVersion:2,methodVersion:"dark-cloud-v1",unit:"fraction",sourceDoi:"10.24381/cds.adbb2d47",thresholds:[0.1,0.25,0.5],period,versions,sourceProvenance:{name:"Fictional test aggregate; not measured ERA5",url:"https://doi.org/10.24381/cds.adbb2d47",attribution:"Fictional engineering validation only",dataClass:"reanalysis",licenseUrl:"https://creativecommons.org/licenses/by/4.0/",modified:true},placeIndexVintage:"fictional-index",grid:{spacingDegrees:.25,nativeResolutionApproxKm:31,mapping:"nearest-supplied-cell"},generatedAt:stamp,sourceRevisions:[{sha256:"a".repeat(64),revision:"fictional:raw:0001",kind:"raw"},{sha256:"b".repeat(64),revision:"fictional:decoded:0001",kind:"decoded"}],caveats:["Fictional data, not climate evidence."],tiles:tiles.map((tile,index)=>({...tile.mapping,key:tile.key,path:`tile${index}.json`,sha256:sha(JSON.stringify(tile)),bytes:Buffer.byteLength(JSON.stringify(tile))}))};
 return {schemaVersion:2,manifest,tiles};
}


