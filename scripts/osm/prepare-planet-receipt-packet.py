"""Stat-only retained allocation inventory and NONEXECUTABLE planet receipt draft.

No source requests, payload/config reads, actual approval or receiver invocation.
Default prints a preparation summary; --write exclusively saves the two drafts.
"""
import argparse
import ctypes
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import sys
import time

sys.dont_write_bytecode = True
import planet_receipt as receiver
from spot_paths import safe_path

REPO = Path(__file__).resolve().parents[2]
PLUGIN = REPO.parent/'plugin-v1'
# Outside the retained cache parent; never create or resume this future root.
ATTEMPT = REPO/'.planet-261012-receipt-20261017-r2'
EVIDENCE = REPO/'docs/operations/data-pilot-evidence'
HISTORICAL_PREPARATION = (
    EVIDENCE/'planet-receipt-retained-inventory-20261017.json',
    EVIDENCE/'planet-receipt-preparation-draft-20261017.json',
    EVIDENCE/'planet-receipt-inventory-compatibility-20261017.json')
PRIOR_REVIEW = EVIDENCE/'planet-capacity-retained-review-20261017.json'
INVENTORY = EVIDENCE/'planet-receipt-retained-inventory-20261017-r2.json'
DRAFT = EVIDENCE/'planet-receipt-preparation-draft-20261017-r2.json'
COMPATIBILITY = EVIDENCE/'planet-receipt-inventory-compatibility-20261017-r2.json'
PRIOR_PREPARATION_STOPS = (
    EVIDENCE/'planet-receipt-r2-preparation-stop-20261017.json',
    EVIDENCE/'planet-receipt-r2-preparation-stop-log-20261017.json',
    EVIDENCE/'planet-receipt-r2-preparation-stop-20261017.log',
    EVIDENCE/'receipt-layout-mutation-stop-20261017.json',
    EVIDENCE/'receipt-directory-diagnostic-20261017.json',
    EVIDENCE/'receipt-native-directory-metadata-20261017.json')
MAX_ENTRIES = 1000000
MAX_SECONDS = 30
MAX_DEPTH = 48
MAX_JSON_BYTES = 256*1024


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True, allow_nan=False)+'\n'


def utc():
    return datetime.now(timezone.utc).isoformat()


def _identity(info):
    return info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns


def _windows_directory_metadata(path,check):
    """Read attributes only; Windows directory EOF/size is not a content count."""
    check()
    class Basic(ctypes.Structure):
        _fields_=[('creation',ctypes.c_int64),('access',ctypes.c_int64),
                  ('write',ctypes.c_int64),('change',ctypes.c_int64),('attributes',ctypes.c_uint32)]
    class Standard(ctypes.Structure):
        _fields_=[('allocation',ctypes.c_int64),('eof',ctypes.c_int64),
                  ('links',ctypes.c_uint32),('deletePending',ctypes.c_ubyte),('directory',ctypes.c_ubyte)]
    class FileId(ctypes.Structure):
        _fields_=[('volume',ctypes.c_uint64),('fileId',ctypes.c_ubyte*16)]
    class FileTime(ctypes.Structure):
        _fields_=[('low',ctypes.c_uint32),('high',ctypes.c_uint32)]
    class Legacy(ctypes.Structure):
        _fields_=[('attributes',ctypes.c_uint32),('creation',FileTime),('access',FileTime),
                  ('write',FileTime),('volume',ctypes.c_uint32),('sizeHigh',ctypes.c_uint32),
                  ('sizeLow',ctypes.c_uint32),('links',ctypes.c_uint32),
                  ('indexHigh',ctypes.c_uint32),('indexLow',ctypes.c_uint32)]
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.CreateFileW.argtypes=[ctypes.c_wchar_p,ctypes.c_uint32,ctypes.c_uint32,ctypes.c_void_p,
                                ctypes.c_uint32,ctypes.c_uint32,ctypes.c_void_p]
    kernel.CreateFileW.restype=ctypes.c_void_p
    kernel.GetFileInformationByHandleEx.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_void_p,ctypes.c_uint32]
    kernel.GetFileInformationByHandleEx.restype=ctypes.c_int
    kernel.GetFileInformationByHandle.argtypes=[ctypes.c_void_p,ctypes.POINTER(Legacy)]
    kernel.GetFileInformationByHandle.restype=ctypes.c_int
    kernel.CloseHandle.argtypes=[ctypes.c_void_p];kernel.CloseHandle.restype=ctypes.c_int
    check()
    # FILE_READ_ATTRIBUTES; share read/write/delete; OPEN_EXISTING;
    # BACKUP_SEMANTICS permits directories and OPEN_REPARSE_POINT avoids following.
    handle=kernel.CreateFileW(str(path),0x80,7,None,3,0x02200000,None)
    if handle in (None,ctypes.c_void_p(-1).value):raise ctypes.WinError(ctypes.get_last_error())
    try:
        check();values=[]
        for kind,structure in ((0,Basic),(1,Standard),(18,FileId)):
            check();value=structure()
            if not kernel.GetFileInformationByHandleEx(handle,kind,ctypes.byref(value),ctypes.sizeof(value)):
                raise ctypes.WinError(ctypes.get_last_error())
            check();values.append(value)
        basic,standard,identity=values
        legacy=Legacy();check()
        if not kernel.GetFileInformationByHandle(handle,ctypes.byref(legacy)):
            raise ctypes.WinError(ctypes.get_last_error())
        check()
        if legacy.attributes!=basic.attributes or (legacy.write.high<<32|legacy.write.low)!=basic.write:
            raise ValueError(f'changed native directory attributes during observation: {path}')
        return dict(volume=identity.volume,fileId=int.from_bytes(bytes(identity.fileId),'little'),
                    legacyVolume=legacy.volume,legacyFileId=legacy.indexHigh<<32|legacy.indexLow,
                    writeNs=(basic.write-116444736000000000)*100,
                    changeNs=(basic.change-116444736000000000)*100,
                    attributes=basic.attributes,directory=bool(standard.directory),
                    deletePending=bool(standard.deletePending))
    finally:
        if not kernel.CloseHandle(handle):raise ctypes.WinError(ctypes.get_last_error())


def _entry_identity(path,info,check):
    # Regular-file size and every POSIX identity retain the original semantics.
    if os.name!='nt' or not stat.S_ISDIR(info.st_mode):return _identity(info)
    native=_windows_directory_metadata(path,check)
    # CPython versions expose different Windows stat ID widths. Bind the pair
    # to a full or legacy identity queried from the SAME native handle; retain
    # full IDs in the authoritative comparison rather than truncating them.
    bound=(info.st_dev,info.st_ino) in ((native['volume'],native['fileId']),
                                     (native['legacyVolume'],native['legacyFileId']))
    if (not native['directory'] or native['deletePending'] or native['attributes']&0x400
            or not native['attributes']&0x10 or native['changeNs']<=0
            or not bound
            or native['writeNs']!=info.st_mtime_ns):
        raise ValueError(f'unsafe or changed native directory identity: {path}')
    # Reopen the pathname on every observation. An old retained handle alone
    # could hide replacement. ChangeTime is a separate mutation witness, subject
    # to filesystem timestamp granularity; this is not an atomic snapshot.
    # Unsupported/query failures never fall back to omitting directory checks.
    return native['volume'],native['fileId'],native['writeNs'],native['changeNs'],native['attributes']


def _regular(info):
    if stat.S_ISLNK(info.st_mode) or getattr(info, 'st_file_attributes', 0)&0x400:
        raise ValueError('inventory symlink/reparse point refused')
    if not (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)):
        raise ValueError('inventory requires regular files/directories')


def _category(relative):
    lower=relative.lower()
    parts=Path(lower).parts
    name=parts[-1]
    if any(part in ('venv','.venv','osm-venv','geography-venv','geography-venv314') for part in parts):
        return 'runtime-allocation'
    if 'rollback' in lower:
        return 'explicitly-named-rollback'
    if 'scratch' in name or name.endswith(('.sqlite','.sqlite-journal','.sqlite-wal','.sqlite-shm')):
        return 'scratch-or-journal'
    if name.endswith(('.partial','.part')) or any(word in lower for word in ('failed','failure','quarantine','diagnostic','staging')):
        return 'partial-failure-or-diagnostic'
    if name.endswith(('.pbf','.osm','.nc','.grib','.grib2','.zip')):
        return 'source-body-or-archive'
    if name.endswith(('.geojson','.poly')):
        return 'boundary-or-clip'
    return 'other-retained-artifact'


class InventoryBudget:
    def __init__(self,max_entries,max_seconds,clock):
        self.max_entries=max_entries;self.max_seconds=max_seconds;self.clock=clock
        self.began=clock();self.entries=0
    def check(self):
        if self.clock()-self.began>=self.max_seconds:
            raise TimeoutError('bounded retained inventory deadline')
    def entry(self):
        self.check();self.entries+=1
        if self.entries>self.max_entries:raise ValueError('bounded retained inventory entry limit')


def inventory_roots(roots, *, max_entries=MAX_ENTRIES, max_seconds=MAX_SECONDS,
                    max_depth=MAX_DEPTH, clock=time.monotonic, budget=None):
    """One bounded stat-only traversal; classifications never imply acceptance."""
    if type(max_entries) is not int or not 1<=max_entries<=MAX_ENTRIES or not 0<max_seconds<=MAX_SECONDS or not 1<=max_depth<=MAX_DEPTH:
        raise ValueError('inventory bounds exceed fixed preparation ceilings')
    budget=budget or InventoryBudget(max_entries,max_seconds,clock)
    checked=[]
    for path in roots:
        budget.check()
        if len(checked)>=64:raise ValueError('receiver requires at most 64 unique retained roots')
        checked.append(safe_path(path));budget.check()
    roots=checked
    if len(set(roots))!=len(roots):
        raise ValueError('receiver requires at most 64 unique retained roots')
    for index,path in enumerate(roots):
        budget.check()
        if any(path.is_relative_to(other) or other.is_relative_to(path) for other in roots[:index]):
            raise ValueError('overlapping retained roots')
    records=[];check=budget.check
    for root in roots:
        check();before=root.lstat();_regular(before);root_identity=_entry_identity(root,before,check)
        categories={};groups={};files=directories=total=0
        digest=hashlib.sha256();started=utc()
        pending=[(root,0)] if stat.S_ISDIR(before.st_mode) else []
        def record(path,info):
            nonlocal files,total
            relative=str(path.relative_to(root)) if path!=root else path.name
            components=Path(relative).parts
            group='/'.join(components[:2]) if root.name=='.data' and len(components)>1 and components[0] in ('era5','osm') else components[0]
            item=groups.setdefault(group,dict(relativePath=group,logicalBytes=0,files=0))
            item['logicalBytes']+=info.st_size;item['files']+=1
            label=_category(relative)
            category=categories.setdefault(label,dict(logicalBytes=0,files=0))
            category['logicalBytes']+=info.st_size;category['files']+=1
            files+=1;total+=info.st_size
            digest.update(canonical([relative,info.st_size,info.st_mtime_ns]).encode())
        if stat.S_ISREG(before.st_mode):
            budget.entry()
            record(root,before)
        while pending:
            check();directory,depth=pending.pop()
            if depth>max_depth:raise ValueError('bounded retained inventory depth')
            initial=directory.lstat();_regular(initial)
            if not stat.S_ISDIR(initial.st_mode):raise ValueError('retained directory changed type')
            initial_identity=_entry_identity(directory,initial,check)
            directories+=1
            with os.scandir(directory) as entries:
                for entry in entries:
                    budget.entry()
                    info=entry.stat(follow_symlinks=False);_regular(info)
                    path=Path(entry.path)
                    if stat.S_ISDIR(info.st_mode):pending.append((path,depth+1))
                    else:record(path,info)
            final=directory.lstat();_regular(final)
            final_identity=_entry_identity(directory,final,check)
            if initial_identity!=final_identity:
                raise ValueError(f'retained directory changed during enumeration: {directory}; before={initial_identity!r}; after={final_identity!r}')
        check();after=root.lstat();_regular(after)
        if root_identity!=_entry_identity(root,after,check):raise ValueError('retained root changed during enumeration')
        safe_path(root)
        records.append(dict(path=str(root),logicalBytes=total,files=files,directories=directories,
            categories=categories,topLevelAllocations=sorted(groups.values(),key=lambda item:item['relativePath']),
            treeStatMetadataSha256=digest.hexdigest(),observedStartUtc=started,observedEndUtc=utc()))
    return dict(records=records,logicalBytes=sum(item['logicalBytes'] for item in records),
                files=sum(item['files'] for item in records),directories=sum(item['directories'] for item in records),
                enumeratedEntries=budget.entries,elapsedSeconds=round(budget.clock()-budget.began,6),
                bounds=dict(maxEntries=max_entries,maxSeconds=max_seconds,maxDepth=max_depth),
                method='stat-only regular-file logical lengths; no payload/config/credential contents opened; directory names classify allocation only; metadata digest is not a payload digest',
                reservation=False,atomicFilesystemSnapshot=False)


def machine_snapshot(path):
    """Fresh local Windows counters, without process or account inspection."""
    if os.name!='nt':raise RuntimeError('Windows memory snapshot required for this preparation packet')
    class Memory(ctypes.Structure):
        _fields_=[('length',ctypes.c_uint32),('load',ctypes.c_uint32)]+[(name,ctypes.c_uint64) for name in ('totalPhysical','availablePhysical','totalPageFile','availablePageFile','totalVirtual','availableVirtual','availableExtendedVirtual')]
    value=Memory();value.length=ctypes.sizeof(value)
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.GlobalMemoryStatusEx.argtypes=[ctypes.POINTER(Memory)]
    if not kernel.GlobalMemoryStatusEx(ctypes.byref(value)):raise ctypes.WinError(ctypes.get_last_error())
    disk=shutil.disk_usage(safe_path(path))
    return dict(observedUtc=utc(),platform=sys.platform,disk=dict(path=str(safe_path(path)),totalBytes=disk.total,freeBytes=disk.free),
                memory=dict(totalPhysicalBytes=value.totalPhysical,availablePhysicalBytes=value.availablePhysical,
                            totalPageFileBytes=value.totalPageFile,availablePageFileBytes=value.availablePageFile),
                processInventory='not-inspected; no commands, credentials or account configuration read')


def build_documents(inventory,machine,source_evidence,attempt,inventory_path,draft_path):
    attempt=safe_path(attempt);inventory_path=safe_path(inventory_path);draft_path=safe_path(draft_path)
    roots=[safe_path(item['path']) for item in inventory['records']]
    if any(attempt==path or attempt.is_relative_to(path) or path.is_relative_to(attempt) for path in roots):
        raise ValueError('proposed receipt root overlaps retained accounting')
    if attempt.exists():raise FileExistsError('proposed attempt root already exists; do not overwrite or resume')
    retained=[*map(str,roots),str(inventory_path),str(draft_path)]
    if len(retained)+1>64:raise ValueError('preparation plus attempt exceeds receiver combined 64-root ceiling')
    if any(path.exists() for path in (inventory_path,draft_path)):
        raise FileExistsError('preparation artifacts already exist; never overwrite retained evidence')
    observation=dict(schemaVersion=1,kind='planet-receipt-retained-allocation-inventory',
        observedUtc=machine['observedUtc'],inventory=inventory,machine=machine,
        sourceEvidence=source_evidence,authorization=None,networkRequests=0,rawBodyAcquired=False,
        caveats=['logical lengths are not allocated/compressed disk blocks','existing bytes already reduce observed free disk; logical accounting does not allocate them again',
                 'stat observations span enumeration and are not an atomic snapshot or capacity reservation',
                 'runtime allocations are included by stat only; no environment/configuration/payload content was opened',
                 'other worktrees/jobs and future writes are not enumerated as launch permission; refresh immediately before any approved receipt'],
        preparationArtifacts=[dict(path=str(inventory_path),bytes=0),dict(path=str(draft_path),bytes=0)])
    draft=dict(schemaVersion=1,kind='planet-receipt-preparation',authorization=None,executionAllowed=False,
        status='nonexecutable-preparation-only',observedUtc=machine['observedUtc'],
        proposedAllowance=dict(schemaVersion=1,action='receive-one-exact-planet',source=dict(receiver.SOURCE),
            limits=dict(receiver.LIMITS),retainedPaths=retained,attemptRoot=str(attempt),operatorApprovalReference=None),
        inventoryObservationPath=str(inventory_path),sourceEvidence=source_evidence,
        sourceObservation=dict(rawSha256=None,nativeVintage=None,coverageClaim='source-domain-only'),
        transfer=dict(requests=1,method='GET',redirects=False,retries=0,ranges=False,resume=False,alternateEditions=False,mirrors=False,
                      etagIsProviderMd5=False,stopAfter='receipt and later actual native-header inspection; no build'),
        coexistingWork=dict(exclusiveReceiptRequired=True,launchAuthorized=False,jobStatus='not-inspected',
                           requirement='Coordinate with all other lanes; launch no coexisting history/producer/acquisition job; refresh capacity and retained inventory before any separately authorized receipt'),
        gates=['actual separately obtained operator approval is absent','draft is deliberately rejected by receiver.validate_allowance',
               'actual allowance file must be added to retained paths when separately authorized; rerun receiver preflight with its exact digest',
               'fresh retained inventory, disk and memory plus no overlapping active jobs required at execution',
               'raw SHA-256/native observation/descriptor/trusted source reviews follow actual receipt; no hash or approval is fabricated'],
        capacity={})
    if not attempt.parent.is_dir():draft['gates'].append('proposed attempt parent must exist before any later authorized receipt')
    # These are byte lengths, not self-hashes. The two lengths converge without
    # a circular file SHA pin; all actual payload identities remain unknown.
    for _ in range(12):
        sizes=[len(canonical(observation).encode()),len(canonical(draft).encode())]
        for artifact,size in zip(observation['preparationArtifacts'],sizes):artifact['bytes']=size
        draft['capacity']=dict(observedFreeBytes=machine['disk']['freeBytes'],reserveBytes=receiver.RESERVE_BYTES,
            retainedExistingLogicalBytes=inventory['logicalBytes'],newPreparationFileBytes=sum(sizes),
            proposedRawBytes=receiver.SOURCE['bytes'],proposedReceiptEvidenceBytes=receiver.EVIDENCE_BYTES,
            headroomAfterPreparationRawEvidenceAndReserveBytes=machine['disk']['freeBytes']-sum(sizes)-receiver.SOURCE['bytes']-receiver.EVIDENCE_BYTES-receiver.RESERVE_BYTES,
            supervisorMaximumAccountedBytes=inventory['logicalBytes']+sum(sizes)+receiver.SOURCE['bytes']+receiver.EVIDENCE_BYTES,
            diskReservation=False,memoryReservation=False,fullBuildFitProven=False)
        if sizes==[len(canonical(observation).encode()),len(canonical(draft).encode())]:break
    else:raise ValueError('preparation byte lengths did not converge')
    if max(sizes)>MAX_JSON_BYTES:raise ValueError('preparation JSON byte ceiling')
    if draft['capacity']['headroomAfterPreparationRawEvidenceAndReserveBytes']<0:
        draft['gates'].append('current free disk cannot fit proposed receipt plus unchanged reserve')
        raise ValueError('bounded preparation snapshot has insufficient receipt capacity')
    try:receiver.validate_allowance(draft['proposedAllowance'])
    except ValueError as error:
        if str(error)!='operator approval reference required':raise
    else:raise ValueError('preparation must never create a runnable allowance')
    return observation,draft


def prepare(*,clock=time.monotonic):
    # Broad plugin parents include source/boundary/failure/scratch/old editions
    # and stat-only runtime allocations once. One assigned cache parent includes
    # every test/recovery child without spending a retained-root slot per child.
    # The future attempt is outside it. No account directories are inspected.
    budget=InventoryBudget(MAX_ENTRIES,MAX_SECONDS,clock)
    budget.check();repo=safe_path(REPO);budget.check()
    plugin=safe_path(PLUGIN);budget.check()
    if repo==plugin:
        raise ValueError('distinct geography checkout required; run the preparer from the intended geography-readiness checkout, not plugin-v1')
    attempt=safe_path(ATTEMPT);budget.check()
    if attempt.exists():raise FileExistsError('proposed attempt root already exists; do not overwrite or resume')
    roots=[PLUGIN/'.data',PLUGIN/'.cache']
    budget.check()
    cache=safe_path(REPO/'.cache')
    budget.check();cache_before=cache.lstat();_regular(cache_before)
    if not stat.S_ISDIR(cache_before.st_mode):raise ValueError('assigned cache directory required')
    cache_identity=_entry_identity(cache,cache_before,budget.check)
    roots.append(cache)
    roots.append(REPO/'docs/operations/natural-earth-admission')
    roots.extend((*HISTORICAL_PREPARATION,PRIOR_REVIEW,*PRIOR_PREPARATION_STOPS))
    budget.check();source=receiver._source_evidence();budget.check();roots.append(Path(source['path']))
    inventory=inventory_roots(roots,budget=budget)
    budget.check();safe_path(cache);budget.check()
    cache_after=cache.lstat();_regular(cache_after)
    if cache_identity!=_entry_identity(cache,cache_after,budget.check):
        raise ValueError('assigned cache root changed during preparation; refresh after other validation writes settle')
    budget.check();machine=machine_snapshot(REPO);budget.check()
    inventory['enumeratedEntries']=budget.entries
    inventory['elapsedSeconds']=round(budget.clock()-budget.began,6)
    result=build_documents(inventory,machine,source,ATTEMPT,INVENTORY,DRAFT)
    budget.check()
    return result


def probe_receiver_inventory(paths,expected_bytes,*,clock=time.monotonic):
    """Exercise only the receiver's metadata walker with its unchanged 30s cap."""
    if not isinstance(paths,list) or not 1<=len(paths)<=64 or any(
            not isinstance(path,str) or not path or len(path)>4096 or not Path(path).is_absolute()
            for path in paths):
        raise ValueError('bounded probe requires 1 to 64 absolute text paths')
    if type(expected_bytes) is not int or expected_bytes<0:
        raise ValueError('bounded probe expected logical bytes required')
    began=clock();actual=None;reason=None
    def deadline():
        if clock()-began>=30:raise TimeoutError('receiver retained inventory compatibility deadline')
    try:
        deadline();_,actual=receiver._inventory(paths,deadline);deadline()
    except Exception as error:
        reason=type(error).__name__+': '+str(error)[:1000]
    return dict(schemaVersion=1,kind='planet-receipt-inventory-compatibility-observation',
        observedUtc=utc(),status='bounded-stop' if reason else 'compatible-observation',reason=reason,
        maxSeconds=30,elapsedSeconds=round(clock()-began,6),retainedPathCount=len(paths),
        expectedRetainedLogicalBytes=expected_bytes,actualRetainedLogicalBytes=actual,
        retainedAllocationComparisonEstablished=actual is not None,
        retainedAllocationChangedSinceObservation=None if actual is None else actual!=expected_bytes,
        networkRequests=0,rawBodyAcquired=False,allowanceUsed=False,receiverModified=False,
        method='receiver._inventory with elapsed monotonic deadline_check only; no worker, supervisor execution, request, approval or source body read',
        reservation=False,latency='cooperative deadline; individual filesystem calls/OS scheduling affect stop precision',
        scope='Startup accounting compatibility observation only; not transfer authorization or successful GET evidence')


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    mode=parser.add_mutually_exclusive_group()
    mode.add_argument('--write',action='store_true',help='exclusively save nonexecutable preparation artifacts; never receive')
    mode.add_argument('--probe-existing',action='store_true',help='bound existing receiver metadata walker to 30s on already saved draft roots; no network')
    args=parser.parse_args(argv)
    if args.probe_existing:
        if safe_path(COMPATIBILITY).exists():raise FileExistsError('compatibility observation already exists; never overwrite')
        with safe_path(DRAFT).open('rb') as handle:body=handle.read(MAX_JSON_BYTES+1)
        if len(body)>MAX_JSON_BYTES:raise ValueError('preparation JSON byte ceiling')
        draft=json.loads(body)
        if draft.get('kind')!='planet-receipt-preparation' or draft.get('authorization') is not None or draft.get('executionAllowed') is not False:
            raise ValueError('nonexecutable preparation draft required')
        proposed=draft['proposedAllowance']
        if proposed['source']!=receiver.SOURCE or proposed['limits']!=receiver.LIMITS or proposed['operatorApprovalReference'] is not None:
            raise ValueError('unchanged exact source/bounds with absent authorization required')
        expected=draft['capacity']['retainedExistingLogicalBytes']+draft['capacity']['newPreparationFileBytes']
        report=probe_receiver_inventory(proposed['retainedPaths'],expected)
        with safe_path(COMPATIBILITY).open('xb') as handle:
            handle.write(canonical(report).encode());handle.flush();os.fsync(handle.fileno())
        print(canonical(report),end='')
        return 0
    observation,draft=prepare()
    if args.write:
        for path,value in ((INVENTORY,observation),(DRAFT,draft)):
            payload=canonical(value).encode()
            with safe_path(path).open('xb') as handle:
                handle.write(payload);handle.flush();os.fsync(handle.fileno())
    print(canonical(dict(kind='planet-receipt-preparation-summary',executionAllowed=False,
        networkRequests=0,written=args.write,inventoryPath=str(INVENTORY),draftPath=str(DRAFT),
        retainedRootCount=len(draft['proposedAllowance']['retainedPaths']),retainedExistingLogicalBytes=observation['inventory']['logicalBytes'],
        observedMachine=observation['machine'],capacity=draft['capacity'],authorization=None)),end='')
    return 0


if __name__=='__main__':
    sys.exit(main())
