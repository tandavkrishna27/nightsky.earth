# HTTPS and access preparation — server continuation

Use this after the application session supplies the reviewed commit SHA and its successful source/ARM64 CI links. This supersedes the earlier account/key preparation prompt. Do not repeat key generation or erase the prepared server.

## Current verified and reported state

- Browser-verified: DNS configuration has A records `mcp` and `mcp-staging` -> `37.27.221.101`, TTL600; website root/www remain on Netlify. Public lookup through1.1.1.1 now returns that address for both names; server-side confirmation remains pending.
- Browser-verified: GitHub `image-publication`, `staging`, `production` require owner review, disallow administrator bypass and select only `codex/plugin-v1`; sole-owner self-review remains allowed. Staging/production each have one SSH secret and four expected variables. Secret contents/authentication have not been verified.
- Browser-verified: Hetzner `NightSky`, CAX11 in Helsinki, server124080128; firewall `nightsky-web`11836193 applied. Inbound TCP22/80/443 and ICMP, all IPv4/IPv6; other inbound blocked; outbound allowed.
- Server-session report: exact helpers at4fd7835c04e4289a99240f5d9f77df553f26bbcb; dedicated deploy account and networks prepared; no image/service/provider activation. Runtime directories currently1000:1000; that UID belongs to the older privileged `deploy` host account. New contract requires10001:10001.

## Copy this to the server-connected Codex

```text
Continue NightSky preparation using the exact reviewed commit and successful CI
links provided with this prompt. Read docs/operations/hetzner-setup-20261019.md,
this document, and the changed ops/hetzner files. Verify commit/file identity.

Scope: update prepared helpers, runtime ownership, HTTPS and read-only access.
Do not pull/build/publish an application image, deploy NightSky, start a provider,
copy provider secrets/ledgers, initialize quota, expose staging, alter website
DNS, regenerate SSH keys, or remove unrelated resources.

1. Reconfirm server37.27.221.101 through existing trusted SSH, fingerprint,
   root access, firewall, networks, free disk and existing nginx vhosts. Preserve
   working administrative SSH. Verify both MCP names resolve publicly to this
   address; stop on conflicting AAAA/proxy/listener routes. Do not modify DNS.
2. Check getent passwd 10001 and getent group 10001. Both numeric IDs must be
   unused, with no existing process or unrelated owner using them. Inspect the
   two exact /var/lib/nightsky/state/{staging,production}/runtime paths with
   lstat: directories, not symlinks; root-owned safe parents; mode0700; empty;
   no active NightSky container/process/ledger owner. If either is nonempty,
   report and stop ownership migration. Do not recursively chown anything.
   For the confirmed empty directories only, change owner/group to10001:10001
   and retain0700. This is the image's dedicated runtime identity, not the SSH
   user and not the old deploy account. Reserve these numeric IDs on the host
   with a dedicated locked nonlogin nightsky-runtime account/group (no home,
   supplementary groups, sudo or SSH) after collision checks, to prevent future
   reuse. On rerun verify the existing reservation exactly; do not recreate it
   or accept a conflicting account. Recheck metadata.
3. Install reviewed nightsky-release and nightsky-ssh-dispatch root:root0755
   at their documented paths, preserving backup copies privately. Validate
   Python syntax and the updated sudoers using visudo -cf before replacement.
   Keep existing exact deploy/rollback entries; add only these exact commands:
   /usr/local/sbin/nightsky-release check staging
   /usr/local/sbin/nightsky-release check production
   Never allow arbitrary Python, shell, Docker or wildcard check arguments.
   Preserve each key's forced staging/production argument and SSH restrictions.
4. Test `nightsky-release check staging` and `check production` through their
   matching deployment keys on THIS computer. Require exact JSON with
   environment, operation=check, status=ready. Cross-environment checks must
   exit2 with 'SSH key is not authorized for that environment'. A connection
   error does not pass that negative test. Verify no release lock/record/image/
   container/state or provider change. Do not invoke valid deploy/rollback.
5. Prepare root-owned /var/www/nightsky-acme/.well-known/acme-challenge with
   directories0755 and only public challenge files0644. Inspect existing vhosts
   for duplicate hostnames. Back up exact affected nginx config; install the
   HTTP-only nginx-acme-bootstrap.conf for these two names without disrupting
   unrelated vhosts. Run nginx -t before reload. Test unique temporary public
   challenge text externally over HTTP for BOTH names, unknown challenge404,
   all other paths403. Remove only the exact temporary test files afterward.
6. Explain certificate issuance/ACME terms before accepting any new legal
   agreement if not already authorized. Use Certbot webroot (not standalone
   or nginx auto-rewrite), /var/www/nightsky-acme, separate cert names matching
   each hostname, contact nightsky.earth2026@gmail.com. Obtain the two
   certificates only after DNS/challenge validation and required approval.
   Do not claim issuance if approval or challenge is pending.
7. Once certificate files exist, replace bootstrap with the reviewed two
   HTTPS templates. During PREPARATION add `deny all;` to production location /
   too, keeping it closed until the later authorized production release;
   staging retains its existing deny all. Keep the HTTP ACME locations and
   redirects, exact forwarded-header overwrites and disabled raw access logs.
   No application is running. nginx -t then reload; externally verify valid
   certificates/hostname chains for both, HTTPS /mcp denied403, HTTP redirect,
   unknown ACME404 and a fresh temporary challenge200. No public5000/5001.
8. Install a root-owned Certbot deploy hook that runs /usr/sbin/nginx -t before
   /usr/bin/systemctl reload nginx (absolute paths, set -eu). Check the renewal
   configuration uses this webroot and enable/check certbot.timer. With any
   required external-request approval, run these two separate exact commands:
   certbot renew --cert-name mcp.nightsky.earth --dry-run --run-deploy-hooks
   certbot renew --cert-name mcp-staging.nightsky.earth --dry-run --run-deploy-hooks
   Do not run an unscoped renew against unrelated certificates. Report
   failures without opening application routes or changing other certificates.
9. Return a safe receipt: reviewed SHA, helper hashes, UID/GID/modes, check
   outputs/exit codes, DNS/TLS expiry and renewal results, nginx validation,
   protection state, disk, and remaining blockers. Never print private keys,
   env contents, provider secrets or ledger contents. Public host-key metadata
   and certificate details are fine. No deployment/publication performed.
```

## Following this preparation

The new **NightSky deployment access check** workflow can verify GitHub-to-host authentication after the server update. If GitHub has not registered the branch-only workflow, normal reviewed PR/default-branch integration is still required; do not bypass it by deploying another way. The check neither proves TLS nor closes product/client/provider acceptance. Publication and staging/production promotion remain separate manual approvals.
