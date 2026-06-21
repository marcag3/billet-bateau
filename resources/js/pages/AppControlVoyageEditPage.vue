<template>
    <AppEntityEditPageLayout
        :title="t('programsControlAdmin.editVoyageTitle')"
        :back-to="backTo"
        :back-label="t('programsControlAdmin.backToVoyages')"
    >
        <q-banner v-if="showNotFound" class="bg-warning text-dark mb-4" rounded>
            {{ t('programsControlAdmin.voyageNotFound') }}
            <template #action>
                <q-btn color="primary" flat :label="t('programsControlAdmin.backToVoyages')" :to="backTo" />
            </template>
        </q-banner>

        <template v-else-if="currentVoyage">
            <AppCardSection :label="t('programsControlAdmin.voyageDetails')">
                <div class="text-body1 q-mb-md">
                    {{ t('programsControlAdmin.status') }}:
                    <strong>{{ statusLabel(currentVoyage.status) }}</strong>
                </div>

                <q-form @submit.prevent="onSaveSubmit">
                    <div class="column gap-4">
                        <q-select
                            v-model="tripId"
                            v-bind="tripIdProps"
                            outlined
                            emit-value
                            map-options
                            :options="tripOptions"
                            :label="t('programsControlAdmin.trip')"
                            :disable="isSubmitting || isDeleting || !fieldsEditable"
                        />
                        <q-select
                            v-model="waterRouteId"
                            v-bind="waterRouteIdProps"
                            outlined
                            emit-value
                            map-options
                            :options="waterRouteOptions"
                            :label="t('programsControlAdmin.waterRoute')"
                            :disable="isSubmitting || isDeleting || !fieldsEditable"
                        />
                        <q-input
                            v-model="scheduledDepartureAt"
                            outlined
                            type="datetime-local"
                            :label="t('programsControlAdmin.scheduledDeparture')"
                            :disable="isSubmitting || isDeleting || !fieldsEditable"
                        />
                        <q-input
                            v-model="startedAt"
                            outlined
                            type="datetime-local"
                            :label="t('programsControlAdmin.startedAt')"
                            :disable="isSubmitting || isDeleting || !timestampsEditable"
                        />
                        <q-input
                            v-model="arrivedAt"
                            outlined
                            type="datetime-local"
                            :label="t('programsControlAdmin.arrivedAt')"
                            :disable="isSubmitting || isDeleting || !timestampsEditable"
                        />
                        <q-select
                            v-model="boatIds"
                            outlined
                            multiple
                            use-chips
                            emit-value
                            map-options
                            :options="boatOptions"
                            :label="t('programsControl.selectBoats')"
                            :disable="isSubmitting || isDeleting || !pivotsEditable"
                        />
                        <q-select
                            v-model="guideIds"
                            outlined
                            multiple
                            use-chips
                            emit-value
                            map-options
                            :options="guideOptions"
                            :label="t('programsControl.selectGuides')"
                            :disable="isSubmitting || isDeleting || !pivotsEditable"
                        />
                        <div class="row gap-2 flex-wrap">
                            <q-btn
                                color="primary"
                                type="submit"
                                :label="t('programsControlAdmin.saveVoyage')"
                                :loading="isSubmitting"
                                :disable="!meta.valid || isSubmitting || isDeleting || !fieldsEditable"
                            />
                            <q-btn
                                v-if="canDelete"
                                flat
                                color="negative"
                                icon="delete"
                                :label="t('common.delete')"
                                :disable="isSubmitting || isDeleting"
                                @click="confirmDelete"
                            />
                        </div>
                    </div>
                </q-form>
            </AppCardSection>

            <AppCardSection :label="t('programsControlAdmin.voyageActions')">
                <div class="row gap-2 flex-wrap">
                    <q-btn
                        v-if="canDepart"
                        color="primary"
                        no-caps
                        :label="t('programsControl.depart')"
                        @click="onDepart"
                    />
                    <q-btn
                        v-if="canArrive"
                        color="secondary"
                        no-caps
                        :label="t('programsControl.arrive')"
                        @click="onArrive"
                    />
                    <q-btn
                        v-if="canRevertDepart"
                        outline
                        color="primary"
                        no-caps
                        :label="t('programsControlAdmin.revertDepart')"
                        @click="onRevertDepart"
                    />
                    <q-btn
                        v-if="canRevertArrive"
                        outline
                        color="secondary"
                        no-caps
                        :label="t('programsControlAdmin.revertArrive')"
                        @click="onRevertArrive"
                    />
                    <q-btn
                        v-if="canCancel"
                        flat
                        color="negative"
                        no-caps
                        :label="t('programsControl.cancelTrip')"
                        @click="onCancel"
                    />
                </div>
            </AppCardSection>

            <AppCardSection :label="t('programsControl.passengers')">
                <AppEmptyListRow :show="passengers.length === 0" :message="t('programsControlAdmin.noPassengers')" />
                <q-list v-if="passengers.length > 0" separator>
                    <q-item v-for="passenger in passengers" :key="String(passenger.id)">
                        <q-item-section>{{ passenger.name ?? '—' }}</q-item-section>
                        <q-item-section side>
                            <q-btn
                                v-if="passenger.booking_id"
                                flat
                                dense
                                color="primary"
                                :label="t('programsControlAdmin.viewBooking')"
                                :to="controlContextNamedRoute(route, 'control.bookings.edit', {
                                    bookingId: String(passenger.booking_id),
                                })"
                            />
                            <q-btn
                                flat
                                dense
                                color="negative"
                                icon="person_remove"
                                :aria-label="t('programsControl.removePassenger')"
                                @click="() => onRemovePassenger(String(passenger.id))"
                            />
                        </q-item-section>
                    </q-item>
                </q-list>
            </AppCardSection>
        </template>
    </AppEntityEditPageLayout>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import {
    createVoyageAdminFormSchema,
    type VoyageAdminFormValues,
} from '../models/voyages/voyages.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import {
    isoToLocalDatetimeInputValue,
    localDatetimeInputValueToIso,
} from '../utilities/datetime-input';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { joinTripsWithRelationsFrom, type TripWithRelationsRow } from '../powersync/joined-queries';
import { liveQueryRows } from '../powersync/live-query-casts';
import type { VoyageOutput } from '../powersync/voyages.collection';
import type { PassengerOutput } from '../powersync/passengers.collection';
import { useControlVoyageAdminOps } from '../composables/useControlVoyageAdminOps';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import { useNotifyErrorFromCatch } from '../composables/useNotifyErrorFromCatch';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import AppEntityEditPageLayout from '../layouts/AppEntityEditPageLayout.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppEmptyListRow from '../components/ui/AppEmptyListRow.vue';

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();
const { runWithNotify } = useNotifyAsyncAction();
const {
    updateVoyage,
    deleteVoyage,
    startDeparture,
    markArrival,
    revertDeparture,
    revertArrival,
    removePassenger,
    cancelTrip,
} = useControlVoyageAdminOps();

const isDeleting = ref(false);
const scheduledDepartureAt = ref('');
const startedAt = ref('');
const arrivedAt = ref('');

const voyageId = computed(() => String(route.params.voyageId ?? '').trim());
const activeProgramIdRef = powersync.activeProgramIdRef;

const backTo = computed(() => controlContextNamedRoute(route, 'control.voyages.list'));

const schema = createVoyageAdminFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } =
    useForm<VoyageAdminFormValues>({
        validationSchema: schema,
        initialValues: {
            tripId: '',
            waterRouteId: '',
            scheduledDepartureAt: null,
            startedAt: null,
            arrivedAt: null,
            boatIds: [],
            guideIds: [],
        },
    });

const quasarField = createQuasarFieldBinder(defineField);
const [tripId, tripIdProps] = quasarField('tripId');
const [waterRouteId, waterRouteIdProps] = quasarField('waterRouteId');
const [boatIds] = quasarField('boatIds');
const [guideIds] = quasarField('guideIds');

const { data: voyageRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.voyages.value;
        const id = voyageId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ v: col }).where(({ v }) => eq(v.id, id));
    },
    [powersync.collections.voyages, voyageId],
);

const currentVoyage = computed(() => {
    const rows = liveQueryRows<VoyageOutput>(voyageRaw.value);
    return rows[0] ?? null;
});

const showNotFound = computed(
    () => voyageId.value.length > 0 && voyageRaw.value != null && currentVoyage.value == null,
);

const voyageStatus = computed(() => String(currentVoyage.value?.status ?? '').trim());

const fieldsEditable = computed(
    () => voyageStatus.value !== 'completed' && voyageStatus.value !== 'cancelled',
);
const timestampsEditable = computed(() => voyageStatus.value !== 'cancelled');
const pivotsEditable = computed(
    () =>
        voyageStatus.value !== 'completed' &&
        voyageStatus.value !== 'cancelled',
);

const canDelete = computed(
    () => voyageStatus.value !== 'underway' && voyageStatus.value !== 'completed',
);
const canDepart = computed(
    () =>
        voyageStatus.value === 'ready' ||
        voyageStatus.value === 'draft',
);
const canArrive = computed(() => voyageStatus.value === 'underway');
const canRevertDepart = computed(() => voyageStatus.value === 'underway');
const canRevertArrive = computed(() => voyageStatus.value === 'completed');
const canCancel = computed(
    () =>
        voyageStatus.value !== 'underway' &&
        voyageStatus.value !== 'completed' &&
        voyageStatus.value !== 'cancelled',
);

const { data: voyageBoatPivotsRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.voyage_boat.value;
        const id = voyageId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ vb: col }).where(({ vb }) => eq(vb.voyage_id, id));
    },
    [powersync.collections.voyage_boat, voyageId],
);

const { data: voyageGuidePivotsRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.voyage_guide.value;
        const id = voyageId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ vg: col }).where(({ vg }) => eq(vg.voyage_id, id));
    },
    [powersync.collections.voyage_guide, voyageId],
);

const voyageBoatPivotIds = computed(() =>
    liveQueryRows<{ id: string; boat_id: string | null }>(voyageBoatPivotsRaw.value).map(
        (row) => String(row.id),
    ),
);

const voyageGuidePivotIds = computed(() =>
    liveQueryRows<{ id: string; guide_id: string | null }>(voyageGuidePivotsRaw.value).map(
        (row) => String(row.id),
    ),
);

const { data: passengersRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.passengers.value;
        const id = voyageId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ p: col }).where(({ p }) => eq(p.voyage_id, id));
    },
    [powersync.collections.passengers, voyageId],
);

const passengers = computed(() => liveQueryRows<PassengerOutput>(passengersRaw.value));

watch(
    currentVoyage,
    (voyage) => {
        if (voyage == null) {
            return;
        }
        resetForm({
            values: {
                tripId: String(voyage.trip_id ?? ''),
                waterRouteId: String(voyage.water_route_id ?? ''),
                scheduledDepartureAt:
                    voyage.scheduled_departure_at != null
                        ? String(voyage.scheduled_departure_at)
                        : null,
                startedAt:
                    voyage.started_at != null ? String(voyage.started_at) : null,
                arrivedAt:
                    voyage.arrived_at != null ? String(voyage.arrived_at) : null,
                boatIds: liveQueryRows<{ boat_id: string | null }>(voyageBoatPivotsRaw.value)
                    .map((row) => String(row.boat_id ?? ''))
                    .filter((id) => id.length > 0),
                guideIds: liveQueryRows<{ guide_id: string | null }>(voyageGuidePivotsRaw.value)
                    .map((row) => String(row.guide_id ?? ''))
                    .filter((id) => id.length > 0),
            },
        });
        scheduledDepartureAt.value = isoToLocalDatetimeInputValue(
            String(voyage.scheduled_departure_at ?? ''),
        );
        startedAt.value = isoToLocalDatetimeInputValue(String(voyage.started_at ?? ''));
        arrivedAt.value = isoToLocalDatetimeInputValue(String(voyage.arrived_at ?? ''));
    },
    { immediate: true },
);

const { data: tripsRaw } = useLiveQuery(
    (qb) => {
        const tripsCol = powersync.collections.trips.value;
        const productsCol = powersync.collections.products.value;
        const boatTypesCol = powersync.collections.boat_types.value;
        const waterRoutesCol = powersync.collections.water_routes.value;
        const pid = activeProgramIdRef.value.trim();
        if (!tripsCol || !productsCol || !boatTypesCol || !waterRoutesCol || pid.length === 0) {
            return undefined;
        }
        return joinTripsWithRelationsFrom(
            qb,
            tripsCol,
            productsCol,
            boatTypesCol,
            waterRoutesCol,
        )
            .where(({ trip }) => eq(trip.program_id, pid))
            .orderBy(({ trip }) => trip.scheduled_departure_at, 'asc');
    },
    [
        powersync.collections.trips,
        powersync.collections.products,
        powersync.collections.boat_types,
        powersync.collections.water_routes,
        activeProgramIdRef,
    ],
);

const tripRows = computed(() => liveQueryRows<TripWithRelationsRow>(tripsRaw.value));

const tripOptions = computed(() =>
    tripRows.value.map((trip) => ({
        value: String(trip.id),
        label: `${String(trip.scheduled_departure_at ?? '—')} · ${String(trip.product_name ?? '—')}`,
    })),
);

const selectedTrip = computed(
    () => tripRows.value.find((trip) => String(trip.id) === String(tripId.value ?? '').trim()) ?? null,
);

const { data: waterRoutesRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.water_routes.value;
        const pid = activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return qb.from({ wr: col }).where(({ wr }) => eq(wr.program_id, pid));
    },
    [powersync.collections.water_routes, activeProgramIdRef],
);

const waterRouteOptions = computed(() =>
    liveQueryRows<{ id: string; name: string | null }>(waterRoutesRaw.value).map((wr) => ({
        value: String(wr.id),
        label: String(wr.name ?? '—'),
    })),
);

const { data: boatsRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.boats.value;
        const pid = activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return qb.from({ b: col }).where(({ b }) => eq(b.program_id, pid));
    },
    [powersync.collections.boats, activeProgramIdRef],
);

const boatOptions = computed(() =>
    liveQueryRows<{ id: string; name: string | null }>(boatsRaw.value).map((b) => ({
        value: String(b.id),
        label: String(b.name ?? '—'),
    })),
);

const { data: guidesRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.guides.value;
        if (!col) {
            return undefined;
        }
        return qb.from({ g: col });
    },
    [powersync.collections.guides],
);

const guideOptions = computed(() =>
    liveQueryRows<{ id: string; name: string | null }>(guidesRaw.value).map((g) => ({
        value: String(g.id),
        label: String(g.name ?? '—'),
    })),
);

function statusLabel(status: string | null | undefined): string {
    const key = String(status ?? '').trim();
    const map: Record<string, string> = {
        draft: t('programsControl.statusDraft'),
        ready: t('programsControl.statusReady'),
        underway: t('programsControl.statusUnderway'),
        completed: t('programsControl.statusCompleted'),
        cancelled: t('programsControl.statusCancelled'),
    };
    return map[key] ?? key;
}

function isoOrNull(local: string): string | null {
    const trimmed = local.trim();
    if (trimmed.length === 0) {
        return null;
    }
    return localDatetimeInputValueToIso(trimmed);
}

const onSaveSubmit = handleSubmit(async (values: VoyageAdminFormValues) => {
    await runWithNotify(
        async () => {
            await updateVoyage(
                voyageId.value,
                {
                    tripId: values.tripId,
                    waterRouteId: values.waterRouteId,
                    scheduledDepartureAt: isoOrNull(scheduledDepartureAt.value),
                    startedAt: isoOrNull(startedAt.value),
                    arrivedAt: isoOrNull(arrivedAt.value),
                },
                {
                    boatIds: values.boatIds,
                    guideIds: values.guideIds,
                    existingVoyageBoatPivotIds: voyageBoatPivotIds.value,
                    existingVoyageGuidePivotIds: voyageGuidePivotIds.value,
                },
            );
        },
        {
            successMessage: t('programsControlAdmin.voyageSaved'),
            errorGeneric: t('programsControl.errorGeneric'),
        },
    );
});

function confirmDelete(): void {
    confirm({
        title: t('programsControlAdmin.deleteVoyageTitle'),
        message: t('programsControlAdmin.deleteVoyageMessage'),
        onOk: async () => {
            isDeleting.value = true;
            try {
                await deleteVoyage(voyageId.value);
                $q.notify({ type: 'positive', message: t('programsControlAdmin.voyageDeleted') });
                await router.push(backTo.value);
            } catch (error) {
                notifyError(error, t('programsControl.errorGeneric'));
            } finally {
                isDeleting.value = false;
            }
        },
    });
}

async function onDepart(): Promise<void> {
    const trip = selectedTrip.value;
    if (trip == null || currentVoyage.value == null) {
        return;
    }
    if (boatIds.value.length === 0) {
        notifyError(new Error(t('programsControl.boatsRequired')), t('programsControl.boatsRequired'));
        return;
    }
    await startDeparture({
        trip,
        existingVoyage: currentVoyage.value,
        boatIds: [...boatIds.value],
        guideIds: [...guideIds.value],
        existingVoyageBoatPivotIds: voyageBoatPivotIds.value,
        existingVoyageGuidePivotIds: voyageGuidePivotIds.value,
    });
}

async function onArrive(): Promise<void> {
    await markArrival(voyageId.value);
}

function onRevertDepart(): void {
    confirm({
        title: t('programsControlAdmin.revertDepartTitle'),
        message: t('programsControlAdmin.revertDepartMessage'),
        onOk: () => revertDeparture(voyageId.value),
    });
}

function onRevertArrive(): void {
    confirm({
        title: t('programsControlAdmin.revertArriveTitle'),
        message: t('programsControlAdmin.revertArriveMessage'),
        onOk: () => revertArrival(voyageId.value),
    });
}

function onCancel(): void {
    const trip = selectedTrip.value;
    if (trip == null) {
        return;
    }
    confirm({
        title: t('programsControl.cancelTripConfirmTitle'),
        message: t('programsControl.cancelTripConfirmMessage'),
        onOk: () => cancelTrip({ trip, existingVoyage: currentVoyage.value }),
    });
}

function onRemovePassenger(passengerId: string): void {
    confirm({
        title: t('programsControl.removePassenger'),
        message: t('programsControl.removePassengerConfirm', { name: '' }),
        onOk: () => removePassenger(passengerId),
    });
}
</script>
