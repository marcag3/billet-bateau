import { computed } from 'vue';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getBoatProgramCollectionRef,
    getBoatsCollectionRef,
    getCurrentUserIdRef,
    getPowerSyncDbRef,
    getProgramSyncScopeIdRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';

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
//TODO: capacity should not be optional
export function parseOptionalCapacity(v) {
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
    const boatProgramCollectionRef = getBoatProgramCollectionRef();
    const programSyncScopeIdRef = getProgramSyncScopeIdRef();
    const currentUserIdRef = getCurrentUserIdRef();

    const { data: allBoats } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: boatsModelDefinition.name,
        collection: boatsCollectionRef,
        orderBy: boatsModelDefinition.orderBy ?? [],
    });

    const { data: boatProgramLinks } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: 'boat_program',
        collection: boatProgramCollectionRef,
        orderBy: [
            { key: 'updated_at', direction: 'desc' },
            { key: 'created_at', direction: 'desc' },
            { key: 'id', direction: 'desc' },
        ],
    });

    const boats = computed(() => {
        const pid = programSyncScopeIdRef.value.trim();
        if (pid.length === 0) {
            return [];
        }
        const boatIds = new Set(
            boatProgramLinks.value
                .filter((row) => String(row.program_id) === pid)
                .map((row) => String(row.boat_id)),
        );
        return allBoats.value.filter((b) => boatIds.has(String(b.id)));
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

        const programId = programSyncScopeIdRef.value.trim();
        if (programId.length === 0) {
            throw new Error('Select a program roster before adding boats.');
        }

        const collection = boatsCollectionRef.value;
        if (!collection) {
            throw new Error('Boats collection is not ready.');
        }

        const boatProgramCollection = boatProgramCollectionRef.value;
        if (!boatProgramCollection) {
            throw new Error('Boat program collection is not ready.');
        }

        const parsedUserId = Number.parseInt(currentUserIdRef.value, 10);
        const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;

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

        const linkId = crypto.randomUUID();
        boatProgramCollection.insert({
            id: linkId,
            boat_id: id,
            program_id: programId,
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

        const bpCol = boatProgramCollectionRef.value;
        if (bpCol) {
            for (const row of boatProgramLinks.value) {
                if (String(row.boat_id) === String(boatId)) {
                    bpCol.delete(String(row.id));
                }
            }
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
