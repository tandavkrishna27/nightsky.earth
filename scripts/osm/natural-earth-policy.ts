import {regionRefSchema,type RegionRef} from '../../shared/nightsky/discovery';
/** Retained upstream metadata. Actual payload SHA-256 must be measured locally. */
const revision='natural-earth-v5.1.1-9380cca83db5f9aef52d5e762765100745f84b27';
const source=Object.freeze({name:'Natural Earth',url:'https://github.com/nvkelso/natural-earth-vector/tree/9380cca83db5f9aef52d5e762765100745f84b27',attribution:'Made with Natural Earth. Public domain; provider properties explicitly mapped; all geometry parts and holes retained; any coordinate normalization explicitly audited.',dataClass:'catalog' as const,product:'Natural Earth 1:10m administrative boundaries',vintage:'5.1.1',licenseUrl:'https://github.com/nvkelso/natural-earth-vector/blob/9380cca83db5f9aef52d5e762765100745f84b27/LICENSE.md',modified:true});
export const naturalEarthPolicy=Object.freeze({
 profile:'natural-earth-v5.1.1',edition:'5.1.1',commit:'9380cca83db5f9aef52d5e762765100745f84b27',revision,source,
 licence:Object.freeze({kind:'public-domain',path:'LICENSE.md',bytes:4636,gitBlobSha1:'9dfbc3d55a4ab1dd758c253b2ee339888f632889',sha256:'2631b5b39b6d1acc56de75235109b5af2dbb4b0ac5a127b6f06185977247fd4b',grant:'All versions public domain; modification, commercial redistribution permitted; credit optional',evidence:'docs/operations/natural-earth-v5.1.1-license.txt'}),
 layers:Object.freeze([
  Object.freeze({path:'geojson/ne_10m_admin_0_countries.geojson',bytes:13287234,gitBlobSha1:'5ebc66e25fc1af01edaebe9375c546655e04cf1e'}),
  Object.freeze({path:'geojson/ne_10m_admin_1_states_provinces.geojson',bytes:40726851,gitBlobSha1:'4a8438f98ac7dfec7dc1739b1eaf91398ad33f22'}),
 ]),
});
/** Caller supplies identity only; provenance is always derived from the fixed policy. */
export function naturalEarthRegion(identity:Omit<RegionRef,'boundaryRevision'|'sources'>):RegionRef{return regionRefSchema.parse({...identity,boundaryRevision:revision,sources:[source]});}
