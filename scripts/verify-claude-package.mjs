import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packageRoot = join(root, 'plugins', 'nightsky-claude');
const manifest = JSON.parse(readFileSync(join(packageRoot, '.claude-plugin', 'plugin.json'), 'utf8'));
const connection = JSON.parse(readFileSync(join(packageRoot, '.mcp.json'), 'utf8'));
const expectedSkills = [
  'find-observing-place',
  'plan-stargazing-night',
  'plan-sky-event',
  'plan-astrophotography',
  'prepare-outing',
];

if (manifest.name !== 'nightsky' || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
  throw new Error('Claude package needs its own name and semantic version.');
}
if (!existsSync(join(packageRoot, 'README.md')) || !existsSync(join(packageRoot, 'LICENSE'))) {
  throw new Error('Claude package is missing its README or license.');
}
const servers = Object.values(connection.mcpServers ?? {});
if (servers.length !== 1 || servers[0]?.type !== 'http' || servers[0]?.url !== 'https://mcp.nightsky.earth/mcp?presentation=text') {
  throw new Error('Claude package must declare only the reviewed text-mode HTTPS MCP endpoint.');
}
for (const name of expectedSkills) {
  for (const relative of ['SKILL.md', join('references', 'workflow.md')]) {
    const file = join(packageRoot, 'skills', name, relative);
    if (!existsSync(file) || statSync(file).size === 0) throw new Error(`Missing Claude skill file: ${name}/${relative}`);
  }
}
const actualSkills = readdirSync(join(packageRoot, 'skills'), { withFileTypes: true })
  .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
if (actualSkills.join(',') !== [...expectedSkills].sort().join(',')) {
  throw new Error('Unexpected Claude skill folders.');
}

let bytes = 0;
const visit = directory => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (entry.isFile()) bytes += statSync(path).size;
    else throw new Error(`Unsupported Claude package entry: ${path}`);
  }
};
visit(packageRoot);
if (bytes >= 50 * 1024 * 1024) throw new Error('Claude package exceeds the directory size limit.');
console.log(`Claude package: ${manifest.version}, ${actualSkills.length} skills, ${bytes} bytes, one HTTPS connector.`);
