import { computed, toValue } from 'vue';
import { ulid } from 'ulid';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getBoatsCollectionRef,
    getCurrentUserIdRef,
    getPowerSyncDbRef,
    getProgramSyncScopeIdRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';
import { parseOptionalNonNegativeInt } from '../../validation/zod-fields';

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

export function useBoats() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const boatsCollectionRef = getBoatsCollectionRef();
    const programSyncScopeIdRef = getProgramSyncScopeIdRef();
    const currentUserIdRef = getCurrentUserIdRef();

    const { data: allBoats } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: boatsModelDefinition.name,
        collection: boatsCollectionRef,
        orderBy: boatsModelDefinition.orderBy ?? [],
    });

    const boats = computed(() => {
        const pid = programSyncScopeIdRef.value.trim();
        if (pid.length === 0) {
            return [];
        }
        return allBoats.value.filter((b) => String(b.program_id) === pid);
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
     * @param {{ name: string, capacity: number, notes: string, boatTypeId: string | null }} input
     * @returns {Promise<string>} boat id
     */
    async function createBoatRow(input) {
        await ensureBoatsReady();

        const programId = programSyncScopeIdRef.value.trim();
        if (programId.length === 0) {
            throw new Error('Select a program roster before adding boats.');
        }

        const collection = boatsCollectionRef.value;
        if (!collection) {
            throw new Error('Boats collection is not ready.');
        }

        const parsedUserId = Number.parseInt(currentUserIdRef.value, 10);
        const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;

        const id = ulid();
        const now = new Date().toISOString();
        const name = String(input.name).trim();
        const notes = String(input.notes ?? '').trim();
        const capacity = parseOptionalNonNegativeInt(input.capacity);
        if (capacity === null) {
            throw new Error('Boat capacity is required.');
        }
        const boatTypeId =
            input.boatTypeId != null && String(input.boatTypeId).length > 0 ? String(input.boatTypeId) : null;

        collection.insert({
            id,
            user_id: userId,
            boat_type_id: boatTypeId,
            program_id: programId,
            name: name.length > 0 ? name : 'Untitled',
            capacity,
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

    /**
     * @param {MaybeRefOrGetter<string | null | undefined>} boatId
     * @returns {import('vue').ComputedRef<Record<string, unknown> | null>}
     */
    function useBoatById(boatId) {
        return computed(() => {
            const id = String(toValue(boatId) ?? '').trim();
            if (id.length === 0) {
                return null;
            }
            return boats.value.find((b) => String(b.id) === id) ?? null;
        });
    }

    /**
     * Previous/next boat ids in the current program roster, using the same order as `boats`.
     *
     * @param {MaybeRefOrGetter<string | null | undefined>} boatId
     * @returns {import('vue').ComputedRef<{ prev: string | null, next: string | null, index: number, total: number }>}
     */
    function useBoatNeighborsInRoster(boatId) {
        return computed(() => {
            const id = String(toValue(boatId) ?? '').trim();
            const list = boats.value;
            const ids = list.map((b) => String(b.id));
            const idx = id.length === 0 ? -1 : ids.indexOf(id);
            if (idx < 0) {
                return { prev: null, next: null, index: -1, total: ids.length };
            }
            return {
                prev: idx > 0 ? String(ids[idx - 1]) : null,
                next: idx < ids.length - 1 ? String(ids[idx + 1]) : null,
                index: idx,
                total: ids.length,
            };
        });
    }

    return {
        boats,
        ensureBoatsReady,
        createBoatRow,
        patchBoatRow,
        deleteBoatRow,
        refresh: bootstrapAppPowerSync,
        hasBoats: computed(() => boats.value.length > 0),
        useBoatById,
        useBoatNeighborsInRoster,
    };
}
