<template>
    <AppEntityCreatePageLayout
        :title="t('tripsList.createPageTitle')"
        :description="t('tripsList.createPageDescription')"
        :back-to="backTo"
        :back-label="t('tripsList.backToList')"
    >
        <AppCardSection :label="t('tripsList.addNew')">
            <AppTripForm
                :program-id="programId"
                :seed="null"
                :submit-fn="submitCreateTrip"
            >
                <template #actions="{ meta, isSubmitting }">
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
                </template>
            </AppTripForm>
        </AppCardSection>
    </AppEntityCreatePageLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { ulid } from "ulid";
import type { TripUpsertFormValues } from "../models/trips/trips.validation";
import { localDatetimeInputValueToIso } from "../utilities/datetime-input";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import AppEntityCreatePageLayout from "../layouts/AppEntityCreatePageLayout.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppTripForm from "../components/molecules/AppTripForm.vue";

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

async function submitCreateTrip(values: TripUpsertFormValues): Promise<void> {
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
}
</script>
