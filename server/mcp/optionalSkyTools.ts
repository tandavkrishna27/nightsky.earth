import * as z from 'zod4';
import type { McpServer } from '@modelcontextprotocol/server';
import { calculationPlaceInputSchema, type CalculationPlace } from '../../shared/nightsky/discovery';
import type { OptionalSkyProviders } from '../providers/skyConfiguration';
import { darkSkyPlanOutputSchema } from '../providers/sky/darkSkyPlanner';
import { astronomySearchInputSchema, astronomySearchOutputSchema, astronomyPositionsOutputSchema } from '../providers/sky/astronomyApi';
import { spaceWeatherInputSchema, spaceWeatherResultSchema, smallBodyInputSchema, smallBodyResultSchema, observerEphemerisResultSchema, observerEphemerisInputSchema } from '../providers/space';

/** Source-optional inventory; these names are not part of the default fourteen tools. */
export const OPTIONAL_SKY_TOOL_NAMES = ['find_moon_aware_windows','search_astronomy_objects','get_external_body_positions','get_space_weather_events','resolve_small_body','get_small_body_ephemeris'] as const;
const [moonWindowsTool,objectSearchTool,bodyPositionsTool,spaceWeatherTool,smallBodyTool,ephemerisTool] = OPTIONAL_SKY_TOOL_NAMES;
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v);
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const annotations = {readOnlyHint:true,destructiveHint:false,openWorldHint:true};
const wrap = <T extends z.ZodType>(schema:T) => z.discriminatedUnion('status',[
  z.object({status:z.literal('ok'),data:schema}),
  z.object({status:z.enum(['invalid-input','unavailable']),reason:z.string()}),
]);
function answer<T extends object>(result:T, sourceUrl:string) {
  return {content:[{type:'text' as const,text:`${String('reason' in result ? result.reason : 'Source result is in structuredContent.')} Source: ${sourceUrl}. Keep modelled/calculated context separate from observed or forecast conditions.`}],structuredContent:result};
}
/** Optional capabilities use the same revision-pinned location resolver as core tools. */
export function registerOptionalSkyTools(server:McpServer, services:OptionalSkyProviders, resolvePoint:(input:z.infer<typeof calculationPlaceInputSchema>)=>Promise<CalculationPlace>) {
  if(services.darkSky) server.registerTool(moonWindowsTool,{
    title:'Compare Moon-aware observing windows',description:'Compare full local evening windows using Dark Sky Planner. Resolve a named place first. Excluded full windows may have useful later moonless intervals; this does not evaluate weather, light pollution or access.',
    inputSchema:calculationPlaceInputSchema.safeExtend({startDate:day,endDate:day,startTime:clock,endTime:clock,moonIlluminationThresholdPercent:z.number().min(0).max(100).default(10)}),
    outputSchema:wrap(darkSkyPlanOutputSchema),annotations,
  },async input=>{const p=await resolvePoint(input);return answer(await services.darkSky!.plan({locationName:p.name,latitude:p.latitude,longitude:p.longitude,timeZone:p.displayTimeZone,startDate:input.startDate,endDate:input.endDate,startTime:input.startTime,endTime:input.endTime,moonIlluminationThresholdPercent:input.moonIlluminationThresholdPercent}),'https://darkskyplanner.com/');});
  if(services.astronomy) {
    server.registerTool(objectSearchTool,{title:'Search stars and deep-sky objects',description:'Search AstronomyAPI for object identities. Returned catalogue coordinates do not establish local visibility.',inputSchema:astronomySearchInputSchema,outputSchema:wrap(astronomySearchOutputSchema),annotations},async input=>answer(await services.astronomy!.searchObjects(input),'https://docs.astronomyapi.com/endpoints/search'));
    server.registerTool(bodyPositionsTool,{title:'Get reference body positions',description:'Get AstronomyAPI body positions at the selected location. Routine local astronomy remains available separately. Preserve the provider time convention and never infer continuous visibility from samples. Elevation must be supplied explicitly.',inputSchema:calculationPlaceInputSchema.safeExtend({elevation:z.number().min(-500).max(9000),startDate:day,endDate:day,time:clock,body:z.enum(['sun','moon','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto']).optional()}),outputSchema:wrap(astronomyPositionsOutputSchema),annotations},async input=>{const p=await resolvePoint(input);return answer(await services.astronomy!.bodyPositions({latitude:p.latitude,longitude:p.longitude,elevation:input.elevation,startDate:input.startDate,endDate:input.endDate,time:input.time,body:input.body}),'https://docs.astronomyapi.com/endpoints/bodies/positions');});
  }
  if(services.space && services.selected.includes('nasa-donki')) server.registerTool(spaceWeatherTool,{title:'Get NASA space-weather event context',description:'Retrieve research space-weather event records. These do not predict local aurora visibility and do not replace NOAA operational outlooks.',inputSchema:spaceWeatherInputSchema,outputSchema:spaceWeatherResultSchema,annotations},async input=>answer(await services.space!.getSpaceWeather(input),'https://ccmc.gsfc.nasa.gov/tools/DONKI/'));
  if(services.space && services.selected.includes('jpl')) {
    server.registerTool(smallBodyTool,{title:'Resolve a comet or asteroid',description:'Resolve JPL small-body identity; ask the user to select among ambiguous candidates. Identity and close approach do not establish visibility.',inputSchema:smallBodyInputSchema,outputSchema:smallBodyResultSchema,annotations},async input=>answer(await services.space!.resolveSmallBody(input),'https://ssd-api.jpl.nasa.gov/doc/sbdb.html'));
    server.registerTool(ephemerisTool,{title:'Get a small-body observer position',description:'Calculate one airless JPL observer position for an explicitly resolved SPK identity and selected place. Elevation is explicit. No brightness, terrain or continuous visibility is inferred.',inputSchema:calculationPlaceInputSchema.safeExtend({spkId:observerEphemerisInputSchema.shape.spkId,atUtc:observerEphemerisInputSchema.shape.atUtc,elevationMeters:z.number().min(-500).max(9000)}),outputSchema:observerEphemerisResultSchema,annotations},async input=>{const p=await resolvePoint(input);return answer(await services.space!.getObserverEphemeris({spkId:input.spkId,atUtc:input.atUtc,latitude:p.latitude,longitude:p.longitude,elevationMeters:input.elevationMeters}),'https://ssd-api.jpl.nasa.gov/doc/horizons.html');});
  }
}
