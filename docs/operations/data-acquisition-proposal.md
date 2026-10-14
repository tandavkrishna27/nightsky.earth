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
| Spots | Monaco, Faroe Islands, Fiji; exact261013URLs in [spot proposal](global-spot-acquisition-proposal.md) | At most3HEAD+3GET, one worker/request path at a time; no retries/redirects/substitution | 25,677,683bytes total declared bodies | Nine stages×60s maximum activework plus boundedcleanup;256MiB workerRSS+jobcommit;100MiB combined newly created raw/scratch/kept files, sampled stopping. Proposed15-minute operator batch deadline includes acquisition/build/cleanup; inspection can prevent starting further stages. | Generic manifest/acquisition/admission and supervised build path implemented and tested offline; no live capability or retrieval allowance. Source header/hash unknown until future approved retrieval. |
| ERA5 | March1991+1992, Hanle and Kodaikanal/Munnar footprints; [two exact grouped jobs](historical-acquisition-proposal.md) | At most2new durable submissions, one active; bounded metadata polling and one admitted raw parent per job. No automatic retries/resubmission/splitting. | At most32MiB each/64MiB selected raw total | 30minutes overall including queue/transfer/import/inspection;1GiB root scratch;256MiB cooperative importRSS gate;four child partitions≤4MiB each and two indexes≤4MiB each. | Existing offline path validated; actual currentCDS cost acceptance/groupedNetCDF shape remains unverified. Two-job and overall gates need operator supervision. |

Spots' maximum kept non-raw allocation is63MiB across three sources; raw plus kept ceilings total91,737,971bytes, leaving13,119,629bytes staging/headroom inside100MiB. These are proposed allocation stops, not predictions or hard diskquota. Count failed evidence and all reports; do not delete evidence to make the next stage fit. Pre-existing tools/artifacts need separate disk headroom. The15-minute outer cap originated as a live-pilot operator proposal. It is now implemented as the offline runner’s cooperative deadline; live execution/capability approval remains held. Never enlarge it or stage limits automatically.

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

## Offline prerequisite implementation update

[Offline runner wave](offline-spot-runner-wave.md) implements the reviewed generic path and synthetic safety evidence. Sequence2 above is complete for offline code; trustedlive capability review, explicit retrievalallowance, fresh metadata and actualsource admission remain ahead. The proposal grants no automatic execution and current source/budget pins remain unchanged.

## Owner discussion: what the remaining data work actually means — 14 October 2026

Current implementation status is 12 Done / 9 Partial / 6 Not started after the darkness correction. This section explains existing proposals; it adds no acquisition allowance, changes no product scope and closes no source ticket. Generic spot acquisition/build supervision and grouped ERA5 planning/import are already implemented and tested offline. The older implementation prerequisite above is complete, not another development wave.

| Layer | User question it supports | How it works | Current gap | Next evidence needed |
|---|---|---|---|---|
| Calculated astronomy | When is it dark? Where are the Moon and supported targets? | Calculate from place/time using the pinned library; no downloaded worldwide night-by-night table. | Supported target/catalog boundaries remain explicit. | Preserve current reference evidence; no bulk data acquisition needed for the darkness correction. |
| Forecast weather / aurora | Is this coming night worth considering? | Request supported providers on demand and cache with bounded freshness; return source-specific values and gaps. | Forecast limits, unavailable values and provider coverage cannot become certainty. | Existing adapters are locally accepted; hosted operation is a separate gate. No weather-history download is needed for a near-term forecast. |
| Meteor calendars and activity | Which showers are active during my trip? | Retained, attributed catalogs plus bounded radiant models. | Peaks are not seasons; current year-specific peaks cover 2025/2026. Missing seasons/years/models cannot be filled by repeating dates or stretching fits. | Accept reusable, scientifically appropriate season/year/model evidence before expanding runtime records. These small tables need correctness more than storage. |
| Candidate places | Where might I observe nearby? | Build compact regional candidate files from public geographic extracts; serve selected partitions with bounded cache. | Current regional artifacts do not establish worldwide observing-place coverage or night access. | Existing three-region pilot tests dense/sparse/coastal/dateline processing. Review actual candidates and budgets before choosing global scale. |
| Historical cloud context | Which month is usually clearer? | Process ERA5 offline into location/grid statistics, labeled historical; serve prepared files. | Existing three-place 2025 tiles and incomplete older samples are not a 30-year/global baseline. | Two March grouped jobs test real format and processing cost; they do not complete the climatology ticket. Then choose a sustainable geographic/resolution/year strategy using measurements. |

### No database and no worldwide raw archive on the MCP server

The current architecture has no runtime relational database. Astronomy is calculated, live provider results use bounded caches, and prepared candidate/history artifacts are files with manifests and checksums. The model runs in its provider/client; the Hetzner service executes tools and returns structured evidence.

Separate raw source inputs, temporary processing space and served artifacts. A compressed download's size is neither its peak memory use nor its final served size. ERA5 acquisition records preserve raw parents/checkpoint evidence locally; there is no requirement to copy the complete acquisition directory to production. Production selects validated served artifacts and records their provenance. Decide retention and backups explicitly before deployment.

### The two existing small pilots, in familiar units

- Spots: three proposed extracts total about 24.5 MiB of declared raw input, within a 100 MiB combined pilot file envelope; proposed worker memory gate 256 MiB. These are ceilings/admission checks, not guaranteed actual usage or a global estimate. Fresh headers/vintages must still match the pinned proposal.
- History: two requests, one at a time, March 1991 and 1992 for Hanle and Kodaikanal/Munnar footprints. Combined raw ceiling 64 MiB, temporary root ceiling 1 GiB, import memory gate 256 MiB and 30-minute batch deadline. These are ceilings, not predicted transfer times; provider queues can prevent completion.
- Neither requires a paid data purchase in the existing proposal. Disk, hosting, maintenance and model usage are separate costs; a free user product does not make those costs zero.
- A 2-vCPU/4-GiB server remains a proposed size rather than a selected, measured hosting configuration. Process heavy acquisition/build work locally and serve compact artifacts; measure the final workload before promising its capacity.

### Recommended sequence and parallel work

1. Resolve meteor source definitions and reuse evidence while spot/history selections are discussed. Do not import unsupported dates or create a rate/visibility guarantee.
2. After the owner lifts the existing download hold for the exact spot proposal, run Monaco and inspect it before Faroe Islands and Fiji. No source substitutions, retries or larger budgets follow automatically.
3. Separately, after approval of the exact two-job history proposal, run Hanle first and inspect it before Kodaikanal/Munnar. Retain job identities; uncertain submissions stop resubmission. Spot permission is not history permission.
4. Compare measured usefulness, retained sizes and peak processing memory. Decide global serving strategy without reducing the already requested global scope by implication. Global candidate/history production is a further decision, not authorized by small pilots.
5. Integrate accepted artifacts and their truthful coverage into existing tools; update only affected original ticket criteria. Run the broad audit at the end, followed by the complete installed-plugin/model matrix as directed.

Meteor source work, spot processing and history processing have independent outputs, so their preparation can run in parallel. Within each approved acquisition pilot, requests/stages run sequentially. Start with one acquisition batch at a time on the local machine until combined memory/disk limits are measured.

### What remains to decide with the owner

The immediate decision is whether to lift the explicit acquisition hold for the existing small spot pilot, the separate two-job historical pilot, or neither. Nothing in this discussion activates either. Worldwide history coverage, long-term raw retention, exact hosting and publication remain later decisions informed by measurements. Complete local plugin testing is technically possible with current limited artifacts and explicit gaps; it would not certify global data coverage.

## Execution update — 15 October 2026

Owner approved the existing small measurement pilots. [Execution evidence](data-pilot-wave.md) records two completed ERA5 jobs and the Monaco build-time stop, after which the geographic pilot halted before Faroe/Fiji. This is the executed bounded allowance, not authorization for a global build or retries. Existing earlier proposal-only/no-approval statements are historical; new acquisition remains held beyond the consumed pilot. Cleanup was blocked by automatic approval review; files retained.
