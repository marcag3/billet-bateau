import { useI18n } from 'vue-i18n';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import type { PassengerOutput } from '../powersync/passengers.collection';
import { useNotifyAsyncAction } from './useNotifyAsyncAction';

export function useControlPanelUndoCheckIn() {
    const powersync = getAppPowerSyncContext();
    const { t } = useI18n();
    const { runWithNotify } = useNotifyAsyncAction();

    async function undoCheckInForBooking(
        bookingId: string,
        passengers: PassengerOutput[],
    ): Promise<void> {
        const normalizedBookingId = bookingId.trim();
        if (normalizedBookingId.length === 0) {
            return;
        }

        await runWithNotify(
            async () => {
                const passengersCol = powersync.collections.passengers.value;
                const checkInsCol = powersync.collections.check_ins.value;

                if (!passengersCol || !checkInsCol) {
                    throw new Error('Collections not ready.');
                }

                const related = passengers.filter(
                    (passenger) =>
                        String(passenger.booking_id ?? '').trim() === normalizedBookingId,
                );

                if (related.length === 0) {
                    return;
                }

                let checkInId = '';
                for (const passenger of related) {
                    const id = String(passenger.check_in_id ?? '').trim();
                    if (id.length > 0) {
                        checkInId = id;
                    }
                    await passengersCol.delete(String(passenger.id)).isPersisted.promise;
                }

                if (checkInId.length > 0) {
                    await checkInsCol.delete(checkInId).isPersisted.promise;
                }

                void powersync.refreshOutboxSnapshot();
            },
            {
                successMessage: t('programsControl.checkInUndone'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    return { undoCheckInForBooking };
}
