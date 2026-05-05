<template>
    <AppEntityCreatePageLayout
        :title="t('tripsList.createPageTitle')"
        :description="t('tripsList.createPageDescription')"
        :back-to="backTo"
        :back-label="t('tripsList.backToList')"
    >
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
                    <AppBoatTypeSelectField
                        v-model="createBoatTypeId"
                        v-bind="createBoatTypeIdProps"
                        :program-id="programId"
                        :label="t('tripsList.boatType')"
                        :disable="isSubmitting"
                    />
                    <AppWaterRouteSelectField
                        v-model="createWaterRouteId"
                        v-bind="createWaterRouteIdProps"
                        :program-id="programId"
                        :label="t('tripsList.waterRoute')"
                        :disable="isSubmitting"
                    />
                    <q-btn
                        color="primary"
                        type="submit"
                        :label="t('tripsList.create')"
                        :loading="isSubmitting"
                        :disable="
                            !meta.valid ||
                            isSubmitting ||
                            programId.length === 0
                        "
                        class="self-start"
                    />
                </AppFormStack>
            </q-form>
        </AppCardSection>
    </AppEntityCreatePageLayout>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
    createTripUpsertFormSchema,
    type TripUpsertFormValues,
} from "../models/trips/trips.validation";
import { ulid } from "ulid";
import { localDatetimeInputValueToIso } from "../utilities/datetime-input";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import AppEntityCreatePageLayout from "../layouts/AppEntityCreatePageLayout.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";
import AppBoatTypeSelectField from "../components/ui/AppBoatTypeSelectField.vue";
import AppWaterRouteSelectField from "../components/organisms/AppWaterRouteSelectField.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const tripsCollection = powersync.collections.trips;
const { runWithNotify } = useNotifyAsyncAction();

const programId = computed(() => String(route.params.programId ?? "").trim());

const backTo = computed(() => ({
    name: "trips.list" as const,
    params: { programId: programId.value },
}));

const tripSchema = createTripUpsertFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } =
    useForm<TripUpsertFormValues>({
        validationSchema: tripSchema,
        initialValues: {
            scheduledDepartureAt: "",
            capacity: null,
            boatTypeId: null,
            waterRouteId: null,
        } as unknown as TripUpsertFormValues,
    });

const quasarField = createQuasarFieldBinder(defineField);

const [createScheduled, createScheduledProps] = quasarField(
    "scheduledDepartureAt",
);
const [createCapacity, createCapacityProps] = quasarField("capacity");
const [createBoatTypeId, createBoatTypeIdProps] = quasarField("boatTypeId");
const [createWaterRouteId, createWaterRouteIdProps] =
    quasarField("waterRouteId");

const onCreateSubmit = handleSubmit(async (values: TripUpsertFormValues) => {
    await runWithNotify(
        async () => {
            const col = tripsCollection.value;
            if (!col) throw new Error("Trips collection not ready.");
            const pid = powersync.activeProgramIdRef.value.trim();
            if (pid.length === 0)
                throw new Error("Select a program before adding trips.");
            const id = ulid();
            const iso = localDatetimeInputValueToIso(
                String(values.scheduledDepartureAt),
            );
            const cap = Number.parseInt(String(values.capacity), 10);
            if (!Number.isFinite(cap) || cap < 1)
                throw new Error("Trip capacity must be a positive integer.");

            await col.insert({
                id,
                program_id: pid,
                boat_type_id: values.boatTypeId ?? null,
                water_route_id: values.waterRouteId ?? null,
                template_day_slot_id: null,
                scheduled_departure_at: iso,
                capacity: cap,
            }).isPersisted.promise;
            void powersync.refreshOutboxSnapshot();
            resetForm();
            await router.push({
                name: "trips.list",
                params: { programId: programId.value },
            });
        },
        {
            successMessage: t("tripsList.created"),
            errorGeneric: t("tripsList.errorGeneric"),
        },
    );
});
</script>
