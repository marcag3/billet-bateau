<template>
    <q-dialog
        v-model="dialogModel"
        persistent
        @hide="onDialogHide"
    >
        <q-card
            class="p-0"
            style="width: min(560px, 92vw); max-width: 100%"
        >
            <q-card-section class="row items-center pb-0">
                <div class="text-h6">
                    {{
                        modalMode === "edit"
                            ? t("guidesList.editPageTitle")
                            : t("guidesList.createPageTitle")
                    }}
                </div>
                <q-space />
                <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    :aria-label="t('common.cancel')"
                    @click="closeModal"
                />
            </q-card-section>

            <q-card-section>
                <AppGuideForm :seed="formSeed" :submit-fn="onSubmitGuide">
                    <template #actions="{ meta, isSubmitting: formSubmitting }">
                        <div class="row justify-end gap-2 mt-4">
                            <q-btn
                                flat
                                :label="t('common.cancel')"
                                :disable="formSubmitting"
                                @click="closeModal"
                            />
                            <q-btn
                                color="primary"
                                type="submit"
                                :loading="formSubmitting"
                                :label="
                                    modalMode === 'edit'
                                        ? t('guidesList.saveChanges')
                                        : t('guidesList.create')
                                "
                                :disable="!meta.valid"
                            />
                        </div>
                    </template>
                </AppGuideForm>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { ulid } from "ulid";
import AppGuideForm from "../molecules/AppGuideForm.vue";
import type { GuideFormValues } from "../../models/guides/guides.validation";
import type { GuideOutput } from "../../powersync/guides.collection";
import { getAppPowerSyncContext } from "../../powersync/app-powersync.runtime";
import { useNotifyAsyncAction } from "../../composables/useNotifyAsyncAction";

const { t } = useI18n();
const powersync = getAppPowerSyncContext();
const { runWithNotify } = useNotifyAsyncAction();

const guidesCollection = powersync.collections.guides;

const dialogModel = ref(false);
const modalMode = ref<"create" | "edit">("create");
const editingId = ref("");
const formSeed = ref<Partial<GuideFormValues> | null>(null);

function rowToFormValues(row: GuideOutput): GuideFormValues {
    return {
        name: String(row.name ?? ""),
    };
}

function closeModal(): void {
    dialogModel.value = false;
}

function resetModalState(): void {
    modalMode.value = "create";
    editingId.value = "";
    formSeed.value = null;
}

function onDialogHide(): void {
    resetModalState();
}

function openCreateModal(): void {
    modalMode.value = "create";
    editingId.value = "";
    formSeed.value = null;
    dialogModel.value = true;
}

function openEditModal(row: GuideOutput): void {
    modalMode.value = "edit";
    editingId.value = String(row.id ?? "").trim();
    formSeed.value = rowToFormValues(row);
    dialogModel.value = true;
}

async function onSubmitGuide(values: GuideFormValues): Promise<void> {
    const idSnapshot = editingId.value.trim();
    const wasEditing = idSnapshot.length > 0;

    await runWithNotify(
        async () => {
            const col = guidesCollection.value;
            if (!col) {
                throw new Error("Guides collection is not ready.");
            }
            const trimmedName = String(values.name).trim();
            const name =
                trimmedName.length > 0 ? trimmedName : "Untitled";

            if (wasEditing) {
                col.update(idSnapshot, (draft) => {
                    draft.name = name;
                });
                void powersync.refreshOutboxSnapshot();
            } else {
                await col
                    .insert({
                        id: ulid(),
                        name,
                        staff_user_id: null,
                    })
                    .isPersisted.promise;
                void powersync.refreshOutboxSnapshot();
            }
            closeModal();
        },
        {
            successMessage: wasEditing
                ? t("guidesList.changesSaved")
                : t("guidesList.created"),
            errorGeneric: t("guidesList.errorGeneric"),
        },
    );
}

defineExpose({
    openCreateModal,
    openEditModal,
});
</script>
