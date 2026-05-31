import { useI18n } from 'vue-i18n';
import { ulid } from 'ulid';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { useNotifyAsyncAction } from './useNotifyAsyncAction';
import type { TripWithRelationsRow } from '../powersync/joined-queries';

export type WalkInBookingInput = {
    trip: TripWithRelationsRow;
    programId: string;
    ticketTypeId: string;
    contactName: string;
    contactEmail: string;
    customFieldMap: Record<string, string>;
};

export function useControlPanelWalkInBooking() {
    const powersync = getAppPowerSyncContext();
    const { t } = useI18n();
    const { runWithNotify } = useNotifyAsyncAction();

    async function addWalkInBooking(input: WalkInBookingInput): Promise<void> {
        await runWithNotify(
            async () => {
                const bookingsCol = powersync.collections.bookings.value;
                const ticketsCol = powersync.collections.booking_tickets.value;

                if (!bookingsCol || !ticketsCol) {
                    throw new Error('Collections not ready.');
                }

                const programId = input.programId.trim();
                const tripId = String(input.trip.id ?? '').trim();
                const ticketTypeId = input.ticketTypeId.trim();

                if (programId.length === 0 || tripId.length === 0 || ticketTypeId.length === 0) {
                    throw new Error(t('programsControl.errorGeneric'));
                }

                const bookingId = ulid();
                await bookingsCol
                    .insert({
                        id: bookingId,
                        program_id: programId,
                        trip_id: tripId,
                        contact_name: input.contactName.trim(),
                        contact_email: input.contactEmail.trim(),
                    })
                    .isPersisted.promise;

                await ticketsCol
                    .insert({
                        id: ulid(),
                        booking_id: bookingId,
                        ticket_type_id: ticketTypeId,
                        name: input.contactName.trim(),
                        email: input.contactEmail.trim(),
                        country: '',
                        custom_fields: JSON.stringify(input.customFieldMap),
                        waiver_confirmation_id: null,
                    })
                    .isPersisted.promise;

                void powersync.refreshOutboxSnapshot();
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
            },
            {
                successMessage: t('programsControl.walkInRemoved'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    return {
        addWalkInBooking,
        removeWalkInBookingTicket,
    };
}
