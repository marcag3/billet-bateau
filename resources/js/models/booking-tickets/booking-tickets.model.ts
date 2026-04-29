import { computed, toValue } from 'vue';
import { ulid } from 'ulid';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getBookingTicketsCollectionRef,
    getPowerSyncDbRef,
    refreshOutboxSnapshot,
    waitForUploadQueueDrained,
} from '../../powersync/app-powersync.runtime';

export const bookingTicketsModelDefinition = defineModel({
    name: 'booking_tickets',
    collectionId: 'booking_tickets',
    persistenceSchemaVersion: 1,
    pickUpdatePayload: (changes) => ({ ...changes }),
    orderBy: [
        { key: 'updated_at', direction: 'desc' },
        { key: 'created_at', direction: 'desc' },
        { key: 'id', direction: 'desc' },
    ],
    relations: defineRelations([]),
});

export function useBookingTickets() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const bookingTicketsCollectionRef = getBookingTicketsCollectionRef();

    const { data: bookingTickets } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: bookingTicketsModelDefinition.name,
        collection: bookingTicketsCollectionRef,
        orderBy: bookingTicketsModelDefinition.orderBy ?? [],
    });

    /**
     * @returns {Promise<void>}
     */
    async function ensureBookingTicketsReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
    }

    /**
     * @param {{
     *   bookingId: string,
     *   ticketTypeId: string,
     *   name: string,
     *   email: string,
     *   country: string,
     *   customFields?: Record<string, unknown>,
     *   waiverConfirmationId?: string | null,
     * }} input
     * @returns {Promise<string>}
     */
    async function createBookingTicketRow(input) {
        await ensureBookingTicketsReady();

        const collection = bookingTicketsCollectionRef.value;
        if (!collection) {
            throw new Error('Booking tickets collection is not ready.');
        }

        const id = ulid();
        const now = new Date().toISOString();

        collection.insert({
            id,
            booking_id: String(input.bookingId ?? '').trim(),
            ticket_type_id: String(input.ticketTypeId ?? '').trim(),
            name: String(input.name ?? '').trim(),
            email: String(input.email ?? '').trim(),
            country: String(input.country ?? '').trim(),
            custom_fields: JSON.stringify(input.customFields ?? {}),
            waiver_confirmation_id:
                input.waiverConfirmationId != null && String(input.waiverConfirmationId).length > 0
                    ? String(input.waiverConfirmationId)
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
     * @param {string} bookingTicketId
     * @param {(draft: Record<string, unknown>) => void} updateDraft
     * @returns {Promise<void>}
     */
    async function patchBookingTicketRow(bookingTicketId, updateDraft) {
        await ensureBookingTicketsReady();
        const collection = bookingTicketsCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.update(bookingTicketId, (draft) => {
            updateDraft(draft);
            draft.updated_at = new Date().toISOString();
        });

        void refreshOutboxSnapshot();
    }

    /**
     * @param {string} bookingTicketId
     * @returns {Promise<void>}
     */
    async function deleteBookingTicketRow(bookingTicketId) {
        await ensureBookingTicketsReady();
        const collection = bookingTicketsCollectionRef.value;
        if (!collection) {
            return;
        }

        collection.delete(bookingTicketId);
        void refreshOutboxSnapshot();
    }

    /**
     * @param {MaybeRefOrGetter<string | null | undefined>} bookingId
     * @returns {import('vue').ComputedRef<Array<Record<string, unknown>>>}
     */
    function useBookingTicketsByBookingId(bookingId) {
        return computed(() => {
            const id = String(toValue(bookingId) ?? '').trim();
            if (id.length === 0) {
                return [];
            }
            return bookingTickets.value.filter((row) => String(row.booking_id) === id);
        });
    }

    return {
        bookingTickets,
        ensureBookingTicketsReady,
        createBookingTicketRow,
        patchBookingTicketRow,
        deleteBookingTicketRow,
        useBookingTicketsByBookingId,
        hasBookingTickets: computed(() => bookingTickets.value.length > 0),
    };
}
