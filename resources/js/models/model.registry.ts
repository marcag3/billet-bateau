/**
 * Central bootstrap for domain models (PowerSync-backed TanStack DB collections).
 */
import { bootstrapAppPowerSync } from '../powersync/app-powersync.runtime';

/**
 * Ordered domain model bootstraps.
 *
 * @type {Record<string, () => Promise<unknown>>}
 */
export const domainModelBootstraps = {
    powersync: bootstrapAppPowerSync,
};

/**
 * Boots PowerSync once with the unified app schema (programs, boats, media metadata, …).
 *
 * @returns {Promise<void>}
 */
export async function bootstrapDomainModels() {
    for (const bootstrap of Object.values(domainModelBootstraps)) {
        await bootstrap();
    }
}
