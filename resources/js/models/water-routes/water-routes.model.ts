import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getWaterRoutesCollectionRef,
} from '../../powersync/app-powersync.runtime';

export const waterRoutesModelDefinition = defineModel({
    name: 'water_routes',
    collectionId: 'water_routes',
    persistenceSchemaVersion: 1,
    pickUpdatePayload: (changes) => ({ ...changes }),
    orderBy: [
        { key: 'name', direction: 'asc' },
        { key: 'updated_at', direction: 'desc' },
    ],
    relations: defineRelations([]),
});

export function useWaterRoutes() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const waterRoutesCollectionRef = getWaterRoutesCollectionRef();

    const { data: waterRoutes } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: waterRoutesModelDefinition.name,
        collection: waterRoutesCollectionRef,
        orderBy: waterRoutesModelDefinition.orderBy ?? [],
    });

    /**
     * @returns {Promise<void>}
     */
    async function ensureWaterRoutesReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    return {
        waterRoutes,
        ensureWaterRoutesReady,
    };
}
