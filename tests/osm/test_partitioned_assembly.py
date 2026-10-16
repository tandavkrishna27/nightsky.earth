import hashlib,json,sys,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'/'osm'))
import supervised_membership_assembly as driver
import test_global_source_pipeline as fixtures
import test_membership_assembly as assembly_fixtures

class PartitionedAssemblyPreflight(unittest.TestCase):
 def fixture(self,version=2):
  f=fixtures.Pipeline();f.setUp();self.addCleanup(f.doCleanups)
  m=f.manifest([f.node()]);m['schemaVersion']=2;m['evidenceLayout']={'kind':'partitioned-jsonl-v1','maxPartBytes':134217728,'maxParts':64}
  manifest=f.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
  plan,path,save=assembly_fixtures.Assembly().setup_plan(f);plan['schemaVersion']=version
  plan.update(evidenceLayout=m['evidenceLayout'],maxNormalizedOutputBytes=m['limits']['outputBytes'],maxCandidateInputBytes=m['limits']['outputBytes'])
  MiB=1024**2
  member=dict(maxCandidateInputBytes=m['limits']['outputBytes'],maxBoundaryBytes=MiB,maxVertices=100000,maxTotalVertices=100000,maxComparisons=1000000,maxRows=min(1000,m['limits']['candidates']),maxOutputBytes=MiB,maxMilliseconds=1000)
  cat=dict(chunkRows=100,mergeFanIn=2,maxRows=10,fanout=8,maxInputRows=member['maxRows'],maxMetadataRows=10000,maxInputBytes=max(MiB,m['limits']['outputBytes']),maxOutputBytes=MiB,maxScratchBytes=MiB,timeoutMs=1000)
  limits=dict(wallSeconds=max(60,m['limits']['seconds']+2),rssBytes=256*MiB,commitBytes=512*MiB,diskBytes=1024**3,freeBytes=0,maxProcesses=2)
  capacity=dict(schemaVersion=2,kind='partitioned-geography-capacity-v1',freeBytes=16*1024**3,reserveBytes=0,retainedBytes=0,rawSourceAlreadyRetainedBytes=0,
   allocations=dict(raw=m['limits']['sourceBytes'],index=m['limits']['scratchBytes'],journal=0,normalizedOutput=m['limits']['outputBytes'],boundaries=MiB,stagedCandidates=0,stagedBoundaries=MiB,footprints=MiB,membership=MiB,sort=MiB,catalogue=MiB,failureReports=MiB,rollback=0),limits=dict(raw=m['limits'],membership=member,catalogue=cat,supervisor=limits))
  if version==3:
   m['limits']['candidates']=2281141;manifest.write_text(json.dumps(m),encoding='utf8')
   member.pop('maxComparisons');member.update(maxGeometryComparisons=200000000,maxRows=2281141,maxOutputBytes=2*1024**3)
   cat.update(maxInputRows=2281141,maxInputBytes=member['maxOutputBytes']+MiB)
   limits['diskBytes']=16*1024**3
   capacity.update(schemaVersion=3,kind='partitioned-geography-capacity-v2')
   capacity['allocations']['membership']=member['maxOutputBytes']
   validation=dict(maxLexicalTokens=1000000000,maxOperations=1000000000,maxReadBytes=4*(m['limits']['outputBytes']+member['maxOutputBytes']+MiB)+8*MiB+3*MiB+3*MiB,maxRowsRead=100000000,controlAndAdmissionReadBytes=3*MiB)
   plan['validation']=dict(validation);capacity['limits']['validation']=dict(validation)
  plan['membership']={k:v for k,v in member.items() if k!='maxCandidateInputBytes'};plan['catalogue']=cat;plan['stream']=dict(maxRowBytes=65536,maxBytes=max(member['maxOutputBytes'],cat['maxInputBytes']),maxRows=member['maxRows'])
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

 def test_version_three_explicit_large_envelope_reaches_only_the_fixed_gate(self):
  f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture(3)
  with patch.object(driver,'verify_production_admission',side_effect=RuntimeError('fixed-gate-reached')):
   try:driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
   except RuntimeError as error:self.assertEqual(str(error),'fixed-gate-reached')
   except ValueError as error:self.fail('Valid explicit v3 envelope rejected: '+str(error))
   else:self.fail('Execution must stop at the fixed production gate')
  self.assertFalse((f.root/'job').exists())
  commands=driver.production_commands(manifest,f.root/'job',path,save(),manifest.read_bytes(),'all-nodes','node','python',f.root/'admission.json','a'*64,'b'*64)
  self.assertEqual(commands[1][2],str(manifest));self.assertNotIn(str(f.root/'job'/'raw-manifest.json'),commands[1])

 def test_only_the_three_explicit_version_combinations_are_supported(self):
  for raw_version,plan_version,cap_version,accepted in [(1,1,2,True),(2,2,2,True),(2,3,3,True),(1,2,2,False),(1,3,3,False),(2,1,2,False),(2,2,3,False),(2,3,2,False),(3,3,3,False),(2,4,3,False)]:
   with self.subTest(raw=raw_version,plan=plan_version,capacity=cap_version):
    f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture(3 if plan_version==3 else 2)
    m['schemaVersion']=raw_version;plan['schemaVersion']=plan_version;capacity['schemaVersion']=cap_version
    capacity['kind']='partitioned-geography-capacity-v2' if cap_version==3 else 'partitioned-geography-capacity-v1'
    if raw_version==1:m.pop('evidenceLayout')
    if plan_version==1:
     for key in ['capacityPlan','evidenceLayout','maxNormalizedOutputBytes','maxCandidateInputBytes']:plan.pop(key,None)
    manifest.write_text(json.dumps(m),encoding='utf8');capsave()
    if plan_version==1:plan.pop('capacityPlan')
    with patch.object(driver,'verify_production_admission',side_effect=RuntimeError('fixed-gate-reached')):
     if accepted:
      try:driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
      except RuntimeError as error:self.assertEqual(str(error),'fixed-gate-reached')
      except ValueError as error:self.fail('Supported version matrix rejected: '+str(error))
      else:self.fail('Fixed gate must remain required')
     else:
      with self.assertRaises(ValueError):driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
    self.assertFalse((f.root/'job').exists())

 def test_version_three_controls_cannot_default_reset_or_exceed_coupled_caps(self):
  modes=['missing-validation','extra-validation','missing-token','boolean-operation','unsafe-read','lexical-above-reads','read-formula','zero-q','capacity-validation','old-comparison','geometry-cap','rows-cap','raw-rows','publisher-rows','output-cap','membership-allocation','publisher-bytes','stream-bytes','stream-rows','supervisor','source-credit']
  for mode in modes:
   with self.subTest(mode=mode):
    f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture(3);v=plan['validation'];member=plan['membership']
    if mode=='missing-validation':del plan['validation']
    if mode=='extra-validation':v['extra']=1
    if mode=='missing-token':del v['maxLexicalTokens']
    if mode=='boolean-operation':v['maxOperations']=True
    if mode=='unsafe-read':v['maxReadBytes']=9007199254740992
    if mode=='lexical-above-reads':v['maxLexicalTokens']=v['maxReadBytes']+1
    if mode=='read-formula':v['maxReadBytes']-=1
    if mode=='zero-q':v['controlAndAdmissionReadBytes']=0
    if mode=='capacity-validation':capacity['limits']['validation']['maxOperations']-=1
    if mode=='old-comparison':member['maxComparisons']=member.pop('maxGeometryComparisons')
    if mode=='geometry-cap':member['maxGeometryComparisons']=200000001
    if mode=='rows-cap':member['maxRows']=10000001
    if mode=='raw-rows':m['limits']['candidates']=member['maxRows']-1
    if mode=='publisher-rows':plan['catalogue']['maxInputRows']=member['maxRows']-1
    if mode=='output-cap':member['maxOutputBytes']=64*134217728+134217728+1048576+1
    if mode=='membership-allocation':capacity['allocations']['membership']=member['maxOutputBytes']-1
    if mode=='publisher-bytes':plan['catalogue']['maxInputBytes']=member['maxOutputBytes']+capacity['allocations']['footprints']-1
    if mode=='stream-bytes':plan['stream']['maxBytes']=member['maxOutputBytes']+capacity['allocations']['footprints']-1
    if mode=='stream-rows':plan['stream']['maxRows']=member['maxRows']-1
    if mode=='supervisor':limits={**limits,'diskBytes':limits['diskBytes']+1}
    if mode=='source-credit':capacity['rawSourceAlreadyRetainedBytes']=sum(s['bytes'] for s in m['sources'])+1;capacity['retainedBytes']=capacity['rawSourceAlreadyRetainedBytes']
    if mode!='capacity-validation':capacity['limits']['validation']=dict(plan.get('validation',{}))
    capacity['limits']['membership']={**member,'maxCandidateInputBytes':plan['maxCandidateInputBytes']}
    manifest.write_text(json.dumps(m),encoding='utf8');capsave()
    with patch.object(driver,'verify_production_admission',side_effect=AssertionError('invalid declaration reached production gate')):
     with self.assertRaises(ValueError):driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
    self.assertFalse((f.root/'job').exists())

 def test_partitioned_control_duplicate_keys_refuse_before_gate(self):
  for version,which in [(2,'manifest'),(2,'plan'),(2,'capacity'),(3,'manifest'),(3,'plan'),(3,'capacity')]:
   with self.subTest(version=version,which=which):
    f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture(version);digest=save()
    target=manifest if which=='manifest' else path if which=='plan' else Path(plan['capacityPlan']['path'])
    body=target.read_text(encoding='utf8');body='{"schemaVersion":'+str(2 if which=='manifest' else version)+','+body.lstrip()[1:];target.write_text(body,encoding='utf8')
    if which=='plan':digest=hashlib.sha256(body.encode()).hexdigest()
    if which=='capacity':plan['capacityPlan'].update(bytes=len(body.encode()),sha256=hashlib.sha256(body.encode()).hexdigest());digest=save()
    with patch.object(driver,'verify_production_admission',side_effect=AssertionError('duplicate metadata reached gate')):
     with self.assertRaisesRegex(ValueError,'duplicate'):driver.assembly_pipeline(manifest,f.root/'job',path,digest,limits)
    self.assertFalse((f.root/'job').exists())
 def test_root_cardinality_refuses_before_retained_path_expansion(self):
  for version in (2,3):
   with self.subTest(version=version):
    f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture(version);plan['retained']=[str(f.root/'missing')]*65
    with patch.object(driver,'verify_production_admission',side_effect=AssertionError('must not reach gate')):
     with self.assertRaisesRegex(ValueError,'64|cardinality'):driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
    self.assertFalse((f.root/'job').exists())

 def test_attempt_root_consumes_one_of_the_64_accounting_slots_before_path_expansion(self):
  for version in (2,3):
   with self.subTest(version=version):
    f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture(version)
    count=64-len(m['sources'])-len(plan['boundaries'])-4
    plan['retained']=[str(f.root/'missing')]*count
    with patch.object(driver,'verify_production_admission',side_effect=AssertionError('must not reach gate')),patch.object(driver,'validate_manifest',side_effect=AssertionError('must not expand source paths')):
     with self.assertRaisesRegex(ValueError,'64|cardinality'):driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
    self.assertFalse((f.root/'job').exists())

 def test_version_three_added_gate_evidence_preserves_the_attempt_root_slot(self):
  f,m,manifest,plan,path,save,capacity,capsave,limits=self.fixture(3)
  # Six distinct base roots; 57 additions reach 63 retained, then refuse the
  # next missing path before canonicalization instead of consuming attempt's slot.
  pins=[]
  for index in range(58):
   target=f.root/f'evidence-{index}.json'
   if index<57:target.write_bytes(b'{}')
   pins.append(dict(path=str(target),bytes=2,sha256='a'*64))
  snapshot=dict(snapshotSha256='b'*64,metadataPins=pins,codePins=[])
  with patch.object(driver,'verify_production_admission',return_value=snapshot),patch.object(driver,'supervise',side_effect=AssertionError('no Job may launch')):
   with self.assertRaisesRegex(ValueError,'64|cardinality'):driver.assembly_pipeline(manifest,f.root/'job',path,save(),limits)
  self.assertFalse((f.root/'job').exists())
