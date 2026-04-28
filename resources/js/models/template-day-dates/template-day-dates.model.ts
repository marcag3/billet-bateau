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
    getTemplateDayDatesCollectionRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';

export const templateDayDatesModelDefinition = defineModel({
    name: 'template_day_dates',
    collectionId: 'template_day_dates',
    persistenceSchemaVersion: 1,
    pickUpdatePayload: (changes) => ({ ...changes }),
    orderBy: [
        { key: 'service_date', direction: 'asc' },
        { key: 'updated_at', direction: 'desc' },
    ],
    relations: defineRelations([]),
});

export function useTemplateDayDates() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const datesCollectionRef = getTemplateDayDatesCollectionRef();
    const programSyncScopeIdRef = getProgramSyncScopeIdRef();

    const { data: allDates } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: templateDayDatesModelDefinition.name,
        collection: datesCollectionRef,
        orderBy: templateDayDatesModelDefinition.orderBy ?? [],
    });

    const templateDayDates = computed(() => {
        const pid = programSyncScopeIdRef.value.trim();
        if (pid.length === 0) {
            return [];
        }
        return allDates.value.filter((row) => String(row.program_id) === pid);
    });

    async function ensureTemplateDayDatesReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {{ templateDayId: string, serviceDate: string }} input
     * @returns {Promise<string>}
     */
    async function createTemplateDayDateRow(input) {
        await ensureTemplateDayDatesReady();

        const programId = programSyncScopeIdRef.value.trim();
        if (programId.length === 0) {
            throw new Error('Select a program before applying template days.');
        }

        const collection = datesCollectionRef.value;
        if (!collection) {
            throw new Error('Template day dates collection is not ready.');
        }

        const id = ulid();
        const now = new Date().toISOString();

        collection.insert({
            id,
            program_id: programId,
            template_day_id: String(input.templateDayId),
            service_date: String(input.serviceDate ?? '').trim(),
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
     * @param {string} rowId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     */
    async function patchTemplateDayDateRow(rowId, updateDraft) {
        await ensureTemplateDayDatesReady();
        const collection = datesCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.update(rowId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });
        void refreshOutboxSnapshot();
    }

    /**
     * @param {string} rowId
     */
    async function deleteTemplateDayDateRow(rowId) {
        await ensureTemplateDayDatesReady();
        const collection = datesCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.delete(rowId);
        void refreshOutboxSnapshot();
    }

    return {
        templateDayDates,
        ensureTemplateDayDatesReady,
        createTemplateDayDateRow,
        patchTemplateDayDateRow,
        deleteTemplateDayDateRow,
    };
}
