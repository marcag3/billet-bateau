<template>
    <q-form @submit="onValidSubmit">
        <div class="column gap-4">
            <q-input v-model="name" v-bind="nameProps" outlined :label="t('productsList.name')"
                :disable="fieldsDisabled" />
            <q-input v-model="description" v-bind="descriptionProps" type="textarea" outlined autogrow
                :label="t('productsList.productDescription')" :hint="t('productsList.productDescriptionHint')"
                :disable="fieldsDisabled" />
            <q-input v-model.number="capacity" v-bind="capacityProps" outlined type="number"
                :label="t('productsList.capacity')" :hint="t('productsList.capacityHint')" :disable="fieldsDisabled" />
            <AppBoatTypeSelectField v-model="boatTypeId" v-bind="boatTypeIdProps" :program-id="programId"
                :label="t('productsList.boatType')" :disable="fieldsDisabled" />
            <AppWaterRouteSelectField v-model="waterRouteId" v-bind="waterRouteIdProps" :program-id="programId"
                :label="t('productsList.waterRoute')" :disable="fieldsDisabled" />

            <AppImageUploadField v-if="programId.trim().length > 0" ref="bannerUploadField"
                :label="t('productsList.image')" :hint="t('productsList.imageHint')" :disabled="fieldsDisabled"
                accept="image/jpeg,image/png,image/webp" :existing-image-url="existingBannerUrl" :preview-ratio="1"
                :presign-url="presignUpload.url()" :allow-clear-existing="persistedProductId.trim().length > 0 &&
                    existingBannerUrl.length > 0
                    " :clear-existing-loading="isClearingBanner" :clear-existing-aria-label="t('productsList.imageRemove')"
                @clear-existing="onRemovePersistedBanner" />

            <slot name="actions" :meta="meta" :is-submitting="isSubmitting" :fields-disabled="fieldsDisabled" />
        </div>
    </q-form>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { presignUpload } from "../../actions/App/Http/Controllers/Api/PresignUploadController";
import {
    createEmptyProductUpsertFormValues,
    createProductUpsertFormSchema,
    type ProductUpsertFormValues,
} from "../../models/products/products.validation";
import { useNotifyErrorFromCatch } from "../../composables/useNotifyErrorFromCatch";
import { createQuasarFieldBinder } from "../../validation/quasar-vee-fields";
import { getAppPowerSyncContext } from "../../powersync/app-powersync.runtime";
import { mediaObjectPublicUrl } from "../../utilities/media-url";
import AppBoatTypeSelectField from "../ui/AppBoatTypeSelectField.vue";
import AppWaterRouteSelectField from "../organisms/AppWaterRouteSelectField.vue";
import AppImageUploadField from "./AppImageUploadField.vue";

const props = defineProps<{
    programId: string;
    seed: Partial<ProductUpsertFormValues> | null;
    persistedProductId?: string;
    existingBannerKey?: string | null;
    disabled?: boolean;
    submitFn: (values: ProductUpsertFormValues) => Promise<string>;
}>();

const emit = defineEmits<{
    (e: "submitted", productId: string): void;
}>();

const { t } = useI18n();
const { notifyError } = useNotifyErrorFromCatch();
const powersync = getAppPowerSyncContext();

const bannerUploadField = ref<InstanceType<typeof AppImageUploadField> | null>(null);
const isClearingBanner = ref(false);

const persistedProductId = computed(() =>
    String(props.persistedProductId ?? "").trim(),
);

const existingBannerUrl = computed(() =>
    mediaObjectPublicUrl(props.existingBannerKey ?? null),
);

const productSchema = createProductUpsertFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, setValues, resetForm } =
    useForm<ProductUpsertFormValues>({
        validationSchema: productSchema,
        initialValues: createEmptyProductUpsertFormValues(),
    });

const quasarField = createQuasarFieldBinder(defineField);
const [name, nameProps] = quasarField("name");
const [description, descriptionProps] = quasarField("description");
const [capacity, capacityProps] = quasarField("capacity");
const [boatTypeId, boatTypeIdProps] = quasarField("boatTypeId");
const [waterRouteId, waterRouteIdProps] = quasarField("waterRouteId");

const fieldsDisabled = computed(
    () => Boolean(props.disabled) || isSubmitting.value,
);

watch(
    () => [props.seed, props.existingBannerKey, props.persistedProductId] as const,
    () => {
        if (props.seed != null) {
            setValues({
                ...createEmptyProductUpsertFormValues(),
                ...props.seed,
            });
        } else {
            resetForm({ values: createEmptyProductUpsertFormValues() });
        }
        bannerUploadField.value?.clearSelection();
    },
    { immediate: true },
);

async function finalizeBannerAfterPersistence(productId: string): Promise<void> {
    const col = powersync.collections.products.value;
    if (!col) {
        return;
    }
    const result = await bannerUploadField.value?.uploadIfNeeded();
    if (result == null) {
        return;
    }
    col.update(productId, (draft) => {
        draft.banner_object_key = result.objectKey;
        draft.banner_mime_type = result.mimeType;
        draft.banner_size_bytes = result.sizeBytes;
        draft.banner_etag = result.etag;
        draft.banner_uploaded_at = new Date().toISOString();
    });
    void powersync.refreshOutboxSnapshot();
}

async function onRemovePersistedBanner(): Promise<void> {
    const id = persistedProductId.value;
    if (id.length === 0 || fieldsDisabled.value) {
        return;
    }
    const col = powersync.collections.products.value;
    if (!col) {
        return;
    }
    isClearingBanner.value = true;
    try {
        col.update(id, (draft) => {
            draft.banner_object_key = null;
            draft.banner_mime_type = null;
            draft.banner_size_bytes = null;
            draft.banner_etag = null;
            draft.banner_uploaded_at = null;
        });
        void powersync.refreshOutboxSnapshot();
    } catch (e) {
        notifyError(e, t("productsList.errorGeneric"));
    } finally {
        isClearingBanner.value = false;
    }
}

const onValidSubmit = handleSubmit(async (values) => {
    const productId = await props.submitFn(values);
    try {
        await finalizeBannerAfterPersistence(productId);
    } catch (e) {
        notifyError(e, t("productsList.imageUploadFailed"));
    }
    emit("submitted", productId);
});
</script>
