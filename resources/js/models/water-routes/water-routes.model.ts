import { computed, toValue } from 'vue';
import { ulid } from 'ulid';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getProgramSyncScopeIdRef,
    getWaterRoutesCollectionRef,
    refreshOutboxSnapshot,
} from '../../powersync/app-powersync.runtime';

/** Default LineString (Montreal area) as GeoJSON; matches server tests / upload applier. */
export const DEFAULT_WATER_ROUTE_TRACE_GEOJSON =
    '{"type":"LineString","coordinates":[[-73.5673,45.5017],[-73.5540,45.5080]]}';

export const waterRoutesModelDefinition = defineModel({
    name: 'water_routes',
    collectionId: 'water_routes',
    persistenceSchemaVersion: 2,
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
    const programSyncScopeIdRef = getProgramSyncScopeIdRef();

    const { data: allWaterRoutes } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: waterRoutesModelDefinition.name,
        collection: waterRoutesCollectionRef,
        orderBy: waterRoutesModelDefinition.orderBy ?? [],
    });

    const waterRoutes = computed(() => {
        const pid = programSyncScopeIdRef.value.trim();
        if (pid.length === 0) {
            return [];
        }
        return allWaterRoutes.value.filter((row) => String(row.program_id) === pid);
    });

    /**
     * @returns {Promise<void>}
     */
    async function ensureWaterRoutesReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {{
     *   name: string,
     *   durationMinutes: number,
     *   traceGeoJson?: string | null,
     * }} input
     * @returns {Promise<string>} water route id
     */
    async function createWaterRouteRow(input) {
        await ensureWaterRoutesReady();

        const programId = programSyncScopeIdRef.value.trim();
        if (programId.length === 0) {
            throw new Error('Select a program before adding water routes.');
        }

        const collection = waterRoutesCollectionRef.value;
        if (!collection) {
            throw new Error('Water routes collection is not ready.');
        }

        const id = ulid();
        const now = new Date().toISOString();
        const name = String(input.name ?? '').trim();
        const duration = Number.parseInt(String(input.durationMinutes), 10);
        if (!Number.isFinite(duration) || duration < 1) {
            throw new Error('Duration must be a positive integer (minutes).');
        }
        const traceRaw = input.traceGeoJson != null ? String(input.traceGeoJson).trim() : '';
        const trace = traceRaw.length > 0 ? traceRaw : DEFAULT_WATER_ROUTE_TRACE_GEOJSON;

        await collection
            .insert({
                id,
                program_id: programId,
                name: name.length > 0 ? name : 'Untitled',
                trace,
                duration_minutes: duration,
                created_at: now,
                updated_at: now,
            })
            .isPersisted.promise;

        void refreshOutboxSnapshot();

        return id;
    }

    /**
     * @param {string} waterRouteId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     * @returns {Promise<void>}
     */
    async function patchWaterRouteRow(waterRouteId, updateDraft) {
        await ensureWaterRoutesReady();
        const collection = waterRoutesCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.update(waterRouteId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });
        void refreshOutboxSnapshot();
    }

    /**
     * @param {string} waterRouteId
     * @returns {Promise<void>}
     */
    async function deleteWaterRouteRow(waterRouteId) {
        await ensureWaterRoutesReady();
        const collection = waterRoutesCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.delete(waterRouteId);
        void refreshOutboxSnapshot();
    }

    /**
     * @param {import('vue').MaybeRefOrGetter<string | null | undefined>} waterRouteId
     * @returns {import('vue').ComputedRef<Record<string, unknown> | null>}
     */
    function useWaterRouteById(waterRouteId) {
        return computed(() => {
            const id = String(toValue(waterRouteId) ?? '').trim();
            if (id.length === 0) {
                return null;
            }
            return waterRoutes.value.find((r) => String(r.id) === id) ?? null;
        });
    }

    return {
        waterRoutes,
        ensureWaterRoutesReady,
        createWaterRouteRow,
        patchWaterRouteRow,
        deleteWaterRouteRow,
        useWaterRouteById,
    };
}
