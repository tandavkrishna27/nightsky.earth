/** Local-only bounded verification; all listeners are ephemeral loopback test fixtures. */
import { spawnSync } from "node:child_process";
const result=spawnSync(process.execPath,["--import","tsx","--test","tests/mcp/local-proxy.test.ts"],{stdio:"inherit",timeout:30000});
if(result.error) console.error("Local proxy verification could not complete within its process bound.");
process.exitCode=result.status ?? 1;
