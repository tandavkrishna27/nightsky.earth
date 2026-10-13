import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildPluginPackage } from './build-plugin-package';
import { runReviewCases } from './verify-review-cases';

// Explicit offline commands; no deployment, account, validator or invitation path.
const execute = promisify(execFile);
const startedAt = new Date().toISOString();
const { stdout: revision } = await execute('git', ['rev-parse', 'HEAD']);
const { stdout: diff } = await execute('git', ['diff', '--binary', 'HEAD']);
const { stdout: untracked } = await execute('git', ['ls-files', '--others', '--exclude-standard']);
const untrackedSources = await Promise.all((untracked.trim() ? untracked.trim().split(/\r?\n/) : []).map(async path => ({ path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })));
await execute(process.execPath, ['--import', 'tsx', '--test', 'tests/mcp/transport-smoke.test.ts', 'tests/mcp/resolver-only.test.ts', 'tests/platforms/package.test.ts', 'tests/operations/offline-readiness.test.ts'], { timeout: 60000, maxBuffer: 2 * 1024 * 1024 });
const packageResult = buildPluginPackage();
const review = await runReviewCases({ offline: true });
assert.equal(review.records.length, 8); assert.equal(review.externalAttempts, 0);
const { stdout: rollback } = await execute(process.execPath, ['--import', 'tsx', 'scripts/verify-artifact-rollback.ts'], { timeout: 60000, maxBuffer: 2 * 1024 * 1024 });
const report = {
  startedAt, completedAt: new Date().toISOString(), runtime: process.version,
  revision: revision.trim(), workingTreePatchSha256: createHash('sha256').update(diff).digest('hex'),
  untrackedFileCount: untracked.trim() ? untracked.trim().split(/\r?\n/).length : 0,
  untrackedSources,
  scope: 'local working tree rehearsal; revision alone does not identify uncommitted sources',
  protocol: { smokeTestsPassed: true, hostConnectionVerified: false },
  package: { sha256: packageResult.sha256, inventory: packageResult.inventory, submissionReady: false, officialValidationPerformed: false },
  review, rollback: JSON.parse(rollback),
  liveClients: { chatgptDesktop: 'not run', chatgptMobile: 'not run', codex: 'not run', claude: 'not run', geminiConsumer: 'conditional; not run' },
};
await mkdir('dist/offline-operations', { recursive: true });
await writeFile('dist/offline-operations/readiness-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ packageSha256: packageResult.sha256, reviewSets: review.records.length, rollback: report.rollback, officialValidationPerformed: false, hostConnectionVerified: false }, null, 2));
