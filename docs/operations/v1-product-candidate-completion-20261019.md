# Local product candidate completion — 19 October 2026

## Disposition

The six-item local engineering pass is implemented, independently reviewed and regression-tested. **Assembled product acceptance is still partial**, not a public-launch pass. Tasks12B/15 remain open; current work-location categories remain15local accepted/2local acceptance remaining/8release dependent/2separate-deferred. No ticket was silently closed or new feature requirement added.

Plan: [product candidate completion](../superpowers/plans/2026-10-19-product-candidate-completion.md). This builds on code baseline `7784d36ef4b9ca7cc3003f30545458b96202f990`; the accompanying candidate manifest records runtime/package/file digests. The existing installed plugin remains unchanged.

| Requested item | Work completed | Remaining acceptance boundary |
| --- | --- | --- |
| Credit presentation | Fixed browser limits that rejected valid producer cards below32KiB. Complete source/attribution/licence records and safe text fallback remain. | Actual host card visibility/links unverified. Final model prose still abbreviates credits. Default startup keeps the card off; it is explicitly enabled only in the rehearsal. |
| Repeated lookups | Reviewed exact identity/reuse guidance; current conversations resolve once and reuse across all follow-ups. No unsupported cache/cooldown added to suppress legitimate refreshes. | One identical astronomy call repeats in the Milky Way initial turn. This is not a guarantee of model efficiency; generated workflow loading was blocked in this harness. |
| Evidence-bound summaries | Fixed summaries and preparation advice using out-of-session weather. Numeric fields follow instant membership or positive native-period overlap; native periods remain unscaled and raw evidence remains intact. | Model interpretation remains separately assessed; no source cadences are interpolated. |
| Exact assembly | Rebuilt Codex/Claude rehearsal packages and standalone runtime. Added two missing reviewed event assets to Docker's explicit COPY allowlist; static regressions and built-process startup pass. | Actual pinned-image construction/start not tested: Docker works but its pinned base is not cached, and no image download was performed. Rehearsal endpoints are loopback, not public production configuration. |
| Conversation acceptance | Three conversations, six turns completed; real astronomy, synthetic location/weather, zero provider attempts. Full returned evidence/answers retained and independently reviewed. | Child CLI execution policy rejected workflow file reads. These are tool-grounding/reuse observations, not complete skill-loaded/native UI acceptance. Milky Way maximum interpretation and prose-credit failures remain recorded below. |
| Final review/freeze | Independent lane reviews, scoped correction review and final audit found no remaining material defect in this code diff. Full offline suite, types, package builds and final runtime probes pass. | Final release approval remains conditional on the explicit model/native/source/host gates; freezing evidence does not certify them. |

## Reproduced defects and review

1. Planner factors summarized every returned sample, including out-of-session instants. RED regressions reproduced this. The fix filters each numeric field, retaining genuinely overlapping native periods and the original evidence. Positive period overlap excludes periods merely touching a boundary; in-window instantaneous endpoint samples remain valid.
2. Independent review caught the same leak in cloud-related packing/trip warnings. A second RED regression reproduced it. Both preparation derivations and sparse-cloud gap wording now use the scoped evidence; a positive control preserves warnings for in-session cloud. Scoped re-review passed.
3. Browser per-field caps rejected evidence accepted by the producer's32KiB total bound. The regression reproduced a24.3KiB detail/2.4KiB fact payload. Removed smaller field caps; total UTF8 bound, count limits, safe URLs, text-only DOM insertion and parent handshake remain.
4. Docker's explicit event list omitted the unconditional startup inventory and reviewed2027 peaks. Static regression failed on the exact omissions, then passed with only those two files added. Private/operator and unreviewed recurring-event exclusions remain.
5. The model batch exposed a deterministic presentation omission: the correct interval maximum was returned in structured evidence but omitted by `orientationAnswerText`. A RED regression reproduced that text gap. The formatter now supplies the returned sampled maximum, its exact local/UTC time and a separately qualified bearing only at that instant. Missing time/basis stays unknown; no continuous optimum is invented. All27answer-text checks pass and independent scoped review is clean. This post-batch correction was not model-retested, so it does not erase the observed answer failure.

No new provider, permission, analytics, database, bulk geography/history requirement or normal-startup UI activation was introduced.

## Verification

- Full offline suite: **1,875passed,0failed,2skipped;1,877total**,303.12seconds. This includes the existing fifteen deterministic product journeys; it is not fifteen fresh native conversations.
- Planner/7Timer focused checks:39passed; card/resolver/credit/answer checks:41passed; runtime event/package/static checks:23passed. Overlapping counts are not added to the full suite.
- `npm run check`, rebuilt Codex/Claude rehearsal packages and `npm run build:plugin` passed.
- Final compiled runtime probe passed full14-tool and resolver-only1-tool modes: health, MCP/body bounds and absent website/news routes, no provider calls.
- Actual image execution remains unverified without its uncached pinned base. Static recipe checks and native Node startup are distinct evidence.

Local ignored evidence directory: `.superpowers/sdd/2026-10-18-publicuniverse-v1/`. Final logs: `product-candidate-final-full.log`, `product-candidate-final-types.log`, `product-candidate-final-build.log`, `product-candidate-final-runtime.log`; `product-candidate-final-verification-exit.json` confirms exit0. Earlier `product-candidate-*` logs are the pre-formatter checkpoint; package reports under `dist/product-candidate-20261019/`.

## Finite model batch and limitations

The first setup attempt stopped before any tool/provider call because the user's CLI default model was unsupported by the signed-in account. Its evidence remains under `product-candidate-20261019/`; it is not a product test pass. One corrected bounded batch used the previously exercised `gpt-5.6-sol` and isolated settings; no user configuration was changed.

Corrected batch evidence: `product-candidate-verified-20261019/`, including generated package, six answers, complete event logs and `report.json`. All six turns exited0 without hitting the deadline/output caps:14MCPcalls,32loopbackHTTPrequests,0provider attempts. Limits were three conversations/two turns each,6calls and120seconds per turn,36calls/90HTTPrequests total, no provider retries or web. The listener closed after this batch; the same batch was not repeated.

- **General session:** preserves synthetic cloud90%@20:30,25%@21:30,80%@22:30, missing23:30 and sparse-sample uncertainty. Follow-up Moon21.4°/234.3° and Saturn66.8°/131.1° at22:00IST match the returned evidence. No repeated location or follow-up calls.
- **Geminids:** distinguishes the calculated19:00–05:20 darkness interval from a manageable session and calendar evidence from a locally observable dated maximum. Moon boundary/phase, broad-sky technique, no telescope, packing and unavailable weather/access are explicit. No repeat location or follow-up calls. A lack of a returned maximum in the chosen interval does not establish no maximum elsewhere.
- **Milky Way:** preserves requested21:50 and23:30 geometry, geometric rise versus requested05:00 cutoff and usable app/camera preparation. However, its prose selects35.9°/04:59 as the highest returned sample despite a returned43.5834° maximum-altitude sample at03:10IST. It also repeats an identical astronomy-window call. These are model-answer failures, not corrected calculations or a provider incident.
- The post-batch formatter correction above makes that returned interval maximum explicit in readable tool text as well as structured data. The original model result remains failed on that point until a focused, properly skill-loaded retest; no repeat model batch was run.
- **Credits:** prose abbreviates or omits supplied attribution/licence links. Tool/card credits remain complete. A hidden payload or CLI tool transcript does not prove adjacent native-host display.

The child policy blocked reading the generated skills, so neither the practical successes nor the failures establish that the complete packaged workflows loaded. Do not call this a fresh all-client or complete plugin acceptance pass. Existing deterministic workflow tests and earlier skill-loaded receipts remain separate evidence.

After the independently reviewed maximum-text correction, the plan permitted one targeted two-turn confirmation with exact generated workflow bytes supplied through `model_instructions_file`, avoiding shell reads. This separate prompt-fed attempt stopped at the first turn with **“Selected model is at capacity”**, before any MCP/provider call; no second turn or retry ran. Evidence: `product-candidate-workflow-confirmation-20261019/`. Its listener closed. This setup failure is neither a product pass nor a demonstrated new product failure. A successful skill-guided confirmation still remains; no further model loop was run.

## Next boundary

Remaining product acceptance is a properly skill-loaded intended-host rehearsal, including actual card/text credit presentation and a focused Milky Way maximum/reuse check. Do not add more astronomical data or infrastructure merely to conceal these response-level findings. Claude remains separately deferred; Gemini acceptance is conditional. Public source/account/logo/method-offer, publisher/policy/HTTPS and operational gates remain in the later release plan.

Hetzner remains preferred. CI/CD implementation, website release work, hosting purchase/provisioning, credential migration, new data/provider calls and deployment were not performed in this pass. Existing CI may verify committed code; no deployment workflow is added.
