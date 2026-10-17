import { ApiSelectionStore } from './selectionStore';
import { ApiDiscoveryProvider } from './discovery';
import { resolveApiCalculationPlace } from '../calculationPlace';
import type { ApiConfiguration } from './http';
export type { ApiConfiguration } from './http';
export function createApiServices(config: ApiConfiguration) {
    for (const credential of [config.geonamesUsername, config.geoapifyApiKey])
        if (credential !== undefined && (!credential.trim() || credential.length > 256 || /[\x00-\x20\x7f]/.test(credential)))
            throw new TypeError('Invalid location provider credentials.');
    if (config.geonamesUsername?.toLowerCase() === 'demo')
        throw new TypeError('A dedicated location provider account is required.');
    if (!config.userAgent || config.userAgent.length > 300 || /[\r\n]/.test(config.userAgent))
        throw new TypeError('Invalid location provider identifying User-Agent.');
    const selectionStore = new ApiSelectionStore({
        now: config.now
    });
    const discoveryProvider = new ApiDiscoveryProvider(config, selectionStore);
    const selectedPlaceResolver = {
        resolve: async (input: Parameters<typeof resolveApiCalculationPlace>[0]) => resolveApiCalculationPlace(input, selectionStore)
    };
    return {
        selectionStore, discoveryProvider, selectedPlaceResolver
    };
}
