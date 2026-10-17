import { ApiProviderError } from './http';
import type { ApiSourceRecord } from './types';
/** A conflicting reused upstream identity is never resolved by response order. */
export function uniqueRecords(records: ApiSourceRecord[]): ApiSourceRecord[] {
    const unique = new Map<string, ApiSourceRecord>();
    for (const record of records) {
        const key = record.providerId + ':' + record.upstreamId;
        const old = unique.get(key);
        if (old && (old.latitude !== record.latitude || old.longitude !== record.longitude || JSON.stringify(old.timeZoneEvidence) !== JSON.stringify(record.timeZoneEvidence)))
            throw new ApiProviderError('invalid-response');
        if (!old)
            unique.set(key, record);
    }
    return Array.from(unique.values());
}
