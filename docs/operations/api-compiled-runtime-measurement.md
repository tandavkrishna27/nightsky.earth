# Compiled API runtime fixture measurements

Build with `npm run build:plugin`, then run the existing `node scripts/verify-api-runtime.mjs` check. The integration owner runs this check in the existing CI workflow. No new test rig or provider access is introduced.

The script retains its asserted loopback HTTP/MCP journey: initialize, resolve a synthetic named place, calculate astronomy at the selected API snapshot, and retrieve conditions with MET/WeatherAPI fixture disagreement and an OpenWeather fixture outage. It uses temporary synthetic quota state, fake credentials and a closed fixture fetcher. Existing environment restoration, listener shutdown, quota release and guarded temporary-directory cleanup remain in `finally`.

On success it prints a JSON measurement report followed by the existing synthetic-success message. The report contains:

- SHA-256 and byte size of `dist/plugin.js`, plus Node version, platform and architecture. The hash identifies the bundle, not external dependencies or an entire release.
- Separately timed dynamic module import, configured-app initialization, their combined elapsed time, and listener readiness. These measure module plus app cold initialization within this invocation. They exclude process spawning, Node startup, script imports, fixture preparation and bundle hashing; no filesystem cold-cache claim is made.
- Four sequential loopback request latencies through response-body reading, HTTP statuses, and decoded UTF-8 response bytes. Bytes include the SSE envelope when present; headers, wire compression and JSON parsing are outside those metrics.
- Process-wide sampled peak RSS at phase, request and fake-provider boundaries and a 10 ms timer. Event-loop blocking can hide peaks. This includes the measurement script and its bundle buffer; it is not an OS peak or isolated service allocation.
- Initial/final byte sizes of the synthetic quota JSON file and actual fake-provider call count. Quota file sizes exclude marker/lock files, backups and deployment/current/rollback/cache allocations.

The report always declares `synthetic: true` and `liveEvidenceEligible: false`. These local measurements do not establish real provider throughput, availability, geographic quality, forecast accuracy, full S3 completion or selected-host acceptance. A failed journey does not emit a passing measurement report. Root records execution results for the integrated revision; this document itself is instrumentation documentation, not a fresh passing-run record.
