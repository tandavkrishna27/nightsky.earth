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

test('all workflows preserve staged useful evidence and exact reference search', () => {
    const descriptions = readFileSync('server/mcp/publicUniverseTools.ts', 'utf8');
    assert.ok(descriptions.includes('For complete session planning, optional enrichment follows useful main-planner astronomy/weather evidence.'));
    assert.ok(descriptions.includes('For a focused catalogue shortlist, call directly once place and session time are known; forecasts are not a prerequisite.'));
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
