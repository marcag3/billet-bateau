import { computed } from 'vue';
import { ulid } from 'ulid';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getBoatTypesCollectionRef,
    getCurrentUserIdRef,
    refreshOutboxSnapshot,
} from '../../powersync/app-powersync.runtime';

export const boatTypesModelDefinition = defineModel({
    name: 'boat_types',
    collectionId: 'boat_types',
    persistenceSchemaVersion: 2,
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
     * @param {string} programId
     * @returns {Promise<string>} boat type id
     */
    async function createBoatTypeRow(name, programId) {
        await ensureBoatTypesReady();

        const collection = boatTypesCollectionRef.value;
        if (!collection) {
            throw new Error('Boat types collection is not ready.');
        }

        const pid = String(programId ?? '').trim();
        if (pid.length === 0) {
            throw new Error('Program is required to create a boat type.');
        }

        const parsedUserId = Number.parseInt(currentUserIdRef.value, 10);
        const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;

        const id = ulid();
        const now = new Date().toISOString();
        const trimmed = String(name).trim();

        await collection
            .insert({
                id,
                user_id: userId,
                program_id: pid,
                name: trimmed.length > 0 ? trimmed : 'Untitled',
                created_at: now,
                updated_at: now,
            })
            .isPersisted.promise;

        void refreshOutboxSnapshot();

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
