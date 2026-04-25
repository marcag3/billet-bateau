import { computed } from 'vue';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getBoatTypesCollectionRef,
    getCurrentUserIdRef,
    getPowerSyncDbRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';

export const boatTypesModelDefinition = defineModel({
    name: 'boat_types',
    collectionId: 'boat_types',
    persistenceSchemaVersion: 1,
    pickUpdatePayload: (changes) => ({ ...changes }),
    orderBy: [
        { key: 'updated_at', direction: 'desc' },
        { key: 'created_at', direction: 'desc' },
        { key: 'id', direction: 'desc' },
    ],
    relations: defineRelations([]),
});

export function useBoatTypes() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const boatTypesCollectionRef = getBoatTypesCollectionRef();
    const currentUserIdRef = getCurrentUserIdRef();

    const { data: boatTypes } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: boatTypesModelDefinition.name,
        collection: boatTypesCollectionRef,
        orderBy: boatTypesModelDefinition.orderBy ?? [],
    });

    /**
     * @returns {Promise<void>}
     */
    async function ensureBoatTypesReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {string} name
     * @returns {Promise<string>} boat type id
     */
    async function createBoatTypeRow(name) {
        await ensureBoatTypesReady();

        const collection = boatTypesCollectionRef.value;
        if (!collection) {
            throw new Error('Boat types collection is not ready.');
        }

        const userId = Number.parseInt(currentUserIdRef.value, 10);
        if (!Number.isFinite(userId)) {
            throw new Error('Missing authenticated user id.');
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const trimmed = String(name).trim();

        collection.insert({
            id,
            user_id: userId,
            name: trimmed.length > 0 ? trimmed : 'Untitled',
            created_at: now,
            updated_at: now,
        });

        void refreshOutboxSnapshot();

        const db = getPowerSyncDbRef().value;
        if (db) {
            await waitForUploadQueueDrained(db);
        }

        return id;
    }

    /**
     * @param {string} boatTypeId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     * @returns {Promise<void>}
     */
    async function patchBoatTypeRow(boatTypeId, updateDraft) {
        await ensureBoatTypesReady();
        const collection = boatTypesCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.update(boatTypeId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });
        void refreshOutboxSnapshot();
    }

    /**
     * @param {string} boatTypeId
     * @returns {Promise<void>}
     */
    async function deleteBoatTypeRow(boatTypeId) {
        await ensureBoatTypesReady();
        const collection = boatTypesCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.delete(boatTypeId);
        void refreshOutboxSnapshot();
    }

    return {
        boatTypes,
        ensureBoatTypesReady,
        createBoatTypeRow,
        patchBoatTypeRow,
        deleteBoatTypeRow,
        refresh: bootstrapAppPowerSync,
        hasBoatTypes: computed(() => boatTypes.value.length > 0),
    };
}
