<template>
    <AppEntityCreatePageLayout
        :ready="hasBootstrapped"
        :title="t('tripsList.createPageTitle')"
        :description="t('tripsList.createPageDescription')"
        :back-to="backTo"
        :back-label="t('tripsList.backToList')"
    >
        <template #alerts>
            <AppAlertBanner
                v-if="hasOutboxCommitError"
                variant="warning"
                dismissible
                :dismiss-label="t('common.dismiss')"
                @dismiss="dismissOutboxCommitError"
            >
                {{ outboxCommitError }}
            </AppAlertBanner>
        </template>

        <AppCardSection :label="t('tripsList.addNew')">
            <q-form @submit.prevent="onCreateSubmit">
                <AppFormStack>
                    <q-input
                        v-model="createScheduled"
                        v-bind="createScheduledProps"
                        outlined
                        type="datetime-local"
                        :label="t('tripsList.scheduledDeparture')"
                        :disable="isSubmitting"
                    />
                    <q-input
                        v-model.number="createCapacity"
                        v-bind="createCapacityProps"
                        outlined
                        type="number"
                        :label="t('tripsList.capacity')"
                        :hint="t('tripsList.capacityHint')"
                        :disable="isSubmitting"
                    />
                    <q-select
                        v-model="createBoatTypeId"
                        v-bind="createBoatTypeIdProps"
                        outlined
                        emit-value
                        map-options
                        clearable
                        :options="boatTypeOptions"
                        :label="t('tripsList.boatType')"
                        :disable="isSubmitting"
                    />
                    <q-select
                        v-model="createWaterRouteId"
                        v-bind="createWaterRouteIdProps"
                        outlined
                        emit-value
                        map-options
                        clearable
                        :options="waterRouteOptions"
                        :label="t('tripsList.waterRoute')"
                        :disable="isSubmitting"
                    />
                    <q-btn
                        color="primary"
                        type="submit"
                        :label="t('tripsList.create')"
                        :loading="isSubmitting"
                        :disable="!meta.valid || isSubmitting || programId.length === 0"
                        class="self-start"
                    />
                </AppFormStack>
            </q-form>
        </AppCardSection>
    </AppEntityCreatePageLayout>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { createTripUpsertFormSchema, type TripUpsertFormValues } from '../models/trips/trips.validation';
import { ulid } from 'ulid';
import { localDatetimeInputValueToIso } from '../utilities/datetime-input';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import { getAppPowerSyncBootstrappedRef, useAppPowerSyncOutbox, getBoatTypesCollection, getWaterRoutesCollection, getTripsCollection, getActiveProgramIdRef, refreshOutboxSnapshot } from '../powersync/app-powersync.runtime';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import AppEntityCreatePageLayout from '../layouts/AppEntityCreatePageLayout.vue';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppFormStack from '../components/ui/AppFormStack.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const tripsCollection = getTripsCollection();
const boatTypesCollection = getBoatTypesCollection();

const { data: boatTypes } = useLiveQuery(
    (queryBuilder) => {
        const col = boatTypesCollection.value;
        const pid = getActiveProgramIdRef().value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ bt: col })
            .where(({ bt }) => eq(bt.program_id, pid));
    },
    [boatTypesCollection, getActiveProgramIdRef()],
);

const waterRoutesCollection = getWaterRoutesCollection();
const { data: waterRoutes } = useLiveQuery(
    (queryBuilder) => {
        const col = waterRoutesCollection.value;
        const pid = getActiveProgramIdRef().value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ wr: col })
            .where(({ wr }) => eq(wr.program_id, pid));
    },
    [waterRoutesCollection, getActiveProgramIdRef()],
);
const { runWithNotify } = useNotifyAsyncAction();

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const programId = computed(() => String(route.params.programId ?? '').trim());

const backTo = computed(() => ({ name: 'trips.list' as const, params: { programId: programId.value } }));

const boatTypeOptions = computed(() =>
    boatTypes.value.map((bt) => ({
        label: String(bt.name ?? ''),
        value: String(bt.id),
    })),
);

const waterRouteOptions = computed(() =>
    waterRoutes.value.map((wr) => ({
        label: String(wr.name ?? ''),
        value: String(wr.id),
    })),
);

const tripSchema = createTripUpsertFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } = useForm<TripUpsertFormValues>({
    validationSchema: tripSchema,
    initialValues: {
        scheduledDepartureAt: '',
        capacity: null,
        boatTypeId: null,
        waterRouteId: null,
    } as unknown as TripUpsertFormValues,
});

const quasarField = createQuasarFieldBinder(defineField);

const [createScheduled, createScheduledProps] = quasarField('scheduledDepartureAt');
const [createCapacity, createCapacityProps] = quasarField('capacity');
const [createBoatTypeId, createBoatTypeIdProps] = quasarField('boatTypeId');
const [createWaterRouteId, createWaterRouteIdProps] = quasarField('waterRouteId');

const onCreateSubmit = handleSubmit(async (values: TripUpsertFormValues) => {
    await runWithNotify(
        async () => {
            const col = tripsCollection.value;
            if (!col) throw new Error('Trips collection not ready.');
            const pid = getActiveProgramIdRef().value.trim();
            if (pid.length === 0) throw new Error('Select a program before adding trips.');
            const id = ulid();
            const now = new Date().toISOString();
            const iso = localDatetimeInputValueToIso(String(values.scheduledDepartureAt));
            const cap = Number.parseInt(String(values.capacity), 10);
            if (!Number.isFinite(cap) || cap < 1) throw new Error('Trip capacity must be a positive integer.');
            const scheduledIso = Number.isNaN(Date.parse(iso)) ? iso : new Date(iso).toISOString();

            await col.insert({
                id,
                program_id: pid,
                boat_type_id: values.boatTypeId ?? null,
                water_route_id: values.waterRouteId ?? null,
                template_day_slot_id: null,
                scheduled_departure_at: scheduledIso,
                capacity: cap,
                created_at: now,
                updated_at: now,
            }).isPersisted.promise;
            void refreshOutboxSnapshot();
            resetForm();
            await router.push({ name: 'trips.list', params: { programId: programId.value } });
        },
        { successMessage: t('tripsList.created'), errorGeneric: t('tripsList.errorGeneric') },
    );
});

</script>
