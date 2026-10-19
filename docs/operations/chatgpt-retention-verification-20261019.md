# ChatGPT privacy retention verification

**Owner decision, 19 October 2026:** Support correspondence should be deleted 90 days after the last reply. This is a target rule until a repeatable Gmail process and treatment of existing mail are verified. Do not publish it as already enforced.

## Support mailbox

The operator should identify NightSky support threads in `nightsky.earth2026@gmail.com`, distinguish the last reply from an older message in the same thread, and decide whether any specific thread must be retained under an applicable obligation. Before publication, set up a repeatable process that checks due threads at least daily and permanently removes due correspondence and attachments from both the mailbox and Trash, or adopt an equivalent verified retention mechanism. Record the process owner and first completed sweep. Do not put message bodies, addresses, names or screenshots in the public release record. Google may retain service copies under its own policy; NightSky cannot promise deletion from the assistant provider's chat history.

This can be a manual process run by TK; an automated mail integration is not required. For low volume, review the dedicated support mailbox and Sent folder daily, use each conversation's **latest reply date** to determine its due date, then remove due threads and clear those messages from Trash on the same day. A Gmail age search can narrow the review, but message age alone is not proof that a thread's last reply is 90 days old. Keep only a private sweep date, count and any exception reason in the operations record. Gmail otherwise retains deleted messages in Trash for up to 30 days, so moving a thread to Trash alone does not meet a strict 90-day account-deletion promise. See [Gmail's deletion guidance](https://support.google.com/mail/answer/7401).

Until that process is verified, public privacy copy must state that support-mail retention is still being finalized, rather than claiming a 90-day deletion period has already been met. Once verified, update the public page with the 90-day rule and any lawful exception, then date the page.

## Hetzner production host handoff

Ask the server-connected Codex for a **read-only** report on the deployed NightSky host. It should identify the active nginx access/error-log destinations and redaction settings, Docker log driver and rotation settings, systemd/journald retention, production container stdout/stderr logging, backup/snapshot retention and who can access each. It should inspect effective configuration and current state, not merely the intended repository templates. It must report retention periods or mark them unknown, avoid printing credentials or request content, and make no changes, provider API calls or deployment. If a setting is unknown, propose the smallest change and a way to verify it before a public privacy claim is made.

The public ChatGPT privacy page needs actual retention timelines for the categories it describes. Application code excludes planning request bodies from its own logs, but that alone does not establish host, proxy, backup or mailbox retention.

## Read-only host report received 19 October 2026

The server-connected Codex reported the production image running behind nginx at `127.0.0.1:5000`. Production vhost access logging is off and its error log goes to `/dev/null`; staging remains denied. The catch-all nginx vhost writes `/var/log/nginx/access.log` and `error.log`, with daily logrotate and 14 compressed rotations. These settings do not establish an exact maximum age. Root and `adm` members can read those logs.

Docker uses `json-file`; the production container has `max-size=10m` and `max-file=3`, a size limit rather than an age limit. Root and the `deploy` account with Docker/sudo access can read container logs. Journald is persistent, currently about 3.7 GB, with no explicit retention period; root, `systemd-journal` members and `deploy` through sudo can access it. No NightSky backup policy or job was found on the host. Hetzner backup/snapshot retention and project access were not verifiable from the server.

**Hetzner Console check, 19 October 2026:** The NightSky server's Backups page shows **Enable Backups**, so automatic backups are disabled. Its Snapshots page says there are no snapshots for this server. This browser check did not inspect other project resources or establish Hetzner project-member access. No setting was changed.

**V1 decision:** A time-based Docker or journald log limit is not a prerequisite for using the current private ChatGPT service or preparing its submission. Production nginx does not persist access logs, the application does not persist prompts or destination queries, Docker logs are size-limited, and the privacy draft names the unknown age of Docker/journald logs. Do not promise that all server logs are deleted after a fixed number of days. A stricter age bound remains an operational improvement, especially if logging scope changes. OpenAI's public review may still require a clearer retention timeline; this decision is not an approval guarantee. Decide separately whether NightSky needs a backup plan for recovery; enabling Hetzner backups would add a recurring charge and a new retention category, so the privacy page must be reviewed if that changes. No server settings were changed by this report or browser check.

**Mailbox status:** No changes and no verified retention sweep. The owner (TK) will implement the 90-day-after-last-reply process. Keep the 90-day period unpublished until it is operating and existing mail has been reviewed.
