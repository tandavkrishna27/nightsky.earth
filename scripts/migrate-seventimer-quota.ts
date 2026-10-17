/** Explicit offline ledger addition. No provider requests and no initialization/reset path. */
import {open,lstat} from 'node:fs/promises';
import {isAbsolute,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {createPersistentQuota} from '../server/providers/quotaState';
import {PROVIDER_QUOTA_POLICIES} from '../server/providers/weather/configuration';
import {SEVENTIMER_QUOTA_POLICY} from '../server/providers/weather/sevenTimer';
const packetSchema=z.strictObject({
 decision:z.literal('approved-add-seventimer-account'),quotaPath:z.string().max(4096).refine(isAbsolute),expiresAt:z.string().datetime(),
 usage:z.strictObject({verifiedAllowance:z.literal(true),verifiedAllAccountUsage:z.literal(true),allConsumersQuiesced:z.literal(true),evidence:z.string().trim().min(8).max(500),observedAt:z.number().int().nonnegative(),usedLast24Hours:z.number().int().nonnegative(),usedCurrentMonth:z.number().int().nonnegative()})
});
export async function runSevenTimerQuotaMigration(args:string[]) {
 if(!args.length)return {outcome:'offline-plan',providerId:'seventimer',policy:{...SEVENTIMER_QUOTA_POLICY},networkRequests:0,requirements:'An existing valid checkpoint, quiesced consumers, reviewed complete usage snapshot and explicit --apply packet are required. Existing counters are preserved.'};
 if(args.length!==2||args[0]!=='--apply')throw Error('Expected offline mode or --apply reviewed packet path.');
 const file=await open(args[1],'r');let raw:unknown;
 try{const stat=await file.stat();if(!stat.isFile()||stat.size>16384)throw Error('Invalid packet size');const bytes=Buffer.alloc(16385);const {bytesRead}=await file.read(bytes,0,bytes.length,0);if(bytesRead>16384)throw Error('Packet too large');raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,bytesRead)));}finally{await file.close();}
 const packet=packetSchema.parse(raw);
 if(Date.parse(packet.expiresAt)<=Date.now())throw Error('Expired migration authority');
 // Refuse missing checkpoints before lock acquisition; the quota layer checks path safety and integrity.
 const stat=await lstat(packet.quotaPath);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Existing ordinary checkpoint required');
 const quota=await createPersistentQuota({path:packet.quotaPath,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});
 try{if(Date.parse(packet.expiresAt)<=Date.now())throw Error('Expired migration authority');await quota.addVerifiedProvider(SEVENTIMER_QUOTA_POLICY,packet.usage);return {outcome:'provider-added',providerId:'seventimer',networkRequests:0};}finally{await quota.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 runSevenTimerQuotaMigration(process.argv.slice(2)).then(result=>console.log(JSON.stringify(result,null,2))).catch(()=>{console.error('7Timer migration refused: check reviewed authority, existing accounting and complete usage evidence. Preserve ledger and initialization marker.');process.exitCode=1;});
}
