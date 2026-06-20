<template>
    <q-dialog v-model="dialogModel" persistent @hide="onDialogHide">
        <q-card
            class="p-0"
            style="width: min(680px, 94vw); max-width: 100%"
        >
            <q-card-section class="row items-center pb-0">
                <div class="text-h6">
                    {{
                        modalMode === "edit"
                            ? t("productsList.editTitle")
                            : t("productsList.createTitle")
                    }}
                </div>
                <q-space />
                <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    :aria-label="t('productsList.cancel')"
                    @click="closeModal"
                />
            </q-card-section>

            <q-card-section>
                <AppProductForm
                    :program-id="activeProgramId"
                    :seed="formSeed"
                    :persisted-product-id="editingId"
                    :existing-banner-key="existingBannerKey"
                    :submit-fn="onSubmitProduct"
                    @submitted="onProductFormSubmitted"
                >
                    <template #actions="{ meta, isSubmitting: formSubmitting }">
                        <div class="row justify-end gap-2 mt-4">
                            <q-btn
                                flat
                                :label="t('productsList.cancel')"
                                :disable="formSubmitting"
                                @click="closeModal"
                            />
                            <q-btn
                                color="primary"
                                type="submit"
                                :loading="formSubmitting"
                                :label="
                                    modalMode === 'edit'
                                        ? t('productsList.save')
                                        : t('productsList.create')
                                "
                                :disable="!meta.valid"
                            />
                        </div>
                    </template>
                </AppProductForm>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ulid } from "ulid";
import AppProductForm from "../molecules/AppProductForm.vue";
import type { ProductUpsertFormValues } from "../../models/products/products.validation";
import type { ProductOutput } from "../../powersync/products.collection";
import { getAppPowerSyncContext } from "../../powersync/app-powersync.runtime";
import { useNotifyAsyncAction } from "../../composables/useNotifyAsyncAction";

const { t } = useI18n();
const powersync = getAppPowerSyncContext();
const { runWithNotify } = useNotifyAsyncAction();

const productsCollection = powersync.collections.products;

const dialogModel = ref(false);
const modalMode = ref<"create" | "edit">("create");
const editingId = ref("");
const existingBannerKey = ref<string | null>(null);
const formSeed = ref<Partial<ProductUpsertFormValues> | null>(null);

const activeProgramId = computed(() => powersync.activeProgramIdRef.value.trim());

function normalizeDescription(value: unknown): string {
    return String(value ?? "").trim();
}

function descriptionForPersistence(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function rowToFormValues(row: ProductOutput): ProductUpsertFormValues {
    return {
        name: String(row.name ?? ""),
        description: normalizeDescription(row.description),
        capacity:
            row.capacity === null || row.capacity === undefined
                ? null
                : Number(row.capacity),
        boatTypeId:
            row.boat_type_id == null || String(row.boat_type_id).trim() === ""
                ? null
                : String(row.boat_type_id),
        waterRouteId:
            row.water_route_id == null || String(row.water_route_id).trim() === ""
                ? null
                : String(row.water_route_id),
    };
}

function closeModal(): void {
    dialogModel.value = false;
}

function resetModalState(): void {
    modalMode.value = "create";
    editingId.value = "";
    existingBannerKey.value = null;
    formSeed.value = null;
}

function onDialogHide(): void {
    resetModalState();
}

function openCreateModal(): void {
    modalMode.value = "create";
    editingId.value = "";
    existingBannerKey.value = null;
    formSeed.value = null;
    dialogModel.value = true;
}

function openEditModal(row: ProductOutput): void {
    modalMode.value = "edit";
    editingId.value = String(row.id ?? "").trim();
    existingBannerKey.value =
        row.banner_object_key == null || String(row.banner_object_key).trim() === ""
            ? null
            : String(row.banner_object_key);
    formSeed.value = rowToFormValues(row);
    dialogModel.value = true;
}

async function onSubmitProduct(values: ProductUpsertFormValues): Promise<string> {
    const idSnapshot = editingId.value.trim();
    const wasEditing = idSnapshot.length > 0;
    let persistedId = "";

    await runWithNotify(
        async () => {
            const col = productsCollection.value;
            if (!col) {
                throw new Error("Products collection not ready.");
            }

            const name = String(values.name ?? "").trim();
            if (name.length === 0) {
                throw new Error("Product name is required.");
            }

            if (wasEditing) {
                col.update(idSnapshot, (draft) => {
                    draft.name = name;
                    draft.description = descriptionForPersistence(
                        values.description,
                    );
                    draft.capacity = values.capacity;
                    draft.boat_type_id = values.boatTypeId;
                    draft.water_route_id = values.waterRouteId;
                });
                persistedId = idSnapshot;
                void powersync.refreshOutboxSnapshot();
                return;
            }

            const programId = activeProgramId.value;
            if (programId.length === 0) {
                throw new Error("Select a program before adding products.");
            }

            const id = ulid();
            persistedId = id;
            await col
                .insert({
                    id,
                    program_id: programId,
                    name,
                    description: descriptionForPersistence(values.description),
                    capacity: values.capacity,
                    boat_type_id: values.boatTypeId,
                    water_route_id: values.waterRouteId,
                    banner_object_key: null,
                    banner_mime_type: null,
                    banner_size_bytes: null,
                    banner_etag: null,
                    banner_uploaded_at: null,
                })
                .isPersisted.promise;
            void powersync.refreshOutboxSnapshot();
        },
        {
            successMessage: wasEditing
                ? t("productsList.changesSaved")
                : t("productsList.created"),
            errorGeneric: t("productsList.errorGeneric"),
        },
    );

    if (persistedId.length === 0) {
        throw new Error("Unable to determine product id.");
    }

    return persistedId;
}

function onProductFormSubmitted(): void {
    closeModal();
}

defineExpose({
    openCreateModal,
    openEditModal,
});
</script>
