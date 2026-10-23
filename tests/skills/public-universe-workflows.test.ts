import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
for (const name of readdirSync('plugins/nightsky/skills'))
    test(`${name}: optional Public Universe guidance preserves default and evidence boundaries`, () => {
        for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
            const text = readFileSync(path, 'utf8');
            for (const token of ['## Optional Public Universe', 'search_reference_objects', 'get_reference_details', 'discover_observing_targets', 'get_catalogue_target_windows', 'Astronomy Engine remains the default', 'annual peak', 'exoplanet', 'host-native', 'arbitrary'])
                assert.ok(text.includes(token), `${path}: ${token}`);
        }
    });
test('authored Public Universe conversation cases retain five workflow routes and evidence boundaries without native acceptance claims', () => {
    const cases = JSON.parse(readFileSync('tests/fixtures/public-universe/workflow-conversations.json', 'utf8'));
    assert.deepEqual(cases.map((row: any) => row.workflow).sort(), readdirSync('plugins/nightsky/skills').sort());
    const covered = new Set<string>();
    for (const row of cases) {
        assert.equal(row.evidenceKind, 'authored-synthetic');
        assert.equal(row.executionStatus, 'not-run');
        assert.ok(row.turns.length >= 2);
        for (const turn of row.turns) {
            assert.ok(turn.user.length > 10);
            assert.ok(turn.expected.length > 0);
            assert.ok(turn.forbidden.length > 0);
            for (const boundary of turn.boundaries)
                covered.add(boundary);
        }
        for (const path of [`plugins/nightsky/skills/${row.workflow}/SKILL.md`, `docs/product/workflows/${row.workflow}.md`]) {
            const text = readFileSync(path, 'utf8');
            for (const evidence of row.documentEvidence)
                assert.ok(text.includes(evidence), `${path}: ${evidence}`);
        }
    }
    for (const boundary of ['annual-meteor-separation', 'exoplanet-learning', 'unsupported-local-target', 'source-disagreement', 'weather-event-preservation', 'host-capability-preservation'])
        assert.ok(covered.has(boundary), boundary);
});

// These are authored guidance checks, not live service or native-host acceptance.
test('catalogue guidance recipes validate against the actual strict tool schemas', async () => {
    const { discoverObservingTargetsInputSchema, getCatalogueTargetWindowsInputSchema } = await import('../../shared/nightsky/reference');
    const { calculationPlaceInputSchema } = await import('../../shared/nightsky/discovery');
    const toolSchema = calculationPlaceInputSchema.safeExtend(discoverObservingTargetsInputSchema.omit({ placeId: true, sourceRevision: true, catalogueRevision: true }).shape);
    for (const name of readdirSync('plugins/nightsky/skills')) {
        for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
            const text = readFileSync(path, 'utf8');
            const match = text.match(/<!-- catalogue-discovery-recipe -->\s*```json\s*([\s\S]*?)```/);
            assert.ok(match, `${path}: executable catalogue recipe`);
            const recipe = JSON.parse(match[1]);
            assert.ok(toolSchema.safeParse(recipe).success, `${path}: valid public tool recipe`);
            assert.ok([2, 3].includes(recipe.shortlistLimit));
            const { equipment, preference, shortlistLimit, ...session } = recipe;
            const targetRecipe = { ...session, targets: [{ referenceId: 'authored-example-only', revision: 'a'.repeat(64) }] };
            const windowsSchema = calculationPlaceInputSchema.safeExtend(getCatalogueTargetWindowsInputSchema.omit({ placeId: true, sourceRevision: true, catalogueRevision: true }).shape);
            assert.ok(windowsSchema.safeParse(targetRecipe).success);
            assert.equal(windowsSchema.safeParse({ ...targetRecipe, window: { ...recipe.window, timeZone: recipe.displayTimeZone } }).success, false);
            assert.equal(windowsSchema.safeParse({ ...targetRecipe, targets: [] }).success, false);
            assert.equal(windowsSchema.safeParse({ ...targetRecipe, targets: Array.from({ length: 7 }, (_, i) => ({ referenceId: `authored-${i}`, revision: 'a'.repeat(64) })) }).success, false);
            for (const shortlistLimit of [0, 7, 10])
                assert.equal(toolSchema.safeParse({ ...recipe, shortlistLimit }).success, false);
            assert.equal(toolSchema.safeParse({ ...recipe, window: { ...recipe.window, timeZone: recipe.displayTimeZone } }).success, false);
        }
    }
});

test('all workflows preserve staged useful evidence and bounded catalogue lookup', () => {
    const descriptions = readFileSync('server/mcp/publicUniverseTools.ts', 'utf8');
    assert.ok(descriptions.includes('Optional catalogue shortlist for a selected place and session time, independent of a weather forecast.'));
    assert.ok(descriptions.includes('Requires one resolved place snapshot, explicit shortlistLimit 1..6'));
    for (const name of readdirSync('plugins/nightsky/skills'))
        for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
            const text = readFileSync(path, 'utf8');
            for (const token of ['one exact object name or catalogue ID per query', 'lexical lookup', 'core astronomy and weather', 'tonight-only', 'native-client timeout', 'one or two relevant questions', 'window contains only startUtc and endUtc'])
                assert.ok(text.includes(token), `${path}: ${token}`);
        }
});


test('all workflows pin timestamp identity and reuse matching positions on follow-up',()=>{
 for(const name of readdirSync('plugins/nightsky/skills'))for(const path of [`plugins/nightsky/skills/${name}/SKILL.md`,`docs/product/workflows/${name}.md`]){
  const text=readFileSync(path,'utf8');
  assert.ok(text.indexOf('## Timestamp-bound evidence')<8000,`${path}: early evidence rules`);
  for(const phrase of ['server-formatted local time and original UTC timestamp','never move a value to another row','endUtc must be after startUtc','matching place, date and requested instant','get_night_conditions for focused forecast samples'])assert.ok(text.includes(phrase),`${path}: ${phrase}`);
 }
});


test('all workflows retain prior forecast evidence after failed refresh without inventing cache or windows', () => {
 for (const name of readdirSync('plugins/nightsky/skills')) for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
  const text = readFileSync(path, 'utf8');
  for (const phrase of ['conversation evidence, not a server cache', 'original retrieval time when known', 'refresh failed or was allowance-blocked', 'both equally close neighbouring samples', 'A sample is not a window', 'Never request again solely to rebuild a table', 'A later retrieval does not establish a newer forecast edition']) assert.ok(text.includes(phrase), `${path}: ${phrase}`);
 }
});


test('all workflows require discovery comparison evidence and retain practical preferences', () => {
 for(const name of readdirSync('plugins/nightsky/skills')) for(const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
  const text=readFileSync(path,'utf8');
  for(const phrase of ['## Discovery evidence before recommendations', 'origin baseline', 'Do not pad the requested count', 'highest returned SQM estimate', 'unknown coverage cannot establish a reliable darkest site', 'representative point is not a setup pin', 'do not silently restrict to a state', 'investigate available host search/maps', 'Do not ask again for a removed travel limit', 'new moon is a provisional date lead', 'core-proxy visibility during astronomical darkness']) assert.ok(text.includes(phrase), `${path}: ${phrase}`);
  assert.ok(text.indexOf('## Discovery evidence before recommendations')<10000, `${path}: guidance visible early`);
 }
});


test('all workflows separate event peaks, geometry, practical sessions and forecast support',()=>{
 for(const name of readdirSync('plugins/nightsky/skills'))for(const path of [`plugins/nightsky/skills/${name}/SKILL.md`,`docs/product/workflows/${name}.md`]){
  const text=readFileSync(path,'utf8');
  for(const phrase of ['published peak is not the local viewing window','calendar-only guidance cannot supply an exact peak','peak occurs in local daylight','practical suggested session','geometric rise is not a useful photographic start','requested-window is a calculation cutoff, not rise or set','do not turn all-night darkness into an all-night beginner itinerary'])assert.ok(text.includes(phrase),`${path}: ${phrase}`);
 }
});

test('all workflows route resolved cities separately from candidate details with valid recipes', async () => {
 const { getObservingLocationDetailsInputSchema: schema } = await import('../../shared/nightsky/discovery');
 for (const name of readdirSync('plugins/nightsky/skills')) for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
  const text = readFileSync(path, 'utf8');
  for (const phrase of ['A resolved named-city plan needs no candidate-details prerequisite', 'reuse its returned place identity, revision and timezone', 'If the user asks for observing-site details', 'placeId alone is invalid', 'do not retry the same invalid arguments']) assert.ok(text.includes(phrase), `${path}: ${phrase}`);
  assert.ok(text.indexOf('A resolved named-city plan') < text.indexOf('Before a candidate-site plan'), `${path}: route before candidate gate`);
  const match = text.match(/<!-- location-details-recipes -->\s*```json\s*([\s\S]*?)```/);
  assert.ok(match, `${path}: details recipes`);
  const recipes = JSON.parse(match[1]);
  assert.equal(recipes.length, 3);
  for (const recipe of recipes) assert.ok(schema.safeParse(recipe).success, `${path}: schema-valid details recipe`);
  assert.equal(schema.safeParse({ placeId: 'place:v1:geonames:990001' }).success, false);
  assert.equal(schema.safeParse({ ...recipes[0], sourceRevision: 'a'.repeat(64) }).success, false);
 }
});

test('all workflows label clipped darkness boundaries without inventing dusk or dawn', () => {
 for (const name of readdirSync('plugins/nightsky/skills')) for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
  const text = readFileSync(path, 'utf8');
  for (const phrase of ['Darkness intervals are clipped to the requested calculation window', '21:00 is the requested start cutoff, not established astronomical dusk', 'full-window means darkness throughout the requested window', 'true dusk or dawn remains unknown', 'within your requested 21:00–05:00 window']) assert.ok(text.includes(phrase), `${path}: ${phrase}`);
  assert.ok(text.indexOf('Darkness intervals are clipped') < 8000, `${path}: early darkness boundary rule`);
 }
});

test('details guidance distinguishes API runtime requirements from the shared schema', () => {
 const runtime = readFileSync('server/mcp/registerTools.ts', 'utf8');
 const handler = runtime.slice(runtime.indexOf('server.registerTool("get_observing_location_details"'), runtime.indexOf('server.registerTool("get_location_context"'));
 assert.ok(handler.includes('if(!input.placeId||!input.sourceRevision)'));
 assert.ok(handler.includes('dependencies.discoveryProvider.details({placeId:input.placeId,sourceRevision:input.sourceRevision})'));
 assert.ok(handler.includes('dependencies.catalogue.findNames({placeQuery:input.placeQuery,countryCode:input.countryCode})'));
 for (const name of readdirSync('plugins/nightsky/skills')) for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
  const text = readFileSync(path, 'utf8');
  for (const phrase of ['In API mode, details require the retained placeId and sourceRevision', 'Named-query details are catalogue/legacy mode only', 'schema-valid does not mean supported in every runtime mode']) assert.ok(text.includes(phrase), `${path}: ${phrase}`);
  assert.ok(text.indexOf('In API mode, details require') < text.indexOf('Before a candidate-site plan'), `${path}: mode distinction precedes candidate gate`);
 }
});

test('all workflows reuse successful matching results before requesting distinct missing evidence', () => {
 for (const name of readdirSync('plugins/nightsky/skills')) for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
  const text = readFileSync(path, 'utf8');
  for (const phrase of ['## Successful-result reuse', 'same place identity/revision, timezone, window, activity and target', 'An absent optional field is not a reason to repeat an identical aggregate request', 'name the distinct missing evidence', 'explicit user refresh', 'expired or rejected selection', 'not a server cache or invented cooldown', 'A useful partial result remains useful']) assert.ok(text.includes(phrase), `${path}: ${phrase}`);
 }
});
