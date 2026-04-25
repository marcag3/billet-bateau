import { computed } from 'vue';
import { defineRelations } from '../entity.relations.js';
import { defineModel } from '../model.definition.js';
import { useEntityList } from '../entity.queries.js';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getBoatsCollectionRef,
    getCurrentUserIdRef,
    getPowerSyncDbRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime.js';

export const boatsModelDefinition = defineModel({
    name: 'boats',
    collectionId: 'boats',
    persistenceSchemaVersion: 1,
    pickUpdatePayload: (changes) => ({ ...changes }),
    orderBy: [
        { key: 'updated_at', direction: 'desc' },
        { key: 'created_at', direction: 'desc' },
        { key: 'id', direction: 'desc' },
    ],
    relations: defineRelations([]),
});

/**
 * @param {unknown} v
 * @returns {number | null}
 */
function parseOptionalCapacity(v) {
    if (v === null || v === undefined || v === '') {
        return null;
    }
    const n = typeof v === 'number' ? v : Number.parseInt(String(v), 10);
    if (!Number.isFinite(n) || n < 0) {
        return null;
    }
    return n;
}

export function useBoats() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const boatsCollectionRef = getBoatsCollectionRef();
    const currentUserIdRef = getCurrentUserIdRef();

    const { data: boats } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: boatsModelDefinition.name,
        collection: boatsCollectionRef,
        orderBy: boatsModelDefinition.orderBy ?? [],
    });

    /**
     * @returns {Promise<void>}
     */
    async function ensureBoatsReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {{ name: string, capacity: number | null, notes: string, boatTypeId: string | null }} input
     * @returns {Promise<string>} boat id
     */
    async function createBoatRow(input) {
        await ensureBoatsReady();

        const collection = boatsCollectionRef.value;
        if (!collection) {
            throw new Error('Boats collection is not ready.');
        }

        const userId = Number.parseInt(currentUserIdRef.value, 10);
        if (!Number.isFinite(userId)) {
            throw new Error('Missing authenticated user id.');
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const name = String(input.name).trim();
        const notes = String(input.notes ?? '').trim();
        const capacity = parseOptionalCapacity(input.capacity);
        const boatTypeId =
            input.boatTypeId != null && String(input.boatTypeId).length > 0 ? String(input.boatTypeId) : null;

        collection.insert({
            id,
            user_id: userId,
            boat_type_id: boatTypeId,
            name: name.length > 0 ? name : 'Untitled',
            capacity: capacity === null ? null : capacity,
            notes: notes.length > 0 ? notes : null,
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
     * @param {string} boatId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     * @returns {Promise<void>}
     */
    async function patchBoatRow(boatId, updateDraft) {
        await ensureBoatsReady();
        const collection = boatsCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.update(boatId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });
        void refreshOutboxSnapshot();
    }

    /**
     * @param {string} boatId
     * @returns {Promise<void>}
     */
    async function deleteBoatRow(boatId) {
        await ensureBoatsReady();
        const collection = boatsCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.delete(boatId);
        void refreshOutboxSnapshot();
    }

    return {
        boats,
        ensureBoatsReady,
        createBoatRow,
        patchBoatRow,
        deleteBoatRow,
        refresh: bootstrapAppPowerSync,
        hasBoats: computed(() => boats.value.length > 0),
    };
}
