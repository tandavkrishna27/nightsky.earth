/** Offline, checksum-pinned composition. Does not acquire data or publish files. */
import { createHash } from 'node:crypto';
import { loadOsmCandidateIndex, mergeOsmCandidateShards, type OSMCandidateIndex } from '../../server/places/osmCandidates';

export async function buildRegionalShards(shards: {path:string; sha256:string}[], coverage:string, options:{maxShardBytes?:number}={}) {
  if (!shards.length || shards.length>32) throw new RangeError('Require 1 to 32 regional shards.');
  const limit=options.maxShardBytes ?? 4*1024*1024;
  if (!Number.isSafeInteger(limit) || limit<1 || limit>4*1024*1024) throw new RangeError('Shard byte limit must be 1 to 4 MiB.');
  const indexes:OSMCandidateIndex[]=[];
  let rowCount=0;
  for (const shard of shards) {
    if (!/^[a-f0-9]{64}$/i.test(shard.sha256)) throw new TypeError('Every shard requires a reviewed checksum.');
    const index=await loadOsmCandidateIndex(shard.path,{maxArtifactBytes:limit,expectedSha256:shard.sha256});
    if (!index) throw new TypeError('Reviewed shard is missing.');
    rowCount+=index.candidates.length;
    if(rowCount>100000) throw new RangeError('100,000 aggregate candidate limit exceeded.');
    indexes.push(index);
  }
  const index=mergeOsmCandidateShards(indexes,coverage);
  const payload=Buffer.from(JSON.stringify(index)+'\n');
  if(payload.length>32*1024*1024) throw new RangeError('32 MiB composed artifact limit exceeded.');
  return {index,payload,provenance:{shards:shards.map((s,i)=>({sha256:s.sha256.toLowerCase(),coverage:indexes[i]!.coverage,vintage:indexes[i]!.vintage,candidateCount:indexes[i]!.candidates.length})),candidateCount:index.candidates.length,duplicatesRemoved:rowCount-index.candidates.length,artifactSha256:createHash('sha256').update(payload).digest('hex'),artifactBytes:payload.length}};
}
