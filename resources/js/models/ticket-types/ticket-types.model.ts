import { computed } from 'vue';
import { ulid } from 'ulid';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getProgramSyncScopeIdRef,
    getTicketTypesCollectionRef,
    refreshOutboxSnapshot,
} from '../../powersync/app-powersync.runtime';

export const ticketTypesModelDefinition = defineModel({
    name: 'ticket_types',
    collectionId: 'ticket_types',
    persistenceSchemaVersion: 1,
    pickUpdatePayload: (changes) => ({ ...changes }),
    orderBy: [
        { key: 'updated_at', direction: 'desc' },
        { key: 'created_at', direction: 'desc' },
        { key: 'id', direction: 'desc' },
    ],
    relations: defineRelations([]),
});

export function useTicketTypes() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const ticketTypesCollectionRef = getTicketTypesCollectionRef();
    const programSyncScopeIdRef = getProgramSyncScopeIdRef();

    const { data: allTicketTypes } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: ticketTypesModelDefinition.name,
        collection: ticketTypesCollectionRef,
        orderBy: ticketTypesModelDefinition.orderBy ?? [],
    });

    const ticketTypes = computed(() => {
        const pid = programSyncScopeIdRef.value.trim();
        if (pid.length === 0) {
            return [];
        }
        return allTicketTypes.value.filter((row) => String(row.program_id) === pid);
    });

    /**
     * @returns {Promise<void>}
     */
    async function ensureTicketTypesReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {{
     *   title: string,
     *   priceCents: number | null,
     *   isPayWhatYouCan: boolean,
     *   minPerPurchase: number,
     *   maxPerPurchase: number | null,
     *   tripInventoryCaps?: Record<string, number | null>,
     * }} input
     * @returns {Promise<string>}
     */
    async function createTicketTypeRow(input) {
        await ensureTicketTypesReady();

        const programId = programSyncScopeIdRef.value.trim();
        if (programId.length === 0) {
            throw new Error('Select a program before adding ticket types.');
        }

        const collection = ticketTypesCollectionRef.value;
        if (!collection) {
            throw new Error('Ticket types collection is not ready.');
        }

        const id = ulid();
        const now = new Date().toISOString();
        const title = String(input.title ?? '').trim();
        if (title.length === 0) {
            throw new Error('Ticket type title is required.');
        }

        await collection
            .insert({
                id,
                program_id: programId,
                title,
                price_cents: input.priceCents,
                is_pay_what_you_can: input.isPayWhatYouCan ? 1 : 0,
                min_per_purchase: input.minPerPurchase ?? 0,
                max_per_purchase: input.maxPerPurchase,
                trip_inventory_caps: JSON.stringify(input.tripInventoryCaps ?? {}),
                created_at: now,
                updated_at: now,
            })
            .isPersisted.promise;

        void refreshOutboxSnapshot();

        return id;
    }

    /**
     * @param {string} ticketTypeId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     * @returns {Promise<void>}
     */
    async function patchTicketTypeRow(ticketTypeId, updateDraft) {
        await ensureTicketTypesReady();
        const collection = ticketTypesCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.update(ticketTypeId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });

        void refreshOutboxSnapshot();
    }

    /**
     * @param {string} ticketTypeId
     * @returns {Promise<void>}
     */
    async function deleteTicketTypeRow(ticketTypeId) {
        await ensureTicketTypesReady();
        const collection = ticketTypesCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.delete(ticketTypeId);
        void refreshOutboxSnapshot();
    }

    return {
        ticketTypes,
        ensureTicketTypesReady,
        createTicketTypeRow,
        patchTicketTypeRow,
        deleteTicketTypeRow,
        hasTicketTypes: computed(() => ticketTypes.value.length > 0),
    };
}
