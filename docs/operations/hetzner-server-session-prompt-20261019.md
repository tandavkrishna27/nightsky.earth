# Original server preparation prompt (historical)

The account/key preparation below was completed at4fd7835. Use [the HTTPS/access continuation](hetzner-https-access-handoff-20261019.md) next; do not repeat key generation or the superseded UID1000 ownership instructions.

Use the exact reviewed commit supplied by the application session, not an unreviewed branch tip. This prompt prepares access/configuration only; it does not authorize publication or deployment.

```text
Finish NightSky's server-side deployment preparation using the exact reviewed
commit supplied by my application Codex session on codex/plugin-v1 in
https://github.com/tandavkrishna27/nightsky.earth.

First read docs/operations/hetzner-setup-20261019.md and the files in ops/hetzner.
Verify that this is the intended reviewed commit. Do not invent a different
deployment contract or edit application code/workflows.

1. Reconfirm server identity, disk, firewall, ports, subnet conflicts and
   installed Docker/nginx/Python. Preserve my administrative SSH access and
   unrelated resources.
2. Prepare the documented root-owned configuration/record directories,
   UID1000 runtime subdirectories, dedicated deploy account, two bridge
   networks and reviewed Python helpers. The staging bridge is INTERNAL;
   staging's private address is172.30.81.2:5000, not localhost5001.
3. On THIS LOCAL COMPUTER generate two separate restricted Ed25519 deployment
   keypairs, staging and production, in protected files outside any repository.
   Do not display or transmit private key contents in chat/logs. Install only
   the public keys in root-owned authorized_keys with the corresponding
   fixed-environment forced command from the guide.
4. Validate the narrow sudoers rule and effective SSH restrictions. Test denied
   commands and denied cross-environment use without invoking a valid deploy
   or rollback. No shell/SFTP/forwarding or Docker-group access for this account.
5. Create protected staging.env/production.env from the preparation examples.
   Do not activate sources, enter credentials, initialize zero usage counters,
   migrate quota ledgers or run NightSky yet. These need the separate source/
   account migration handoff. Never show env-file contents after secrets exist.
6. Confirm the known_hosts entry against the trusted connection. Report its
   public entry/fingerprint and exact GitHub environment-variable values.
   Report ONLY the local paths of the two private key files, not their contents.
7. Prepare nginx/DNS/TLS steps for mcp.nightsky.earth and
   mcp-staging.nightsky.earth. Keep staging denied by default. Do not enable a
   new public service or modify DNS/certificates without telling me the exact
   proposed change first. nginx templates require existing certificate files.

Do not build/pull a NightSky release image, publish to GHCR, execute a valid
deployment command, dispatch GitHub workflows, deploy the website or submit a
plugin. Return the preparation report and any blockers, including effective
permissions, disk space, subnet/port verification and key file paths.

The GitHub deployment environments are staging and production. Both use secret
NIGHTSKY_DEPLOY_SSH_KEY but each must receive its DIFFERENT matching private key.
Variables are NIGHTSKY_DEPLOY_HOST, NIGHTSKY_DEPLOY_PORT,
NIGHTSKY_DEPLOY_USER and NIGHTSKY_DEPLOY_KNOWN_HOSTS. The image-publication
environment needs approval protection but no SSH/provider secret.
```
