# API-mode local rehearsal

The local test paths can now use API-shaped fixture responses through the real selection, discovery and planning services. They need no local city or spots catalogue, provider accounts or external provider requests.

## Scripted checks

```sh
node --import tsx --test tests/platforms/api-model-harness.test.ts tests/operations/api-review-cases.test.ts
node --import tsx scripts/verify-review-cases.ts --offline --api-fixture --out dist/api-review-rehearsal
```

The model harness keeps its twenty journey prompts and offers an explicit `--api-fixture` option. Normal fixture destinations have source-provided timezones; separate fixtures cover unknown timezone, ambiguous results, stale revisions, timed expiry, unavailable providers and conflicting records. A resumed report cannot mix API and catalogue modes. Its advancing synthetic clock deliberately excludes real provider pacing and model waiting time from cache-age observations.

The eight manifest review cases now have both API and legacy fixture paths. API calls carry the selected source revision into planning, conditions, event and comparison tools. The scripted cases preserve source gaps, unavailable history, empty candidate coverage, aurora uncertainty and solar safety. Reports explicitly distinguish manually scripted server assertions from assistant behavior.

## Native model acceptance remains separate

The harness still requires explicit `--run` for model execution and enforces its existing call/output/time caps. Generating a package, passing scripted tests or completing CLI transport does not prove skill discovery, complete reference loading or answer quality. Review whole answers and returned evidence before marking a model case passed. Preserve any existing host-policy rejection rather than retrying it through a workaround. Claude retesting remains owner-deferred.

This document records preparation, not a new native model run, installed plugin, live API acceptance or release approval. Existing package commands create local rehearsal artifacts only; final hosted identity/URLs and actual-client checks remain in the completion tracker.
