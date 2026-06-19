<template>
    <q-form @submit="onValidSubmit">
        <div class="column gap-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <q-input v-model="name" v-bind="nameProps" outlined label-slot :disable="fieldsDisabled">
                        <template #label>
                            {{ t("programsCreate.name") }}
                            <span class="text-negative" aria-hidden="true">*</span>
                        </template>
                    </q-input>
                </div>
                <div>
                    <q-input v-model="themeColor" v-bind="themeColorProps" outlined label-slot
                        :disable="fieldsDisabled">
                        <template #label>
                            {{ t("programsCreate.themeColor") }}
                            <span class="text-negative" aria-hidden="true">*</span>
                        </template>
                        <template #append>
                            <q-icon name="colorize" class="cursor-pointer">
                                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                    <q-color v-model="themeColor" format-model="hex" default-view="palette" />
                                </q-popup-proxy>
                            </q-icon>
                        </template>
                    </q-input>
                </div>
            </div>

            <q-input v-model="description" v-bind="descriptionProps" type="textarea" outlined autogrow
                :label="t('programsCreate.description')" :disable="fieldsDisabled" />

            <q-input v-if="isEditMode" v-model="slug" v-bind="slugProps" outlined :label="t('programsList.slug')"
                :hint="t('programsList.slugHint')" :disable="fieldsDisabled" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <q-input v-model="startDate" v-bind="startDateProps" type="date" outlined label-slot
                        :disable="fieldsDisabled">
                        <template #label>
                            {{ t("programsCreate.startDate") }}
                            <span class="text-negative" aria-hidden="true">*</span>
                        </template>
                    </q-input>
                </div>
                <div>
                    <q-input v-model="endDate" v-bind="endDateProps" type="date" outlined label-slot
                        :disable="fieldsDisabled">
                        <template #label>
                            {{ t("programsCreate.endDate") }}
                            <span class="text-negative" aria-hidden="true">*</span>
                        </template>
                    </q-input>
                </div>
            </div>

            <AppTextRepeaterField v-model="bookingQuestionRows" :label="t('programsCreate.bookingQuestions')"
                :hint="t('programsCreate.bookingQuestionsHint')"
                :item-label-template="t('programsCreate.bookingQuestionLabel')"
                :add-label="t('programsCreate.addBookingQuestion')"
                :remove-label="t('programsCreate.removeBookingQuestion')" :disabled="fieldsDisabled">
                <template #fields="{ value, setValue, label, disabled }">
                    <q-input :model-value="value" outlined :disable="disabled" :label="label"
                        @update:model-value="setValue" />
                </template>
            </AppTextRepeaterField>

            <q-input v-model="emailSignature" v-bind="emailSignatureProps" type="textarea" outlined autogrow
                :label="t('programsCreate.emailSignature')" :hint="t('programsCreate.emailSignatureHint')"
                :disable="fieldsDisabled" />

            <q-toggle v-model="isActive" v-bind="isActiveProps" :label="t('programsList.isActive')"
                :disable="fieldsDisabled" />

            <q-expansion-item :label="t('programsCreate.addressOptional')" icon="place"
                class="bg-grey-1 rounded-borders" dense-toggle :disable="fieldsDisabled">
                <div class="p-4 column gap-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <q-input v-model="line1" v-bind="line1Props" outlined :label="t('programsCreate.line1')"
                                :disable="fieldsDisabled" />
                        </div>
                        <div>
                            <q-input v-model="line2" v-bind="line2Props" outlined :label="t('programsCreate.line2')"
                                :disable="fieldsDisabled" />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <q-input v-model="city" v-bind="cityProps" outlined :label="t('programsCreate.city')"
                                :disable="fieldsDisabled" />
                        </div>
                        <div>
                            <q-input v-model="postalCode" v-bind="postalCodeProps" outlined
                                :label="t('programsCreate.postalCode')" :disable="fieldsDisabled" />
                        </div>
                    </div>
                    <q-input v-model="country" v-bind="countryProps" outlined :label="t('programsCreate.country')"
                        :disable="fieldsDisabled" />
                </div>
            </q-expansion-item>

            <AppImageUploadField ref="imageUploadField" :label="t('programsCreate.images')" :disabled="fieldsDisabled"
                accept="image/jpeg,image/png,image/webp" :existing-image-url="existingBannerUrl"
                :presign-url="presignUpload.url()" />

            <slot name="actions" :meta="meta" :is-submitting="isSubmitting" :fields-disabled="fieldsDisabled" />
        </div>
    </q-form>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { presignUpload } from "../../actions/App/Http/Controllers/Api/PresignUploadController";
import {
    createProgramCreateFormSchema,
    createProgramEditFormSchema,
    createEmptyProgramCreateFormValues,
    createEmptyProgramEditFormValues,
    type ProgramCreateFormValues,
    type ProgramEditFormValues,
} from "../../models/programs/programs.validation";
import type { ProgramFormSubmitPayload } from "../../models/programs/program-form";
import { parseBookingQuestionsInput } from "../../utilities/program-booking-questions";
import { createQuasarFieldBinder } from "../../validation/quasar-vee-fields";
import { getAppPowerSyncContext } from "../../powersync/app-powersync.runtime";
import { useNotifyErrorFromCatch } from "../../composables/useNotifyErrorFromCatch";
import AppTextRepeaterField from "../ui/AppTextRepeaterField.vue";
import AppImageUploadField from "./AppImageUploadField.vue";

const props = withDefaults(
    defineProps<{
        mode: "create" | "edit";
        programId?: string;
        seed?: ProgramEditFormValues | null;
        bookingQuestionSeed?: string[] | null;
        existingBannerUrl?: string;
        disabled?: boolean;
        submitFn: (payload: ProgramFormSubmitPayload) => Promise<string>;
    }>(),
    {
        programId: "",
        seed: null,
        bookingQuestionSeed: null,
        existingBannerUrl: "",
        disabled: false,
    },
);

const emit = defineEmits<{
    (e: "submitted", programId: string): void;
    (e: "banner-uploaded", publicUrl: string): void;
}>();

const { t } = useI18n();
const { notifyError } = useNotifyErrorFromCatch();
const powersync = getAppPowerSyncContext();

const imageUploadField = ref<InstanceType<typeof AppImageUploadField> | null>(null);
const bookingQuestionRows = ref<string[]>([""]);

const validationSchema = computed(() =>
    props.mode === "edit"
        ? createProgramEditFormSchema(t)
        : createProgramCreateFormSchema(t),
);

const initialValues = computed(() =>
    props.mode === "edit"
        ? createEmptyProgramEditFormValues()
        : createEmptyProgramCreateFormValues(),
);

const isEditMode = props.mode === "edit";

const { handleSubmit, defineField, meta, isSubmitting, resetForm } = useForm<
    ProgramCreateFormValues | ProgramEditFormValues
>({
    validationSchema,
    initialValues: initialValues.value,
});

const quasarField = createQuasarFieldBinder(defineField);

const [name, nameProps] = quasarField("name");
const [description, descriptionProps] = quasarField("description");
const [themeColor, themeColorProps] = quasarField("themeColor");
const [startDate, startDateProps] = quasarField("startDate");
const [endDate, endDateProps] = quasarField("endDate");
const [emailSignature, emailSignatureProps] = quasarField("emailSignature");
const [isActive, isActiveProps] = quasarField("isActive");
const [line1, line1Props] = quasarField("address.line_1");
const [line2, line2Props] = quasarField("address.line_2");
const [city, cityProps] = quasarField("address.city");
const [postalCode, postalCodeProps] = quasarField("address.postal_code");
const [country, countryProps] = quasarField("address.country");

const slugBinding = isEditMode ? quasarField("slug") : null;
const slug = slugBinding?.[0];
const slugProps = slugBinding?.[1];

const fieldsDisabled = computed(
    () => Boolean(props.disabled) || isSubmitting.value,
);

function applyBookingQuestionSeed(rows: string[] | null | undefined): void {
    const normalized =
        rows != null && rows.length > 0 ? [...rows] : [""];
    bookingQuestionRows.value = normalized;
}

watch(
    () => [props.seed, props.bookingQuestionSeed, props.programId] as const,
    async ([seed, bookingSeed, programId], previousTuple) => {
        if (props.mode !== "edit" || seed == null) {
            return;
        }

        const previousId = Array.isArray(previousTuple)
            ? String(previousTuple[2] ?? "")
            : "";
        const routeChanged = programId !== previousId;
        if (meta.value.dirty && !routeChanged) {
            return;
        }

        applyBookingQuestionSeed(bookingSeed);
        resetForm({ values: seed });
        await nextTick();
        imageUploadField.value?.clearSelection();
    },
    { immediate: true },
);

async function finalizeBannerAfterPersistence(programId: string): Promise<void> {
    const col = powersync.collections.programs.value;
    if (!col) {
        return;
    }

    const uploadResult = await imageUploadField.value?.uploadIfNeeded();
    if (uploadResult == null) {
        return;
    }

    col.update(programId, (draft) => {
        draft.banner_object_key = uploadResult.objectKey;
        draft.banner_mime_type = uploadResult.mimeType;
        draft.banner_size_bytes = uploadResult.sizeBytes;
        draft.banner_etag = uploadResult.etag;
        draft.banner_uploaded_at = new Date().toISOString();
    });
    void powersync.refreshOutboxSnapshot();

    if (uploadResult.publicUrl.length > 0) {
        emit("banner-uploaded", uploadResult.publicUrl);
    }
}

const onValidSubmit = handleSubmit(async (values) => {
    const bookingQuestions = parseBookingQuestionsInput(bookingQuestionRows.value);
    const programId = await props.submitFn({ values, bookingQuestions });
    try {
        await finalizeBannerAfterPersistence(programId);
    } catch (error) {
        notifyError(error, t("programsCreate.bannerUploadFailed"));
    }
    emit("submitted", programId);
});

defineExpose({
    clearImageSelection: () => imageUploadField.value?.clearSelection(),
});
</script>
