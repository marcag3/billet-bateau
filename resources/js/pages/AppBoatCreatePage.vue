<template>
    <AppEntityCreatePageLayout
        :ready="hasBootstrapped"
        :title="t('boatsList.createPageTitle')"
        :description="t('boatsList.createPageDescription')"
        :back-to="backTo"
        :back-label="t('boatsList.backToList')"
    >
        <AppCardSection :label="t('boatsList.addNew')">
            <q-form @submit.prevent="onCreateSubmit">
                <AppFormStack>
                    <q-input
                        v-model="createName"
                        v-bind="createNameProps"
                        outlined
                        :label="t('boatsList.name')"
                        :disable="isSubmitting"
                    />
                    <q-input
                        v-model.number="createCapacity"
                        v-bind="createCapacityProps"
                        outlined
                        type="number"
                        :label="t('boatsList.capacity')"
                        :hint="t('boatsList.capacityHint')"
                        :disable="isSubmitting"
                    />
                    <q-input
                        v-model="createNotes"
                        v-bind="createNotesProps"
                        type="textarea"
                        autogrow
                        outlined
                        :label="t('boatsList.notes')"
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
                        :label="t('boatsList.boatType')"
                        :disable="isSubmitting"
                    />
                    <q-btn
                        color="primary"
                        type="submit"
                        :label="t('boatsList.create')"
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
    createBoatCreateFormSchema,
    type BoatCreateFormValues,
} from "../models/boats/boats.validation";
import { parseOptionalNonNegativeInt } from "../validation/zod-fields";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import { useLiveQuery } from "@tanstack/vue-db";
import { ulid } from "ulid";
import { eq } from "@tanstack/db";
import {
    getAppPowerSyncBootstrappedRef,
    getBoatTypesCollection,
    getBoatsCollection,
    getCurrentUserIdRef,
    getActiveProgramIdRef,
    refreshOutboxSnapshot,
} from "../powersync/app-powersync.runtime";
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import AppEntityCreatePageLayout from "../layouts/AppEntityCreatePageLayout.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const boatsCollection = getBoatsCollection();
const currentUserIdRef = getCurrentUserIdRef();
const activeProgramIdRef = getActiveProgramIdRef();
const boatTypesCollection = getBoatTypesCollection();

const { data: boatTypes } = useLiveQuery(
    (queryBuilder) => {
        const col = boatTypesCollection.value;
        const pid = activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ bt: col })
            .where(({ bt }) => eq(bt.program_id, pid));
    },
    [boatTypesCollection, activeProgramIdRef],
);
const { runWithNotify } = useNotifyAsyncAction();

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const programId = computed(() => String(route.params.programId ?? "").trim());

const backTo = computed(() => ({
    name: "boats.list" as const,
    params: { programId: programId.value },
}));

const boatTypeOptions = computed(() =>
    boatTypes.value.map((bt) => ({
        label: String(bt.name ?? ""),
        value: String(bt.id),
    })),
);

const boatCreateSchema = createBoatCreateFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } =
    useForm<BoatCreateFormValues>({
        validationSchema: boatCreateSchema,
        initialValues: {
            name: "",
            capacity: null,
            notes: "",
            boatTypeId: null,
        } as unknown as BoatCreateFormValues,
    });

const quasarField = createQuasarFieldBinder(defineField);

const [createName, createNameProps] = quasarField("name");
const [createCapacity, createCapacityProps] = quasarField("capacity");
const [createNotes, createNotesProps] = quasarField("notes");
const [createBoatTypeId, createBoatTypeIdProps] = quasarField("boatTypeId");

const onCreateSubmit = handleSubmit(async (values: BoatCreateFormValues) => {
    await runWithNotify(
        async () => {
            const pid = activeProgramIdRef.value.trim();
            if (pid.length === 0) {
                throw new Error("Select a program roster before adding boats.");
            }
            const col = boatsCollection.value;
            if (!col) {
                throw new Error("Boats collection is not ready.");
            }
            const parsedUserId = Number.parseInt(currentUserIdRef.value, 10);
            const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;
            const id = ulid();
            const name = String(values.name).trim();
            const notes = String(values.notes ?? "").trim();
            const capacity = parseOptionalNonNegativeInt(values.capacity);
            if (capacity === null) {
                throw new Error("Boat capacity is required.");
            }
            const boatTypeId =
                values.boatTypeId != null &&
                String(values.boatTypeId).length > 0
                    ? String(values.boatTypeId)
                    : null;
            await col.insert({
                id,
                user_id: userId,
                boat_type_id: boatTypeId,
                program_id: pid,
                name: name.length > 0 ? name : "Untitled",
                capacity,
                notes: notes.length > 0 ? notes : null,
            }).isPersisted.promise;
            void refreshOutboxSnapshot();
            resetForm();
            await router.push({
                name: "boats.list",
                params: { programId: programId.value },
            });
        },
        {
            successMessage: t("boatsList.created"),
            errorGeneric: t("boatsList.errorGeneric"),
        },
    );
});
</script>
