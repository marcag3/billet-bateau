<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('programsCreate.title')"
            :description="t('programsCreate.subtitle')"
            description-size="body2"
        />

        <AppCardSection :label="t('programsCreate.formSection')">
            <AppAlertBanner v-if="errorMessage.length > 0" variant="error">
                {{ errorMessage }}
            </AppAlertBanner>

            <q-form class="q-gutter-md" @submit.prevent="onFormSubmit">
                <q-input
                    v-model="name"
                    v-bind="nameProps"
                    outlined
                    label-slot
                    :disable="isSubmitting"
                >
                    <template #label>
                        {{ t("programsCreate.name") }}
                        <span class="text-negative" aria-hidden="true">*</span>
                    </template>
                </q-input>

                <q-input
                    v-model="description"
                    v-bind="descriptionProps"
                    type="textarea"
                    outlined
                    autogrow
                    :label="t('programsCreate.description')"
                    :disable="isSubmitting"
                />

                <q-input
                    v-model="themeColor"
                    v-bind="themeColorProps"
                    outlined
                    label-slot
                    :disable="isSubmitting"
                >
                    <template #label>
                        {{ t("programsCreate.themeColor") }}
                        <span class="text-negative" aria-hidden="true">*</span>
                    </template>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy
                                cover
                                transition-show="scale"
                                transition-hide="scale"
                            >
                                <q-color
                                    v-model="themeColor"
                                    format-model="hex"
                                    default-view="palette"
                                />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>

                <q-toggle
                    v-model="isActive"
                    v-bind="isActiveProps"
                    :label="t('programsList.isActive')"
                    :disable="isSubmitting"
                />

                <q-expansion-item
                    :label="t('programsCreate.addressOptional')"
                    icon="place"
                    class="bg-grey-1 rounded-borders"
                    dense-toggle
                    :disable="isSubmitting"
                >
                    <div class="q-pa-md q-gutter-y-md">
                        <q-input
                            v-model="line1"
                            v-bind="line1Props"
                            outlined
                            :label="t('programsCreate.line1')"
                            :disable="isSubmitting"
                        />
                        <q-input
                            v-model="line2"
                            v-bind="line2Props"
                            outlined
                            :label="t('programsCreate.line2')"
                            :disable="isSubmitting"
                        />
                        <div class="row q-col-gutter-sm">
                            <div class="col-12 col-sm-6">
                                <q-input
                                    v-model="city"
                                    v-bind="cityProps"
                                    outlined
                                    :label="t('programsCreate.city')"
                                    :disable="isSubmitting"
                                />
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-input
                                    v-model="postalCode"
                                    v-bind="postalCodeProps"
                                    outlined
                                    :label="t('programsCreate.postalCode')"
                                    :disable="isSubmitting"
                                />
                            </div>
                        </div>
                        <q-input
                            v-model="country"
                            v-bind="countryProps"
                            outlined
                            :label="t('programsCreate.country')"
                            :disable="isSubmitting"
                        />
                    </div>
                </q-expansion-item>

                <q-file
                    v-model="imagesModel"
                    v-bind="imagesModelProps"
                    outlined
                    multiple
                    use-chips
                    counter
                    :label="t('programsCreate.images')"
                    accept="image/jpeg,image/png,image/webp"
                    :disable="isSubmitting"
                />

                <div class="row q-gutter-sm">
                    <q-btn
                        color="primary"
                        type="submit"
                        :loading="isSubmitting"
                        :disable="isSubmitting"
                        :label="t('programsCreate.submit')"
                    />
                    <q-btn
                        flat
                        color="primary"
                        :disable="isSubmitting"
                        :label="t('common.programs')"
                        @click="goToProgramsList"
                    />
                </div>
            </q-form>
        </AppCardSection>
    </q-page>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { ulid } from "ulid";
import {
    createProgramCreateFormSchema,
    type ProgramCreateFormValues,
} from "../models/programs/programs.validation";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import {
    normalizeThemeColor,
    buildInitialProgramSlug,
    normalizeAddressRowFields,
} from "../utilities/program-helpers";
import mediaRoutes from "../routes/api/media";
import { requestFormData } from "../services/http.client";
import { ref } from "vue";
import { normalizeImageFiles } from "../utilities/image-files";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();

const errorMessage = ref("");

const programCreateSchema = createProgramCreateFormSchema(t);
const { handleSubmit, defineField, isSubmitting } =
    useForm<ProgramCreateFormValues>({
        validationSchema: programCreateSchema,
        initialValues: {
            name: "",
            description: "",
            themeColor: "#08758A",
            isActive: true,
            address: {
                line_1: "",
                line_2: "",
                city: "",
                postal_code: "",
                country: "",
            },
            imagesModel: null,
        } satisfies ProgramCreateFormValues,
    });

const quasarField = createQuasarFieldBinder(defineField);

const [name, nameProps] = quasarField("name");
const [description, descriptionProps] = quasarField("description");
const [themeColor, themeColorProps] = quasarField("themeColor");
const [isActive, isActiveProps] = quasarField("isActive");
const [line1, line1Props] = quasarField("address.line_1");
const [line2, line2Props] = quasarField("address.line_2");
const [city, cityProps] = quasarField("address.city");
const [postalCode, postalCodeProps] = quasarField("address.postal_code");
const [country, countryProps] = quasarField("address.country");
const [imagesModel, imagesModelProps] = quasarField("imagesModel");

async function ensureBootstrapped(): Promise<void> {
    if (!powersync.hasBootstrappedCollection.value) {
        await powersync.bootstrapAppPowerSync();
    }
}

function goToProgramsList() {
    void router.push({ name: "programs.list" });
}

const onFormSubmit = handleSubmit(async (values: ProgramCreateFormValues) => {
    errorMessage.value = "";

    try {
        await ensureBootstrapped();

        const col = powersync.collections.programs.value;
        if (!col) {
            throw new Error("Programs collection is not ready.");
        }

        const id = ulid();
        const themeColor = normalizeThemeColor(values.themeColor);
        const addressFields = normalizeAddressRowFields({ ...values.address });

        await col.insert({
            id,
            name: values.name.trim(),
            description:
                values.description.trim().length > 0
                    ? values.description.trim()
                    : null,
            theme_color: themeColor,
            is_active: values.isActive ? 1 : 0,
            is_archived: 0,
            slug: buildInitialProgramSlug(values.name, id),
            line_1: addressFields.line_1,
            line_2: addressFields.line_2,
            city: addressFields.city,
            postal_code: addressFields.postal_code,
            country: addressFields.country,
        }).isPersisted.promise;

        void powersync.refreshOutboxSnapshot();

        const files = normalizeImageFiles(values.imagesModel);
        if (files.length > 0) {
            const formData = new FormData();
            for (const file of files) {
                formData.append("images[]", file);
            }

            await requestFormData(
                mediaRoutes.store.url({ type: "program", id: id }),
                formData,
                {
                    withCsrf: true,
                },
            );
        }

        $q.notify({ type: "positive", message: t("programsCreate.success") });
        await router.push({ name: "programs.list" });
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : String(error);
    }
});
</script>
