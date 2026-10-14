# NightSky bounded acquisition decision packet

Prepared14October2026, baselinef6d043b. **Preparation only: no acquisition authorization, source/historical download, authentication, runtime change or deployment.** This packet consolidates three independently prepared lanes. Current ticket counts remain12 Done/9 Partial/6 Not started.

## Recommendation and sequence

**Start with the three-region spot pilot**, after implementing/reviewing generic source admission offline. It tests whether the exact-output filter remains useful on dense, sparse/coastal and antimeridian sources, with approximately24.5MiB of explicitly listed raw bodies. The current Bhutan prototype cannot run these other sources unchanged.

1. Review the exact source/policy/budget below. Approval to prepare this packet grants no retrieval allowance.
2. Implement and test a generic pinned manifest/downloader/source-header/worker admission path using retained and synthetic fixtures only. Test whole-wave scratch accounting, no retries/redirects, exclusive paths and source identity. Independently settle crossing-way point correction or exclusion; equality with a naive mean is insufficient.
3. Obtain explicit bounded retrieval allowance, then run Monaco first. Inspect its evidence before Faroe Islands, then Fiji. A failed stage stops the source wave without increasing resources or substituting sources.
4. Review that pilot before global inventory expansion. These three sources do not cover the world or establish useful observing-place completeness.
5. Separately authorize the two-job ERA5 grouped-format pilot; keep source jobs sequential and inspect the first actual result before the second. Do not mix allowances or treat spot approval as historical approval.
6. Use the meteor matrix to prioritize specific missing source layers. No acquisition batch in this packet supplies missing meteor seasons.

## Proposed allowances — ceilings, not completion/cost forecasts

| Batch | Exact selection | New source operations | Download/body ceiling | Local resource and deadline limits | Execution readiness |
|---|---|---|---:|---|---|
| Spots | Monaco, Faroe Islands, Fiji; exact261013URLs in [spot proposal](global-spot-acquisition-proposal.md) | At most3HEAD+3GET, one worker/request path at a time; no retries/redirects/substitution | 25,677,683bytes total declared bodies | Nine stages×60s maximum activework plus boundedcleanup;256MiB workerRSS+jobcommit;100MiB combined newly created raw/scratch/kept files, sampled stopping. Proposed15-minute operator batch deadline includes acquisition/build/cleanup; inspection can prevent starting further stages. | Generic manifest/downloader/admission wrapper not implemented; source header/hash unknown until future approved retrieval. |
| ERA5 | March1991+1992, Hanle and Kodaikanal/Munnar footprints; [two exact grouped jobs](historical-acquisition-proposal.md) | At most2new durable submissions, one active; bounded metadata polling and one admitted raw parent per job. No automatic retries/resubmission/splitting. | At most32MiB each/64MiB selected raw total | 30minutes overall including queue/transfer/import/inspection;1GiB root scratch;256MiB cooperative importRSS gate;four child partitions≤4MiB each and two indexes≤4MiB each. | Existing offline path validated; actual currentCDS cost acceptance/groupedNetCDF shape remains unverified. Two-job and overall gates need operator supervision. |

Spots' maximum kept non-raw allocation is63MiB across three sources; raw plus kept ceilings total91,737,971bytes, leaving13,119,629bytes staging/headroom inside100MiB. These are proposed allocation stops, not predictions or hard diskquota. Count failed evidence and all reports; do not delete evidence to make the next stage fit. Pre-existing tools/artifacts need separate disk headroom. The new15-minute outer cap is a proposed operator gate, not existing automation; never enlarge it or stage limits automatically.

ERA5's twoMarchgroups each contain1,488 UTC clocks and two monthly children. No completedJanuary/boundary chunk is duplicated. It remains a two-year sample diagnostic; absent adjacentFebruary/April data leave local-night boundary gaps. Raw/download reservations differ from final retained bytes; details and recovery/uncertain-submission rules are in the lane proposal. Local timeout does not guarantee remote cancellation. Existing2025 active tiles remain unchanged; no partial full-period envelope is published.

No paid compute/service acquisition is proposed. Local time, disk and maintenance still have a cost; these ceilings do not establish an affordable worldwide build or selectedHetzner capacity.

## Meteor readiness and decision priorities

[Complete coverage matrix](meteor-coverage-matrix.md) maps19distinct shower codes,26year-qualified2025/2026 peak instants,12bounded radiant models and two source-only typical intervals. Only six codes have both a retained peak and radiant model. Every row lacks complete UTC seasons, full-season local-geometry coverage and a personal meteor-rate model. Typical intervals are unfiltered reference evidence with unavailable UTC conversion/overlap; other years' maxima are not inferred.

Prioritize source-layer acceptance for common requested showers and explicit missing codes, then season-wide radiant validity and dated-session regression cases. Public accessibility is not catalog reuse permission. Separately licensed software is not permission for its paper or an observation catalog. The matrix identifies an older eight-code guidance message versus twelve supported aliases; reconcile that copy in a future runtime change before usability testing. No scope reduction is accepted by this packet.

## Decision and stop record

| Decision | Current state | Required before retrieval or release |
|---|---|---|
| Exact spot allowance | Pending owner review | Agree sources/policy/ceilings; generic tools and safety tests reviewed before anyPBFGET. |
| Exact ERA5 allowance | Pending owner review | Agree twojob/digest/ceilings; check exact current requestcost, existingledgers/configuration without disclosing secrets; supervise remaining overall time. |
| Meteor full coverage | Missing evidence | Review exact per-layer gaps and admitted scientific/license source; no guessed seasons or calendar conversions. |
| Global/baseline product claim | Open originalTasks0/6/8/9 | Measured intended worldwide coverage and real required historical baseline, or separately explicit owner-reviewed unsupported scope. Pilots do not close these gates. |
| Hosting/assistant/policies | Later release work | Existing legal/host/client gates remain; this packet deploys nothing. |

Any changed sourceURL/bytes/ETag, header/vintage mismatch, uncertainCDSsubmission, incompatible groupedlayout, deadline/budget violation, missingpartition or identity/geometry conflict stops the dependent operation. Keep isolated evidence; no alternative source, wider request, resubmission, decoder relaxation or resource increase follows automatically. Further decisions are made from actual reviewed evidence.

## Verification record

Root regenerated the30-group offline1991–1992plan, checked bothMarchIDs/1,488uniqueclocks/twochildmonths each, and compared the exact digest/completed-child exclusion. Retained source JSON checks confirmed meteor13peakcodes per year,12modelcodes,19union/sixoverlap and explicit evaluation bounds. Metadata-only primary-source research checked exact spotContent-Length/vintage notices; no body/hash claim. Local documentlinks/JSON/arithmetic checks and independentreview precedecommit. Existingruntimebehavior/tests unchanged. All six CI jobs passed at documentation revision `880778a2701ec7ce17d4cfe9d990a017ce0433a6`; exact evidence is recorded in ci-verification.md. Its documentation-only follow-up is observed separately.
