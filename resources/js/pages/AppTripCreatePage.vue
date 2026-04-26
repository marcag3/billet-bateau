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
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { createTripUpsertFormSchema, type TripUpsertFormValues } from '../models/trips/trips.validation';
import { localDatetimeInputValueToIso } from '../utilities/datetime-input';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { useTrips } from '../models/trips/trips.model';
import { useBoatTypes } from '../models/boat-types/boat-types.model';
import { useWaterRoutes } from '../models/water-routes/water-routes.model';
import { getAppPowerSyncBootstrappedRef, useAppPowerSyncOutbox } from '../powersync/app-powersync.runtime';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import AppEntityCreatePageLayout from '../layouts/AppEntityCreatePageLayout.vue';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppFormStack from '../components/ui/AppFormStack.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { createTripRow, ensureTripsReady } = useTrips();
const { boatTypes, ensureBoatTypesReady } = useBoatTypes();
const { waterRoutes, ensureWaterRoutesReady } = useWaterRoutes();
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
            const iso = localDatetimeInputValueToIso(String(values.scheduledDepartureAt));
            await createTripRow({
                scheduledDepartureAt: iso,
                capacity: values.capacity as number,
                boatTypeId: values.boatTypeId,
                waterRouteId: values.waterRouteId,
            });
            resetForm();
            await router.push({ name: 'trips.list', params: { programId: programId.value } });
        },
        { successMessage: t('tripsList.created'), errorGeneric: t('tripsList.errorGeneric') },
    );
});

onMounted(() => {
    void ensureBoatTypesReady();
    void ensureWaterRoutesReady();
    void ensureTripsReady();
});
</script>
