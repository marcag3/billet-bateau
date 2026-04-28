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
    getTemplateDaysCollectionRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';

export const templateDaysModelDefinition = defineModel({
    name: 'template_days',
    collectionId: 'template_days',
    persistenceSchemaVersion: 1,
    pickUpdatePayload: (changes) => ({ ...changes }),
    orderBy: [
        { key: 'name', direction: 'asc' },
        { key: 'updated_at', direction: 'desc' },
    ],
    relations: defineRelations([]),
});

export function useTemplateDays() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const templateDaysCollectionRef = getTemplateDaysCollectionRef();
    const programSyncScopeIdRef = getProgramSyncScopeIdRef();

    const { data: allTemplateDays } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: templateDaysModelDefinition.name,
        collection: templateDaysCollectionRef,
        orderBy: templateDaysModelDefinition.orderBy ?? [],
    });

    const templateDays = computed(() => {
        const pid = programSyncScopeIdRef.value.trim();
        if (pid.length === 0) {
            return [];
        }
        return allTemplateDays.value.filter((row) => String(row.program_id) === pid);
    });

    async function ensureTemplateDaysReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {{ name: string }} input
     * @returns {Promise<string>}
     */
    async function createTemplateDayRow(input) {
        await ensureTemplateDaysReady();

        const programId = programSyncScopeIdRef.value.trim();
        if (programId.length === 0) {
            throw new Error('Select a program before adding template days.');
        }

        const collection = templateDaysCollectionRef.value;
        if (!collection) {
            throw new Error('Template days collection is not ready.');
        }

        const id = ulid();
        const now = new Date().toISOString();
        const name = String(input.name ?? '').trim();

        collection.insert({
            id,
            program_id: programId,
            name: name.length > 0 ? name : 'Untitled',
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
     * @param {string} templateDayId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     * @returns {Promise<void>}
     */
    async function patchTemplateDayRow(templateDayId, updateDraft) {
        await ensureTemplateDaysReady();
        const collection = templateDaysCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.update(templateDayId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });
        void refreshOutboxSnapshot();
    }

    /**
     * @param {string} templateDayId
     * @returns {Promise<void>}
     */
    async function deleteTemplateDayRow(templateDayId) {
        await ensureTemplateDaysReady();
        const collection = templateDaysCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.delete(templateDayId);
        void refreshOutboxSnapshot();
    }

    return {
        templateDays,
        ensureTemplateDaysReady,
        createTemplateDayRow,
        patchTemplateDayRow,
        deleteTemplateDayRow,
    };
}
