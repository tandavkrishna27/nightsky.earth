# Native discovery correction — 18 October 2026

## Observed acceptance

The owner supplied 1.0.26 discovery/photography conversation at 14:35–14:37 IST. NightSky tools were called. Three candidates were returned: Mosra20.70 SQM/Bortle5, reserve representative point20.47/Bortle5, Mrugavani18.78/Bortle8, with unknown coverage and no origin baseline. The reply acknowledged the bright park did not qualify but still failed the requested three darker candidates. Follow-up called Mosra darkest, stopped route investigation at missing candidate metadata, and later asked for the removed driving limit. May new moon was proposed without core/darkness evidence. Values and uncertainties were mostly retained, so discovery and photography are partial, not unconnected or fully failed. Geminids was not exercised.

The previous forecast timestamp/direction follow-up pass remains valid for that demonstrated flow. Its acceptance is not expanded to discovery by this correction.

## Reviewed fix

[Plan and preimplementation review](../superpowers/plans/2026-10-18-discovery-evidence-correction.md). Internal package1.0.27 updates all five skills and canonical workflows; no backend, API contracts, provider activation, caches or quota changes.

Require a comparable origin baseline when possible before claiming darker than origin; otherwise report values and qualified leads with incomplete count. Do not pad with rejected candidates. Declare initial bounded search extent without silently imposing a state constraint. Treat representative points as area leads; investigate exact point and route evidence through available host tools under their permissions. Keep road presence, vehicle reachability and legal/night access distinct. Unknown coverage permits a qualified numeric comparison but no reliable darkest-site conclusion. Retain travel corrections. A local best Milky Way date needs supported core/darkness/Moon evidence; new moon alone is provisional. Core geometry is a fixed direction proxy, not a whole-band or photographic visibility model.

## Verification and remaining gate

Observed owner conversation is the behavior-failure baseline. New authored all-workflow regression failed before guidance and passed after it. All76 workflow tests and all three type projects passed. Independent read-only review found no material issues. Controlled offline replay retained the missing baseline/incomplete count, numeric-only SQM comparison, reserve area identity, route evidence gap, removed travel limit and provisional Milky Way date. Both host packages passed verification; version1.0.27 installed under the same identity, all15 installed files verified. Static tests and controlled replay do not establish native-host compliance. Exact-commit CI is checked after push. Targeted native discovery and Milky Way retest remains pending under a valid bounded allowance. No new provider requests, history downloads, scraping or deployment in this correction.
