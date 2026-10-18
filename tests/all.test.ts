import "./shared/contracts.test.ts";
import "./mcp/complete-optional-journeys.test.ts";
import "./places/discoveryScope.test.ts";
import "./places/catalogueFiles.test.ts";
import "./places/streamedCatalogue.test.ts";
import "./places/regions.test.ts";
import "./places/globalCatalogue.test.ts";
import "./nightsky/candidate-planning.test.ts";
import "./skills/host-capability-workflows.test.ts";
import "./mcp/transport-smoke.test.ts";
import "./mcp/initialize.test.ts";
import "./mcp/tool-metadata.test.ts";
import "./mcp/route-body.test.ts";
import "./mcp/planning-e2e.test.ts";
import "./mcp/global-discovery.test.ts";
import "./places/geonames.test.ts";
import "./places/hanleCoverage.test.ts";
import "./places/osmCandidates.test.ts";
import "./places/importOsm.test.ts";
import "./places/context.test.ts";
import "./places/osmMcp.test.ts";
import "./places/osmIndex.test.ts";
import "./nightsky/time.test.ts";
import "./nightsky/astronomy.test.ts";
import "./nightsky/reference-astronomy.test.ts";
import "./nightsky/reference-horizon.test.ts";
import "./nightsky/planner.test.ts";
import "./nightsky/compare.test.ts";
import "./content/learning.test.ts";
import "./content/recommendations.test.ts";
import "./skills/workflows.test.ts";
import "./platforms/host-cases.test.ts";
import "./platforms/complete-model-harness.test.ts";
import "./events/catalog.test.ts";
import "./providers/weather/metNorway.test.ts";
import "./providers/weather/metPeriods.test.ts";
import "./providers/aurora/noaaSwpc.test.ts";
import "./providers/providerSafety.test.ts";
import "./operations/health.test.ts";
import "./operations/load-smoke.test.ts";

import "./mcp/provider-controls.test.ts";
import "./mcp/live-planning-contract.test.ts";
import "./providers/upstreamControls.test.ts";
import "./providers/providerOperational.test.ts";
import "./providers/climate/contracts.test.ts";
import "./providers/climate/aggregate.test.ts";
import "./providers/climate/chunks.test.ts";
import "./providers/climate/pilot-builder.test.ts";
import "./providers/climate/era5.test.ts";
import "./mcp/climate-e2e.test.ts";
import "./mcp/climate-installed.test.ts";
import "./operations/capacity.test.ts";
import "./mcp/metadata-privacy.test.ts";
import "./mcp/shared-index.test.ts";
import "./shared/format.test.ts";
import "./osm/overpassPilot.test.ts";
import "./places/osmRealPilot.test.ts";
import "./platforms/package.test.ts";
import "./nightsky/journey-completion.test.ts";
import "./mcp/metadata-adapter.test.ts";
import "./operations/policies.test.ts";
import "./mcp/result-budget.test.ts";
import "./operations/requestLogging.test.ts";
import "./mcp/shared-osm-index.test.ts";
import "./operations/artifact-rollback.test.ts";
import "./platforms/review-cases.test.ts";
import "./events/meteorRadiants.test.ts";
import "./nightsky/meteor-planning.test.ts";
import "./providers/climate/tiledEra5.test.ts";
import "./providers/climate/tile-builder.test.ts";
import "./mcp/climate-tiled-installed.test.ts";
import "./operations/plugin-entry.test.ts";
import "./events/localHorizon.test.ts";
import "./osm/regionalWave.test.ts";
import "./providers/climate/history-builder.test.ts";
import "./events/meteorPeaks.test.ts";
import "./mcp/regional-data-journey.test.ts";
import "./providers/climate/grouped-history-builder.test.ts";
import "./mcp/offline-journeys.test.ts";
import "./mcp/offline-resilience.test.ts";
import "./mcp/resolver-only.test.ts";
import "./operations/offline-readiness.test.ts";
import "./events/planetAlignments.test.ts";
import "./places/regionalOsm.test.ts";
import "./mcp/local-proxy.test.ts";
import "./mcp/regional-provider.test.ts";
import "./operations/plugin-regional-config.test.ts";
import "./mcp/regional-installed.test.ts";
import "./events/meteorTypicalSeasons.test.ts";

import "./platforms/local-package.test.ts";
import "./skills/local-experience.test.ts";
import "./mcp/darkness-meaning.test.ts";
import "./mcp/answer-text.test.ts";
import './discovery/country-code-contract.test';
import './planning/optional-event-evidence.test';
import './mcp/climate-release-configuration.test';
import './places/sourceCatalogue.test';
import './providers/climate/release-publication.test';
import './operations/operator-preflight.test';
import './places/boundaryMetadata.test';
import './providers/climate/observation-aggregates.test';
import './places/geographicCoverage.test';
import './providers/climate/production-history-plan.test';
import './providers/climate/retained-history-measurement.test';
import './operations/retained-source-adapters.test';
import './providers/climate/global-history-plan.test';
import './providers/climate/lineage-radix.test';
import './providers/climate/lineage-publication.test';
import './places/sourceAdmission.test';
import './places/naturalEarth.test';

import './places/geographicSweep.test';
import './mcp/unknown-region-assembled.test';

import './places/membershipAssembly.test';

import './era5/reconcile-retained-history.test';
import './places/geographyCapacityPlan.test';

import './places/planetSourceAdmission.test';
import './era5/replan-history-ownership.test';

import './places/planetPolicyPreparation.test';
import './places/planetReceiptContract.test';

import './places/providerSourceAdmission.test';
import './places/productionSourceAdmission.test';

import "./places/retainedNaturalEarthAdmission.test";

import "./places/reviewedNaturalEarthAuthority.test";

import './places/partitionedCandidates.test';

import './places/partitionedLargeContract.test';

import './places/partitionedResources.test';

import './places/api-selection.test';

import './places/api-discovery.test';

import './mcp/api-discovery-planning.test';

import './operations/api-runtime-measurement.test';

import "./providers/weather-collection-contract.test.ts";

import "./providers/quota-state.test.ts";

import "./providers/weather-api.test.ts";

import "./providers/openweather.test.ts";

import "./providers/weather-collection.test.ts";

import "./mcp/multi-weather-planning.test.ts";

import "./providers/weather-configuration.test.ts";

import "./skills/multi-weather-workflows.test.ts";
import "./operations/api-live-validation.test.ts";

import "./providers/climate/open-meteo-history-contract.test.ts";

import "./events/meteorCoverage.test.ts";

import "./places/api-region-membership.test.ts";

import "./events/conjunctionWindow.test.ts";

import "./places/api-geometry-snapshot.test.ts";
import "./providers/climate/open-meteo-history-pilot.test.ts";
import "./places/api-geometry-acquisition.test.ts";
import "./providers/climate/open-meteo-history-serving.test.ts";
import "./mcp/hosted-history-planning.test.ts";
import "./operations/geometry-live-validation.test.ts";
import "./operations/api-load-measurement.test.ts";
import "./platforms/api-model-harness.test.ts";
import "./operations/api-review-cases.test.ts";
import './places/api-geonames-point-contract.test';
import './places/api-region-contract.test';
import './places/api-geography-flows.test';
import './mcp/api-geography-journeys.test';
import "./providers/climate/api-history-plan.test";
import "./providers/climate/api-history-store.test";
import "./providers/climate/api-history-jobs.test";
import "./providers/climate/api-history-provider.test";
import "./operations/api-history-runtime.test";
import "./providers/climate/annual-history-probe.test";

import "./providers/quota-add-provider.test";
import "./providers/climate/history-accounting-operator.test";
import "./platforms/codex-local-fixture.test";
import "./operations/geometry-filter-probe.test";
import "./platforms/outdoor-contract-package.test";
import "./skills/conversation-acceptance.test";
import "./operations/hyderabad-owner-validation.test";
import './providers/sevenTimer.test';
import './providers/sky/sky.test';
import './providers/space/space.test';
import './mcp/optional-sky-tools.test';
import './skills/optional-sky-workflows.test';
import './nightsky/sevenTimer-planner.test';
import './providers/source-cache.test';
import './operations/sky-quota-setup.test';
import './operations/sky-live-probe.test';
import './providers/sevenTimer-migration.test';
import './operations/sky-continuation-probe.test';
import './operations/native-bounded-session.test';
import './operations/jpl-error-probe.test';
import './providers/light-pollution-contract.test';
import './providers/darkskysites.test';
import './providers/light-pollution-browser.test';
import './providers/darkskysites-browser.test';
import './mcp/light-pollution-journeys.test';
import './skills/light-pollution-workflows.test';
import './operations/light-pollution-validation.test';

import './skills/host-aware-outing.test';
import './providers/public-universe-configuration.test.ts';
import './providers/public-universe-contracts.test.ts';
import './providers/public-universe-date-query.test.ts';
import './providers/public-universe-deadlines.test.ts';
import './providers/public-universe-provider.test.ts';
import './providers/public-universe-store.test.ts';
import './providers/public-universe-transport.test.ts';
import './mcp/public-universe-tools.test';
import './skills/public-universe-workflows.test';
import './providers/public-universe-meteor-evidence.test';
import './providers/public-universe-starter-evidence.test';

import './mcp/native-admission.test';

import './mcp/forecast-answer-text.test';
