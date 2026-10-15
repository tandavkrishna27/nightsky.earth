import type { GeoNamesPlaceIndex } from '../../places/geonames';
import { createEra5ClimateProvider, type Era5ClimateProvider } from './era5';
import { createReleaseEra5ClimateProvider } from './releaseEra5';

export interface ClimateArtifactEnvironment {
  NIGHTSKY_CLIMATE_ARTIFACT?: string;
  NIGHTSKY_CLIMATE_SHA256?: string;
  NIGHTSKY_ERA5_RELEASE_MANIFEST?: string;
  NIGHTSKY_ERA5_RELEASE_SHA256?: string;
}

/** Explicit release selection never falls back to an unrelated legacy edition. */
export function climateArtifactConfiguration(environment: ClimateArtifactEnvironment): {format:'auto'|'release';artifactPath?:string;expectedSha256?:string} {
  const path=environment.NIGHTSKY_ERA5_RELEASE_MANIFEST, digest=environment.NIGHTSKY_ERA5_RELEASE_SHA256;
  if(path===undefined && digest===undefined) return {format:'auto',artifactPath:environment.NIGHTSKY_CLIMATE_ARTIFACT,expectedSha256:environment.NIGHTSKY_CLIMATE_SHA256};
  if(environment.NIGHTSKY_CLIMATE_ARTIFACT!==undefined || environment.NIGHTSKY_CLIMATE_SHA256!==undefined ||
     !path?.trim() || path.length>4096 || /[\x00-\x1f\x7f]/.test(path) || !digest || !/^[a-f0-9]{64}$/i.test(digest)) {
    throw Error('Invalid historical release configuration.');
  }
  return {format:'release',artifactPath:path,expectedSha256:digest.toLowerCase()};
}

export function selectConfiguredClimateProvider(index:GeoNamesPlaceIndex, environment:ClimateArtifactEnvironment):Era5ClimateProvider {
  const {format,...options}=climateArtifactConfiguration(environment);
  return format==='release' ? createReleaseEra5ClimateProvider({...options,index}) : createEra5ClimateProvider({...options,index});
}
