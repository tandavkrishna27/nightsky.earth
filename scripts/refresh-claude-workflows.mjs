import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const skillNames = [
  'find-observing-place',
  'plan-stargazing-night',
  'plan-sky-event',
  'plan-astrophotography',
  'prepare-outing',
];

// Only shared workflow references are refreshed. Each platform owns its own
// manifest, version, connection, and skill instructions.
for (const name of skillNames) {
  const canonicalPath = join(root, 'docs', 'product', 'workflows', `${name}.md`);
  const destination = join(root, 'plugins', 'nightsky-claude', 'skills', name, 'references', 'workflow.md');
  mkdirSync(resolve(destination, '..'), { recursive: true });
  writeFileSync(destination, readFileSync(canonicalPath));
}

console.log(`Refreshed ${skillNames.length} shared Claude workflow references; review the diff before release.`);
