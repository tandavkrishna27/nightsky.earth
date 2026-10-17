import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
for (const name of readdirSync('plugins/nightsky/skills'))
    test(`${name}: optional Public Universe guidance preserves default and evidence boundaries`, () => { for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
        const text = readFileSync(path, 'utf8');
        for (const token of ['## Optional Public Universe', 'search_reference_objects', 'get_reference_details', 'discover_observing_targets', 'get_catalogue_target_windows', 'Astronomy Engine remains the default', 'annual peak', 'exoplanet', 'host-native', 'arbitrary'])
            assert.ok(text.includes(token), `${path}: ${token}`);
    } });
