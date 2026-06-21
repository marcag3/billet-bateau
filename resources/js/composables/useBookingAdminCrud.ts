import { useI18n } from 'vue-i18n';
import { ulid } from 'ulid';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { useNotifyAsyncAction } from './useNotifyAsyncAction';

export type BookingUpsertInput = {
    programId: string;
    tripId: string;
    contactName: string;
    contactEmail: string;
};

export type BookingTicketUpsertInput = {
    ticketTypeId: string;
    name: string;
    email: string;
    country: string;
    customFieldMap: Record<string, string>;
};

export function useBookingAdminCrud() {
    const powersync = getAppPowerSyncContext();
    const { t } = useI18n();
    const { runWithNotify } = useNotifyAsyncAction();

    async function createBooking(input: BookingUpsertInput): Promise<string> {
        const bookingsCol = powersync.collections.bookings.value;
        if (!bookingsCol) {
            throw new Error('Collections not ready.');
        }

        const bookingId = ulid();
        await bookingsCol
            .insert({
                id: bookingId,
                program_id: input.programId.trim(),
                trip_id: input.tripId.trim(),
                contact_name: input.contactName.trim(),
                contact_email: input.contactEmail.trim(),
            })
            .isPersisted.promise;

        void powersync.refreshOutboxSnapshot();
        return bookingId;
    }

    async function updateBooking(
        bookingId: string,
        input: Partial<BookingUpsertInput>,
    ): Promise<void> {
        const bookingsCol = powersync.collections.bookings.value;
        if (!bookingsCol) {
            throw new Error('Collections not ready.');
        }

        bookingsCol.update(bookingId, (draft) => {
            if (input.programId != null) {
                draft.program_id = input.programId.trim();
            }
            if (input.tripId != null) {
                draft.trip_id = input.tripId.trim();
            }
            if (input.contactName != null) {
                draft.contact_name = input.contactName.trim();
            }
            if (input.contactEmail != null) {
                draft.contact_email = input.contactEmail.trim();
            }
        });

        void powersync.refreshOutboxSnapshot();
    }

    async function deleteBooking(bookingId: string): Promise<void> {
        const bookingsCol = powersync.collections.bookings.value;
        if (!bookingsCol) {
            throw new Error('Collections not ready.');
        }
        await bookingsCol.delete(bookingId).isPersisted.promise;
        void powersync.refreshOutboxSnapshot();
    }

    async function insertBookingTicket(
        bookingId: string,
        input: BookingTicketUpsertInput,
    ): Promise<string> {
        const ticketsCol = powersync.collections.booking_tickets.value;
        if (!ticketsCol) {
            throw new Error('Collections not ready.');
        }

        const ticketId = ulid();
        await ticketsCol
            .insert({
                id: ticketId,
                booking_id: bookingId,
                ticket_type_id: input.ticketTypeId.trim(),
                name: input.name.trim(),
                email: input.email.trim(),
                country: input.country.trim().toUpperCase(),
                custom_fields: JSON.stringify(input.customFieldMap),
                waiver_confirmation_id: null,
            })
            .isPersisted.promise;

        void powersync.refreshOutboxSnapshot();
        return ticketId;
    }

    async function updateBookingTicket(
        ticketId: string,
        input: Partial<BookingTicketUpsertInput>,
    ): Promise<void> {
        const ticketsCol = powersync.collections.booking_tickets.value;
        if (!ticketsCol) {
            throw new Error('Collections not ready.');
        }

        ticketsCol.update(ticketId, (draft) => {
            if (input.ticketTypeId != null) {
                draft.ticket_type_id = input.ticketTypeId.trim();
            }
            if (input.name != null) {
                draft.name = input.name.trim();
            }
            if (input.email != null) {
                draft.email = input.email.trim();
            }
            if (input.country != null) {
                draft.country = input.country.trim().toUpperCase();
            }
            if (input.customFieldMap != null) {
                draft.custom_fields = JSON.stringify(input.customFieldMap);
            }
        });

        void powersync.refreshOutboxSnapshot();
    }

    async function removeBookingTicket(
        ticketId: string,
        bookingId: string,
        ticketsForBookingCount: number,
    ): Promise<void> {
        const bookingsCol = powersync.collections.bookings.value;
        const ticketsCol = powersync.collections.booking_tickets.value;

        if (!bookingsCol || !ticketsCol) {
            throw new Error('Collections not ready.');
        }

        await ticketsCol.delete(ticketId).isPersisted.promise;

        if (ticketsForBookingCount <= 1) {
            await bookingsCol.delete(bookingId).isPersisted.promise;
        }

        void powersync.refreshOutboxSnapshot();
    }

    async function addWalkInBooking(input: {
        programId: string;
        tripId: string;
        ticketQuantities: Record<string, number>;
        contactName: string;
        contactEmail: string;
        country: string;
        customFieldMap: Record<string, string>;
    }): Promise<{ bookingId: string; ticketIds: string[] } | undefined> {
        return runWithNotify(
            async () => {
                const bookingId = await createBooking({
                    programId: input.programId,
                    tripId: input.tripId,
                    contactName: input.contactName,
                    contactEmail: input.contactEmail,
                });

                const ticketIds: string[] = [];
                for (const [ticketTypeId, quantityRaw] of Object.entries(input.ticketQuantities)) {
                    const quantity = Math.max(0, Math.floor(Number(quantityRaw)));
                    for (let index = 0; index < quantity; index++) {
                        const ticketId = await insertBookingTicket(bookingId, {
                            ticketTypeId,
                            name: input.contactName,
                            email: input.contactEmail,
                            country: input.country,
                            customFieldMap: input.customFieldMap,
                        });
                        ticketIds.push(ticketId);
                    }
                }

                return { bookingId, ticketIds };
            },
            {
                successMessage: t('programsControl.walkInAdded'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    async function removeWalkInBookingTicket(
        ticketId: string,
        bookingId: string,
        ticketsForBookingCount: number,
    ): Promise<void> {
        await runWithNotify(
            async () => {
                await removeBookingTicket(ticketId, bookingId, ticketsForBookingCount);
            },
            {
                successMessage: t('programsControl.walkInRemoved'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    return {
        createBooking,
        updateBooking,
        deleteBooking,
        insertBookingTicket,
        updateBookingTicket,
        removeBookingTicket,
        addWalkInBooking,
        removeWalkInBookingTicket,
    };
}
