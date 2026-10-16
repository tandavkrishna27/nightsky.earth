import hashlib,json,sys,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'/'osm'))
import supervised_membership_assembly as driver
import test_global_source_pipeline as fixtures
import test_membership_assembly as assembly_fixtures

class PartitionedAssemblyPreflight(unittest.TestCase):
 def fixture(self):
  f=fixtures.Pipeline();f.setUp();self.addCleanup(f.doCleanups)
  m=f.manifest([f.node()]);m['schemaVersion']=2;m['evidenceLayout']={'kind':'partitioned-jsonl-v1','maxPartBytes':134217728,'maxParts':64}
  manifest=f.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
  plan,path,save=assembly_fixtures.Assembly().setup_plan(f);plan['schemaVersion']=2
  plan.update(evidenceLayout=m['evidenceLayout'],maxNormalizedOutputBytes=m['limits']['outputBytes'],maxCandidateInputBytes=m['limits']['outputBytes'])
  MiB=1024**2
  member=dict(maxCandidateInputBytes=m['limits']['outputBytes'],maxBoundaryBytes=MiB,maxVertices=100000,maxTotalVertices=100000,maxComparisons=1000000,maxRows=min(1000,m['limits']['candidates']),maxOutputBytes=MiB,maxMilliseconds=1000)
  cat=dict(chunkRows=100,mergeFanIn=2,maxRows=10,fanout=8,maxInputRows=member['maxRows'],maxMetadataRows=10000,maxInputBytes=max(MiB,m['limits']['outputBytes']),maxOutputBytes=MiB,maxScratchBytes=MiB,timeoutMs=1000)
  limits=dict(wallSeconds=max(60,m['limits']['seconds']+2),rssBytes=256*MiB,commitBytes=512*MiB,diskBytes=1024**3,freeBytes=0,maxProcesses=2)
  capacity=dict(schemaVersion=2,kind='partitioned-geography-capacity-v1',freeBytes=16*1024**3,reserveBytes=0,retainedBytes=0,rawSourceAlreadyRetainedBytes=0,
   allocations=dict(raw=m['limits']['sourceBytes'],index=m['limits']['scratchBytes'],journal=0,normalizedOutput=m['limits']['outputBytes'],boundaries=MiB,stagedCandidates=0,stagedBoundaries=MiB,footprints=MiB,membership=MiB,sort=MiB,catalogue=MiB,failureReports=MiB,rollback=0),limits=dict(raw=m['limits'],membership=member,catalogue=cat,supervisor=limits))
  plan['membership']={k:v for k,v in member.items() if k!='maxCandidateInputBytes'};plan['catalogue']=cat;plan['stream']=dict(maxRowBytes=65536,maxBytes=MiB,maxRows=member['maxRows'])
  capacity_path=f.root/'capacity.json'
  def capsave():
   body=json.dumps(capacity).encode();capacity_path.write_bytes(body);plan['capacityPlan']=dict(path=str(capacity_path),bytes=len(body),sha256=hashlib.sha256(body).hexdigest())
  capsave();return f,m,manifest,plan,path,save,capacity,capsave,limits
 def test_exact_partition_capacity_reaches_the_fixed_admission_gate(self):
  f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture()
  with patch.object(driver,'verify_production_admission',side_effect=RuntimeError('fixed-gate-reached')) as gate:
   with self.assertRaisesRegex(RuntimeError,'fixed-gate-reached'):driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
  gate.assert_called_once();self.assertFalse((f.root/'job').exists())
 def test_missing_changed_or_inconsistent_capacity_fails_before_gate_and_job(self):
  for mode in ['missing','changed','raw','aggregate','supervisor','credit']:
   with self.subTest(mode=mode):
    f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture()
    if mode=='missing':del plan['capacityPlan']
    if mode=='changed':Path(plan['capacityPlan']['path']).write_text('{}')
    if mode=='raw':capacity['limits']['raw']={**capacity['limits']['raw'],'nodes':m['limits']['nodes']+1};capsave()
    if mode=='aggregate':plan['maxNormalizedOutputBytes']+=1
    if mode=='supervisor':limits={**limits,'diskBytes':limits['diskBytes']+1}
    if mode=='credit':capacity['rawSourceAlreadyRetainedBytes']=sum(x['bytes'] for x in m['sources'])+1;capacity['retainedBytes']=capacity['rawSourceAlreadyRetainedBytes'];capsave()
    with patch.object(driver,'verify_production_admission',side_effect=AssertionError('must not reach gate')):
     with self.assertRaises(ValueError):driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
    self.assertFalse((f.root/'job').exists())
 def test_root_cardinality_refuses_before_retained_path_expansion(self):
  f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture();plan['retained']=[str(f.root/'missing')]*65
  with patch.object(driver,'verify_production_admission',side_effect=AssertionError('must not reach gate')):
   with self.assertRaisesRegex(ValueError,'64|cardinality'):driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
  self.assertFalse((f.root/'job').exists())

 def test_attempt_root_consumes_one_of_the_64_accounting_slots_before_path_expansion(self):
  f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture()
  count=64-len(m['sources'])-len(plan['boundaries'])-4
  plan['retained']=[str(f.root/'missing')]*count
  with patch.object(driver,'verify_production_admission',side_effect=AssertionError('must not reach gate')),patch.object(driver,'validate_manifest',side_effect=AssertionError('must not expand source paths')):
   with self.assertRaisesRegex(ValueError,'64|cardinality'):driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
  self.assertFalse((f.root/'job').exists())
