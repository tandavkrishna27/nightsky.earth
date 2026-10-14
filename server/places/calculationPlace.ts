import { CatalogueRevisionError } from './globalCatalogue';
import { calculationPlaceInputSchema, calculationPlaceSchema, type CalculationPlace, type CatalogueReader } from '../../shared/nightsky/discovery';
import { type GeoNamesPlaceIndex } from './geonames';

export type CalculationPlaceInput = { placeId: string; catalogueRevision?: string; displayTimeZone?: string };
/** A recoverable selection problem: return this clarification before invoking providers. */
export class CalculationPlaceClarificationError extends RangeError {
  constructor(public readonly code: 'resolve-again' | 'display-time-zone-required' | 'time-zone-mismatch', message: string) { super(message); this.name = 'CalculationPlaceClarificationError'; }
}
export function resolveNamedCalculationPlace(input: CalculationPlaceInput, cities: GeoNamesPlaceIndex): CalculationPlace {
  const parsed = calculationPlaceInputSchema.parse(input);
  const city = parsed.placeId.startsWith('place:v1:geonames:') ? cities.getById(Number(parsed.placeId.slice('place:v1:geonames:'.length))) : undefined;
  if (!city) throw new CalculationPlaceClarificationError('resolve-again', 'The selected named place is unavailable in the current GeoNames index. Resolve it again.');
  if (parsed.displayTimeZone && parsed.displayTimeZone !== city.timeZone) throw new CalculationPlaceClarificationError('time-zone-mismatch', 'The requested time zone does not match the resolved named place. Resolve it again and use its returned time zone.');
  const ref = cities.toPlaceRef(city);
  return calculationPlaceSchema.parse({placeId:ref.placeId,name:ref.displayName,latitude:city.latitude,longitude:city.longitude,displayTimeZone:city.timeZone,timeZoneBasis:'named-record',sources:ref.sources});
}
/** Validate the selected edition before using its public source point; never substitute a nearby city. */
export async function resolveCalculationPlace(input: CalculationPlaceInput, deps: {cities: GeoNamesPlaceIndex; catalogue: CatalogueReader}): Promise<CalculationPlace> {
  const parsed = calculationPlaceInputSchema.parse(input);
  if (parsed.placeId.startsWith('place:v1:geonames:')) return resolveNamedCalculationPlace(parsed,deps.cities);
  if (!parsed.catalogueRevision) throw new CalculationPlaceClarificationError('resolve-again','A selected candidate requires its catalogue revision. Resolve it again.');
  let candidate;
  try {candidate = await deps.catalogue.details({placeId:parsed.placeId,catalogueRevision:parsed.catalogueRevision});}
  catch(error){if(error instanceof CatalogueRevisionError)throw new CalculationPlaceClarificationError('resolve-again','The selected candidate catalogue revision is stale. Resolve it again.');throw error;}
  if (!candidate || candidate.placeId !== parsed.placeId || candidate.catalogueRevision !== parsed.catalogueRevision) throw new CalculationPlaceClarificationError('resolve-again','This candidate or catalogue revision is no longer available. Resolve it again.');
  if (!parsed.displayTimeZone) throw new CalculationPlaceClarificationError('display-time-zone-required','Choose an explicit display time zone; the actual site time zone is unverified.');
  return calculationPlaceSchema.parse({placeId:candidate.placeId,name:candidate.name,latitude:candidate.latitude,longitude:candidate.longitude,displayTimeZone:parsed.displayTimeZone,timeZoneBasis:'explicit-display',sources:candidate.sources,catalogueRevision:candidate.catalogueRevision});
}
/** Only server-resolved values belong here; this object is never a public tool input. */
export type CalculationObserverPlace = {placeId:string;timeZone:string;calculationPlace?:CalculationPlace};
export function calculationCoordinates(place: CalculationObserverPlace, cities: GeoNamesPlaceIndex, override?: CalculationPlace): CalculationPlace {
  const point = override ?? place.calculationPlace ?? resolveNamedCalculationPlace({placeId:place.placeId,displayTimeZone:place.timeZone},cities);
  const checked = calculationPlaceSchema.parse(point);
  if (checked.placeId !== place.placeId || checked.displayTimeZone !== place.timeZone) throw new CalculationPlaceClarificationError('time-zone-mismatch','Calculation place and requested time zone must match the selected place and display time zone.');
  if (checked.timeZoneBasis === 'named-record') resolveNamedCalculationPlace({placeId:checked.placeId,displayTimeZone:checked.displayTimeZone},cities);
  return checked;
}
