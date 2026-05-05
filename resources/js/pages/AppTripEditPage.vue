<template>
    <AppEntityEditPageLayout
        :title="t('tripsList.editPageTitle')"
        :description="t('tripsList.editPageDescription')"
        :back-to="backTo"
        :back-label="t('tripsList.backToList')"
    >
        <template
            v-if="currentTrip && tripSwitcherOptions.length > 0"
            #quickNav
        >
            <AppCardSection :label="t('tripsList.quickNavLabel')">
                <div class="row q-col-gutter-sm items-center">
                    <div class="col-12 col-sm-auto">
                        <q-btn
                            flat
                            round
                            dense
                            icon="chevron_left"
                            :aria-label="t('tripsList.previousTrip')"
                            :disable="!neighbors.prev"
                            @click="goPrev"
                        />
                    </div>
                    <q-select
                        class="col-12 col-sm"
                        :model-value="String(tripId)"
                        :options="tripSwitcherOptions"
                        emit-value
                        map-options
                        dense
                        outlined
                        :label="t('tripsList.scheduledDeparture')"
                        @update:model-value="onSwitchTrip"
                    />
                    <div class="col-12 col-sm-auto">
                        <q-btn
                            flat
                            round
                            dense
                            icon="chevron_right"
                            :aria-label="t('tripsList.nextTrip')"
                            :disable="!neighbors.next"
                            @click="goNext"
                        />
                    </div>
                    <div
                        v-if="neighbors.total > 0 && neighbors.index >= 0"
                        class="col-12 text-caption text-grey-8"
                    >
                        {{
                            t("tripsList.positionInList", {
                                index: neighbors.index + 1,
                                total: neighbors.total,
                            })
                        }}
                    </div>
                </div>
            </AppCardSection>
        </template>

        <q-banner
            v-if="showNotFound"
            class="bg-warning text-dark q-mb-md"
            rounded
        >
            {{ t("tripsList.notFound") }}
            <template #action>
                <q-btn
                    color="primary"
                    flat
                    :label="t('tripsList.backToList')"
                    :to="backTo"
                />
            </template>
        </q-banner>

        <AppCardSection
            v-else-if="currentTrip"
            :label="t('tripsList.editSection')"
        >
            <q-form @submit.prevent="onSaveSubmit">
                <AppFormStack>
                    <q-input
                        v-model="editScheduled"
                        v-bind="editScheduledProps"
                        outlined
                        type="datetime-local"
                        :label="t('tripsList.scheduledDeparture')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <q-input
                        v-model.number="editCapacity"
                        v-bind="editCapacityProps"
                        outlined
                        type="number"
                        :label="t('tripsList.capacity')"
                        :hint="t('tripsList.capacityHint')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <AppBoatTypeSelectField
                        v-model="editBoatTypeId"
                        v-bind="editBoatTypeIdProps"
                        :program-id="programId"
                        :label="t('tripsList.boatType')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <AppWaterRouteSelectField
                        v-model="editWaterRouteId"
                        v-bind="editWaterRouteIdProps"
                        :program-id="programId"
                        :label="t('tripsList.waterRoute')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <div class="row q-gutter-sm">
                        <q-btn
                            color="primary"
                            type="submit"
                            :label="t('tripsList.saveChanges')"
                            :loading="isSubmitting"
                            :disable="!meta.valid || isDeleting"
                        />
                        <q-btn
                            flat
                            color="negative"
                            icon="delete"
                            :label="t('tripsList.delete')"
                            :disable="isSubmitting || isDeleting"
                            @click="confirmDelete"
                        />
                    </div>
                </AppFormStack>
            </q-form>
        </AppCardSection>
    </AppEntityEditPageLayout>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";
import {
    createTripUpsertFormSchema,
    type TripUpsertFormValues,
} from "../models/trips/trips.validation";
import {
    isoToLocalDatetimeInputValue,
    localDatetimeInputValueToIso,
} from "../utilities/datetime-input";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import type { TripOutput } from "../powersync/trips.collection";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import { parsePositiveInt } from "../validation/zod-fields";
import AppEntityEditPageLayout from "../layouts/AppEntityEditPageLayout.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";
import AppBoatTypeSelectField from "../components/ui/AppBoatTypeSelectField.vue";
import AppWaterRouteSelectField from "../components/organisms/AppWaterRouteSelectField.vue";

const { t, locale } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { confirm } = useConfirmDialog();
const { runWithNotify } = useNotifyAsyncAction();
const { notifyError } = useNotifyErrorFromCatch();
const tripsCollection = powersync.collections.trips;
const { data: trips } = useLiveQuery(
    (queryBuilder) => {
        const col = tripsCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ t: col })
            .where(({ t }) => eq(t.program_id, pid));
    },
    [tripsCollection, powersync.activeProgramIdRef],
);

const currentTrip = computed(() => {
    const id = tripId.value;
    if (id.length === 0) return null;
    return (trips.value ?? []).find((t) => String(t.id) === id) ?? null;
});

const neighbors = computed(() => {
    const id = tripId.value;
    const list = trips.value ?? [];
    const ids = list.map((t) => String(t.id));
    const idx = id.length === 0 ? -1 : ids.indexOf(id);
    if (idx < 0)
        return { prev: null, next: null, index: -1, total: ids.length };
    return {
        prev: idx > 0 ? String(ids[idx - 1]) : null,
        next: idx < ids.length - 1 ? String(ids[idx + 1]) : null,
        index: idx,
        total: ids.length,
    };
});

const hasBootstrapped = powersync.hasBootstrappedCollection;
const isDeleting = ref(false);

const programId = computed(() => String(route.params.programId ?? "").trim());
const tripId = computed(() => String(route.params.tripId ?? "").trim());

const backTo = computed(() => ({
    name: "trips.list" as const,
    params: { programId: programId.value },
}));

const showNotFound = computed(
    () =>
        hasBootstrapped.value &&
        tripId.value.length > 0 &&
        currentTrip.value == null,
);

function formatSwitcherLabel(tr: TripOutput) {
    const raw = tr.scheduled_departure_at;
    if (raw == null || String(raw) === "") {
        return String(tr.id ?? "");
    }
    const d = new Date(String(raw));
    if (Number.isNaN(d.getTime())) {
        return String(raw);
    }
    return new Intl.DateTimeFormat(locale.value === "fr" ? "fr-CA" : "en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(d);
}

const tripSwitcherOptions = computed(() =>
    trips.value.map((tr) => ({
        label: formatSwitcherLabel(tr),
        value: String(tr.id),
    })),
);

const editSchema = createTripUpsertFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, setValues, resetForm } =
    useForm<TripUpsertFormValues>({
        validationSchema: editSchema,
        initialValues: {
            scheduledDepartureAt: "",
            capacity: null,
            boatTypeId: null,
            waterRouteId: null,
        } as unknown as TripUpsertFormValues,
    });

const quasarField = createQuasarFieldBinder(defineField);

const [editScheduled, editScheduledProps] = quasarField("scheduledDepartureAt");
const [editCapacity, editCapacityProps] = quasarField("capacity");
const [editBoatTypeId, editBoatTypeIdProps] = quasarField("boatTypeId");
const [editWaterRouteId, editWaterRouteIdProps] = quasarField("waterRouteId");

function syncFormFromTrip() {
    const tr = currentTrip.value;
    if (!tr) {
        return;
    }
    const cap = parsePositiveInt(tr.capacity);
    setValues({
        scheduledDepartureAt: isoToLocalDatetimeInputValue(
            String(tr.scheduled_departure_at ?? ""),
        ),
        capacity: cap,
        boatTypeId:
            tr.boat_type_id == null || String(tr.boat_type_id).length === 0
                ? null
                : String(tr.boat_type_id),
        waterRouteId:
            tr.water_route_id == null || String(tr.water_route_id).length === 0
                ? null
                : String(tr.water_route_id),
    });
}

watch(
    [currentTrip, tripId],
    () => {
        if (currentTrip.value) {
            syncFormFromTrip();
        } else {
            resetForm();
        }
    },
    { immediate: true },
);

function onSwitchTrip(nextId: string | null | undefined) {
    if (nextId == null || String(nextId) === String(tripId.value)) {
        return;
    }
    void router.push({
        name: "trips.edit",
        params: { programId: programId.value, tripId: String(nextId) },
    });
}

function goPrev() {
    const p = neighbors.value.prev;
    if (p) {
        onSwitchTrip(p);
    }
}

function goNext() {
    const n = neighbors.value.next;
    if (n) {
        onSwitchTrip(n);
    }
}

const onSaveSubmit = handleSubmit(async (values: TripUpsertFormValues) => {
    const id = tripId.value;
    if (id.length === 0) {
        return;
    }
    await runWithNotify(
        async () => {
            const cap = parsePositiveInt(values.capacity);
            if (cap === null) {
                throw new Error("capacity");
            }
            const iso = localDatetimeInputValueToIso(
                String(values.scheduledDepartureAt),
            );
            const nextBoatType =
                values.boatTypeId != null &&
                String(values.boatTypeId).length > 0
                    ? String(values.boatTypeId)
                    : null;
            const nextWaterRoute =
                values.waterRouteId != null &&
                String(values.waterRouteId).length > 0
                    ? String(values.waterRouteId)
                    : null;
            const col = tripsCollection.value;
            if (!col) throw new Error("Trips collection not ready.");
            col.update(id, (draft) => {
                draft.scheduled_departure_at = iso;
                draft.capacity = cap;
                draft.boat_type_id = nextBoatType;
                draft.water_route_id = nextWaterRoute;
            });
            void powersync.refreshOutboxSnapshot();
        },
        {
            successMessage: t("tripsList.changesSaved"),
            errorGeneric: t("tripsList.errorGeneric"),
        },
    );
});

function confirmDelete() {
    const tr = currentTrip.value;
    if (!tr) {
        return;
    }
    confirm({
        title: t("tripsList.deleteConfirmTitle"),
        message: t("tripsList.deleteConfirmMessage"),
        onOk: async () => {
            isDeleting.value = true;
            try {
                const col = tripsCollection.value;
                if (!col) return;
                col.delete(String(tr.id));
                void powersync.refreshOutboxSnapshot();
                $q.notify({
                    type: "positive",
                    message: t("tripsList.deleted"),
                });
                await router.push({
                    name: "trips.list",
                    params: { programId: programId.value },
                });
            } catch (e) {
                notifyError(e, t("tripsList.errorGeneric"));
            } finally {
                isDeleting.value = false;
            }
        },
    });
}
</script>
