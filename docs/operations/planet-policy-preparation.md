# Planet operator-policy preparation — 17 October 2026

The preparation command is offline and read-only. It verifies the existing immutable inventory roots through `buildRetainedSourceAdmissionPolicy()`, binds the proposed dated source identity and reports unresolved gates. It does not acquire a body, read a retained planet, launch a provider/build job, write policy/trust files, or grant admission. `acquisitionAuthorized` and `productionAdmitted` are always false.

From this worktree:

```powershell
.\node_modules\.bin\tsx.cmd scripts/osm/planet-policy-preparation.ts
.\node_modules\.bin\tsx.cmd scripts/osm/planet-policy-preparation.ts --check PATH_TO_PROPOSED_METADATA.json
```

The optional file must be one strict JSON object with exactly the following fields; the command reads at most 65,537 bytes and rejects input above 64 KiB or observed mutation. Both forms write their report to stdout only. A zero exit code means this preparation report was produced, never that its listed gates passed or a receipt/build is permitted.

```json
{
  "url": "https://osm-planet-eu-central-1.s3.dualstack.eu-central-1.amazonaws.com/planet/pbf/2026/planet-261012.osm.pbf",
  "edition": "planet-261012.osm.pbf",
  "bytes": 95380942829,
  "versionId": "brLMq6.oGIcbk.3ciQgjtqIduCfYJMT1",
  "etag": "\"37619b1886c62145e6a0a6b31109b300-5686\"",
  "md5": "c51bb08eb9fc486d010aaa1a3424cabc",
  "lastModified": "2026-10-15T19:22:44Z"
}
```

Each identity field is enforced as an exact literal. URLs with another date, query, mirror or mutable name cannot pass. Raw SHA-256, native vintage, review declarations, selected policy and approval fields cannot be supplied to this command. The multipart ETag remains distinct from provider MD5. These are retained metadata observations from [the exact-source packet](planet-identity-capacity.md), not verification of absent body bytes. Receipt allowance and bounds are a separate contract described in [acquisition readiness](geography-acquisition-readiness.md).

## Reviewable policy path

The current operator policy `retained-geography-source-admission-v2-reviewed-natural-earth` preserves the earlier 429 boundary layers and eight extracts and appends two [reviewed private Natural Earth subjects](natural-earth-admission/reviewed-authority.md). Its three fixed inventory roots include the code-pinned actual authority, which also pins independent role evidence and a separate admission assessment. The proposed planet remains absent. Passing candidate/trust files cannot replace this baseline. This command uses no caller-selected policy or root, makes no changes to that policy, emits no source-admission bundle or invented planet record digest, and produces no review receipts or trust allowlist.

`OSM-planet-261012` remains a proposed future key with no grant. `NE-v5.1.1-ADM0` and `NE-v5.1.1-ADM1` have actual fixed records and eight subject-bound role receipts for the exact private retained inputs. A present policy record alone does not validate a candidate bundle or an execution envelope. This preparation report performs neither validation and keeps its workflow admission false. Changed source records, evidence or uses require fresh review and an explicit operator-controlled revision. Real planet file validation remains quarantined with `policy-source-not-found` even if hypothetical review declarations are present.

The planet proposal preserves ODbL derivative-database treatment, contributor attribution, original-source/payload chain, licence and modification notices, share-alike, compatibility and machine-readable-offer conditions. The emitted condition list prepares review; it supplies no legal determination or condition evidence. For a public output, the owner still needs the exact machine-readable derivative offer URL, hosting owner, delivery/retention terms and immutable catalogue identity. Private preparation does not remove the later public-release gate.

## What can only follow receipt

1. From the received bytes, verify exact length/provider MD5, retain measured local SHA-256 and inspect the native PBF header with the intended parser. Neither filename date nor HTTP Last-Modified is native vintage. Failed receipt evidence must remain failure evidence.
2. Retain the exact `native-vintage-observation` JSON accepted by [the planet descriptor contract](planet-source-admission.md), bound to measured raw bytes/SHA-256 and actual native vintage. Retain independent provider whole-world evidence with immutable pins. Use `createPlanetDomainDescriptor()` on the actual retained local raw file; its linked files resolve beside the descriptor. The descriptor may claim only `source-domain-only`.
3. Prepare the actual source manifest and record, intended use, rights/condition evidence and descriptor pin. Review an inventory/policy revision for those actual identities. Do not use a dummy raw hash, clip hash, record digest, timestamp, review receipt or approval placeholder that a production parser could accept.
4. Calculate `admissionSubjectDigest` over the full actual source. Obtain independent `source-provenance`, `payload-validation`, `rights-review`, `planet-domain` and `admission-approval` receipts on that digest, then independently allowlist their reviewer/evidence identities. Use the existing file gate to verify pinned bytes, manifest membership and receipts. Any changed source, intended use, rights, descriptor or evidence invalidates the old subject reviews.
5. Prepare the actual pinned [production admission envelope](production-source-admission.md), binding the full raw manifest, assembly plan, source bundles, actual native evidence and subject-bound normalized boundary lineage. Production CLIs, `global_source.py` and `membership-assembly.ts` invoke the fixed-policy production gate before execution and recheck it around their work. Fixed authority covers only the two reviewed private Natural Earth subjects; actual planet policy, measured raw/native evidence and planet subject reviews remain absent. A candidate cannot replace that authority with an inspection trust file.
6. Stop after receipt/native inspection and actual descriptor/review preparation. A later build needs separate authorization, refreshed disk/memory, a complete retained-path inventory without overlap and unchanged stage limits. Completed scanning and independent footprint evidence remain necessary for searched cells. A world rectangle is source extent only.

## Natural Earth remains a concrete production gate

The selected inputs are Natural Earth v5.1.1 at commit `9380cca83db5f9aef52d5e762765100745f84b27`, with the retained licence and fixed source metadata in `scripts/osm/natural-earth-policy.ts`. [The actual receipt](data-pilot-evidence/2026-10-16-n4-geography-r2.json) records ADM0 **13,287,234 bytes**, SHA-256 `239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255`, and ADM1 **40,726,851 bytes**, SHA-256 `22d0e3ad85eb3e27f17cabf8ba2d50e554fbc27a87796ff891d958185da62fb5`. Those measured receipt records and completed normalization do not admit a generic production source subject. This command reads the fixed policy metadata, not those retained geometry bodies, and does not reverify their hashes.

The generic gate supports [provider-aware boundary admission](provider-source-admission.md), and producer/assembly production entrypoints enforce the fixed production admission gate. The two exact reviewed private Natural Earth bundles now pass its metadata validator on the Windows workstation. Their unchanged source subjects bind measured originals, retained licence, normalization/preparation audits, complete normalized lineage and intended use. The independent review remeasured all bodies, compared all 4,854 feature mappings/70 unknowns and replayed the 49 audited transformations. Its rights-evidence conclusions cover the private boundary purpose, not public mixed-database compatibility. The separate root assessment adopted those genuine conclusions; the assembler issued no approvals.

Candidate fields cannot select the Natural Earth branch. Omitted provider classification preserves the existing GeoBoundaries rules, including `geoboundaries-cc-by-4.0-attribution` and `geoboundaries-modification-and-edition-notice`; all 437 earlier policy records remain unchanged. Those condition IDs are forbidden substitutes for Natural Earth evidence. Actual execution must still verify consumed normalized bodies and the complete invocation. Source changes need fresh reviews. Preserve unknown membership, generalized cartography/disputed-boundary limitations and all documented transformations.

Assembly keeps its individual **128 MiB** candidates/exclusions/lineage/footprint pin maxima. Capacity arithmetic is advisory and cannot enlarge them. The Windows workstation remains the preparation machine; the **2 CPU / 4 GB Hetzner host** receives only an admitted immutable catalogue and required runtime assets after actual size/query/concurrency/rollback measurements and installation approval. No planet raw/scratch transfer to that host is prepared here.

Validation: focused preparation tests exercise immutable policy preservation, every exact identity field, forged approval/evidence fields, Natural Earth gaps and bounded read-only CLI behavior. No body acquisition, production job, external approval or acceptance-total change is represented by those tests.
