# Hetzner setup and GitHub handoff — 19 October 2026

## Current preparation update - HTTPS/access wave

The [server continuation handoff](hetzner-https-access-handoff-20261019.md) records actual GitHub/DNS/Hetzner browser verification and the remaining root-side changes. The server was prepared at4fd7835; its existing runtime directories still use1000:1000. The updated contract below requires10001:10001 to avoid the privileged legacy deploy account. Apply the guarded empty-directory migration before the new helper is used. No application image has been published or deployed.

A manual non-deploying access workflow validates each environment key and its cross-environment denial. It requires the updated helper and exact check sudoers entries; do not dispatch against the older helper. It validates SSH/config/network/disk/runtime metadata, not TLS, secrets, provider quota or application behavior. [Private migration checklist](hetzner-private-migration-20261019.md) remains a later activation gate.

## Original preparation scope and architecture

The owner confirmed `mcp.nightsky.earth` and `mcp-staging.nightsky.earth`. The separate server session removed Tunes; its handoff reports Ubuntu24.04 ARM64, Docker/nginx/Certbot, 3.7GiB RAM and9.3GiB disk free. That report is an input, not a fresh inspection by this session. No server connection, DNS change, registry publication, provider request or deployment is performed by preparing these files.

The standalone service uses `Dockerfile.plugin` and `dist/plugin.js`, not the website entry point. It requires no database, GeoNames file, OSM download or historical dataset. API mode is explicit. The website remains separately hosted. Root owns the deployment helper and configuration; the application is UID10001 with a narrow writable `/state` mount. A dedicated deployment account has no unrestricted shell, general sudo or Docker-group access.

## Architecture and exact paths

| Item | Contract |
| --- | --- |
| Image | `ghcr.io/tandavkrishna27/nightsky-mcp@sha256:<digest>`; Linux ARM64 only |
| Production | `https://mcp.nightsky.earth/mcp`; host `127.0.0.1:5000` |
| Staging | `https://mcp-staging.nightsky.earth/mcp`; private bridge `172.30.81.2:5000` from Linux host nginx; no published port; access denied until deliberately configured |
| Container listener | `0.0.0.0:5000` inside each isolated container |
| Runtime configuration | `/etc/nightsky/production.env`, `/etc/nightsky/staging.env`; root:root0600 |
| State | `/var/lib/nightsky/state/<environment>/runtime` -> `/state`; UID/GID10001:10001,0700; root-owned parents |
| Deployment records/lock | `/var/lib/nightsky/releases`; root:root0700; separate from application-writable state |
| Helper | `/usr/local/sbin/nightsky-release`; root:root0755 |
| SSH forced command | `/usr/local/libexec/nightsky-ssh-dispatch`; root:root0755 |
| Docker networks | `nightsky`:172.30.80.0/24,gateway172.30.80.1; `nightsky-staging`:172.30.81.0/24,gateway172.30.81.1,internal |

Check subnet conflicts before creating either network. Different subnets require a coordinated helper/profile change and review, not ad-hoc proxy trust widening. Nginx overwrites forwarded-client headers. Staging's internal network blocks external routing; Docker's internal-network published-port mapping was unavailable in the local rehearsal, so nginx uses its fixed private bridge address instead. its preload additionally denies application fetch. Staging has no credentials or provider ledgers. It tests startup, transport, astronomy and unavailable-source behavior, not live provider accuracy or a full synthetic conversation fixture.

Limits per container:768MiB RAM with no additional swap,1CPU,128PIDs, read-only root,64MiB temporary filesystem, no capabilities, no privilege escalation and at most3×10MiB Docker logs. There is one production process/ledger owner. Staging and production on one machine share a failure domain. Use only reviewed NightSky images: an internal Docker bridge still permits access to host services and is not a general untrusted-code sandbox.

## 1. Prepare the dedicated account and files in the server session

Use the reviewed files from the exact pushed commit. Do not install scripts from an unreviewed branch tip. The server session should inspect the files and verify their Git commit before root installation. Do not execute these installation operations in this application session.

1. Verify existing SSH still works and check Hetzner firewall rules separately: only SSH/HTTP/HTTPS inbound, no public5000/5001. Do not alter the working root key. Confirm the proposed networks/ports and UID10001 filesystem ownership are suitable.
2. Create `nightsky-deploy` with a locked password, normal `/bin/sh` command interpreter for the SSH forced command, and no supplementary sudo/docker membership. An `nologin` shell can prevent forced commands from running; constrain access through the SSH key instead.
3. Create root-owned0700 `/etc/nightsky`, `/var/lib/nightsky/releases` and root-owned non-writable parent directories for `/var/lib/nightsky/state/staging` and `/var/lib/nightsky/state/production`. Create their `runtime` subdirectories as UID/GID10001:10001 mode0700. Keep parent ownership root so the application cannot replace the state mount or deployment records.
4. Install the two Python helpers at the paths above. Install root-owned0600 environment files based on `ops/hetzner/*.env.example`. These files use Docker env-file syntax: literal `NAME=value`, no `export`, shell expansion or surrounding shell quotes. Never put actual values in the repo.
5. Create the two dedicated Docker bridges with the exact subnet/gateway/internal properties; the helper verifies them rather than creating networks implicitly.
6. Install a sudoers drop-in using `visudo -cf` validation before enabling it. The minimal command set is:

```sudoers
nightsky-deploy ALL=(root) NOPASSWD: /usr/local/sbin/nightsky-release deploy staging sha256\:*, /usr/local/sbin/nightsky-release deploy production sha256\:*, /usr/local/sbin/nightsky-release rollback staging, /usr/local/sbin/nightsky-release rollback production, /usr/local/sbin/nightsky-release check staging, /usr/local/sbin/nightsky-release check production
```

The helper independently validates argument count and lowercase digest grammar. Each forced SSH command also pins its key to exactly one environment, so the staging key cannot promote production. Do not allow `/bin/sh`, arbitrary Python, Docker, arbitrary env or general sudo. Treat this key as a privileged promotion credential within the fixed image repository; container isolation does not make arbitrary image publication harmless.

7. On your other Windows computer generate TWO dedicated Ed25519 key pairs in a private `.ssh` directory, one for staging and one for production. Use different files and never reuse the same private key across environments. The unattended workflow supports an unencrypted dedicated key stored as an environment secret; it does not implement a passphrase input. Keep the local file restricted to your Windows account. Never send its contents in chat. The public key can be shared with the server session.
8. Have root own the deployment account's home, `.ssh` and `authorized_keys`, with these separately restricted public-key entries. Replace the corresponding public key portions only:

```text
restrict,command="/usr/local/libexec/nightsky-ssh-dispatch staging" ssh-ed25519 <STAGING-PUBLIC-KEY> nightsky-staging
restrict,command="/usr/local/libexec/nightsky-ssh-dispatch production" ssh-ed25519 <PRODUCTION-PUBLIC-KEY> nightsky-production
```

Do not permit user-writable `authorized_keys`, SSH environment files or alternate authorized-key sources. Verify effective sshd settings for this account, including no password/keyboard-interactive authentication, no forwarding, no user environment and no user rc. Keep the existing administrative account available. Invalid commands, SFTP/SCP, interactive sessions and forwarding must fail. A negative-command test is safe; do not run `deploy` to test authentication yet.

## 2. Enter GitHub settings

Create environments **`image-publication`**, **`staging`**, **`production`** under repository Settings → Environments. Restrict them to the intended reviewed branch (`codex/plugin-v1` initially; `main` after merge). Require owner approval, including publication. For a solo owner, allow self-review rather than selecting “prevent self-review.” Check availability on the actual GitHub plan. Browser verification now confirms these environments and secret names exist; secret contents remain unverified until the read-only access check.

Set these on BOTH deployment environments (not `image-publication`):

| Kind | Exact name | Value / source |
| --- | --- | --- |
| Variable | `NIGHTSKY_DEPLOY_HOST` | `37.27.221.101` from the server handoff; reconfirm identity |
| Variable | `NIGHTSKY_DEPLOY_PORT` | `22` |
| Variable | `NIGHTSKY_DEPLOY_USER` | `nightsky-deploy`, after creation |
| Variable | `NIGHTSKY_DEPLOY_KNOWN_HOSTS` | The trusted verified public known_hosts entry from your server session |
| Secret | `NIGHTSKY_DEPLOY_SSH_KEY` | Complete matching environment private key entered directly from its local file; staging key in staging, production key in production; never the root key |

The reported ED25519 fingerprint is `SHA256:EI9Or5rTF3F3GVWjOHeAfml0SHQAm2mC7fywZRb6ZPk`. Reconfirm from the trusted existing connection. Do not replace verification with an unauthenticated `ssh-keyscan` result or `StrictHostKeyChecking=no`.

Do not add a root key, `GITHUB_TOKEN`, provider API keys, SSH passphrase or release-root variable. GitHub supplies the short-lived workflow token. The fixed helper owns the release path; there is no arbitrary destination input.

The GHCR package must be publicly pullable, or the server needs separately reviewed read-only registry authentication. Initial publication may create a private package: explicitly check/change package visibility after the authorized first publication. Never give the deployment account a registry write token. Publishing an image is a separate manual action from deploying it.

## 3. Configure provider secrets privately on the server

The checked-in production example is a preparation profile. It does not activate optional providers. The built-in MET baseline can be used by existing tools when a suitable identity is configured; do not describe this profile as a zero-network production mode. Only staging is network-isolated.

Review `production.env.example` against the exact provider configuration modules. Required base values are already shown there: API discovery, correct allowed-host list and single trusted Docker gateway. A key alone does not bypass a provider's admission requirement. Keep card delivery `false` until its intended host/source-credit acceptance is confirmed.

For the previously tested location/weather/light-pollution providers, the private names are `NIGHTSKY_GEOAPIFY_API_KEY`, `NIGHTSKY_WEATHERAPI_KEY`, `NIGHTSKY_OPENWEATHER_KEY`, `NIGHTSKY_DARKSKYSITES_API_KEY`. Optional astronomy uses `NIGHTSKY_ASTRONOMY_API_APP_ID`, `NIGHTSKY_ASTRONOMY_API_APP_SECRET`, `NIGHTSKY_NASA_API_KEY`. Public Universe has a separate quota ledger, not an API secret. No GeoNames account is required when using Geoapify.

Source selection, entitlements, credits and admission values must be reviewed before enabling each source. API keys stay in root-owned production.env; the non-root container receives only the selected runtime configuration. Do not pass keys as Docker build arguments, image labels, workflow inputs or ordinary CI secrets.

**Quota migration is a separate mandatory activation step.** Existing local accounts were used in tests. Do not initialize new zero counters or run another instance against the same accounts. Stop the old ledger owner, preserve usage/reservations, validate policies and migrate reviewed private ledger bytes into `/state` using the existing accounting tools/procedure. Path keys are `NIGHTSKY_QUOTA_STATE_PATH`, `NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH`, `NIGHTSKY_SKY_QUOTA_STATE_PATH`, `NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH`. Each selects a separate `/state/<name>.json`. Missing/locked/invalid ledgers fail closed; never delete a lock or reset state merely to force a start. No ledger or key was read/copied here.

## 4. DNS, TLS and nginx — later authorized server work

Both DNS A records are configured and now resolve through1.1.1.1 to37.27.221.101. Reconfirm from the server and external client before certificate issuance. Add no AAAA record unless IPv6 listener/firewall routing is actually configured and tested. Check for DNS proxy/CDN behaviour before selecting a topology.

Use the supplied nginx templates only after their certificate files exist. Obtain certificates with the server session's reviewed Certbot/ACME procedure; a template referencing nonexistent certificates will fail `nginx -t`. Staging defaults to deny access until an explicit restricted testing access rule is chosen. Never expose provider-free staging as a production service. An owner IP allowlist is suitable for CLI tests; ChatGPT-hosted access needs its own compatible access design and approval.

Validate `nginx -t` before reload, public TLS and correct Host routing, loopback-only production port and non-public staging bridge, overwritten forwarded headers, streaming/no buffering, request bounds and log handling. Templates disable raw access logs; review host-wide error/Certbot/journal collection and retention as well. Do not enable tracking/analytics implicitly.

## 5. Exact release sequence

1. Push reviewed changes and wait for all source CI and ARM64 image checks. Push builds/checks only; it neither publishes nor deploys.
2. GitHub registers new manual workflows from the default branch. Merge reviewed deployment files through the normal PR process before attempting manual dispatch if they are not registered yet. A branch-only file is not automatically available in the Actions UI. No merge is performed here.
3. After approval, run **NightSky ARM64 image** at the intended exact commit with `publish=true`; approve `image-publication`. It verifies successful source CI, builds/smokes the native ARM64 image, publishes an immutable run/attempt tag and records its digest/source SHA. Preserve the run ID/logs.
4. Make the package publicly pullable or establish read-only server credentials. Complete server account/runtime/source/ledger/DNS/TLS preparation.
5. Manually run **NightSky manual promotion**, choose `staging`, supply the successful publication `image_run`; approve staging. The helper pulls by digest, verifies ARM64, checks disk, starts the guarded service and probes health/MCP plus host-upstream reachability before recording acceptance.
6. Test the approved staging client/policy/credits/operations surface. The automated receipt is infrastructure acceptance, not a full product/client sign-off. Record source activation and public policy readiness before production.
7. Manually run promotion at the same source commit with `production`, the same `image_run` and successful `staging_run`; approve production. Both workflow and helper require the same staged digest. No rebuild is used for promotion.
8. Verify production HTTPS, MCP registry and separately approved real journeys, state persistence, restart and rollback. Submission/publication, website download pointers and marketplace acceptance follow independently.

Evidence uses successful workflow/job receipts tied to exact source SHA and digest. Expired/unavailable logs cause promotion to fail; do not bypass this by pasting a digest. Retain release evidence or implement a reviewed durable receipt mechanism before log expiry.

## Rollback and capacity

An administrator can invoke the restricted SSH command `nightsky-release rollback production` (or staging) after deciding to roll back. This selects only the previous successful image and preserves the current provider state/configuration. It does not reverse consumed credits. Configuration edits need their own version/review; image rollback cannot restore an incompatible configuration or ledger schema. Repeated deploy of the same current digest must preserve the previous rollback target.

New-image health failure attempts to restore the old image; a failed first deployment stops without pretending a previous release exists. Inspect recovery failures with the administrative account. Do not delete state/locks to hide shutdown errors.

The helper rejects less than2GiB free before/after pull, but this is a minimum safety floor, not a capacity proof. Measure actual image size/RSS/storage after the image build and on the host. With9.3GiB reported free, retain the current/previous digest for each environment and remove only specifically identified unreferenced NightSky images after review. Avoid global Docker prune or deleting future applications' images. Keep configuration backups private, protect provider-account state through restart/rollback and review filesystem growth/log retention. The old unused Tunes certificate/renewal remains a separate server housekeeping item.

## Research references

GitHub documents environment approval/branch/secret controls in [deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments) and [environment management](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments). Docker documents [GitHub image builds](https://docs.docker.com/build/ci/github-actions/) and [multi-platform CI](https://docs.docker.com/build/ci/github-actions/multi-platform/). These support the prepared approach; they do not prove the actual account, host or runtime has passed its later gates.

## Local verification receipt

Full offline suite: **1,891 passed /0 failed /2 skipped**,238.3seconds. Types,13focused Node checks,14Python deployment/rollback checks and YAML parsing pass. Independent review found and rechecked rollback retry history, atomic temp-file resilience, nginx privacy and per-environment SSH-key scope. [Machine-readable receipt](hetzner-preparation-verification-20261019.json).

The actual ARM64 image built and ran under local Docker Desktop emulation, with health/initialize/tools/list, non-root identity, public event assets and private-data exclusions checked without external networking. Image size682,639,044bytes (about651MiB) is an uncompressed local image figure, not registry transfer size or peak disk/RAM. The actual build exposed a missing pure arithmetic source import; a narrow build-context include fixes it without enabling history or adding datasets.

A separate internal-network experiment found no published-port binding; staging now uses the private bridge IP. Desktop cannot prove native Linux host access to that bridge. The new native ARM64 CI image job must run that host-access check before publication. Actual Hetzner/TLS/nginx/SSH permissions and quota migration remain server-side acceptance, not local test passes.

The first sandboxed full-suite attempt encountered EPERM on atomic temporary-file renames. The complete authorized rerun outside that sandbox passed; no product logic was changed to hide that environmental failure. No server, provider, credential/ledger, installed plugin, publication or deployment changes occurred here.

Use [the ready-to-copy HTTPS/access continuation](hetzner-https-access-handoff-20261019.md) after the exact pushed commit and CI result are supplied. Registry publication and deployment are still separate manual steps.

Native CI follow-up: the first ARM64 job passed image build/container-local checks but the host bridge MCP probe returned403. Actual wire tests confirmed Node fetch ignored its custom Host header. A bounded node:http probe now sends the reviewed hostname; hostname security is unchanged. Fifteen focused Node tests and14Python tests pass after correction; the final exact-commit CI is the follow-up acceptance evidence.


## HTTPS/access wave local verification

Full offline suite: **1,902 passed / 0 failed / 2 skipped**, 234.0 seconds. Independent plan and integrated code review found no material blocker. Affected Node deployment checks:21 passed; Python helper checks:18 passed. Type checks and actionlint for the new workflow pass. The rebuilt ARM64 image passes health, initialize, tools/list, exact10001:10001 identity and private-data exclusions under local emulation; native Linux host-bridge acceptance still belongs to CI. Actual local nginx accepts both HTTPS templates with temporary self-signed certificates, and its HTTP bootstrap serves the exact challenge200, unknown challenge404 and other paths403 for both names in an isolated container. This is not public certificate issuance or server acceptance.

Public DNS lookup through1.1.1.1 now resolves both MCP hostnames to37.27.221.101. No administrative SSH, real certificate issuance, provider migration, image publication or deployment was performed by this wave. See the next commit's CI and safe server receipt before applying its prepared helper/UID/TLS changes.
