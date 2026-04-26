import { computed, toValue } from 'vue';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getPowerSyncDbRef,
    getProgramSyncScopeIdRef,
    getTripsCollectionRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';

export const tripsModelDefinition = defineModel({
    name: 'trips',
    collectionId: 'trips',
    persistenceSchemaVersion: 1,
    pickUpdatePayload: (changes) => ({ ...changes }),
    orderBy: [
        { key: 'scheduled_departure_at', direction: 'desc' },
        { key: 'updated_at', direction: 'desc' },
        { key: 'id', direction: 'desc' },
    ],
    relations: defineRelations([]),
});

export function useTrips() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const tripsCollectionRef = getTripsCollectionRef();
    const programSyncScopeIdRef = getProgramSyncScopeIdRef();

    const { data: allTrips } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: tripsModelDefinition.name,
        collection: tripsCollectionRef,
        orderBy: tripsModelDefinition.orderBy ?? [],
    });

    const trips = computed(() => {
        const pid = programSyncScopeIdRef.value.trim();
        if (pid.length === 0) {
            return [];
        }
        return allTrips.value.filter((row) => String(row.program_id) === pid);
    });

    /**
     * @returns {Promise<void>}
     */
    async function ensureTripsReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {{
     *   scheduledDepartureAt: string,
     *   capacity: number,
     *   boatTypeId: string | null,
     *   waterRouteId: string | null,
     * }} input
     * @returns {Promise<string>} trip id
     */
    async function createTripRow(input) {
        await ensureTripsReady();

        const programId = programSyncScopeIdRef.value.trim();
        if (programId.length === 0) {
            throw new Error('Select a program before adding trips.');
        }

        const collection = tripsCollectionRef.value;
        if (!collection) {
            throw new Error('Trips collection is not ready.');
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const scheduled = String(input.scheduledDepartureAt).trim();
        const cap = Number.parseInt(String(input.capacity), 10);
        if (!Number.isFinite(cap) || cap < 1) {
            throw new Error('Trip capacity must be a positive integer.');
        }
        const boatTypeId =
            input.boatTypeId != null && String(input.boatTypeId).length > 0 ? String(input.boatTypeId) : null;
        const waterRouteId =
            input.waterRouteId != null && String(input.waterRouteId).length > 0
                ? String(input.waterRouteId)
                : null;

        const scheduledIso = Number.isNaN(Date.parse(scheduled))
            ? scheduled
            : new Date(scheduled).toISOString();

        collection.insert({
            id,
            program_id: programId,
            boat_type_id: boatTypeId,
            water_route_id: waterRouteId,
            scheduled_departure_at: scheduledIso,
            capacity: cap,
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
     * @param {string} tripId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     * @returns {Promise<void>}
     */
    async function patchTripRow(tripId, updateDraft) {
        await ensureTripsReady();
        const collection = tripsCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.update(tripId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });
        void refreshOutboxSnapshot();
    }

    /**
     * @param {string} tripId
     * @returns {Promise<void>}
     */
    async function deleteTripRow(tripId) {
        await ensureTripsReady();
        const collection = tripsCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.delete(tripId);
        void refreshOutboxSnapshot();
    }

    /**
     * @param {MaybeRefOrGetter<string | null | undefined>} tripId
     * @returns {import('vue').ComputedRef<Record<string, unknown> | null>}
     */
    function useTripById(tripId) {
        return computed(() => {
            const id = String(toValue(tripId) ?? '').trim();
            if (id.length === 0) {
                return null;
            }
            return trips.value.find((t) => String(t.id) === id) ?? null;
        });
    }

    /**
     * @param {MaybeRefOrGetter<string | null | undefined>} tripId
     * @returns {import('vue').ComputedRef<{ prev: string | null, next: string | null, index: number, total: number }>}
     */
    function useTripNeighborsInProgram(tripId) {
        return computed(() => {
            const id = String(toValue(tripId) ?? '').trim();
            const list = trips.value;
            const ids = list.map((t) => String(t.id));
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
        trips,
        ensureTripsReady,
        createTripRow,
        patchTripRow,
        deleteTripRow,
        hasTrips: computed(() => trips.value.length > 0),
        useTripById,
        useTripNeighborsInProgram,
    };
}
