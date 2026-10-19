# Production configuration delivery handoff

This changes how **provider configuration** reaches production. It does not migrate mutable quota ledgers, deploy production, or open staging access.

## GitHub secret

Create exactly one secret in repository Settings → Environments → `production` → Environment secrets:

| Name | Content |
| --- | --- |
| `NIGHTSKY_PRODUCTION_ENV` | Complete newline-separated Docker env-file based on `ops/hetzner/production.github.env.example`, with actual approved provider credentials substituted privately. |

Do not create this secret at repository scope or in `staging` / `image-publication`. Do not paste `C:\Users\TK\.nightsky\providers.env` directly: its Windows state path is wrong for the server and it lacks the required production settings. The secret's key values are never printed by the workflow, sent as SSH command arguments or included in the image. The workflow passes them on SSH stdin after production environment review.

The example initially selects Geoapify for API place discovery, MET Norway for weather, and DarkSkySites for modelled light pollution. It does not admit WeatherAPI, OpenWeather, AstronomyAPI, NASA or Public Universe. Adding them later requires entitlement, rights, policy and quota review; putting a key in the secret alone does not admit a source.

## Server preparation before the workflow runs

The server-connected administrator should use the exact reviewed commit and inspect these files before installation:

- `ops/hetzner/nightsky-configure` → `/usr/local/sbin/nightsky-configure`, root:root `0755`.
- `ops/hetzner/nightsky-ssh-dispatch` → `/usr/local/libexec/nightsky-ssh-dispatch`, root:root `0755`.
- `ops/hetzner/nightsky-release` → `/usr/local/sbin/nightsky-release`, root:root `0755`.

Add only the exact sudoers entry from `docs/operations/hetzner-setup-20261019.md` for `nightsky-configure production sha256:*`; validate with `visudo -cf`. Keep the existing release entries and both separately restricted SSH keys. Verify the staging key is denied for `nightsky-configure production ...`. The production key can run only the fixed configure command plus its existing release commands. Check that `/etc/nightsky` remains root-owned and non-writable by group/others. Do not put provider keys into that setup command.

## Runtime sequence

1. Preserve the existing private quota checkpoints and `.initialized` markers, and migrate them separately to `/var/lib/nightsky/state/production/runtime` using `hetzner-private-migration-20261019.md`. No counter may be reset.
2. Enter `NIGHTSKY_PRODUCTION_ENV` privately in the protected GitHub production environment and review its selected providers. The template's placeholders must all be replaced; the installer rejects placeholders and unknown names.
3. Publish and stage an image for the exact source commit that contains this workflow and helper. The published digest must pass staging before production promotion.
4. After explicit production approval, the workflow first sends the config to `/etc/nightsky/production.env.pending`. The release helper starts the candidate image with that pending file, probes it, then promotes the file to active `/etc/nightsky/production.env` and writes the release record. If the candidate fails, the old active config and image are reused. A failed record write restores the old config.
5. Verify only safe receipts, active image digest, TLS and an explicitly bounded provider journey. Keep staging private. Image rollback keeps the currently active config and consumed quota state; review compatibility before rollback.

Do not run the production workflow until the server's helpers/sudoers and mutable quota files are ready. CI success does not prove those host-side conditions.
