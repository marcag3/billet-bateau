import type { TripWithRelationsRow } from '../powersync/joined-queries';
import { useBookingAdminCrud, type BookingTicketUpsertInput } from './useBookingAdminCrud';

export type WalkInBookingInput = {
    trip: TripWithRelationsRow;
    programId: string;
    ticketTypeId: string;
    contactName: string;
    contactEmail: string;
    country: string;
    customFieldMap: Record<string, string>;
};

export function useControlPanelWalkInBooking() {
    const crud = useBookingAdminCrud();

    async function addWalkInBooking(
        input: WalkInBookingInput,
    ): Promise<
        | {
              bookingId: string;
              ticket: { id: string; name: string; booking_id: string };
          }
        | undefined
    > {
        const result = await crud.addWalkInBooking({
            programId: input.programId,
            tripId: String(input.trip.id),
            ticketTypeId: input.ticketTypeId,
            contactName: input.contactName,
            contactEmail: input.contactEmail,
            country: input.country,
            customFieldMap: input.customFieldMap,
        });

        if (result == null) {
            return undefined;
        }

        return {
            bookingId: result.bookingId,
            ticket: {
                id: result.ticketId,
                name: input.contactName.trim(),
                booking_id: result.bookingId,
            },
        };
    }

    return {
        addWalkInBooking,
        removeWalkInBookingTicket: crud.removeWalkInBookingTicket,
    };
}

export type { BookingTicketUpsertInput };
