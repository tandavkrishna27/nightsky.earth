import * as z from 'zod4';
import { apiSelectionRefSchema, sourceRevisionSchema, sourceRecordSchema, utcInstantSchema, type ApiSelectionRef } from '../../../shared/nightsky/common';
import { regionIdSchema } from '../../../shared/nightsky/discovery';

export const apiRegionSelectionRefSchema = z.strictObject({ regionId: regionIdSchema, sourceRevision: sourceRevisionSchema });
export type ApiRegionSelectionRef = z.infer<typeof apiRegionSelectionRefSchema>;
export const membershipResultSchema = z.strictObject({
    point: apiSelectionRefSchema,
    region: apiRegionSelectionRefSchema,
    membership: z.enum(['inside', 'outside', 'unknown']),
    source: sourceRecordSchema,
    method: z.string().trim().min(1).max(160),
    fetchedAt: utcInstantSchema,
    expiresAt: utcInstantSchema,
    reason: z.string().trim().min(1).max(500).optional()
});
export type MembershipResult = z.infer<typeof membershipResultSchema>;
/** Future adapter boundary only. No provider implementation or runtime registration is admitted. */
export interface RegionMembershipProvider {
    classify(points: ApiSelectionRef[], regions: ApiRegionSelectionRef[], deadline: number): Promise<MembershipResult[]>;
}
const inputSchema = z.strictObject({
    candidates: z.array(z.strictObject({ point: apiSelectionRefSchema, originMatches: z.array(z.boolean()).max(5) })).max(100),
    originMode: z.enum(['any', 'all']).default('any'),
    includeRegions: z.array(apiRegionSelectionRefSchema).max(5).default([]),
    excludeRegions: z.array(apiRegionSelectionRefSchema).max(5).default([]),
    regionMode: z.enum(['any', 'all']).default('any'),
    evidence: z.array(membershipResultSchema).max(1000),
    now: z.number().finite()
});
const pointKey = (p: ApiSelectionRef) => p.placeId + ':' + p.sourceRevision;
const regionKey = (r: ApiRegionSelectionRef) => r.regionId + ':' + r.sourceRevision;

/** Pure bounded composition; never infers geometry from names, coordinates or administrative labels.
 * Evidence rows are caller supplied, not authorization to acquire a point × region Cartesian product.
 * Unknown relevant membership conservatively withholds qualification even for a partly known union.
 */
export function composeRegionMembership(value: unknown): {
    decisions: Array<{ point: ApiSelectionRef; status: 'qualified' | 'excluded' | 'unknown' }>;
    coverage: 'complete' | 'partial';
} {
    const input = inputSchema.parse(value);
    const originCount = input.candidates[0]?.originMatches.length ?? 0;
    if (input.candidates.some(c => c.originMatches.length !== originCount))
        throw new RangeError('Every candidate requires the same origin predicates.');
    if (!originCount && !input.includeRegions.length)
        throw new RangeError('Membership composition requires a positive origin or included-region scope.');
    if (new Set(input.candidates.map(c => pointKey(c.point))).size !== input.candidates.length)
        throw new RangeError('Candidate revisions must be unique.');
    const rows = new Map<string, MembershipResult[]>();
    for (const row of input.evidence) {
        const key = pointKey(row.point) + '/' + regionKey(row.region);
        const list = rows.get(key) ?? [];
        list.push(row);
        rows.set(key, list);
    }
    const membership = (p: ApiSelectionRef, r: ApiRegionSelectionRef): MembershipResult['membership'] => {
        const matching = rows.get(pointKey(p) + '/' + regionKey(r)) ?? [];
        if (!matching.length || matching.some(row => Date.parse(row.fetchedAt) > input.now || Date.parse(row.expiresAt) <= input.now || Date.parse(row.expiresAt) <= Date.parse(row.fetchedAt)))
            return 'unknown';
        const states = new Set(matching.map(row => row.membership));
        return states.size === 1 ? matching[0]!.membership : 'unknown';
    };
    const decisions = input.candidates.map(candidate => {
        const originPass = !originCount || (input.originMode === 'all' ? candidate.originMatches.every(Boolean) : candidate.originMatches.some(Boolean));
        const included = input.includeRegions.map(r => membership(candidate.point, r));
        const excluded = input.excludeRegions.map(r => membership(candidate.point, r));
        let status: 'qualified' | 'excluded' | 'unknown';
        const inclusionFails = included.length > 0 && (input.regionMode === 'all' ? included.includes('outside') : included.every(s => s === 'outside'));
        if (!originPass || excluded.includes('inside') || inclusionFails) status = 'excluded';
        else if (included.includes('unknown') || excluded.includes('unknown')) status = 'unknown';
        else status = 'qualified';
        return { point: candidate.point, status };
    });
    return { decisions, coverage: decisions.some(d => d.status === 'unknown') ? 'partial' : 'complete' };
}
