/** Offline preparation gate only. This module does not acquire data or promote runtime artifacts. */
import {createHash} from 'node:crypto';
import {open, lstat} from 'node:fs/promises';
import {dirname, isAbsolute, join, parse, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';

const MiB = 1024 * 1024;
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const text = z.string().trim().min(1).max(4096);
const safeRelative = z.string().min(1).max(240).refine(value =>
  !isAbsolute(value) && !value.includes(':') && !value.includes('\\') &&
  value.split('/').every(part => !!part && part !== '.' && part !== '..' && !/[.\s]$/.test(part) && !/[\x00-\x1f<>"|?*]/.test(part) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)), 'Unsafe relative evidence path');
const publicUrl = z.string().max(2048).refine(value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash &&
      !url.search && !url.pathname.split('/').some(part => /^(latest|main|master)$/i.test(part));
  } catch { return false; }
}, 'Use an exact public HTTPS identity without credentials, query, fragment or mutable ref');
export const admissionEvidencePinSchema = z.strictObject({path: safeRelative, bytes: z.number().int().min(1).max(4 * MiB), sha256});
type EvidencePin = z.infer<typeof admissionEvidencePinSchema>;
const payloadSchema = z.strictObject({url: publicUrl, bytes: z.number().int().min(1).max(160 * 1024 ** 3), sha256, identityEvidence: admissionEvidencePinSchema});
const roles = ['source-provenance', 'payload-validation', 'rights-review', 'effective-clip', 'planet-domain', 'admission-approval'] as const;
const roleSchema = z.enum(roles);
const reviewIdentitySchema = z.strictObject({role: roleSchema, subjectSha256: sha256, reviewer: text, evidence: admissionEvidencePinSchema});
const reviewSchema = reviewIdentitySchema.extend({reviewedAt: z.iso.datetime(), decision: z.literal('approve')});
const receiptDocumentSchema = z.strictObject({schemaVersion: z.literal(1), role: roleSchema, subjectSha256: sha256, reviewer: text, reviewedAt: z.iso.datetime(), decision: z.literal('approve')});
export const sourceAdmissionTrustSchema = z.strictObject({schemaVersion: z.literal(1), trustedReviews: z.array(reviewIdentitySchema).max(1000)});
export const sourceAdmissionManifestSchema = z.strictObject({schemaVersion: z.literal(1), kind: z.literal('source-admission-manifest'), records: z.array(z.strictObject({sourceKey: text, kind: z.enum(['boundary', 'osm-extract', 'osm-planet']), edition: text, recordSha256: sha256, payload: payloadSchema.omit({identityEvidence: true})})).min(1).max(1000)});
/** Source extent only: never a provider clipping polygon or completed search. */
export const planetDomainSchema = z.strictObject({
  schemaVersion: z.literal(1), kind: z.literal('planet-domain-v1'), sourceUrl: publicUrl, edition: text, provider: text,
  providerWholeWorldEvidence: admissionEvidencePinSchema,
  providerObject: z.strictObject({version: text, etag: text, md5: z.string().regex(/^[a-f0-9]{32}$/)}),
  raw: payloadSchema.pick({bytes: true, sha256: true}), nativeVintage: z.iso.datetime().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/), nativeVintageEvidence: admissionEvidencePinSchema,
  domain: z.strictObject({west: z.literal(-180), south: z.literal(-90), east: z.literal(180), north: z.literal(90)}),
  selectionPolicy: z.literal('named-complete-way-v1-polar85'), coverageClaim: z.literal('source-domain-only'),
});
const clipSchema = z.discriminatedUnion('status', [
  z.strictObject({status: z.literal('planet-domain'), descriptor: planetDomainSchema, descriptorEvidence: admissionEvidencePinSchema}),
  z.strictObject({status: z.literal('not-applicable'), reason: text}),
  z.strictObject({status: z.literal('bound'), payload: payloadSchema, associationEvidence: admissionEvidencePinSchema, boundPayloadSha256: sha256, procedure: text}),
]);
export const sourceAdmissionSourceSchema = z.strictObject({
  key: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/), kind: z.enum(['boundary', 'osm-extract', 'osm-planet']),
  edition: text, manifest: admissionEvidencePinSchema, recordSha256: sha256,
  originalSource: z.strictObject({identity: text, url: publicUrl, provenanceEvidence: admissionEvidencePinSchema}),
  payload: payloadSchema, effectiveClip: clipSchema,
  intendedUse: z.strictObject({purpose: text, transformRevision: text, distribution: z.enum(['private', 'public']), outputLicence: text}),
  rights: z.strictObject({
    classification: z.enum(['unmodified', 'adaptation', 'collection', 'derivative-database', 'collective-database', 'produced-work']),
    licensor: text, licenceId: text, licenceEvidence: admissionEvidencePinSchema,
    notices: z.array(z.strictObject({text, destination: publicUrl})).min(1).max(100),
    conditions: z.array(z.strictObject({id: z.string().regex(/^[a-z][a-z0-9.-]{0,99}$/), evidence: admissionEvidencePinSchema})).max(100),
    offer: z.strictObject({url: publicUrl, sha256, bytes: z.number().int().min(1).max(160 * 1024 ** 3), retentionPolicy: text}).optional(),
  }),
});
export const sourceAdmissionBundleSchema = z.strictObject({schemaVersion: z.literal(1), source: sourceAdmissionSourceSchema, reviews: z.array(reviewSchema).max(10)});
const naturalEarthIdentitySchema = z.strictObject({originalSourceUrl: publicUrl, payload: payloadSchema,
  licenceEvidence: admissionEvidencePinSchema, normalizationEvidence: admissionEvidencePinSchema});
const policySourceSchema = z.strictObject({key: sourceAdmissionSourceSchema.shape.key, kind: sourceAdmissionSourceSchema.shape.kind,
  edition: text, recordSha256: sha256, originalLicenceId: text, disposition: z.enum(['reviewable', 'blocked']),
  requiredConditions: z.array(z.string().regex(/^[a-z][a-z0-9.-]{0,99}$/)).min(1).max(100),
  // Omission preserves the retained GeoBoundaries inventory and its digest byte-for-byte.
  boundaryProvider: z.enum(['geoboundaries', 'natural-earth']).optional(), naturalEarthIdentity: naturalEarthIdentitySchema.optional(),
}).superRefine((record, context) => {
  if (record.kind !== 'boundary' && (record.boundaryProvider || record.naturalEarthIdentity)) context.addIssue({code: 'custom', message: 'Boundary provider classification only applies to boundaries'});
  if (record.boundaryProvider === 'natural-earth') {
    if (!record.naturalEarthIdentity || record.originalLicenceId !== 'public-domain') context.addIssue({code: 'custom', message: 'Natural Earth requires trusted exact identity pins and public-domain original terms'});
    if (record.requiredConditions.some(id => id.startsWith('geoboundaries-'))) context.addIssue({code: 'custom', message: 'Natural Earth cannot inherit misleading GeoBoundaries conditions'});
  } else if (record.naturalEarthIdentity) context.addIssue({code: 'custom', message: 'Natural Earth identity requires the trusted Natural Earth classification'});
});
/** This context is supplied by the operator, independently of candidates and receipt declarations. */
export const sourceAdmissionPolicySchema = z.strictObject({
  schemaVersion: z.literal(1), policyId: text, inventoryRoots: z.array(admissionEvidencePinSchema).min(1).max(4),
  sources: z.array(policySourceSchema).min(1).max(1000),
});
/** The document hash is part of the reviewed source subject via its condition evidence pin. */
export const boundaryNormalizationLineageSchema = z.strictObject({schemaVersion: z.literal(1), kind: z.literal('boundary-normalization-lineage'),
  source: payloadSchema.omit({identityEvidence: true}), transformRevision: text,
  outputs: z.array(z.strictObject({path: z.string().min(1).max(2048).refine(value => isAbsolute(value) && !value.split(/[\\/]/).includes('..') && !/[\x00-\x1f\x7f]/.test(value)),
    bytes: z.number().int().min(1).max(128 * MiB), sha256})).min(1).max(1000),
}).superRefine((lineage, context) => {
  const paths = lineage.outputs.map(output => process.platform === 'win32' ? resolve(output.path).toLowerCase() : resolve(output.path));
  if (new Set(paths).size !== paths.length) context.addIssue({code: 'custom', message: 'Duplicate normalized output paths; unique pins required'});
});

/** Sorting object keys makes approval scope independent of JSON formatting, but preserves array order. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical((value as Record<string, unknown>)[key])).join(',') + '}';
  return JSON.stringify(value);
}
function digest(value: unknown): string { return createHash('sha256').update(canonical(value)).digest('hex'); }
export function admissionSubjectDigest(source: unknown): string { return digest(sourceAdmissionSourceSchema.parse(source)); }

interface LicenceProfile {id: string; family: string; termsUrl: string | null; termsEvidence: 'retained-official-document' | 'exact-terms-review-required'; conditions: string[]}
const attribution = ['attribution', 'licence-notice', 'modification-notice'];
const profiles: Record<string, LicenceProfile> = {
  'CC-BY-4.0': {id: 'CC-BY-4.0', family: 'attribution', termsUrl: 'https://creativecommons.org/licenses/by/4.0/legalcode', termsEvidence: 'exact-terms-review-required', conditions: [...attribution, 'no-additional-restrictions']},
  'CC-BY-3.0': {id: 'CC-BY-3.0', family: 'attribution', termsUrl: 'https://creativecommons.org/licenses/by/3.0/legalcode', termsEvidence: 'exact-terms-review-required', conditions: [...attribution, 'no-additional-restrictions']},
  'CC-BY-3.0-IGO': {id: 'CC-BY-3.0-IGO', family: 'attribution-igo', termsUrl: 'https://creativecommons.org/licenses/by/3.0/igo/legalcode', termsEvidence: 'exact-terms-review-required', conditions: [...attribution, 'igo-specific-terms-and-dispute-review', 'no-endorsement']},
  'CC-BY-2.5': {id: 'CC-BY-2.5', family: 'attribution', termsUrl: 'https://creativecommons.org/licenses/by/2.5/legalcode', termsEvidence: 'exact-terms-review-required', conditions: [...attribution, 'no-additional-restrictions']},
  'CC-BY-2.5-IN': {id: 'CC-BY-2.5-IN', family: 'attribution-national', termsUrl: 'https://creativecommons.org/licenses/by/2.5/in/legalcode', termsEvidence: 'retained-official-document', conditions: [...attribution, 'exact-jurisdiction-review', 'no-additional-restrictions']},
  'CC-BY-SA-2.0': {id: 'CC-BY-SA-2.0', family: 'share-alike', termsUrl: 'https://creativecommons.org/licenses/by-sa/2.0/legalcode', termsEvidence: 'retained-official-document', conditions: [...attribution, 'share-alike', 'collection-versus-adaptation', 'compatible-output-licence', 'no-additional-restrictions']},
  'CC-BY-SA-3.0': {id: 'CC-BY-SA-3.0', family: 'share-alike', termsUrl: 'https://creativecommons.org/licenses/by-sa/3.0/legalcode', termsEvidence: 'retained-official-document', conditions: [...attribution, 'share-alike', 'collection-versus-adaptation', 'compatible-output-licence', 'no-additional-restrictions']},
  'ODbL-1.0': {id: 'ODbL-1.0', family: 'database-share-alike', termsUrl: 'https://opendatacommons.org/licenses/odbl/1-0/', termsEvidence: 'retained-official-document', conditions: [...attribution, 'database-versus-produced-work', 'share-alike', 'machine-readable-offer', 'no-additional-restrictions']},
  'CC0-1.0': {id: 'CC0-1.0', family: 'public-domain-dedication', termsUrl: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode', termsEvidence: 'exact-terms-review-required', conditions: ['dedicator-authority', 'third-party-rights-review', 'no-endorsement']},
  'public-domain': {id: 'public-domain', family: 'public-domain-claim', termsUrl: null, termsEvidence: 'exact-terms-review-required', conditions: ['public-domain-jurisdiction-and-authority', 'third-party-rights-review', 'source-and-edition-notice']},
  'OGL-3.0': {id: 'OGL-3.0', family: 'national-government', termsUrl: null, termsEvidence: 'exact-terms-review-required', conditions: [...attribution, 'exact-national-terms', 'excluded-rights-review', 'no-endorsement']},
  'OGL-Canada-2.0': {id: 'OGL-Canada-2.0', family: 'national-government', termsUrl: null, termsEvidence: 'exact-terms-review-required', conditions: [...attribution, 'exact-national-terms', 'excluded-rights-review', 'no-endorsement']},
  'swisstopo': {id: 'swisstopo', family: 'national-government', termsUrl: null, termsEvidence: 'exact-terms-review-required', conditions: [...attribution, 'exact-national-terms', 'edition-specific-terms', 'excluded-rights-review']},
  'dl-de-by-2.0': {id: 'dl-de-by-2.0', family: 'national-government', termsUrl: null, termsEvidence: 'exact-terms-review-required', conditions: [...attribution, 'exact-national-terms', 'dataset-provider-reference', 'excluded-rights-review']},
  'Etalab-2.0': {id: 'Etalab-2.0', family: 'national-government', termsUrl: null, termsEvidence: 'exact-terms-review-required', conditions: [...attribution, 'exact-national-terms', 'source-update-date', 'excluded-rights-review']},
  'ambiguous-humanitarian': {id: 'ambiguous-humanitarian', family: 'ambiguous', termsUrl: null, termsEvidence: 'exact-terms-review-required', conditions: ['exact-original-file-and-revision', 'original-author-and-historical-licence', 'provider-label-link-conflict-resolution']},
  'pixabay-content': {id: 'pixabay-content', family: 'asset-specific', termsUrl: null, termsEvidence: 'exact-terms-review-required', conditions: ['exact-original-file-and-revision', 'historical-asset-redistribution-grant', 'transformed-boundary-redistribution-review']},
};
const labelIds: Record<string, string> = {
  'Creative Commons Attribution 4.0 (CC BY 4.0)': 'CC-BY-4.0',
  'Creative Commons Attribution 4.0 International (CC BY 4.0)': 'CC-BY-4.0',
  'Public Domain': 'public-domain',
  'Creative Commons Attribution-ShareAlike 2.0': 'CC-BY-SA-2.0',
  'Open Data Commons Open Database License 1.0': 'ODbL-1.0',
  'Creative Commons Attribution 2.5 Generic': 'CC-BY-2.5',
  'CC0 1.0 Universal (CC0 1.0) Public Domain Dedication': 'CC0-1.0',
  'Open Government Licence v3.0': 'OGL-3.0',
  'Creative Commons Attribution 3.0 License': 'CC-BY-3.0',
  'Creative Commons Attribution 3.0 Intergovernmental Organisations (CC BY 3.0 IGO)': 'CC-BY-3.0-IGO',
  'Open Government Canada 2.0': 'OGL-Canada-2.0',
  'Federal Office of Topography swisstopo License': 'swisstopo',
  'Data license Germany - Attribution - Version 2.0': 'dl-de-by-2.0',
  'Etalab Open License 2.0': 'Etalab-2.0',
  'Creative Commons Attribution-ShareAlike 3.0 Unported': 'CC-BY-SA-3.0',
  'Creative Commons Attribution 2.5 India (CC BY 2.5 IN)': 'CC-BY-2.5-IN',
  'Other - Humanitarian': 'ambiguous-humanitarian',
  'Pixabay License for Content': 'pixabay-content',
};

/** Trusted receipts are an operator-controlled allowlist, never derived from bundle declarations. */
export function validateSourceAdmission(rawBundle: unknown, rawTrust: unknown, rawTrustedPolicy: unknown) {
  const bundle = sourceAdmissionBundleSchema.parse(rawBundle), trust = sourceAdmissionTrustSchema.parse(rawTrust), policy = sourceAdmissionPolicySchema.parse(rawTrustedPolicy);
  const source = bundle.source, subjectSha256 = admissionSubjectDigest(source), gaps: string[] = [];
  if (new Set(policy.sources.map(record => record.key)).size !== policy.sources.length) throw new Error('Duplicate trusted policy source key');
  const policyRecord = policy.sources.find(record => record.key === source.key);
  if (!policyRecord) gaps.push('policy-source-not-found');
  else {
    if (policyRecord.kind !== source.kind) gaps.push('policy-source-kind-mismatch');
    if (policyRecord.edition !== source.edition) gaps.push('policy-edition-mismatch');
    if (policyRecord.recordSha256 !== source.recordSha256) gaps.push('policy-record-mismatch');
    if (policyRecord.originalLicenceId !== source.rights.licenceId) gaps.push('policy-original-licence-mismatch');
    if (policyRecord.disposition === 'blocked') gaps.push('policy-source-blocked');
    const declaredConditions = new Set(source.rights.conditions.map(condition => condition.id));
    for (const condition of policyRecord.requiredConditions) if (!declaredConditions.has(condition)) gaps.push('missing-policy-condition:' + condition);
  }
  const requiredRoles: (typeof roles)[number][] = ['source-provenance', 'payload-validation', 'rights-review', 'admission-approval'];
  if (source.kind === 'osm-extract') {
    requiredRoles.push('effective-clip');
    if (source.effectiveClip.status !== 'bound') gaps.push('effective-clip-required');
    else if (source.effectiveClip.boundPayloadSha256 !== source.payload.sha256) gaps.push('effective-clip-payload-mismatch');
  } else if (source.kind === 'osm-planet') {
    requiredRoles.push('planet-domain');
    if (source.effectiveClip.status !== 'planet-domain') gaps.push('planet-domain-required');
    else {
      const d = source.effectiveClip.descriptor;
      if (d.sourceUrl !== source.payload.url || d.edition !== source.edition || d.raw.sha256 !== source.payload.sha256 || d.raw.bytes !== source.payload.bytes) gaps.push('planet-domain-source-mismatch');
    }
  } else if (source.effectiveClip.status !== 'not-applicable') gaps.push('boundary-clip-not-applicable');
  // Mandatory original terms come from trusted inventory, never the candidate's chosen label.
  const profile = policyRecord ? profiles[policyRecord.originalLicenceId] : undefined;
  const conditionIds = source.rights.conditions.map(condition => condition.id);
  const naturalEarth = source.kind === 'boundary' && policyRecord?.boundaryProvider === 'natural-earth';
  if (naturalEarth) {
    const identity = policyRecord.naturalEarthIdentity!;
    for (const [name, declared, trusted] of [
      ['original-source', source.originalSource.url, identity.originalSourceUrl],
      ['payload', source.payload, identity.payload], ['licence-evidence', source.rights.licenceEvidence, identity.licenceEvidence],
      ['normalization-evidence', source.rights.conditions.find(condition => condition.id === 'normalized-boundary-lineage')?.evidence, identity.normalizationEvidence],
    ] as const) if (canonical(declared) !== canonical(trusted)) gaps.push('natural-earth-identity-mismatch:' + name);
  }
  for (const condition of ['exact-original-source-identity', 'licensor-authority', 'original-source-to-payload-chain', 'mixed-output-compatibility-review',
    ...(source.kind === 'boundary' ? naturalEarth ? ['natural-earth-exact-edition-and-source', 'natural-earth-normalization-and-limitations', 'normalized-boundary-lineage'] :
      ['geoboundaries-cc-by-4.0-attribution', 'geoboundaries-modification-and-edition-notice'] : ['osm-contributor-attribution'])]) {
    if (!conditionIds.includes(condition)) gaps.push('missing-condition:' + condition);
  }
  if (!profile || !Object.hasOwn(profiles, source.rights.licenceId) || profile.family === 'ambiguous' || profile.family === 'asset-specific') gaps.push('unsupported-licence-profile');
  else {
    if (new Set(conditionIds).size !== conditionIds.length) gaps.push('duplicate-condition');
    for (const condition of profile.conditions) if (!conditionIds.includes(condition)) gaps.push('missing-condition:' + condition);
    if (profile.id === 'ODbL-1.0' && source.intendedUse.distribution === 'public' && !source.rights.offer) gaps.push('machine-readable-offer-required');
    if (source.kind !== 'boundary' && profile.id !== 'ODbL-1.0') gaps.push('osm-original-odbl-review-required');
  }
  if (new Set(bundle.reviews.map(review => review.role)).size !== bundle.reviews.length) gaps.push('duplicate-review-role');
  if (new Set(trust.trustedReviews.map(review => canonical(review))).size !== trust.trustedReviews.length) gaps.push('duplicate-trusted-review');
  for (const role of requiredRoles) {
    const receipt = bundle.reviews.find(review => review.role === role);
    if (!receipt) { gaps.push('missing-review:' + role); continue; }
    if (receipt.subjectSha256 !== subjectSha256) gaps.push('stale-review:' + role);
    const identity = {role: receipt.role, subjectSha256: receipt.subjectSha256, reviewer: receipt.reviewer, evidence: receipt.evidence};
    if (!trust.trustedReviews.some(trusted => canonical(trusted) === canonical(identity))) gaps.push('untrusted-review:' + role);
  }
  return {schemaVersion: 1 as const, sourceKey: source.key, subjectSha256, disposition: gaps.length ? 'quarantined' as const : 'prepared-for-separate-acquisition-review' as const,
    gaps, policyId: policy.policyId, trustedPolicySha256: digest(policy), policyInventoryRoots: policy.inventoryRoots,
    scope: 'Offline preparation gate only; no acquisition authorization, legal opinion, publisher enforcement or runtime promotion',
    trustModel: 'Operator-controlled pinned original-source policy and explicit review allowlist; no cryptographic reviewer authentication is claimed'};
}

// Public JSON artifact pins bind Git's LF representation, not platform-specific checkout bytes.
// Upstream measured raw response pins in those documents are never normalized or changed.
export const retainedSourceEvidencePin: EvidencePin = {path: 'docs/operations/geography-source-metadata-evidence.json', bytes: 2480339, sha256: 'e84cf663e02aa0fed3cd0bcb424d423f06a1bab6f4b119bf104d8c7371b23ffb'};
export const retainedResolutionEvidencePin: EvidencePin = {path: 'docs/operations/geography-admission-resolution-evidence.json', bytes: 32663, sha256: 'dfa54188d7b101cefe6a5d9415f437a1a34110206d1dc9679fc69ca75c1af094'};
// This revision adopts actual independent role reviews and a separate delegated admission
// assessment. The assembler and candidate bundles cannot update this code-owned pin.
const reviewedNaturalEarthAuthorityPin: EvidencePin = {path: 'docs/operations/natural-earth-admission/reviewed-authority.json', bytes: 6212, sha256: 'b4356db8419daa9c7b7ba01d9565610dc6c172456cd05d0243d4a40b17a428cf'};
const reviewedNaturalEarthAuthoritySchema = z.strictObject({schemaVersion: z.literal(1),
  kind: z.literal('reviewed-retained-natural-earth-authority'), scope: z.literal('exact-private-retained-boundary-preparation'),
  sources: z.array(policySourceSchema).length(2), trust: sourceAdmissionTrustSchema,
  assessments: z.array(admissionEvidencePinSchema).min(1).max(8),
});
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
async function safeExisting(path: string): Promise<string> {
  if (path.split(/[\\/]/).includes('..')) throw new Error('Path traversal refused');
  const absolute = resolve(path); let cursor = parse(absolute).root;
  for (const part of absolute.slice(cursor.length).split(/[\\/]/).filter(Boolean)) { cursor = join(cursor, part); if ((await lstat(cursor)).isSymbolicLink()) throw new Error('Symlink path refused'); }
  return absolute;
}
export interface AdmissionMetadataSnapshot {path: string; bytes: number; sha256: string}
/** Resource accounting only; it cannot select policy, reviews or source authority. */
export interface AdmissionMetadataAccounting {bytes: number; ceiling: number; paths: Map<string, number>}
function checkSharedAccounting(shared?: AdmissionMetadataAccounting) {
  if (!shared) return;
  if (!Number.isSafeInteger(shared.bytes) || shared.bytes < 0 || !Number.isSafeInteger(shared.ceiling) ||
      shared.ceiling < 1 || shared.ceiling > 32 * MiB || shared.bytes > shared.ceiling || !(shared.paths instanceof Map)) throw new Error('Shared metadata accounting invalid');
  let total = 0;
  for (const [path, bytes] of shared.paths) {
    if (typeof path !== 'string' || !isAbsolute(path) || !Number.isSafeInteger(bytes) || bytes < 0) throw new Error('Shared metadata accounting entry invalid');
    total += bytes; if (!Number.isSafeInteger(total) || total > shared.ceiling) throw new Error('Shared metadata accounting limit');
  }
  if (total !== shared.bytes) throw new Error('Shared metadata accounting total mismatch');
}
interface ReadBudget {bytes: number; ceiling: number; snapshot?: Map<string, AdmissionMetadataSnapshot>; shared?: AdmissionMetadataAccounting}
async function readBounded(path: string, maxBytes: number, budget: ReadBudget, pin?: Pick<EvidencePin, 'bytes' | 'sha256'>): Promise<Buffer> {
  const absolute = await safeExisting(path), handle = await open(absolute, 'r');
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > maxBytes || budget.bytes + before.size > budget.ceiling || pin && before.size !== pin.bytes) throw new Error('Input byte/pin budget');
    if (budget.shared) {
      const shared = budget.shared, previous = shared.paths.get(absolute);
      if (previous !== undefined && previous !== before.size) throw new Error('Shared metadata path size changed');
      if (previous === undefined) {
        if (shared.bytes + before.size > shared.ceiling) throw new Error('Shared metadata byte limit');
        shared.bytes += before.size; shared.paths.set(absolute, before.size);
      }
    }
    budget.bytes += before.size;
    const bytes = Buffer.alloc(before.size); let offset = 0;
    while (offset < bytes.length) { const result = await handle.read(bytes, offset, bytes.length - offset, null); if (!result.bytesRead) throw new Error('Input mutation'); offset += result.bytesRead; }
    const after = await handle.stat(); await safeExisting(absolute);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ino !== after.ino) throw new Error('Input mutation');
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (pin && sha256 !== pin.sha256) throw new Error('Input checksum mismatch');
    if (budget.snapshot) {
      const observed = {path: absolute, bytes: bytes.length, sha256}, previous = budget.snapshot.get(absolute);
      if (previous && canonical(previous) !== canonical(observed)) throw new Error('Metadata changed between reads');
      budget.snapshot.set(absolute, observed);
    }
    return bytes;
  } finally { await handle.close(); }
}
function json(bytes: Buffer): unknown { return JSON.parse(new TextDecoder('utf8', {fatal: true}).decode(bytes)); }
async function retainedPublicJson(root: string, pin: EvidencePin, budget: ReadBudget) {
  const raw = await readBounded(join(root, pin.path), 4 * MiB, budget);
  const canonicalBytes = Buffer.from(new TextDecoder('utf8', {fatal: true}).decode(raw).replaceAll('\r\n', '\n'), 'utf8');
  if (canonicalBytes.length !== pin.bytes || createHash('sha256').update(canonicalBytes).digest('hex') !== pin.sha256) throw new Error('Canonical LF public artifact pin mismatch');
  return json(canonicalBytes);
}

/** Read retained raw bytes before describing them. The native observation still requires a trusted payload review. */
export async function createPlanetDomainDescriptor(rawPath: string, input: unknown, descriptorPath: string) {
  const descriptor = planetDomainSchema.parse(input), absolute = await safeExisting(rawPath), handle = await open(absolute, 'r');
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size !== descriptor.raw.bytes) throw new Error('Planet raw identity size mismatch');
    const hash = createHash('sha256'), buffer = Buffer.alloc(65536); let count = 0;
    while (true) {
      const {bytesRead} = await handle.read(buffer, 0, buffer.length, null); if (!bytesRead) break;
      count += bytesRead; if (count > descriptor.raw.bytes) throw new Error('Planet raw identity grew'); hash.update(buffer.subarray(0, bytesRead));
    }
    const after = await handle.stat(); await safeExisting(absolute);
    if (count !== descriptor.raw.bytes || hash.digest('hex') !== descriptor.raw.sha256 || before.mtimeMs !== after.mtimeMs || before.size !== after.size || before.ino !== after.ino) throw new Error('Planet raw identity mismatch');
  } finally { await handle.close(); }
  await verifyPlanetDomainEvidence(descriptor, dirname(resolve(descriptorPath)), {bytes: 0, ceiling: 8 * MiB});
  const bytes = Buffer.from(canonical(descriptor), 'utf8');
  return {descriptor, bytes, sha256: createHash('sha256').update(bytes).digest('hex')};
}

/** Linked evidence is always relative to the retained descriptor's parent directory. */
async function verifyPlanetDomainEvidence(descriptor: z.infer<typeof planetDomainSchema>, descriptorDirectory: string, budget: ReadBudget) {
  const observation = json(await readBounded(join(descriptorDirectory, descriptor.nativeVintageEvidence.path), 4 * MiB, budget, descriptor.nativeVintageEvidence));
  const expected = {schemaVersion: 1, kind: 'native-vintage-observation', raw: descriptor.raw, nativeVintage: descriptor.nativeVintage};
  if (canonical(observation) !== canonical(expected)) throw new Error('Planet native vintage observation mismatch');
  await readBounded(join(descriptorDirectory, descriptor.providerWholeWorldEvidence.path), 4 * MiB, budget, descriptor.providerWholeWorldEvidence);
}
async function readPlanetDomainFile(path: string, pin: Pick<EvidencePin, 'bytes' | 'sha256'>, budget: ReadBudget) {
  const descriptor = planetDomainSchema.parse(json(await readBounded(path, 4 * MiB, budget, pin)));
  await verifyPlanetDomainEvidence(descriptor, dirname(resolve(path)), budget);
  return descriptor;
}
/** Assembly calls this on initial and final plan load, checking all three pinned artifacts. */
export async function verifyPlanetDomainFile(path: string, pin: Pick<EvidencePin, 'bytes' | 'sha256'>) {
  return readPlanetDomainFile(path, admissionEvidencePinSchema.omit({path: true}).parse(pin), {bytes: 0, ceiling: 12 * MiB});
}

/** Immutable retained evidence has already been sanitized; do not replace it with current upstream metadata. */
export async function buildRetainedSourceAdmissionInventory(root = repoRoot) {
  return retainedInventory(root, {bytes: 0, ceiling: 8 * MiB});
}
async function retainedInventory(root: string, budget: ReadBudget) {
  const evidence = await retainedPublicJson(root, retainedSourceEvidencePin, budget) as any;
  const resolution = await retainedPublicJson(root, retainedResolutionEvidencePin, budget) as any;
  const commit = '5c25134028196d43ce97b5071934fd0cfc92f09f';
  if (evidence.geoBoundaries.commit !== commit || evidence.geoBoundaries.treeTruncated !== false || evidence.geoBoundaries.inventory.length !== 429 || evidence.supplementalAllocation.aggregateRows.length !== 429) throw new Error('Retained inventory identity/count mismatch');
  const selected = evidence.supplementalAllocation.aggregateRows as Record<string, string>[];
  const byKey = new Map<string, Record<string, string>>();
  for (const row of selected) { const match = /^([A-Z]{3})-(ADM[01])-\d+$/.exec(row.boundaryID); if (!match || byKey.has(match[1] + '-' + match[2])) throw new Error('Duplicate/malformed original source identity'); byKey.set(match[1] + '-' + match[2], row); }
  const licenceCounts: Record<string, number> = {}, seen = new Set<string>();
  const layers = evidence.geoBoundaries.inventory.map((layer: any) => {
    const sourceKey = layer.iso3 + '-' + layer.level, declaration = byKey.get(sourceKey);
    if (!declaration || seen.has(sourceKey)) throw new Error('Missing/duplicate layer declaration'); seen.add(sourceKey);
    const profile = profiles[labelIds[declaration.boundaryLicense]]; if (!profile) throw new Error('Unrecognized source licence label');
    licenceCounts[declaration.boundaryLicense] = (licenceCounts[declaration.boundaryLicense] ?? 0) + 1;
    const geometry = layer.files.find((file: any) => file.path.endsWith('.geojson'));
    if (!geometry || geometry.path !== `releaseData/gbOpen/${layer.iso3}/${layer.level}/geoBoundaries-${sourceKey}.geojson`) throw new Error('Geometry tree identity mismatch');
    const gaps = ['exact-original-source-provenance-review', 'payload-measurement-and-geometry-validation', 'original-licence-review', 'publication-notices-and-transformation-plan', 'trusted-admission-approval'];
    if (declaration.boundaryISO !== layer.iso3 || declaration.boundaryType !== layer.level) gaps.push('metadata-identity-conflict');
    if (!publicUrl.safeParse(declaration.boundarySourceURL).success) gaps.push('source-url-needs-exact-original-asset');
    if (!publicUrl.safeParse(declaration.licenseSource).success) gaps.push('licence-url-needs-exact-version-evidence');
    if (!declaration.licenseDetail.trim()) gaps.push('source-licence-detail-empty');
    if (profile.termsEvidence === 'exact-terms-review-required') gaps.push('exact-licence-terms-not-retained-for-review');
    if (profile.family === 'ambiguous') gaps.push('ambiguous-original-licence');
    if (profile.family === 'asset-specific') gaps.push('historical-original-asset-grant-unproved');
    const isInd = sourceKey === 'IND-ADM0';
    const pointer = isInd ? /^version https:\/\/git-lfs.github.com\/spec\/v1\noid sha256:([a-f0-9]{64})\nsize (\d+)\n$/.exec(resolution.indAdm0Pointer) : null;
    if (isInd && !pointer) throw new Error('Retained IND pointer malformed');
    const originalDeclaration = {...declaration};
    const record = {
      sourceKey, kind: 'boundary' as const, disposition: 'quarantined' as const, edition: commit,
      boundaryId: declaration.boundaryID, immutableGeometry: geometry,
      metadataFiles: layer.files.filter((file: any) => !file.path.endsWith('.geojson')),
      originalDeclaration, declarationScope: 'Sanitized original provider declaration; not a source grant or a measured payload',
      payloadIdentity: {status: isInd ? 'pointer-claim-only' : 'unresolved-lfs-object', claimedBytes: pointer ? Number(pointer[2]) : null, claimedSha256: pointer ? pointer[1] : null, measuredBytes: null, measuredSha256: null, geometryValidated: false},
      effectiveClip: {status: 'not-applicable' as const, reason: 'Administrative membership geometry; independently admit effective extraction clips for OSM inputs'},
      licenceProfile: profile,
      requiredConditions: ['exact-original-source-identity', 'licensor-authority', 'original-source-to-payload-chain', ...profile.conditions, 'geoboundaries-cc-by-4.0-attribution', 'geoboundaries-modification-and-edition-notice', 'mixed-output-compatibility-review'],
      noticeWorksheet: {sourceCredit: declaration.boundarySource, sourceTitle: declaration.boundaryName, sourceUri: declaration.boundarySourceURL, licenceLabel: declaration.boundaryLicense, licenceUri: declaration.licenseSource, representedYear: declaration.boundaryYearRepresented, providerCredit: 'geoBoundaries, CC BY 4.0; retain exact source citation and modifications', publicationDestination: null, approvedNoticeText: null, sourceAuthorEvidence: null, note: 'Worksheet fields preserve declarations; reviewer must resolve original author/title/asset and public notice destination'},
      resolutionEvidence: isInd || sourceKey === 'POL-ADM0' || sourceKey === 'TWN-ADM0' ? retainedResolutionEvidencePin : null,
      nextAction: isInd ? 'Obtain provider correction binding this exact LFS object to ADM0 and original rights, or explicitly choose a separately admitted replacement edition' : sourceKey === 'POL-ADM0' ? 'Resolve exact Wikimedia file/revision/author/licence and provider label/link conflict' : sourceKey === 'TWN-ADM0' ? 'Retain original Pixabay asset revision, dated terms and grant for transformed boundary redistribution, or select a separately admitted replacement' : `Retain exact original ${declaration.boundarySource} asset/revision and source-to-object chain; review ${profile.id} conditions and complete measured payload and review receipts`,
      gaps,
    };
    return {...record, recordSha256: digest(record)};
  });
  if (seen.size !== byKey.size || Object.keys(licenceCounts).length !== 18) throw new Error('Inventory completeness mismatch');
  const csv = evidence.supplementalAllocation.requests[0];
  const osmExtracts = evidence.requests.filter((request: any) => request.method === 'HEAD' && request.url.endsWith('-261013.osm.pbf')).map((request: any) => {
    const basename = new URL(request.url).pathname.slice(1), region = basename.replace('-261013.osm.pbf', '');
    const historicalClip = evidence.requests.find((candidate: any) => candidate.url === `https://download.geofabrik.de/${region}-261013.poly`);
    return {sourceKey: `geofabrik:${region}:261013`, kind: 'osm-extract', disposition: 'quarantined', edition: 'proposed-261013',
      immutablePayloadUrl: request.url, retainedEvidence: retainedSourceEvidencePin,
      payloadIdentity: {status: 'historical-head-observation-only', httpListedBytes: Number(request.headers['Content-Length']), etag: request.headers.ETag, lastModified: request.headers['Last-Modified'], observedAt: request.endedUtc, measuredBytes: null, measuredSha256: null, nativeHeaderVintage: null, headResponseBodySha256IsNotPayloadDigest: true},
      originalSource: {provider: 'Geofabrik', database: 'OpenStreetMap contributors', sourceUrl: 'https://www.openstreetmap.org/copyright', licence: 'ODbL-1.0'},
      effectiveClip: {status: 'unresolved-provider-build-association', selectedExactUrl: null, selectedBytes: null, selectedSha256: null, providerAssociationEvidence: null, extractionProcedureRevision: null,
        guessedDatedCandidate: historicalClip ? {url: historicalClip.url, status: historicalClip.status, interpretation: 'Counted prior 404, not an archival absence proof'} : null,
        currentUnmatchedCandidate: `https://download.geofabrik.de/${region}.poly`,
        antarcticaRepositoryCandidate: region === 'antarctica' ? {tree: resolution.geofabrik.treeSha, entry: resolution.geofabrik.antarcticaTreeEntry, note: 'Repository source polygon differs from server-generated effective polygons; no substitution or historical equality established'} : null},
      requiredConditions: [...profiles['ODbL-1.0'].conditions, 'osm-contributor-attribution', 'source-native-vintage', 'effective-clip-payload-build-association', 'extraction-procedure-revision', 'independent-administrative-membership', 'mixed-output-compatibility-review'],
      noticeWorksheet: {attribution: '© OpenStreetMap contributors', sourceUrl: 'https://www.openstreetmap.org/copyright', licenceUrl: 'https://opendatacommons.org/licenses/odbl/1-0/', modifications: null, exactEditionNotice: null, publicMachineReadableOffer: null, offerHash: null, retentionPolicy: null},
      gaps: ['exact-payload-sha256-and-native-header', 'effective-clip-identity', 'provider-build-clip-association', 'extraction-procedure-evidence', 'public-derivative-offer', 'trusted-source-payload-clip-rights-admission-reviews'],
      nextAction: 'Obtain provider evidence binding the actual effective clip and extraction procedure to this exact dated PBF; freeze measured identities and reviewed notices/offer before separate acquisition approval',
    };
  });
  if (osmExtracts.length !== 8 || osmExtracts.reduce((sum: number, source: any) => sum + source.payloadIdentity.httpListedBytes, 0) !== 85563268782) throw new Error('Retained OSM inventory mismatch');
  return {schemaVersion: 1, scope: 'Complete retained 429-layer source admission inventory; offline preparation only; no production admission or runtime enforcement',
    retainedManifest: retainedSourceEvidencePin, retainedResolution: retainedResolutionEvidencePin,
    retainedPublicArtifactRepresentation: 'UTF-8 with CRLF converted to LF, matching checked-in Git artifacts; input budgets count physical bytes. Upstream raw response identities remain exact and unchanged. Generic acquisition/review pins are always physical byte identities.',
    originalAggregateMetadata: {url: csv.url, bytes: csv.bodyBytes, sha256: csv.sha256, gitBlobSha1: csv.gitBlobSha1, projection: 'Sanitized provider declarations; 2 credential-shaped query value occurrences redacted in retained evidence'},
    repository: {commit, treeSha: evidence.geoBoundaries.treeSha, treeTruncated: false, repositoryIso3Count: 232, missingLevelPairs: evidence.geoBoundaries.absentPairsWithinRepositoryIso3Universe},
    summary: {layers: layers.length, admitted: 0, quarantined: layers.length, licenceLabels: Object.keys(licenceCounts).length, licenceCounts},
    network: {requests: 0, bodyBytes: 0, ledger: [], note: 'Retained evidence only; no allowance consumed or rolled forward'},
    cdsAssetHostAllowlist: [], cdsDisposition: 'No asset host enabled: this packet has no official exact-host proof; never infer a host from an asset URL',
    cdsDownloadHostReadiness: {disposition: 'quarantined', officialExactHostDocumentation: null, approvedHosts: [], requiredEvidence: ['official public documentation naming exact asset host', 'immutable documentation pin', 'owner-approved exact-host policy', 'separately authorized exact job/asset identity and transfer limits'], noHostGuessingOrEnablement: true},
    osmExtracts, layers};
}

/** Only code-reviewed replacement inventory/policy revisions may change the retained original grants. */
async function retainedAdmissionContext(root: string, budget: ReadBudget) {
  const inventory = await retainedInventory(root, budget);
  const authority = reviewedNaturalEarthAuthoritySchema.parse(json(await readBounded(join(root, reviewedNaturalEarthAuthorityPin.path), 4 * MiB, budget, reviewedNaturalEarthAuthorityPin)));
  const trustDirectory = join(root, 'docs/operations/natural-earth-admission');
  for (const [index, record] of authority.sources.entries()) if (record.key !== `NE-v5.1.1-ADM${index}` || record.kind !== 'boundary' || record.boundaryProvider !== 'natural-earth') throw new Error('Reviewed Natural Earth authority source mismatch');
  for (const pin of authority.assessments) await readBounded(join(trustDirectory, pin.path), 4 * MiB, budget, pin);
  const policy = sourceAdmissionPolicySchema.parse({schemaVersion: 1, policyId: 'retained-geography-source-admission-v2-reviewed-natural-earth',
    inventoryRoots: [retainedSourceEvidencePin, retainedResolutionEvidencePin, reviewedNaturalEarthAuthorityPin],
    sources: [
      ...inventory.layers.map((layer: any) => ({key: layer.sourceKey, kind: layer.kind, edition: layer.edition, recordSha256: layer.recordSha256,
        originalLicenceId: layer.licenceProfile.id, requiredConditions: layer.requiredConditions,
        disposition: layer.gaps.includes('metadata-identity-conflict') || ['ambiguous', 'asset-specific'].includes(layer.licenceProfile.family) ? 'blocked' : 'reviewable'})),
      ...inventory.osmExtracts.map((source: any) => ({key: source.sourceKey, kind: source.kind, edition: source.edition, recordSha256: digest(source),
        originalLicenceId: 'ODbL-1.0', requiredConditions: source.requiredConditions, disposition: 'reviewable'})),
      ...authority.sources,
    ],
  });
  return {policy, trust: authority.trust, trustDirectory};
}
async function retainedPolicy(root: string, budget: ReadBudget) {
  return (await retainedAdmissionContext(root, budget)).policy;
}
export async function buildRetainedSourceAdmissionPolicy(root = repoRoot) {
  return retainedPolicy(root, {bytes: 0, ceiling: 8 * MiB});
}

export interface OperatorAdmissionContext {
  /** Operator-owned in-memory context only. Never deserialize these values from an execution candidate. */
  policy: unknown; trust: unknown; trustDirectory: string; policyDirectory?: string;
}
async function validateMetadata(bundlePath: string, operator: OperatorAdmissionContext, budget: ReadBudget, rootsAlreadyVerified = false) {
  const policy = sourceAdmissionPolicySchema.parse(operator.policy), trust = sourceAdmissionTrustSchema.parse(operator.trust);
  if (!rootsAlreadyVerified) for (const pin of policy.inventoryRoots) await readBounded(join(operator.policyDirectory ?? operator.trustDirectory, pin.path), 4 * MiB, budget, pin);
  const bundle = sourceAdmissionBundleSchema.parse(json(await readBounded(bundlePath, 2 * MiB, budget)));
  const source = bundle.source;
  const manifest = sourceAdmissionManifestSchema.parse(json(await readBounded(join(dirname(resolve(bundlePath)), source.manifest.path), 4 * MiB, budget, source.manifest)));
  const selected = manifest.records.filter(record => record.sourceKey === source.key);
  if (new Set(manifest.records.map(record => record.sourceKey)).size !== manifest.records.length || selected.length !== 1 ||
      selected[0].kind !== source.kind || selected[0].edition !== source.edition || selected[0].recordSha256 !== source.recordSha256 ||
      canonical(selected[0].payload) !== canonical({url: source.payload.url, bytes: source.payload.bytes, sha256: source.payload.sha256})) throw new Error('Exact source manifest membership mismatch');
  const pins: EvidencePin[] = [source.originalSource.provenanceEvidence, source.payload.identityEvidence, source.rights.licenceEvidence,
    ...source.rights.conditions.map(condition => condition.evidence), ...bundle.reviews.map(review => review.evidence)];
  if (source.effectiveClip.status === 'bound') pins.push(source.effectiveClip.payload.identityEvidence, source.effectiveClip.associationEvidence);
  if (source.effectiveClip.status === 'planet-domain') {
    const {descriptor, descriptorEvidence} = source.effectiveClip;
    const retained = await readPlanetDomainFile(join(dirname(resolve(bundlePath)), descriptorEvidence.path), descriptorEvidence, budget);
    if (canonical(retained) !== canonical(descriptor)) throw new Error('Planet descriptor content mismatch');
  }
  const visited = new Set<string>();
  for (const [base, list] of [[dirname(resolve(bundlePath)), pins], [operator.trustDirectory, trust.trustedReviews.map(review => review.evidence)]] as const) {
    for (const pin of list) {
      const path = join(base, pin.path), key = canonical({absolutePath: path, pin}); if (visited.has(key)) continue; visited.add(key);
      const bytes = await readBounded(path, 4 * MiB, budget, pin);
      for (const review of bundle.reviews.filter(receipt => canonical(receipt.evidence) === canonical(pin))) {
        const document = receiptDocumentSchema.parse(json(bytes));
        const {evidence: _pin, ...receipt} = review;
        if (canonical(document) !== canonical({schemaVersion: 1, ...receipt})) throw new Error('Review receipt content mismatch');
      }
    }
  }
  const lineagePin = source.rights.conditions.find(condition => condition.id === 'normalized-boundary-lineage')?.evidence;
  if (lineagePin) {
    if (source.kind !== 'boundary') throw new Error('Boundary normalization lineage is boundary-only');
    const lineage = boundaryNormalizationLineageSchema.parse(json(await readBounded(join(dirname(resolve(bundlePath)), lineagePin.path), 4 * MiB, budget, lineagePin)));
    if (canonical(lineage.source) !== canonical({url: source.payload.url, bytes: source.payload.bytes, sha256: source.payload.sha256}) ||
        lineage.transformRevision !== source.intendedUse.transformRevision) throw new Error('Boundary normalization lineage source/revision mismatch');
  }
  return {...validateSourceAdmission(bundle, trust, policy), source, bundle, verifiedMetadataBytes: budget.bytes, evidenceSnapshot: [...budget.snapshot?.values() ?? []]};
}
/** Bounded metadata inspection for an internally supplied operator context; no raw/normalized bodies are read. */
export async function validateSourceAdmissionMetadataFiles(bundlePath: string, operator: OperatorAdmissionContext, accounting?: AdmissionMetadataAccounting) {
  checkSharedAccounting(accounting);
  return validateMetadata(bundlePath, operator, {bytes: 0, ceiling: 16 * MiB, snapshot: new Map(), shared: accounting});
}
/** The production context is fixed here: candidates cannot select policy or supply trusted approvals. */
export async function validateProductionSourceAdmissionFiles(bundlePath: string, accounting?: AdmissionMetadataAccounting) {
  checkSharedAccounting(accounting);
  const budget: ReadBudget = {bytes: 0, ceiling: 16 * MiB, snapshot: new Map(), shared: accounting};
  const context = await retainedAdmissionContext(repoRoot, budget);
  return validateMetadata(bundlePath, context, budget, true);
}
/** Compatibility inspection CLI: a supplied review allowlist is not a production trust authority. */
export async function validateSourceAdmissionFiles(bundlePath: string, trustPath: string) {
  const budget: ReadBudget = {bytes: 0, ceiling: 16 * MiB, snapshot: new Map()};
  const policy = await retainedPolicy(repoRoot, budget);
  const trust = sourceAdmissionTrustSchema.parse(json(await readBounded(trustPath, 2 * MiB, budget)));
  return validateMetadata(bundlePath, {policy, trust, trustDirectory: dirname(resolve(trustPath))}, budget, true);
}

export function sourceAdmissionOutputPath(output: string) {
  if (output.split(/[\\/]/).includes('..')) throw new Error('Output traversal refused');
  // Inspect the caller's original spelling before resolve() can collapse aliases.
  // Permit only the native absolute root; a colon anywhere else would name an NTFS stream.
  const driveRoot = /^[a-z]:[\\/]/i.test(output);
  if (!output || output.length > 2048 || /^[\\/]{2}/.test(output) ||
      process.platform !== 'win32' && (driveRoot || output.includes('\\'))) throw new Error('Unsafe output path syntax');
  const components = (driveRoot ? output.slice(2) : output).replace(/^[\\/]/, '').split(/[\\/]/);
  for (const component of components) {
    if (!component || component === '.' || /[.\s]$/.test(component) || /[\x00-\x1f\x7f<>:"|?*]/.test(component) ||
        /^(?:con|prn|aux|nul|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?:[ .]|$)/i.test(component)) throw new Error('Unsafe output path component');
  }
  const absolute = resolve(output);
  const root = resolve(repoRoot), inside = relative(root, absolute);
  if (inside.startsWith('..') || isAbsolute(inside)) throw new Error('Output must remain within the workspace');
  return absolute;
}
async function writeNewJson(output: string, value: unknown) {
  const absolute = sourceAdmissionOutputPath(output); await safeExisting(dirname(absolute));
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n'); if (bytes.length > 8 * MiB) throw new Error('Output byte budget');
  const handle = await open(absolute, 'wx'); try { await handle.writeFile(bytes); } finally { await handle.close(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, first, second, third, ...extra] = process.argv.slice(2);
  if (command === 'inventory' && first && !second && !extra.length) await writeNewJson(first, await buildRetainedSourceAdmissionInventory());
  else if (command === 'validate' && first && second && third && !extra.length) {
    const result = await validateSourceAdmissionFiles(first, second); await writeNewJson(third, result); if (result.disposition === 'quarantined') process.exitCode = 2;
  } else throw new Error('Usage: source-admission.ts inventory NEW_OUTPUT.json | validate BUNDLE.json TRUST.json NEW_OUTPUT.json');
}
