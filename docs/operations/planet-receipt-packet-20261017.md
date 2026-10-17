# Planet receipt preparation packet — 17 October 2026

**This packet is not a transfer allowance.** It prepares the exact retained-path
inventory, machine observation and proposed receiver fields for one later human
decision. Authorization is null, execution is false, and the nested operator
approval reference is null. The existing receiver rejects both the preparation
document and its proposed allowance. This preparation performs no body request,
provider job, retry, cleanup, build, promotion or publication.

The preserved first preparation consists of:

- [Retained allocation inventory and machine observation](data-pilot-evidence/planet-receipt-retained-inventory-20261017.json)
- [Nonexecutable receiver preparation draft](data-pilot-evidence/planet-receipt-preparation-draft-20261017.json)
- [Failed receiver inventory compatibility observation](data-pilot-evidence/planet-receipt-inventory-compatibility-20261017.json)

These documents contain actual observed logical lengths, not guessed raw SHA,
native vintage, trusted approval or serving-size evidence. Their two own file
lengths converge as byte counters without self-hash pins. No self-referential
source/admission digest is invented.

## Exact proposed receipt

| Field | Prepared value |
| --- | --- |
| Edition | `planet-261012.osm.pbf` |
| URL | `https://osm-planet-eu-central-1.s3.dualstack.eu-central-1.amazonaws.com/planet/pbf/2026/planet-261012.osm.pbf` |
| Exact body allocation | **95,380,942,829 bytes** |
| S3 version | `brLMq6.oGIcbk.3ciQgjtqIduCfYJMT1` |
| ETag | `"37619b1886c62145e6a0a6b31109b300-5686"` |
| Provider MD5 | `c51bb08eb9fc486d010aaa1a3424cabc` |
| Last-Modified | `2026-10-15T19:22:44Z` |
| New attempt root | Historical v1 used `.cache/planet-261012-receipt-20261017-v1`; corrected r2 uses checkout `.planet-261012-receipt-20261017-r2`, outside retained `.cache`; must remain nonexistent |
| Raw SHA-256 / native vintage | Unknown; both remain null |

The draft reuses the receiver's exact source constants and complete limits:
`bodyBytes=95380942829`, `wallSeconds=86400`, `connectSeconds=30`,
`freeBytes=137438953472`, `evidenceBytes=1048576`, `commitBytes=4294967296`,
`rssBytes=2147483648`, `maxProcesses=1`. These preserve the 128 GiB free reserve,
24-hour total deadline and 30-second connection/header deadline. A multipart
ETag is not the provider MD5. There is one proposed GET with no redirect, retry,
range, resume, alternate source, mirror or second raw allocation.

The source metadata artifact is the fixed retained
[S3 observation](data-pilot-evidence/planet-identity-capacity-s3-20261016.json),
checked against Git-text LF SHA-256
`98d6637d14b741be946762d561db84c3fb516411008d1f59e3c68eec75117203`.
The metadata pin does not verify an absent body or establish native vintage.

## Retained allocations and capacity

The enumerator inspects filesystem metadata only. It opens no source body,
configuration, credential, screenshot, package file or database contents. Broad
`plugin-v1/.data` and `plugin-v1/.cache` roots include source inputs, boundary
originals/preparation, failed attempts, diagnostics, SQLite/journals, retained
editions and runtime allocation sizes once. Stat-only inclusion of runtime
directories changes no environment. ERA5 and OSM child allocations are broken
out within those parent records without adding duplicate retained roots.

The corrected r2 inventory counts the assigned worktree's entire `.cache` once,
including every test, failure, runtime and recovery child. Its future attempt
is outside that retained parent. The historical v1 child-per-root layout is
preserved in its original evidence. The inventory also
includes the actual `docs/operations/natural-earth-admission` evidence,
manifests, normalization lineage and frozen subjects, plus the fixed planet
metadata. The two new preparation JSON files are counted separately by their
exact serialized lengths. Every proposed retained root is nonoverlapping and
the complete path count remains within the receiver's existing ceiling of 64.
Changing Natural Earth metadata or adding validation-cache allocations requires
a fresh observation before any later authorized execution.

The JSON inventory records exact observed bytes and counts for every root,
category and allocation group. Named failure/diagnostic, scratch/journal,
source-body/archive, boundary/clip, runtime and explicitly named rollback
classifications describe filenames only. Old ERA5 tile editions remain counted
even when their role as a usable rollback has not been established. No release
or rollback readiness is inferred from a directory name. The tree metadata
digest hashes paths/sizes/mtime values; it is not a payload checksum.

Enumeration stops at one million entries, 48 directory levels or 30 seconds.
The same deadline covers root discovery/canonicalization and the postscan root
refresh; discovery also stops before collecting more cache roots than the
receiver's 64-path accounting can represent.
Linked/reparse or nonregular entries, changed directory identities and changed
assigned-cache root lists fail closed. The records are observations across a
scan interval, not an atomic filesystem snapshot. Individual filesystem calls
and OS scheduling affect stop latency. They are not a disk lease or capacity
reservation.

The original preparer's optimized stat walker was not a measurement of the
receiver's repeated per-entry ancestor checks. Broad runtime-inclusive roots
made that receiver's startup accounting slower. The separate
[30-second compatibility observation](data-pilot-evidence/planet-receipt-inventory-compatibility-20261017.json)
records a read-only `receiver._inventory` probe on the saved final roots using
an elapsed deadline callback. It makes no request, creates no receiver job and
changes no bound. A bounded stop is retained as an actual preparation blocker;
it is not repaired by raising the receiver deadline or omitting allocations.

The first preparation observed 17,658,924,658 retained logical bytes across
47 existing roots (596,470 entry observations) in 12.343466 seconds. Its two
JSON files add 84,351 bytes and two roots. At the observed 282,277,814,272 free
bytes, the proposed raw receipt, 1 MiB evidence and 128 GiB reserve left
49,456,785,044 bytes. This does **not** establish full-build fit: the earlier
145,578,373,101-byte full-build proposal was short by 739,596,652 bytes after
counting those new preparation files. That is a historical observation;
retained files and machine free space can change afterward.

The first receiver compatibility check stopped at its unchanged 30-second
deadline after 30.000902 seconds, with no completed byte total. Its legacy
`retainedAllocationChangedSinceObservation:false` field accompanies a null
actual count and therefore establishes **no comparison**. That report remains
unchanged as failure history. Subsequent reports use
`retainedAllocationComparisonEstablished:false` and a null changed flag on
failure so that an incomplete scan cannot imply unchanged allocations.

A finite local diagnosis reproduced the overhead using 200 one-byte files:
the old receiver made 4,420 `Path.lstat` calls in 0.087524 seconds. After the
targeted fix the same fixture required 53 such calls in 0.001462 seconds and
counted exactly 200 bytes. These are small-fixture observations, not a promised
speedup on the full retained tree. The receiver now canonicalizes every root,
checks directory ancestry on descent and directory identity/mutation at exit,
and uses non-following `scandir` metadata for files. It still rejects
symlink/reparse/nonregular entries, duplicate/ancestor aliases and more than
one million entries. Depth-first iterator frames avoid collecting a broad
directory's contents in memory. No verdict is cached between inventories.

The supervisor checks the clock on every entry, samples response-marker I/O
at its 20 ms cadence, forces a marker check at the shared header deadline,
and directly revalidates marker and transport evidence before success. The
initial retained tree is scanned once before launch; a separate tiny intent
root measurement stays inside the existing 1 MiB evidence allowance. The same
30-second startup/header and 24-hour total deadlines remain in force. Full
inventories still cost time, OS calls can delay cooperative stopping, and
disk/reserve/RSS checks remain sampled rather than a filesystem reservation.

A second preparation uses fixed `-20261017-r2.json` inventory, draft and
compatibility filenames and the nonexistent checkout
`.planet-261012-receipt-20261017-r2` attempt path. It retains all three
first-preparation files, the separate retained-capacity review, the three
failed-root-discovery stop artifacts and three subsequent mutation/metadata
diagnostic artifacts exactly once.
The combined 64-root ceiling includes the future attempt root, so preparation
allows at most 63 retained roots. A later real allowance must also fit and be
counted. The coordinator has signaled storage settled and authorized local
preparation with every file retained and zero reclamation. No owner-retain
approval is needed. A preexisting external attempt is refused before inventory
and document construction. The tool neither deletes data nor assumes reclamation.

The fresh JSON machine observation records C: total/free bytes, total/available
physical memory and total/available page-file-backed memory. Its capacity
equation is:

`free − new preparation JSON bytes − 95,380,942,829 − 1,048,576 − 137,438,953,472`

Existing retained files already reduce observed free disk. Their logical bytes
are added once to supervisor accounting, not subtracted from free disk again.
No deletion or reclamation is assumed. Free-space and memory counters do not
prove full-build fit or reserve resources against other lanes.
The `totalPageFileBytes`/`availablePageFileBytes` fields preserve the Windows
`GlobalMemoryStatusEx` counter names; they describe commit capacity/headroom,
not measured pagefile storage length.

## Work still required before a receipt

### Later r2 attempt — root ceiling stop, no cleanup

After Git recovery and the coordinator's explicit storage-settled signal, the existing reviewed `--write` mode ran once with all retained files and zero reclamation credit. It stopped before inventory with `receiver 64-root ceiling exhausted by assigned cache children`: 78 children now exceed the fixed 53-child allowance, requiring at least 89 combined roots against the unchanged 64-root maximum. No r2 inventory/draft was written, so `--probe-existing` was not run and compatibility remains unknown. The [retained stop report](data-pilot-evidence/planet-receipt-r2-preparation-stop-20261017.json) pins the actual log and fresh counters. The [next decision](geography-next-acquisition-capacity-decision-20261017.md#fresh-authorized-r2-preparation-result) proposes reviewing whole-cache accounting with a future attempt outside that retained parent; no path layout, cap or runtime code changed in this attempt. Unanswered cleanup approval means retain everything, not wait for permission to retain files or perform authorized read-only checks.

### Separately authorized layout correction

The coordinator authorized the finite [correction plan](../superpowers/plans/2026-10-17-receipt-root-layout.md): one complete cache root, direct external future attempt, refusal of a preexisting attempt and explicit retention of all failed-preparation evidence. Independent spec/quality review approved the final diff without actionable findings. The real 100-child regression failed at the old root ceiling and passes with exactly 139 fixture bytes retained once, including recovery and prior evidence. Cache identity is rechecked after all roots; moving traversal up a level does not increase depth48. Focused preparation: 18 run / 17 passed / one privilege skip. Full OSM suite: 246 run / 241 passed / five skips in 59.827 seconds. Source/receiver authority and every resource ceiling remain unchanged. A later section records the actual offline preparation/probe outcome; these tests alone do not establish machine fit.

### Windows directory metadata follow-up

The layout-corrected attempt stopped at an apparent directory mutation before producing r2 files. The [first generic stop](data-pilot-evidence/receipt-layout-mutation-stop-20261017.json) and [bounded exact-directory observation](data-pilot-evidence/receipt-directory-diagnostic-20261017.json) preserve the failure and the later finding of zero immediate children. The diagnostic-only follow-up identified `plugin-v1/.data/era5/.tiles-2025-v1.staging-8ecad926-b5ad-466d-94c7-5c54bf2a1db2`: lstat size4096 then0, with unchanged device/inode/mtime. A separate [native metadata observation](data-pilot-evidence/receipt-native-directory-metadata-20261017.json) exposed size0 then4096 across a read-attributes-only handle query, while native identity and ChangeTime stayed at October13. The mechanism behind that size representation is unproved; it is not a measured child-byte total or proof of content mutation.

The independently approved correction uses a type-specific Windows directory identity: full64-bit volume plus128-bit FileId, LastWriteTime, native ChangeTime and attributes. Every observation reopens the pathname with `FILE_READ_ATTRIBUTES`, shared read/write/delete, `OPEN_EXISTING`, `BACKUP_SEMANTICS` and `OPEN_REPARSE_POINT`. Native basic/standard/id queries reject non-directory, reparse and delete-pending states; query failures stop with no fallback. Same-handle legacy identity/write/attributes bind older CPython lstat representations without truncating authoritative IDs. Inner-directory, root and final cache checks use the same comparison under the original deadline. Regular-file sizes/logical accounting and POSIX checks stay unchanged.

Tiny tests prove size representation tolerance only with unchanged native identity, unsafe/unbound/query rejection, replacement and spaced child additions/renames/removals with intermediate observations and final assertions after restoring write time. They use bounded >=100ms clock separation, not production delays. Rapid mutations can share timestamps; reverted/same-tick changes are not guaranteed detectable, and these observations remain non-atomic. Both Python3.14 and3.11 pass22 preparer tests with one privilege skip; a real Windows short-alias run also passes22 with one skip. The final full OSM suite passed250 run /245 passed /five skipped in47.145seconds. The earlier CI raw-path assertion was reproduced under that alias, then corrected by resolving expected paths while the fixture exists. Independent final review approved native/legacy binding and the retained assertions. This changes neither receiver authority nor any runtime limit.

Obtain the actual separate operator decision. A later actual allowance must
contain its real reference, be independently retained and included in the
retained-path list, and be bound by its exact physical-file SHA-256. Re-run the
existing receiver preflight using fresh inventory/disk/memory and verify the
attempt path remains absent. This preparation tool has no conversion or
approval-generation command and never invokes the receiver's online mode.

Coordinate with all other lanes before a receipt. Their execution status is
not inspected here; no process command lines or account configuration are
read. Launch no coexisting history, raw-producer or acquisition job under this
proposal. Other worktrees and ordinary machine activity already affect free
disk and can change it after this observation. The packet grants no scheduling
or acquisition permission to another lane.

After an actually authorized receipt, measured raw SHA-256/provider MD5 and
native PBF inspection can support the actual descriptor and independently
trusted source reviews. A later build still requires separate authorization
and unchanged stream/work/resource caps. The source domain is not searched
coverage. The 128 MiB assembly stream ceilings remain unchanged, and raw planet
or SQLite scratch do not belong on the 2 CPU / 4 GB serving host. Actual
catalogue/host/rollback measurements and publication decisions remain open.

## Reproducibility and validation

`scripts/osm/prepare-planet-receipt-packet.py` defaults to read-only preparation
and prints a bounded summary. Run the script from the intended, distinct
`geography-readiness` checkout, with the retained `plugin-v1` checkout as its
sibling. Running its integrated copy inside `plugin-v1` makes the retained
plugin cache and the preparation checkout's cache the same directory; the
preparer rejects that layout before discovery or inventory. Both roots are
canonicalized within the unchanged preparation deadline before comparison, so
alternate spellings do not permit overlapping accounting. The working
directory alone does not relocate the script's checkout.
`--write` exclusively saves the two r2 draft
artifacts; it refuses to overwrite either existing file. Output JSON is capped
at 256 KiB each. Once retained, a changed observation needs an explicitly
reviewed new artifact revision rather than silent replacement.
`--probe-existing` runs only that bounded metadata compatibility observation
against an already saved nonexecutable draft and exclusively saves its report.
The report is subsequent review evidence, outside the original measured packet
files; it neither rewrites their observation nor becomes an allowance.

`python -m unittest discover -s tests/osm -p test_planet_receipt_packet.py -v`
tests exact lengths, category accounting, nonoverlap, entry/deadline/depth/root
bounds, reparse refusal, null authorization, receiver rejection, no network
construction and self-byte accounting using tiny local fixtures. Receiver
tests cover the targeted accounting/deadline changes, including actual small
Windows Job workers without network access. No acceptance totals change.
