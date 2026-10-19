# HTTPS and Deployment Access Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Complete each task with affected tests and independent review.

**Goal:** Prepare certificate renewal and a non-deploying SSH access check, with a dedicated container identity.

**Architecture:** Keep environment-bound forced SSH commands and add a read-only check before any release mutation. Run containers as UID/GID 10001 and prepare ACME webroot configuration separately from application deployment.

**Tech Stack:** Python, Node.js, Docker, GitHub Actions, nginx and Certbot.

**Spec:** docs/operations/hetzner-setup-20261019.md and the approved server/browser preparation handoff.

## Global constraints
- No image publication, valid deployment, provider activation, new dataset downloads or merge.
- Preserve existing credentials and usage counters; never print secrets or initialize used accounts as unused.
- Preserve unrelated changes in data-sources.md and weather-provider-admission.md.
- Staging remains denied publicly and internally isolated.
- Actual root server changes belong to the server-connected session.

## Review focus
- Cross-environment keys must fail specifically, not merely due to a network error.
- Access checks must not create locks, change release records, pull images or start services.
- UID/GID collisions and nonempty runtime directories require operator inspection before migration.
- ACME issuance and renewal must work while all other staging paths remain denied.
- A successful access check must not imply TLS, deployment or source readiness.

## Task A: Runtime identity and read-only command
- [x] Add failing Python tests for check grammar, environment binding and mutation-free execution.
- [x] Add `check staging|production` to helper/dispatcher; validate config, runtime, network and disk only.
- [x] Use UID/GID 10001 consistently in image, helper and verification; test old identity rejection.
- [x] Run affected tests and obtain independent review.

## Task B: Manual access workflow
- [x] Add tested strict SSH setup using existing environment variables and secret.
- [x] Require exact positive JSON and specific cross-environment denial.
- [x] Keep workflow manual, without publishing, pulling or deployment.
- [x] Run affected checks and obtain independent review.

## Task C: HTTPS and operational handoff
- [x] Prepare HTTP ACME bootstrap and renewable HTTPS templates; retain staging deny default.
- [x] Record browser-verified GitHub/DNS/firewall setup, distinguishing unverified secret contents and propagation.
- [x] Document exact server update, narrow sudoers additions and UID migration safeguards.
- [x] Document private source/ledger migration with preserved usage and single-writer handoff; do not perform migration.
- [x] Update tracker without resetting original ticket counts.

## Integration
- [x] Full suite:1,902 passed/0 failed/2 skipped; affected Node21, Python18, types, actionlint, actual image/nginx and integrated review pass.
- [ ] Push reviewed branch and inspect exact-commit source and native ARM image CI.
- [ ] Give the user the server continuation prompt and remaining gates.
