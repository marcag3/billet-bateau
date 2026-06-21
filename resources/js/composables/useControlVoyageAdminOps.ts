import { useI18n } from 'vue-i18n';
import { ulid } from 'ulid';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { useNotifyAsyncAction } from './useNotifyAsyncAction';
import type { TripWithRelationsRow } from '../powersync/joined-queries';
import type { VoyageOutput } from '../powersync/voyages.collection';

export type VoyagePivotInput = {
    boatIds: string[];
    guideIds: string[];
    existingVoyageBoatPivotIds: string[];
    existingVoyageGuidePivotIds: string[];
};

export type VoyageUpsertInput = {
    programId: string;
    tripId: string;
    waterRouteId: string;
    scheduledDepartureAt: string | null;
    status: string;
    startedAt: string | null;
    arrivedAt: string | null;
};

export function useControlVoyageAdminOps() {
    const powersync = getAppPowerSyncContext();
    const { t } = useI18n();
    const { runWithNotify } = useNotifyAsyncAction();

    async function syncVoyagePivots(voyageId: string, pivots: VoyagePivotInput): Promise<void> {
        const voyageBoatCol = powersync.collections.voyage_boat.value;
        const voyageGuideCol = powersync.collections.voyage_guide.value;

        if (!voyageBoatCol || !voyageGuideCol) {
            throw new Error('Collections not ready.');
        }

        for (const pivotId of pivots.existingVoyageBoatPivotIds) {
            await voyageBoatCol.delete(pivotId).isPersisted.promise;
        }

        for (const pivotId of pivots.existingVoyageGuidePivotIds) {
            await voyageGuideCol.delete(pivotId).isPersisted.promise;
        }

        for (const boatId of pivots.boatIds) {
            await voyageBoatCol
                .insert({
                    id: ulid(),
                    voyage_id: voyageId,
                    boat_id: boatId,
                })
                .isPersisted.promise;
        }

        for (const guideId of pivots.guideIds) {
            await voyageGuideCol
                .insert({
                    id: ulid(),
                    voyage_id: voyageId,
                    guide_id: guideId,
                })
                .isPersisted.promise;
        }
    }

    async function createVoyage(
        input: VoyageUpsertInput,
        pivots?: VoyagePivotInput,
    ): Promise<string> {
        const voyagesCol = powersync.collections.voyages.value;
        if (!voyagesCol) {
            throw new Error('Collections not ready.');
        }

        const voyageId = ulid();
        await voyagesCol
            .insert({
                id: voyageId,
                program_id: input.programId,
                user_id: null,
                trip_id: input.tripId,
                water_route_id: input.waterRouteId,
                scheduled_departure_at: input.scheduledDepartureAt,
                started_at: input.startedAt,
                arrived_at: input.arrivedAt,
                status: input.status,
            })
            .isPersisted.promise;

        if (pivots != null) {
            await syncVoyagePivots(voyageId, pivots);
        }

        void powersync.refreshOutboxSnapshot();
        return voyageId;
    }

    async function updateVoyage(
        voyageId: string,
        input: Partial<VoyageUpsertInput>,
        pivots?: VoyagePivotInput,
    ): Promise<void> {
        const voyagesCol = powersync.collections.voyages.value;
        if (!voyagesCol) {
            throw new Error('Collections not ready.');
        }

        voyagesCol.update(voyageId, (draft) => {
            if (input.programId != null) {
                draft.program_id = input.programId;
            }
            if (input.tripId != null) {
                draft.trip_id = input.tripId;
            }
            if (input.waterRouteId != null) {
                draft.water_route_id = input.waterRouteId;
            }
            if (input.scheduledDepartureAt !== undefined) {
                draft.scheduled_departure_at = input.scheduledDepartureAt;
            }
            if (input.startedAt !== undefined) {
                draft.started_at = input.startedAt;
            }
            if (input.arrivedAt !== undefined) {
                draft.arrived_at = input.arrivedAt;
            }
            if (input.status != null) {
                draft.status = input.status;
            }
        });

        if (pivots != null) {
            await syncVoyagePivots(voyageId, pivots);
        }

        void powersync.refreshOutboxSnapshot();
    }

    async function deleteVoyage(voyageId: string): Promise<void> {
        const voyagesCol = powersync.collections.voyages.value;
        if (!voyagesCol) {
            throw new Error('Collections not ready.');
        }
        await voyagesCol.delete(voyageId).isPersisted.promise;
        void powersync.refreshOutboxSnapshot();
    }

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
                if (!voyagesCol) {
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
                    voyageId = await createVoyage({
                        programId,
                        tripId: String(input.trip.id),
                        waterRouteId,
                        scheduledDepartureAt: null,
                        status: 'ready',
                        startedAt: null,
                        arrivedAt: null,
                    });
                } else {
                    await updateVoyage(voyageId, {
                        programId,
                        tripId: String(input.trip.id),
                        waterRouteId,
                    });
                }

                await syncVoyagePivots(voyageId, {
                    boatIds: input.boatIds,
                    guideIds: input.guideIds,
                    existingVoyageBoatPivotIds: input.existingVoyageBoatPivotIds,
                    existingVoyageGuidePivotIds: input.existingVoyageGuidePivotIds,
                });

                await updateVoyage(voyageId, {
                    status: 'underway',
                    startedAt: new Date().toISOString(),
                });
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
                await updateVoyage(voyageId, {
                    status: 'completed',
                    arrivedAt: new Date().toISOString(),
                });
            },
            {
                successMessage: t('programsControl.arriveSuccess'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    async function revertDeparture(voyageId: string): Promise<void> {
        await runWithNotify(
            async () => {
                await updateVoyage(voyageId, {
                    status: 'ready',
                    startedAt: null,
                });
            },
            {
                successMessage: t('programsControlAdmin.revertDepartSuccess'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    async function revertArrival(voyageId: string): Promise<void> {
        await runWithNotify(
            async () => {
                await updateVoyage(voyageId, {
                    status: 'underway',
                    arrivedAt: null,
                });
            },
            {
                successMessage: t('programsControlAdmin.revertArriveSuccess'),
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

    async function cancelTrip(input: {
        trip: TripWithRelationsRow;
        existingVoyage: VoyageOutput | null;
    }): Promise<void> {
        await runWithNotify(
            async () => {
                const waterRouteId = String(input.trip.water_route_id ?? '').trim();
                if (waterRouteId.length === 0) {
                    throw new Error(t('programsControl.missingWaterRoute'));
                }

                const programId = String(input.trip.program_id ?? '').trim();
                if (programId.length === 0) {
                    throw new Error(t('programsControl.missingProgram'));
                }

                const voyageStatus = String(input.existingVoyage?.status ?? '').trim();
                if (
                    voyageStatus === 'underway' ||
                    voyageStatus === 'completed' ||
                    voyageStatus === 'cancelled'
                ) {
                    throw new Error(t('programsControl.cancelTripBlocked'));
                }

                let voyageId =
                    input.existingVoyage?.id != null
                        ? String(input.existingVoyage.id)
                        : '';

                if (voyageId.length === 0) {
                    await createVoyage({
                        programId,
                        tripId: String(input.trip.id),
                        waterRouteId,
                        scheduledDepartureAt: null,
                        status: 'cancelled',
                        startedAt: null,
                        arrivedAt: null,
                    });
                } else {
                    await updateVoyage(voyageId, { status: 'cancelled' });
                }
            },
            {
                successMessage: t('programsControl.cancelTripSuccess'),
                errorGeneric: t('programsControl.errorGeneric'),
            },
        );
    }

    return {
        createVoyage,
        updateVoyage,
        deleteVoyage,
        syncVoyagePivots,
        startDeparture,
        markArrival,
        revertDeparture,
        revertArrival,
        addPassenger,
        removePassenger,
        cancelTrip,
    };
}
