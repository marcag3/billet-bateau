import { useI18n } from 'vue-i18n';
import { ulid } from 'ulid';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { useNotifyAsyncAction } from './useNotifyAsyncAction';
import type { ControlPanelTripCardModel } from './useControlPanelDayBoard';

export function useControlPanelCheckIn() {
    const powersync = getAppPowerSyncContext();
    const { t } = useI18n();
    const { runWithNotify } = useNotifyAsyncAction();

    async function checkInBooking(input: {
        card: ControlPanelTripCardModel;
        bookingId: string;
        tickets: { id: string; name: string; booking_id: string }[];
    }): Promise<void> {
        const bookingId = input.bookingId.trim();
        if (bookingId.length === 0) {
            return;
        }

        if (input.card.checkedInBookingIds.includes(bookingId)) {
            return;
        }

        const ticketsForBooking = input.tickets.filter(
            (ticket) => String(ticket.booking_id).trim() === bookingId,
        );

        if (ticketsForBooking.length === 0) {
            return;
        }

        await runWithNotify(
            async () => {
                const voyagesCol = powersync.collections.voyages.value;
                const checkInsCol = powersync.collections.check_ins.value;
                const passengersCol = powersync.collections.passengers.value;

                if (!voyagesCol || !checkInsCol || !passengersCol) {
                    throw new Error('Collections not ready.');
                }

                const trip = input.card.trip;
                const waterRouteId = String(trip.water_route_id ?? '').trim();
                if (waterRouteId.length === 0) {
                    throw new Error(t('programsControl.missingWaterRoute'));
                }

                const programId = String(trip.program_id ?? '').trim();
                if (programId.length === 0) {
                    throw new Error(t('programsControl.missingProgram'));
                }

                const capacity = trip.capacity;
                if (capacity != null && Number.isFinite(Number(capacity))) {
                    const maxSeats = Math.max(0, Math.floor(Number(capacity)));
                    const pendingTicketCount = input.card.pendingBookingGroups.reduce(
                        (sum, group) => sum + group.ticketCount,
                        0,
                    );
                    const occupied = input.card.passengers.length + pendingTicketCount;
                    if (occupied > maxSeats) {
                        throw new Error(t('programsControl.capacityFull'));
                    }
                }

                let voyageId =
                    input.card.voyage?.id != null ? String(input.card.voyage.id) : '';

                if (voyageId.length === 0) {
                    voyageId = ulid();
                    await voyagesCol
                        .insert({
                            id: voyageId,
                            program_id: programId,
                            user_id: null,
                            trip_id: String(trip.id),
                            water_route_id: waterRouteId,
                            scheduled_departure_at: null,
                            started_at: null,
                            arrived_at: null,
                            status: 'ready',
                        })
                        .isPersisted.promise;
                }

                const checkInId = ulid();
                await checkInsCol
                    .insert({
                        id: checkInId,
                        booking_id: bookingId,
                        voyage_id: voyageId,
                        notes: null,
                    })
                    .isPersisted.promise;

                for (const ticket of ticketsForBooking) {
                    const name = ticket.name.trim();
                    if (name.length === 0) {
                        continue;
                    }
                    await passengersCol
                        .insert({
                            id: ulid(),
                            voyage_id: voyageId,
                            name,
                            booking_id: bookingId,
                            check_in_id: checkInId,
                            notes: null,
                        })
                        .isPersisted.promise;
                }

                void powersync.refreshOutboxSnapshot();
            },
            {
                successMessage: t('programsControl.checkInSuccess'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    return { checkInBooking };
}
