import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = join(root, 'plugins', 'nightsky');
const destination = join(root, 'plugins', 'nightsky-claude');
const sourceManifest = JSON.parse(readFileSync(join(source, 'plugin.json'), 'utf8'));
const skillNames = [
  'find-observing-place',
  'plan-stargazing-night',
  'plan-sky-event',
  'plan-astrophotography',
  'prepare-outing',
];

function write(relativePath, content) {
  const path = join(destination, relativePath);
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, content);
}

write('.claude-plugin/plugin.json', JSON.stringify({
  name: 'nightsky',
  version: sourceManifest.version,
  description: sourceManifest.description,
  author: { name: 'Tandav Krishna', url: 'https://nightsky.earth/' },
  license: 'MIT',
}, null, 2) + '\n');
write('.mcp.json', JSON.stringify({
  mcpServers: {
    nightsky: { type: 'http', url: 'https://mcp.nightsky.earth/mcp' },
  },
}, null, 2) + '\n');
write('assets/logo.png', readFileSync(join(source, 'assets', 'logo.png')));

for (const name of skillNames) {
  const skill = readFileSync(join(source, 'skills', name, 'SKILL.md'), 'utf8');
  const canonicalPath = `docs/product/workflows/${name}.md`;
  if (!skill.includes(canonicalPath)) throw Error(`Missing workflow reference: ${name}`);
  write(`skills/${name}/SKILL.md`, skill.replaceAll(canonicalPath, 'references/workflow.md'));
  write(`skills/${name}/references/workflow.md`, readFileSync(join(root, canonicalPath)));
}

console.log(`Synced ${skillNames.length} Claude skills from NightSky ${sourceManifest.version}`);
