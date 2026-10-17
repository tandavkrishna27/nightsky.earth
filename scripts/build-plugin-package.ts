import { OPTIONAL_SKY_TOOL_NAMES } from '../server/mcp/optionalSkyTools';
import { V1_TOOL_ANNOTATIONS } from '../server/mcp/registerTools';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync, strToU8, strFromU8, type Zippable } from 'fflate';
const root = resolve(fileURLToPath(new URL('../plugins/nightsky/', import.meta.url)));
const skillNames = ['find-observing-place', 'plan-stargazing-night', 'plan-astrophotography', 'plan-sky-event', 'prepare-outing'];
const workflowRoot = fileURLToPath(new URL('../docs/product/workflows/', import.meta.url));
const contractPath = resolve(workflowRoot, '../outdoor-conversation-contract.md');
const contractMarker = '<!-- outdoor-conversation -->';
function readCanonicalText(path: string): string {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw Error('Canonical workflow symlinks or non-files prohibited');
  if (stat.size > 1024 * 1024) throw Error('Canonical workflow too large');
  return new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path));
}
export function composeWorkflowReference(name: string): Uint8Array {
  if (!skillNames.includes(name)) throw Error('Unknown canonical workflow name');
  for (const directory of [resolve(workflowRoot, '../..'), resolve(workflowRoot, '..'), workflowRoot]) {
    if (lstatSync(directory).isSymbolicLink()) throw Error('Canonical workflow symlinks prohibited');
  }
  const workflow = readCanonicalText(join(workflowRoot, name + '.md'));
  if (workflow.split(contractMarker).length !== 2) throw Error('Exactly one outdoor contract marker required');
  const contract = readCanonicalText(contractPath).trimEnd();
  if (!contract.startsWith('## Outdoor discovery and conversation contract') || contract.includes(contractMarker)) throw Error('Invalid outdoor conversation contract');
  return strToU8(workflow.replace(contractMarker, () => contract));
}
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function endpointUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.hostname.includes('.') || /^(localhost|0\.|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname) || url.hostname.includes(':') || /\.(local|internal|localhost)$/.test(url.hostname)) throw Error('Invalid public HTTPS endpoint');
  return url.href;
}
export function validatePackageFiles(files: Record<string, Uint8Array>): void {
  if (Object.values(files).reduce((total, bytes) => total + bytes.length, 0) > 32 * 1024 * 1024) throw Error('Package total bytes too large');
  for (const [path, bytes] of Object.entries(files)) {
    if (!/^(plugin\.json|mcp\.json|assets\/[\w.-]+|skills\/[\w-]+\/(?:[\w.-]+|references\/workflow\.md)|RELEASE-NOTES\.md)$/.test(path) || path.includes('..') || path.startsWith('skills/') && !skillNames.includes(path.split('/')[1])) throw Error(`Unsafe package path: ${path}`);
    if (bytes.length > 1024 * 1024) throw Error('Package entry too large');
    if (!bytes.length) throw Error(`Empty package entry: ${path}`);
    let content: string;
    try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { throw Error(`Invalid UTF-8 in ${path}`); }
    if (/sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}|-----BEGIN .*PRIVATE KEY-----|(?:api[_-]?key|token|secret|password)["']?\s*[=:]\s*["']?[A-Za-z0-9_./+=-]{16,}/i.test(content)) throw Error(`Potential secret in ${path}`);
    if (/(?:^|[\s"'`(])[A-Za-z]:[\\/]|\/(?:Users|home)\//.test(content)) throw Error(`Machine local path in ${path}`);
  }
  const manifest = JSON.parse(strFromU8(files['plugin.json']));
  const mcp = JSON.parse(strFromU8(files['mcp.json']));
  if (Object.keys(mcp.mcpServers ?? {}).length !== 1) throw Error('Exactly one remote endpoint required');
  const server: any = Object.values(mcp.mcpServers)[0];
  if (Object.keys(server).some(key => !['type', 'url'].includes(key)) || server.type !== 'streamable-http') throw Error('Only one remote Streamable HTTP endpoint supported');
  endpointUrl(server.url);
  if (manifest.name !== 'nightsky' || !/^\d+\.\d+\.\d+$/.test(manifest.version) || manifest.$schema !== 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json') throw Error('Invalid portable manifest');
  const extension = manifest.extensions?.['com.openai'];
  const presentation = extension?.interface;
  if (!presentation || !Array.isArray(extension.publication?.countries) || extension.publication.countries.length !== 0) throw Error('Missing listing metadata or global intent');
  for (const field of ['composerIcon', 'logo']) {
    const path = presentation[field];
    if (typeof path !== 'string' || !path.startsWith('./assets/') || !files[path.slice(2)]) throw Error(`Missing required asset ${field}`);
  }
  const cases = extension.review?.test_cases;
  if (cases?.positive?.length !== 5 || cases?.negative?.length !== 3) throw Error('Review requires five positive and three negative cases');
  for (const item of [...cases.positive, ...cases.negative]) {
    if (![item.description, item.prompt, item.tools_triggered, item.expected_behavior].every(value => typeof value === 'string') || !item.prompt.trim() || !item.expected_behavior.trim()) throw Error('Invalid review case');
  }
  const skills = Object.entries(files).filter(([path]) => /^skills\/[^/]+\/SKILL.md$/.test(path));
  if (skills.length !== 5 || skillNames.some(name => !files[`skills/${name}/SKILL.md`]) || skills.some(([, bytes]) => !/^---\r?\n[\s\S]*?name:\s*\S+[\s\S]*?description:\s*\S+[\s\S]*?---/.test(strFromU8(bytes)))) throw Error('Five valid workflow skills required');
  for (const name of skillNames) {
    const skill = strFromU8(files[`skills/${name}/SKILL.md`]);
    const workflow = files[`skills/${name}/references/workflow.md`] ? strFromU8(files[`skills/${name}/references/workflow.md`]) : '';
    for (const tool of (skill + '\n' + workflow).match(/\b(?:find|resolve|get|search|plan|compare|recommend)_[a-z]+(?:_[a-z]+)+\b/g) ?? []) {
      if (!(tool in V1_TOOL_ANNOTATIONS) && !(OPTIONAL_SKY_TOOL_NAMES as readonly string[]).includes(tool)) throw Error(`Unknown tool inventory reference: ${tool}`);
    }
    if (!files[`skills/${name}/references/workflow.md`] || !skill.includes('`references/workflow.md`') || skill.includes('docs/product/workflows/')) throw Error(`Missing or broken workflow reference for ${name}`);
    if (!Buffer.from(files[`skills/${name}/references/workflow.md`]).equals(composeWorkflowReference(name))) throw Error(`Canonical workflow reference mismatch: ${name}`);
  }
}
export function buildPluginPackage(options: { endpoint?: string } = {}) {
  const endpoint = endpointUrl(options.endpoint ?? 'https://example.com/nightsky/mcp');
  const files: Record<string, Uint8Array> = {};
  function collect(directory: string, prefix = '') {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name); const stat = lstatSync(path); const relative = prefix + name;
      if (stat.isSymbolicLink()) throw Error('Package symlinks prohibited');
      if (stat.isDirectory()) collect(path, relative + '/'); else files[relative] = readFileSync(path);
    }
  }
  collect(root);
  // Only the five fixed canonical names can enter the installed references.
  for (const directory of [resolve(workflowRoot, '../..'), resolve(workflowRoot, '..'), workflowRoot]) {
    if (lstatSync(directory).isSymbolicLink()) throw Error('Canonical workflow symlinks prohibited');
  }
  for (const name of skillNames) {
    const canonicalPath = join(workflowRoot, name + '.md');
    const stat = lstatSync(canonicalPath);
    if (stat.isSymbolicLink() || !stat.isFile()) throw Error('Canonical workflow symlinks or non-files prohibited');
    if (stat.size > 1024 * 1024) throw Error('Canonical workflow too large');
    const skillPath = `skills/${name}/SKILL.md`;
    const sourceReference = `docs/product/workflows/${name}.md`;
    const skill = strFromU8(files[skillPath]);
    if (!skill.includes('`' + sourceReference + '`')) throw Error(`Missing canonical workflow reference in ${skillPath}`);
    files[skillPath] = strToU8(skill.replaceAll(sourceReference, 'references/workflow.md'));
    files[`skills/${name}/references/workflow.md`] = composeWorkflowReference(name);
  }
  files['mcp.json'] = strToU8(JSON.stringify({ $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json', mcpServers: { nightsky: { type: 'streamable-http', url: endpoint } } }, null, 2) + '\n');
  validatePackageFiles(files);
  const entries: Zippable = {};
  const inventory = Object.keys(files).sort().map(path => { entries[path] = [files[path], { mtime: new Date('2020-01-01T00:00:00Z') }]; return { path, bytes: files[path].length, sha256: hash(files[path]) }; });
  const zip = zipSync(entries, { level: 9 });
  return { zip, sha256: hash(zip), inventory, toolNames:Object.keys(V1_TOOL_ANNOTATIONS).sort(), optionalToolNames:[...OPTIONAL_SKY_TOOL_NAMES].sort(), endpoint, submissionReady: false, gates: ['publisher identity', 'frozen production endpoint', 'HTTPS policy and support URLs', 'verified organization/project and residency', 'official validation', 'production and host case evidence', 'reviewer video', 'source rights and coverage review', 'explicit submission authorization', 'separate publication authorization'] };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); const value = (flag: string) => { const i = args.indexOf(flag); return i < 0 ? undefined : args[i + 1]; };
  const result = buildPluginPackage({ endpoint: value('--endpoint') });
  const directory = resolve(value('--out') ?? 'dist/plugin-rehearsal'); mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'nightsky-local-rehearsal.zip'), result.zip);
  const { zip, ...report } = result; writeFileSync(join(directory, 'package-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
