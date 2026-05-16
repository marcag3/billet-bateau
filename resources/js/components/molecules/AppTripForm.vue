<template>
    <q-form @submit="onValidSubmit">
        <AppFormStack>
            <q-input
                v-model="scheduledDepartureDate"
                v-bind="scheduledDepartureDateProps"
                outlined
                type="date"
                :label="t('tripsList.scheduledDepartureDate')"
                :disable="fieldsDisabled"
            />
            <q-input
                v-model="scheduledDepartureTime"
                v-bind="scheduledDepartureTimeProps"
                outlined
                type="time"
                :label="t('tripsList.scheduledDepartureTime')"
                :disable="fieldsDisabled"
            />
            <q-input
                v-model.number="capacity"
                v-bind="capacityProps"
                outlined
                type="number"
                :label="t('tripsList.capacity')"
                :hint="t('tripsList.capacityHint')"
                :disable="fieldsDisabled"
            />
            <AppBoatTypeSelectField
                v-model="boatTypeId"
                v-bind="boatTypeIdProps"
                :program-id="programId"
                :label="t('tripsList.boatType')"
                :disable="fieldsDisabled"
            />
            <AppWaterRouteSelectField
                v-model="waterRouteId"
                v-bind="waterRouteIdProps"
                :program-id="programId"
                :label="t('tripsList.waterRoute')"
                :disable="fieldsDisabled"
            />

            <AppImageUploadField
                v-if="programId.trim().length > 0"
                ref="productBannerUploadField"
                :label="t('tripsList.productImage')"
                :hint="t('tripsList.productImageHint')"
                dense
                :disabled="fieldsDisabled"
                accept="image/jpeg,image/png,image/webp"
                :existing-image-url="existingProductBannerUrl"
                :preview-max-width-px="88"
                :preview-ratio="1"
                :presign-url="presignUpload.url()"
                :allow-clear-existing="
                    persistedProductId.trim().length > 0 &&
                    existingProductBannerUrl.length > 0
                "
                :clear-existing-loading="isClearingProductBanner"
                :clear-existing-aria-label="t('tripsList.productImageRemove')"
                @clear-existing="onRemovePersistedProductBanner"
            />

            <slot
                name="actions"
                :meta="meta"
                :is-submitting="isSubmitting"
                :fields-disabled="fieldsDisabled"
            />
        </AppFormStack>
    </q-form>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { presignUpload } from "../../actions/App/Http/Controllers/Api/PresignUploadController";
import {
    createTripUpsertFormSchema,
    type TripUpsertFormValues,
} from "../../models/trips/trips.validation";
import { useNotifyErrorFromCatch } from "../../composables/useNotifyErrorFromCatch";
import { createQuasarFieldBinder } from "../../validation/quasar-vee-fields";
import { getAppPowerSyncContext } from "../../powersync/app-powersync.runtime";
import { mediaObjectPublicUrl } from "../../utilities/media-url";
import AppFormStack from "../ui/AppFormStack.vue";
import AppBoatTypeSelectField from "../ui/AppBoatTypeSelectField.vue";
import AppWaterRouteSelectField from "../organisms/AppWaterRouteSelectField.vue";
import AppImageUploadField from "./AppImageUploadField.vue";

const props = defineProps<{
    programId: string;
    /**
     * When set, merges into form values (create prefill may omit time).
     * When null, form resets to empty defaults.
     */
    seed: Partial<TripUpsertFormValues> | null;
    /** Product row id when editing (empty on create) — used for image clear / upload target. */
    persistedProductId?: string;
    /** Current banner object key for this product (from join), for preview when editing. */
    existingProductBannerKey?: string | null;
    /** Disables fields (e.g. while a delete dialog action runs). */
    disabled?: boolean;
    submitFn: (values: TripUpsertFormValues) => Promise<void>;
}>();

const { t } = useI18n();
const { notifyError } = useNotifyErrorFromCatch();
const powersync = getAppPowerSyncContext();

const productBannerUploadField = ref<InstanceType<typeof AppImageUploadField> | null>(null);
const isClearingProductBanner = ref(false);

const persistedProductId = computed(() =>
    String(props.persistedProductId ?? "").trim(),
);

const existingProductBannerUrl = computed(() =>
    mediaObjectPublicUrl(props.existingProductBannerKey ?? null),
);

const emptyValues = (): TripUpsertFormValues =>
    ({
        scheduledDepartureDate: "",
        scheduledDepartureTime: "",
        capacity: null,
        boatTypeId: null,
        waterRouteId: null,
    }) as unknown as TripUpsertFormValues;

const tripSchema = createTripUpsertFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, setValues, resetForm } =
    useForm<TripUpsertFormValues>({
        validationSchema: tripSchema,
        initialValues: emptyValues(),
    });

const quasarField = createQuasarFieldBinder(defineField);

const [scheduledDepartureDate, scheduledDepartureDateProps] = quasarField(
    "scheduledDepartureDate",
);
const [scheduledDepartureTime, scheduledDepartureTimeProps] = quasarField(
    "scheduledDepartureTime",
);
const [capacity, capacityProps] = quasarField("capacity");
const [boatTypeId, boatTypeIdProps] = quasarField("boatTypeId");
const [waterRouteId, waterRouteIdProps] = quasarField("waterRouteId");

const fieldsDisabled = computed(
    () => Boolean(props.disabled) || isSubmitting.value,
);

watch(
    () => [props.seed, props.existingProductBannerKey, props.persistedProductId] as const,
    () => {
        if (props.seed != null) {
            setValues({ ...emptyValues(), ...props.seed });
        } else {
            resetForm({ values: emptyValues() });
        }
        productBannerUploadField.value?.clearSelection();
    },
    { immediate: true },
);

async function finalizeProductBannerAfterPersistence(productId: string): Promise<void> {
    const col = powersync.collections.products.value;
    if (!col) {
        return;
    }
    const result = await productBannerUploadField.value?.uploadIfNeeded();
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

async function onRemovePersistedProductBanner(): Promise<void> {
    const id = persistedProductId.value;
    if (id.length === 0 || fieldsDisabled.value) {
        return;
    }
    const col = powersync.collections.products.value;
    if (!col) {
        return;
    }
    isClearingProductBanner.value = true;
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
        notifyError(e, t("tripsList.errorGeneric"));
    } finally {
        isClearingProductBanner.value = false;
    }
}

const onValidSubmit = handleSubmit((values) => props.submitFn(values));

defineExpose({
    finalizeProductBannerAfterPersistence,
});
</script>
