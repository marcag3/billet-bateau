import { computed } from 'vue';
import { ulid } from 'ulid';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getPowerSyncDbRef,
    getProgramSyncScopeIdRef,
    getTemplateDaySlotsCollectionRef,
    getTemplateDaysCollectionRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';

export const templateDaySlotsModelDefinition = defineModel({
    name: 'template_day_slots',
    collectionId: 'template_day_slots',
    persistenceSchemaVersion: 1,
    pickUpdatePayload: (changes) => ({ ...changes }),
    orderBy: [
        { key: 'sort_order', direction: 'asc' },
        { key: 'departure_time', direction: 'asc' },
    ],
    relations: defineRelations([]),
});

export function useTemplateDaySlots() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const slotsCollectionRef = getTemplateDaySlotsCollectionRef();
    const daysCollectionRef = getTemplateDaysCollectionRef();
    const programSyncScopeIdRef = getProgramSyncScopeIdRef();

    const { data: allTemplateDays } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: 'template_days',
        collection: daysCollectionRef,
        orderBy: [],
    });

    const { data: allSlots } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: templateDaySlotsModelDefinition.name,
        collection: slotsCollectionRef,
        orderBy: templateDaySlotsModelDefinition.orderBy ?? [],
    });

    const templateDaySlots = computed(() => {
        const pid = programSyncScopeIdRef.value.trim();
        if (pid.length === 0) {
            return [];
        }
        const dayIds = new Set(
            allTemplateDays.value
                .filter((row) => String(row.program_id) === pid)
                .map((row) => String(row.id)),
        );
        return allSlots.value.filter((row) => dayIds.has(String(row.template_day_id)));
    });

    async function ensureTemplateDaySlotsReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {{
     *   templateDayId: string,
     *   departureTime: string,
     *   capacity: number,
     *   sortOrder?: number,
     *   boatTypeId?: string | null,
     *   waterRouteId?: string | null,
     * }} input
     * @returns {Promise<string>}
     */
    async function createTemplateDaySlotRow(input) {
        await ensureTemplateDaySlotsReady();

        const collection = slotsCollectionRef.value;
        if (!collection) {
            throw new Error('Template day slots collection is not ready.');
        }

        const id = ulid();
        const now = new Date().toISOString();
        const cap = Number.parseInt(String(input.capacity), 10);
        if (!Number.isFinite(cap) || cap < 1) {
            throw new Error('Capacity must be a positive integer.');
        }

        collection.insert({
            id,
            template_day_id: String(input.templateDayId),
            sort_order: input.sortOrder ?? 0,
            departure_time: String(input.departureTime).trim(),
            capacity: cap,
            boat_type_id:
                input.boatTypeId != null && String(input.boatTypeId).length > 0 ? String(input.boatTypeId) : null,
            water_route_id:
                input.waterRouteId != null && String(input.waterRouteId).length > 0
                    ? String(input.waterRouteId)
                    : null,
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
     * @param {string} slotId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     */
    async function patchTemplateDaySlotRow(slotId, updateDraft) {
        await ensureTemplateDaySlotsReady();
        const collection = slotsCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.update(slotId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });
        void refreshOutboxSnapshot();
    }

    /**
     * @param {string} slotId
     */
    async function deleteTemplateDaySlotRow(slotId) {
        await ensureTemplateDaySlotsReady();
        const collection = slotsCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.delete(slotId);
        void refreshOutboxSnapshot();
    }

    return {
        templateDaySlots,
        ensureTemplateDaySlotsReady,
        createTemplateDaySlotRow,
        patchTemplateDaySlotRow,
        deleteTemplateDaySlotRow,
    };
}
