import { useI18n } from 'vue-i18n';
import { ulid } from 'ulid';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { useNotifyAsyncAction } from './useNotifyAsyncAction';
import type { TripWithRelationsRow } from '../powersync/joined-queries';
import type { VoyageOutput } from '../powersync/voyages.collection';

export function useControlPanelVoyageOps() {
    const powersync = getAppPowerSyncContext();
    const { t } = useI18n();
    const { runWithNotify } = useNotifyAsyncAction();

    async function startDeparture(input: {
        trip: TripWithRelationsRow;
        existingVoyage: VoyageOutput | null;
        boatIds: string[];
        guideIds: string[];
        existingVoyageBoatPivotIds: string[];
        existingVoyageGuidePivotIds: string[];
    }): Promise<void> {
        await runWithNotify(
            async () => {
                const voyagesCol = powersync.collections.voyages.value;
                const voyageBoatCol = powersync.collections.voyage_boat.value;
                const voyageGuideCol = powersync.collections.voyage_guide.value;

                if (!voyagesCol || !voyageBoatCol || !voyageGuideCol) {
                    throw new Error('Collections not ready.');
                }

                const waterRouteId = String(input.trip.water_route_id ?? '').trim();
                if (waterRouteId.length === 0) {
                    throw new Error(t('programsControl.missingWaterRoute'));
                }

                if (input.boatIds.length === 0) {
                    throw new Error(t('programsControl.boatsRequired'));
                }

                let voyageId =
                    input.existingVoyage?.id != null
                        ? String(input.existingVoyage.id)
                        : '';

                const programId = String(input.trip.program_id ?? '').trim();
                if (programId.length === 0) {
                    throw new Error(t('programsControl.missingProgram'));
                }

                if (voyageId.length === 0) {
                    voyageId = ulid();
                    await voyagesCol
                        .insert({
                            id: voyageId,
                            program_id: programId,
                            user_id: null,
                            trip_id: String(input.trip.id),
                            water_route_id: waterRouteId,
                            scheduled_departure_at: null,
                            started_at: null,
                            arrived_at: null,
                            status: 'ready',
                        })
                        .isPersisted.promise;
                } else {
                    voyagesCol.update(voyageId, (draft) => {
                        draft.program_id = programId;
                        draft.trip_id = String(input.trip.id);
                        draft.water_route_id = waterRouteId;
                        if (draft.status !== 'underway' && draft.status !== 'completed') {
                            draft.status = 'ready';
                        }
                    });
                }

                for (const pivotId of input.existingVoyageBoatPivotIds) {
                    await voyageBoatCol.delete(pivotId).isPersisted.promise;
                }

                for (const pivotId of input.existingVoyageGuidePivotIds) {
                    await voyageGuideCol.delete(pivotId).isPersisted.promise;
                }

                for (const boatId of input.boatIds) {
                    await voyageBoatCol
                        .insert({
                            id: ulid(),
                            voyage_id: voyageId,
                            boat_id: boatId,
                        })
                        .isPersisted.promise;
                }

                for (const guideId of input.guideIds) {
                    await voyageGuideCol
                        .insert({
                            id: ulid(),
                            voyage_id: voyageId,
                            guide_id: guideId,
                        })
                        .isPersisted.promise;
                }

                voyagesCol.update(voyageId, (draft) => {
                    draft.status = 'underway';
                    draft.started_at = new Date().toISOString();
                });

                void powersync.refreshOutboxSnapshot();
            },
            {
                successMessage: t('programsControl.departSuccess'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    async function markArrival(voyageId: string): Promise<void> {
        await runWithNotify(
            async () => {
                const col = powersync.collections.voyages.value;
                if (!col) {
                    throw new Error('Collections not ready.');
                }
                col.update(voyageId, (draft) => {
                    draft.status = 'completed';
                    draft.arrived_at = new Date().toISOString();
                });
                void powersync.refreshOutboxSnapshot();
            },
            {
                successMessage: t('programsControl.arriveSuccess'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    async function addPassenger(voyageId: string, name: string): Promise<void> {
        await runWithNotify(
            async () => {
                const col = powersync.collections.passengers.value;
                if (!col) {
                    throw new Error('Collections not ready.');
                }
                await col
                    .insert({
                        id: ulid(),
                        voyage_id: voyageId,
                        name: name.trim(),
                        booking_id: null,
                        check_in_id: null,
                        notes: null,
                    })
                    .isPersisted.promise;
                void powersync.refreshOutboxSnapshot();
            },
            {
                successMessage: t('programsControl.passengerAdded'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    async function removePassenger(passengerId: string): Promise<void> {
        await runWithNotify(
            async () => {
                const col = powersync.collections.passengers.value;
                if (!col) {
                    throw new Error('Collections not ready.');
                }
                await col.delete(passengerId).isPersisted.promise;
                void powersync.refreshOutboxSnapshot();
            },
            {
                successMessage: t('programsControl.passengerRemoved'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    return {
        startDeparture,
        markArrival,
        addPassenger,
        removePassenger,
    };
}
