# GitHub production secret delivery implementation plan

> **For agentic workers:** Implement task by task with review and verification before release.

**Goal:** Let a protected GitHub production deployment install NightSky provider configuration on Hetzner without printing it, building it into an image, or placing it on a command line.

**Architecture:** Store the complete reviewed Docker env-file as one GitHub `production` environment secret, `NIGHTSKY_PRODUCTION_ENV`. A manual production promotion streams its bytes over the existing pinned SSH connection to a new fixed root helper. That helper verifies an expected SHA-256, a strict env-file allowlist and production invariants, then atomically writes root-owned `0600` `/etc/nightsky/production.env.pending`. The release helper starts the candidate image with that file and promotes it to `/etc/nightsky/production.env` only after a passing health probe, restoring the old file on a failed record write. Staging never receives this secret. Quota checkpoints remain a separate one-time private state migration.

**Tech stack:** GitHub Actions, Python 3.12, OpenSSH, Docker env-file.

**Spec:** `docs/operations/hetzner-private-migration-20261019.md` and `docs/operations/hetzner-setup-20261019.md`.

## Global constraints

- No provider key in source, image, workflow arguments, output or logs.
- No change to the staging key's authority or staging config.
- Root owns the final env file; only the fixed production SSH command may install it.
- The existing quota checkpoints and markers are not transported by GitHub Secrets.
- No production deployment or provider request in this change.

## Review focus

- Truncated, oversized or wrong-hash input must not replace the current config.
- Malformed Docker env syntax, duplicate keys or unknown keys must fail closed.
- A staging SSH key must not invoke production configuration.
- Failed validation or write must preserve the previous production file.
- Workflow must not run the configuration step on staging or leak values in output.

## Tasks

### 1. Private configuration installer

- [x] Add a fixed-purpose `ops/hetzner/nightsky-configure` helper that accepts only `production sha256:<digest>` and bounded stdin.
- [x] Validate UTF-8 Docker env-file syntax, approved names and exact production-only base settings; write pending configuration atomically with root ownership and `0600` mode.
- [x] Add tests for good input, wrong hash, malformed/duplicate/unknown input, overlength input, path restrictions and atomic failure.

### 2. SSH and GitHub delivery

- [x] Extend the forced-command dispatcher with only the production configure grammar and destination, preserving cross-environment denial.
- [x] Extend the production-only sudoers contract for that exact helper; staging remains unchanged.
- [x] Add a production-only Actions step that validates presence, hashes the secret locally and streams it through pinned SSH stdin before image promotion, with no log output of contents.
- [x] Use pending configuration for candidate production startup; promote only after health and restore active config if recording fails.
- [x] Add workflow and SSH boundary tests.

### 3. Operator handoff

- [x] Document the exact GitHub environment secret, server helper installation order, quota migration boundary and safe rotation/rollback behavior.
- [ ] Review diff, run affected tests and CI; do not deploy production in this change.
