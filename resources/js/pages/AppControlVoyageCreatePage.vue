<template>
    <AppEntityCreatePageLayout
        :title="t('programsControlAdmin.createVoyageTitle')"
        :back-to="backTo"
        :back-label="t('programsControlAdmin.backToVoyages')"
    >
        <AppCardSection :label="t('programsControlAdmin.voyageDetails')">
            <q-form @submit.prevent="onCreateSubmit">
                <div class="column gap-4">
                    <q-select
                        v-model="tripId"
                        v-bind="tripIdProps"
                        outlined
                        emit-value
                        map-options
                        :options="tripOptions"
                        :label="t('programsControlAdmin.trip')"
                        :disable="isSubmitting"
                    />
                    <q-select
                        v-model="waterRouteId"
                        v-bind="waterRouteIdProps"
                        outlined
                        emit-value
                        map-options
                        :options="waterRouteOptions"
                        :label="t('programsControlAdmin.waterRoute')"
                        :disable="isSubmitting"
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
                        :disable="isSubmitting"
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
                        :disable="isSubmitting"
                    />
                    <q-btn
                        color="primary"
                        type="submit"
                        :label="t('programsControlAdmin.createVoyage')"
                        :loading="isSubmitting"
                        :disable="!meta.valid || isSubmitting || programId.length === 0"
                        class="self-start"
                    />
                </div>
            </q-form>
        </AppCardSection>
    </AppEntityCreatePageLayout>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import {
    createVoyageAdminFormSchema,
    type VoyageAdminFormValues,
} from '../models/voyages/voyages.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { joinTripsWithRelationsFrom } from '../powersync/joined-queries';
import { liveQueryRows } from '../powersync/live-query-casts';
import { useControlVoyageAdminOps } from '../composables/useControlVoyageAdminOps';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import AppEntityCreatePageLayout from '../layouts/AppEntityCreatePageLayout.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { createVoyage } = useControlVoyageAdminOps();
const { runWithNotify } = useNotifyAsyncAction();

const programId = computed(() => String(route.params.programId ?? '').trim());
const activeProgramIdRef = powersync.activeProgramIdRef;

const backTo = computed(() => controlContextNamedRoute(route, 'control.voyages.list'));

const schema = createVoyageAdminFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, setFieldValue } =
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

const tripOptions = computed(() =>
    liveQueryRows<{
        id: string;
        product_name: string | null;
        scheduled_departure_at: string | null;
        water_route_id: string | null;
    }>(tripsRaw.value).map((trip) => ({
        value: String(trip.id),
        label: `${String(trip.scheduled_departure_at ?? '—')} · ${String(trip.product_name ?? '—')}`,
        waterRouteId: String(trip.water_route_id ?? ''),
    })),
);

watch(tripId, (id) => {
    const match = tripOptions.value.find((opt) => opt.value === String(id ?? '').trim());
    if (match != null && match.waterRouteId.length > 0) {
        setFieldValue('waterRouteId', match.waterRouteId);
    }
});

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

const onCreateSubmit = handleSubmit(async (values: VoyageAdminFormValues) => {
    await runWithNotify(
        async () => {
            const voyageId = await createVoyage(
                {
                    programId: programId.value,
                    tripId: values.tripId,
                    waterRouteId: values.waterRouteId,
                    scheduledDepartureAt: null,
                    status: 'ready',
                    startedAt: null,
                    arrivedAt: null,
                },
                {
                    boatIds: values.boatIds,
                    guideIds: values.guideIds,
                    existingVoyageBoatPivotIds: [],
                    existingVoyageGuidePivotIds: [],
                },
            );
            await router.push(
                controlContextNamedRoute(route, 'control.voyages.edit', {
                    voyageId,
                }),
            );
        },
        {
            successMessage: t('programsControlAdmin.voyageCreated'),
            errorGeneric: t('programsControl.errorGeneric'),
        },
    );
});
</script>
