import * as z from 'zod4';
import type { McpServer } from '@modelcontextprotocol/server';
import { calculationPlaceInputSchema, type CalculationPlace } from '../../shared/nightsky/discovery';
import { searchReferenceObjectsInputSchema, getReferenceDetailsInputSchema, discoverObservingTargetsInputSchema, getCatalogueTargetWindowsInputSchema, referenceSearchResultSchema, referenceDetailsResultSchema, referenceObservingResultSchema, referenceSelectionSchema, type ReferenceSearchResult, type ReferenceDetailsResult, type ReferenceObservingResult } from '../../shared/nightsky/reference';
import type { PublicUniverseProvider } from '../providers/publicUniverse';
export const PUBLIC_UNIVERSE_TOOL_NAMES = ['search_reference_objects', 'get_reference_details', 'discover_observing_targets', 'get_catalogue_target_windows'] as const;
const annotations = { readOnlyHint: true, destructiveHint: false, openWorldHint: true };
// MCP requires an object at the JSON Schema root. Validate the original strict
// discriminated union as well, retaining the public flat argument shape.
const detailsInput = z.strictObject({ kind: z.enum(['selected-object', 'meteor-shower', 'close-approaches', 'exoplanet-host']), referenceId: referenceSelectionSchema.shape.referenceId.optional(), revision: referenceSelectionSchema.shape.revision.optional(), sections: z.array(z.enum(['discovery', 'designations', 'moons', 'rings', 'atmosphere'])).max(2).optional(), code: z.string().regex(/^[A-Z]{3}$/).optional(), from: z.string().optional(), to: z.string().optional(), limit: z.number().int().min(1).max(10).optional() }).superRefine((value, ctx) => { const parsed = getReferenceDetailsInputSchema.safeParse(value); if (!parsed.success)
    for (const issue of parsed.error.issues)
        ctx.addIssue({ ...issue, path: issue.path }); });
const discoverInput = calculationPlaceInputSchema.safeExtend(discoverObservingTargetsInputSchema.omit({ placeId: true, sourceRevision: true, catalogueRevision: true }).shape);
const windowsInput = calculationPlaceInputSchema.safeExtend(getCatalogueTargetWindowsInputSchema.omit({ placeId: true, sourceRevision: true, catalogueRevision: true }).shape);
function answer(result: ReferenceSearchResult | ReferenceDetailsResult | ReferenceObservingResult) {
    const lines = [`Public Universe: ${result.status}${result.reason ? ` — ${result.reason}` : ''}.`];
    const data = result.data;
    if (data && 'matches' in data)
        lines.push(...data.matches.map(r => `${r.name} (${r.upstreamId})`));
    if (data && 'record' in data) {
        if (data.record)
            lines.push(`${data.record.name}: ${data.record.measurements.slice(0, 6).map(m => `${m.name}: ${m.value ?? 'unknown'} ${m.unit}`).join('; ')}`);
        if (data.record?.astrometry) {
            const a=data.record.astrometry;
            lines.push(`Astrometry: ${a.status}; frame: ${a.frame??'unknown'}; equinox: ${a.equinox??'unknown'}; reference epoch: ${a.reference_epoch_jyear??'unknown'}; observation epoch: ${a.observation_epoch_jyear??'unknown'}; motion model: ${a.motion_model??'unknown'} � catalogue coordinates, not a current position.${a.reason?` ${a.reason}`:''}`);
        }
        if (data.meteor)
            lines.push(`${data.meteor.name} (${data.meteor.code}): ${data.meteor.totalParameterSets} parameter sets; annual peak forecast is separate.`);
        if (data.host)
            lines.push(`${data.host.name}: ${data.host.planets.length} listed planets; learning context.`);
        if (data.closeApproaches)
            lines.push(...data.closeApproaches.slice(0, 3).map(c => `${c.cd_iso}: ${c.dist_au ?? 'unknown'} AU from Earth; proximity does not establish visibility.`));
    }
    if (data && 'targets' in data)
        lines.push(...data.targets.map(t => `${t.record.name}: ${t.status}; ${t.windows.slice(0, 3).map(w => `${w.startUtc}–${w.endUtc}`).join(', ') || 'no refined windows'}${t.preferenceReasons?.length ? `; ${t.preferenceReasons.join('; ')}` : ''}`));
    const credits = new Map(result.sources.map(source => [JSON.stringify([source.url, source.attribution, source.licence, source.licenceUrl, source.modifications]), source]));
    for (const source of Array.from(credits.values()))
        lines.push(`Source: ${source.url}${source.attribution ? `; ${source.attribution}` : ''}${source.licence ? `; licence: ${source.licence}` : ''}${source.licenceUrl ? ` (${source.licenceUrl})` : ''}${source.modifications ? `; ${source.modifications}` : ''}`);
    lines.push(...result.limitations);
    return { content: [{ type: 'text' as const, text: lines.join('\n') }], structuredContent: result };
}
export function registerPublicUniverseTools(server: McpServer, provider: PublicUniverseProvider, resolvePoint: (input: z.infer<typeof calculationPlaceInputSchema>) => Promise<CalculationPlace>) {
    server.registerTool(PUBLIC_UNIVERSE_TOOL_NAMES[0], { title: 'Search optional reference objects', description: 'Lexical lookup of one exact object name or catalogue ID per query in one domain, at most ten matches. It does not perform semantic free-text, multi-object OR, or observing shortlists. Results provide opaque references for selected details. Catalogue identity does not imply local engine support or visibility.', inputSchema: searchReferenceObjectsInputSchema, outputSchema: referenceSearchResultSchema, annotations }, async (input) => answer(await provider.searchReferenceObjects(input)));
    server.registerTool(PUBLIC_UNIVERSE_TOOL_NAMES[1], { title: 'Read selected reference details', description: 'Read exact selected objects, meteor context, Earth close approaches or exoplanet hosts. Maximum two requested sections. Meteor context is not an annual forecast; exoplanets are learning context.', inputSchema: detailsInput, outputSchema: referenceDetailsResultSchema, annotations }, async (input) => answer(await provider.getReferenceDetails(getReferenceDetailsInputSchema.parse(input))));
    server.registerTool(PUBLIC_UNIVERSE_TOOL_NAMES[2], { title: 'Discover optional observing targets', description: 'Optional catalogue shortlist for a selected place and session time, independent of a weather forecast. Requires one resolved place snapshot, explicit shortlistLimit 1..6, localNightDate, and top-level displayTimeZone. A strict window accepts only UTC startUtc/endUtc, not window.timeZone. Optional failures remain explicit. Geometric source calculations use rounded coordinates; no terrain, weather or detection guarantee.', inputSchema: discoverInput, outputSchema: referenceObservingResultSchema, annotations }, async (input) => { const p = await resolvePoint(input); return answer(await provider.discoverObservingTargets({ ...input, displayTimeZone: p.displayTimeZone }, { latitude: p.latitude, longitude: p.longitude })); });
    server.registerTool(PUBLIC_UNIVERSE_TOOL_NAMES[3], { title: 'Calculate selected catalogue target windows', description: 'Get geometric windows for one to six exact returned pinned starter referenceId/revision pairs. Requires the selected place snapshot, top-level localNightDate and displayTimeZone, and a strict window with only UTC startUtc/endUtc. Optional failures remain explicit. These source calculations are separate from the main local planner; no arbitrary targets or local engine catalogue expansion.', inputSchema: windowsInput, outputSchema: referenceObservingResultSchema, annotations }, async (input) => { const p = await resolvePoint(input); return answer(await provider.getCatalogueTargetWindows({ ...input, displayTimeZone: p.displayTimeZone }, { latitude: p.latitude, longitude: p.longitude })); });
}
