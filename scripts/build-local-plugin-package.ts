import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { unzipSync, zipSync, strToU8, strFromU8, type Zippable } from 'fflate';
import { buildPluginPackage, validatePackageFiles } from './build-plugin-package';

export type LocalPluginHost = 'codex' | 'claude';
const publicPlaceholder = 'https://example.com/nightsky/mcp';
const jsonBytes = (value: unknown) => strToU8(JSON.stringify(value, null, 2) + '\n');
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function checkHost(host: string): asserts host is LocalPluginHost {
  if (host !== 'codex' && host !== 'claude') throw Error('Invalid local package host');
}
function localEndpoint(value: string): string {
  // Match the original spelling before URL parsing can normalize aliases, dot
  // segments, empty query strings, backslashes or omitted/default ports.
  const match = /^http:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):([1-9]\d{0,4})\/mcp$/.exec(value);
  if (!match || Number(match[1]) > 65535) throw Error('Invalid local loopback HTTP /mcp endpoint');
  return value;
}
function claudeManifest(portable: any) {
  return {
    name: portable.name, version: portable.version, description: portable.description,
    keywords: portable.keywords,
    ...(portable.author ? { author: portable.author } : {}),
    displayName: portable.extensions['com.openai'].interface.displayName,
  };
}
function paths(host: LocalPluginHost) {
  return host === 'codex'
    ? { manifest: 'plugin.json', mcp: 'mcp.json' }
    : { manifest: '.claude-plugin/plugin.json', mcp: '.mcp.json' };
}

/** Lint local rehearsal bytes without relaxing the public package validator. */
export function validateLocalPackageFiles(files: Record<string, Uint8Array>, host: LocalPluginHost): void {
  checkHost(host);
  // Scan actual host bytes before JSON parsing or placeholder linting. Duplicate
  // JSON properties must not hide credentials or machine paths from this scan.
  if (Object.values(files).reduce((total, bytes) => total + bytes.length, 0) > 32 * 1024 * 1024) throw Error('Local package total bytes too large');
  for (const [path, bytes] of Object.entries(files)) {
    if (bytes.length > 1024 * 1024) throw Error('Local package entry too large');
    if (!bytes.length) throw Error(`Empty local package entry: ${path}`);
    let content: string;
    try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { throw Error(`Invalid UTF-8 in ${path}`); }
    if (/sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}|-----BEGIN .*PRIVATE KEY-----|(?:api[_-]?key|token|secret|password)["']?\s*[=:]\s*["']?[A-Za-z0-9_./+=-]{16,}/i.test(content)) throw Error(`Potential secret in ${path}`);
    if (/(?:^|[\s"'`(])[A-Za-z]:[\\/]|\/(?:Users|home)\//.test(content)) throw Error(`Machine local path in ${path}`);
  }
  const names = paths(host);
  if (!files[names.manifest] || !files[names.mcp]) throw Error('Missing local manifest or MCP configuration');
  const config = JSON.parse(strFromU8(files[names.mcp]));
  const expectedConfigKeys = host === 'codex' ? ['$schema', 'mcpServers'] : ['mcpServers'];
  if (!isDeepStrictEqual(Object.keys(config).sort(), expectedConfigKeys.sort()) || host === 'codex' && config.$schema !== 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json') throw Error('Invalid local MCP configuration');
  if (!config.mcpServers || !isDeepStrictEqual(Object.keys(config.mcpServers), ['nightsky'])) throw Error('Exactly one local connection required');
  const server = config.mcpServers.nightsky;
  if (!server || !isDeepStrictEqual(Object.keys(server).sort(), ['type', 'url']) || server.type !== (host === 'codex' ? 'streamable-http' : 'http')) throw Error('Invalid local HTTP connection');
  localEndpoint(server.url);

  const baseline = unzipSync(buildPluginPackage().zip);
  const portable = JSON.parse(strFromU8(baseline['plugin.json']));
  const manifest = JSON.parse(strFromU8(files[names.manifest]));
  // Fixed source metadata forbids hidden inline servers, hooks, app bindings or
  // executable settings in either host manifest.
  if (!isDeepStrictEqual(manifest, host === 'codex' ? portable : claudeManifest(portable))) throw Error('Unexpected local manifest fields or metadata');
  const lintFiles: Record<string, Uint8Array> = {};
  for (const [path, bytes] of Object.entries(files)) {
    if (path === names.manifest || path === names.mcp) continue;
    if (path === 'plugin.json' || path === 'mcp.json') throw Error(`Unsafe local package path: ${path}`);
    lintFiles[path] = bytes;
  }
  lintFiles['plugin.json'] = baseline['plugin.json'];
  lintFiles['mcp.json'] = baseline['mcp.json'];
  validatePackageFiles(lintFiles);
  const skillNames = ['find-observing-place', 'plan-stargazing-night', 'plan-astrophotography', 'plan-sky-event', 'prepare-outing'];
  const allowedPaths = ['plugin.json', 'mcp.json', 'RELEASE-NOTES.md', 'assets/logo.svg', 'assets/composer.svg', ...skillNames.flatMap(name => [`skills/${name}/SKILL.md`, `skills/${name}/references/workflow.md`])];
  if (!isDeepStrictEqual(Object.keys(lintFiles).sort(), allowedPaths.sort())) throw Error('Unexpected or missing local package path');
  for (const [path, bytes] of Object.entries(lintFiles)) {
    if (path.endsWith('/references/workflow.md') && !isDeepStrictEqual(bytes, baseline[path])) throw Error(`Canonical workflow reference mismatch: ${path}`);
  }
}

export function buildLocalPluginPackage(options: { host: LocalPluginHost; endpoint: string }) {
  checkHost(options.host);
  const endpoint = localEndpoint(options.endpoint);
  const publicResult = buildPluginPackage({ endpoint: publicPlaceholder });
  const files = unzipSync(publicResult.zip);
  const names = paths(options.host);
  if (options.host === 'claude') {
    files[names.manifest] = jsonBytes(claudeManifest(JSON.parse(strFromU8(files['plugin.json']))));
    delete files['plugin.json']; delete files['mcp.json'];
  }
  files[names.mcp] = jsonBytes({
    ...(options.host === 'codex' ? { $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json' } : {}),
    mcpServers: { nightsky: { type: options.host === 'codex' ? 'streamable-http' : 'http', url: endpoint } },
  });
  files['RELEASE-NOTES.md'] = strToU8(strFromU8(files['RELEASE-NOTES.md']).replace('uses an example endpoint', 'uses a loopback HTTP endpoint') + '\nLocal rehearsal only: submissionReady=false; hostInstallationVerified=false. Start the NightSky backend separately. No backend runtime or data is bundled.\n');
  validateLocalPackageFiles(files, options.host);
  const entries: Zippable = {};
  const inventory = Object.keys(files).sort().map(path => {
    entries[path] = [files[path], { mtime: new Date('2020-01-01T00:00:00Z') }];
    return { path, bytes: files[path].length, sha256: hash(files[path]) };
  });
  const zip = zipSync(entries, { level: 9 });
  return { host: options.host, endpoint, zip, sha256: hash(zip), inventory,
    submissionReady: false as const, hostInstallationVerified: false as const,
    gates: [...publicResult.gates, 'owner-deferred complete installed skill and MCP rehearsal'],
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const values: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i]; const value = args[i + 1];
    if (!['--host', '--endpoint', '--out'].includes(flag) || !value || value.startsWith('--') || values[flag] !== undefined) throw Error('Expected unique --host, --endpoint and optional --out values');
    values[flag] = value;
  }
  if (!values['--host'] || !values['--endpoint']) throw Error('Explicit --host and --endpoint are required');
  checkHost(values['--host']);
  const result = buildLocalPluginPackage({ host: values['--host'], endpoint: values['--endpoint'] });
  const directory = resolve(values['--out'] ?? `dist/local-plugin-rehearsal/${result.host}`);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `nightsky-${result.host}-local-rehearsal.zip`), result.zip);
  const { zip, ...report } = result;
  writeFileSync(join(directory, 'package-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
