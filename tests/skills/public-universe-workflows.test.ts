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
