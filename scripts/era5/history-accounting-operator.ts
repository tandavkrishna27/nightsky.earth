import {open} from 'node:fs/promises';
import {isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {z} from 'zod';
import {createPersistentQuota} from '../../server/providers/quotaState';
import {PROVIDER_QUOTA_POLICIES} from '../../server/providers/weather/configuration';
import {annualHistoryProbePlan,executeAnnualHistoryProbe} from './probe-annual-history';

const evidence=z.string().trim().min(8).max(500);
const policy=z.object({providerId:z.literal('open-meteo'),accountLabel:z.literal('operator-open-meteo'),
 hourlyLimit:z.number().int().positive().max(500),dailyLimit:z.number().int().positive().max(1000),monthlyLimit:z.number().int().positive().max(30000)}).strict();
const common={quotaPath:z.string().refine(isAbsolute),policy,expiresAt:z.string().datetime().refine(v=>Date.parse(v)>Date.now())};
const migration=z.object({...common,decision:z.literal('approved-add-open-meteo-account'),usage:z.object({
 verifiedAllowance:z.literal(true),verifiedAllAccountUsage:z.literal(true),allConsumersQuiesced:z.literal(true),evidence,
 observedAt:z.number().int().nonnegative(),usedLast24Hours:z.number().int().nonnegative(),usedCurrentMonth:z.number().int().nonnegative()}).strict()}).strict();
const execution=z.object({...common,decision:z.literal('approved-annual-history-probe'),
 planSha256:z.literal(annualHistoryProbePlan().planSha256),executionId:z.string().regex(/^[a-f0-9]{64}$/),evidenceRoot:z.string().refine(isAbsolute),
 maxReservedCredits:z.literal(3),sourceUseEligibilityReviewed:z.literal(true),sourceUseEvidence:evidence,accountPolicyEvidence:evidence,
 allAccountConsumptionUsesSharedLedger:z.literal(true)}).strict();

/** Default reads no files and contacts no provider. Explicit modes require separate reviewed packets. */
export async function runHistoryAccountingOperator(args:string[]) {
 if(args.length===0) return annualHistoryProbePlan();
 if(args.length!==2 || !['--apply-provider','--execute-approved'].includes(args[0])) throw Error('Expected offline mode or one explicit approved packet');
 const file=await open(args[1],'r'); let raw:unknown;
 try { if((await file.stat()).size>16384) throw Error('Approval packet too large'); raw=JSON.parse(await file.readFile('utf8')); } finally {await file.close();}
 if(args[0]==='--apply-provider') {
  const packet=migration.parse(raw);
  const quota=await createPersistentQuota({path:packet.quotaPath,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});
  try { if(Date.parse(packet.expiresAt)<=Date.now()) throw Error('Approval expired'); await quota.addVerifiedProvider(packet.policy,packet.usage); return {outcome:'provider-added',providerId:'open-meteo',networkRequests:0}; }
  finally {await quota.close();}
 }
 const packet=execution.parse(raw);
 const quota=await createPersistentQuota({path:packet.quotaPath,now:Date.now,policies:[...PROVIDER_QUOTA_POLICIES,packet.policy]});
 try { return await executeAnnualHistoryProbe({approval:packet,quota}); } finally {await quota.close();}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 runHistoryAccountingOperator(process.argv.slice(2)).then(result=>console.log(JSON.stringify(result,null,2))).catch(()=>{console.error('Operator stopped: invalid authority, unavailable accounting, or persistence failure.');process.exitCode=1;});
}
