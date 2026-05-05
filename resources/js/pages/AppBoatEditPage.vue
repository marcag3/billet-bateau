<template>
    <AppEntityEditPageLayout
        :title="t('boatsList.editPageTitle')"
        :description="t('boatsList.editPageDescription')"
        :back-to="backTo"
        :back-label="t('boatsList.backToList')"
    >
        <template
            v-if="currentBoat && boatSwitcherOptions.length > 0"
            #quickNav
        >
            <AppCardSection :label="t('boatsList.quickNavLabel')">
                <div class="row q-col-gutter-sm items-center">
                    <div class="col-12 col-sm-auto">
                        <q-btn
                            flat
                            round
                            dense
                            icon="chevron_left"
                            :aria-label="t('boatsList.previousBoat')"
                            :disable="!neighbors.prev"
                            @click="goPrev"
                        />
                    </div>
                    <q-select
                        class="col-12 col-sm"
                        :model-value="String(boatId)"
                        :options="boatSwitcherOptions"
                        emit-value
                        map-options
                        dense
                        outlined
                        :label="t('boatsList.name')"
                        @update:model-value="onSwitchBoat"
                    />
                    <div class="col-12 col-sm-auto">
                        <q-btn
                            flat
                            round
                            dense
                            icon="chevron_right"
                            :aria-label="t('boatsList.nextBoat')"
                            :disable="!neighbors.next"
                            @click="goNext"
                        />
                    </div>
                    <div
                        v-if="neighbors.total > 0 && neighbors.index >= 0"
                        class="col-12 text-caption text-grey-8"
                    >
                        {{
                            t("boatsList.positionInList", {
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
            {{ t("boatsList.notFound") }}
            <template #action>
                <q-btn
                    color="primary"
                    flat
                    :label="t('boatsList.backToList')"
                    :to="backTo"
                />
            </template>
        </q-banner>

        <AppCardSection v-else-if="currentBoat" :label="formSectionLabel">
            <q-form @submit.prevent="onSaveSubmit">
                <AppFormStack>
                    <q-input
                        v-model="editName"
                        v-bind="editNameProps"
                        outlined
                        :label="t('boatsList.name')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <q-input
                        v-model.number="editCapacity"
                        v-bind="editCapacityProps"
                        outlined
                        type="number"
                        :label="t('boatsList.capacity')"
                        :hint="t('boatsList.capacityHint')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <q-input
                        v-model="editNotes"
                        v-bind="editNotesProps"
                        type="textarea"
                        autogrow
                        outlined
                        :label="t('boatsList.notes')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <AppBoatTypeSelectField
                        v-model="editBoatTypeId"
                        v-bind="editBoatTypeIdProps"
                        :program-id="programId"
                        :label="t('boatsList.boatType')"
                        :disable="isSubmitting || isDeleting"
                    />
                    <div class="row q-gutter-sm">
                        <q-btn
                            color="primary"
                            type="submit"
                            :label="t('boatsList.saveChanges')"
                            :loading="isSubmitting"
                            :disable="!meta.valid || isDeleting"
                        />
                        <q-btn
                            flat
                            color="negative"
                            icon="delete"
                            :label="t('boatsList.delete')"
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
    createBoatCreateFormSchema,
    type BoatCreateFormValues,
} from "../models/boats/boats.validation";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import {
    getAppPowerSyncBootstrappedRef,
    getBoatsCollection,
    refreshOutboxSnapshot,
} from "../powersync/app-powersync.runtime";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import { parseOptionalNonNegativeInt } from "../validation/zod-fields";
import AppEntityEditPageLayout from "../layouts/AppEntityEditPageLayout.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";
import AppBoatTypeSelectField from "../components/ui/AppBoatTypeSelectField.vue";

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { confirm } = useConfirmDialog();
const { runWithNotify } = useNotifyAsyncAction();
const { notifyError } = useNotifyErrorFromCatch();
const boatsCollection = getBoatsCollection();

const programId = computed(() => String(route.params.programId ?? "").trim());
const boatId = computed(() => String(route.params.boatId ?? "").trim());

const { data: boats } = useLiveQuery(
    (queryBuilder) => {
        const col = boatsCollection.value;
        const pid = programId.value;
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ b: col })
            .where(({ b }) => eq(b.program_id, pid));
    },
    [boatsCollection, programId],
);

const currentBoat = computed(() => {
    const id = boatId.value;
    if (id.length === 0) return null;
    return (boats.value ?? []).find((b) => String(b.id) === id) ?? null;
});

const neighbors = computed(() => {
    const id = boatId.value;
    const list = boats.value ?? [];
    const ids = list.map((b) => String(b.id));
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

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const isDeleting = ref(false);

const backTo = computed(() => ({
    name: "boats.list" as const,
    params: { programId: programId.value },
}));

// currentBoat and neighbors are computed above from allBoats

const showNotFound = computed(
    () =>
        hasBootstrapped.value &&
        boatId.value.length > 0 &&
        currentBoat.value == null,
);

const formSectionLabel = computed(() => {
    const b = currentBoat.value;
    if (b) {
        return String(b.name ?? t("boatsList.editPageTitle"));
    }
    return t("boatsList.editPageTitle");
});

const boatSwitcherOptions = computed(() =>
    boats.value.map((b) => ({
        label: String(b.name ?? ""),
        value: String(b.id),
    })),
);

const editSchema = createBoatCreateFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, setValues, resetForm } =
    useForm<BoatCreateFormValues>({
        validationSchema: editSchema,
        initialValues: {
            name: "",
            capacity: null,
            notes: "",
            boatTypeId: null,
        } as unknown as BoatCreateFormValues,
    });

const quasarField = createQuasarFieldBinder(defineField);

const [editName, editNameProps] = quasarField("name");
const [editCapacity, editCapacityProps] = quasarField("capacity");
const [editNotes, editNotesProps] = quasarField("notes");
const [editBoatTypeId, editBoatTypeIdProps] = quasarField("boatTypeId");

function syncFormFromBoat() {
    const b = currentBoat.value;
    if (!b) {
        return;
    }
    setValues({
        name: String(b.name ?? ""),
        capacity:
            b.capacity === null || b.capacity === undefined
                ? null
                : Number(b.capacity),
        notes: String(b.notes ?? ""),
        boatTypeId:
            b.boat_type_id == null || String(b.boat_type_id).length === 0
                ? null
                : String(b.boat_type_id),
    });
}

watch(
    [currentBoat, boatId],
    () => {
        if (currentBoat.value) {
            syncFormFromBoat();
        } else {
            resetForm();
        }
    },
    { immediate: true },
);

function onSwitchBoat(nextId: string | null | undefined) {
    if (nextId == null || String(nextId) === String(boatId.value)) {
        return;
    }
    void router.push({
        name: "boats.edit",
        params: { programId: programId.value, boatId: String(nextId) },
    });
}

function goPrev() {
    const p = neighbors.value.prev;
    if (p) {
        onSwitchBoat(p);
    }
}

function goNext() {
    const n = neighbors.value.next;
    if (n) {
        onSwitchBoat(n);
    }
}

const onSaveSubmit = handleSubmit(async (values: BoatCreateFormValues) => {
    const id = boatId.value;
    if (id.length === 0) {
        return;
    }
    await runWithNotify(
        async () => {
            const cap = parseOptionalNonNegativeInt(values.capacity);
            if (cap === null) {
                throw new Error("capacity");
            }
            const notes = String(values.notes ?? "").trim();
            const nextType = values.boatTypeId;
            const nextTypeId =
                nextType != null && String(nextType).length > 0
                    ? String(nextType)
                    : null;
            const col = boatsCollection.value;
            if (!col) throw new Error("Boats collection not ready.");
            col.update(id, (draft) => {
                draft.name = String(values.name).trim();
                draft.capacity = cap;
                draft.notes = notes.length > 0 ? notes : null;
                draft.boat_type_id = nextTypeId;
            });
            void refreshOutboxSnapshot();
        },
        {
            successMessage: t("boatsList.changesSaved"),
            errorGeneric: t("boatsList.errorGeneric"),
        },
    );
});

function confirmDelete() {
    const b = currentBoat.value;
    if (!b) {
        return;
    }
    confirm({
        title: t("boatsList.deleteConfirmTitle"),
        message: t("boatsList.deleteConfirmMessage", {
            name: String(b.name ?? ""),
        }),
        onOk: async () => {
            isDeleting.value = true;
            try {
                const col = boatsCollection.value;
                if (!col) return;
                col.delete(String(b.id));
                void refreshOutboxSnapshot();
                $q.notify({
                    type: "positive",
                    message: t("boatsList.deleted"),
                });
                await router.push({
                    name: "boats.list",
                    params: { programId: programId.value },
                });
            } catch (e) {
                notifyError(e, t("boatsList.errorGeneric"));
            } finally {
                isDeleting.value = false;
            }
        },
    });
}
</script>
