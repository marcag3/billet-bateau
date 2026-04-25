<template>
    <q-page class="q-pa-xl">
        <h1 class="text-h4 q-mb-md">{{ t("programsCreate.title") }}</h1>
        <p class="text-body2 text-grey-8 q-mb-lg">
            {{ t("programsCreate.subtitle") }}
        </p>

        <q-banner
            v-if="errorMessage.length > 0"
            class="bg-red-1 text-negative q-mb-md"
            rounded
        >
            {{ errorMessage }}
        </q-banner>

        <q-form class="q-gutter-md" @submit.prevent="onFormSubmit">
            <q-input
                v-model="name"
                v-bind="nameProps"
                outlined
                :label="t('programsCreate.name')"
            />

            <q-input
                v-model="description"
                v-bind="descriptionProps"
                type="textarea"
                outlined
                autogrow
                :label="t('programsCreate.description')"
            />

            <div class="row q-col-gutter-md items-start">
                <div class="col-12 col-md-6">
                    <div class="text-caption text-grey-7 q-mb-xs">
                        {{ t("programsCreate.themeColor") }}
                    </div>
                    <q-input
                        v-model="themeColor"
                        v-bind="themeColorProps"
                        outlined
                        dense
                    >
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
                </div>
            </div>

            <q-expansion-item
                :label="t('programsCreate.addressOptional')"
                icon="place"
                class="bg-grey-1 rounded-borders"
                dense-toggle
            >
                <div class="q-pa-md q-gutter-y-md">
                    <q-input
                        v-model="line1"
                        v-bind="line1Props"
                        outlined
                        dense
                        :label="t('programsCreate.line1')"
                    />
                    <q-input
                        v-model="line2"
                        v-bind="line2Props"
                        outlined
                        dense
                        :label="t('programsCreate.line2')"
                    />
                    <div class="row q-col-gutter-sm">
                        <div class="col-12 col-sm-6">
                            <q-input
                                v-model="city"
                                v-bind="cityProps"
                                outlined
                                dense
                                :label="t('programsCreate.city')"
                            />
                        </div>
                        <div class="col-12 col-sm-6">
                            <q-input
                                v-model="postalCode"
                                v-bind="postalCodeProps"
                                outlined
                                dense
                                :label="t('programsCreate.postalCode')"
                            />
                        </div>
                    </div>
                    <q-input
                        v-model="country"
                        v-bind="countryProps"
                        outlined
                        dense
                        :label="t('programsCreate.country')"
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
            />

            <div class="row q-gutter-sm">
                <q-btn
                    color="primary"
                    type="submit"
                    :loading="isSubmitting"
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
    </q-page>
</template>

<script setup>
import { useForm } from "vee-validate";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { createProgramCreateFormSchema } from "../models/programs/programs.validation";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import { usePrograms } from "../models/programs/programs.model";
import mediaRoutes from "../routes/api/media";
import { requestFormData } from "../services/http.client";
import { ref } from "vue";

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const { createProgramWithOptionalAddress } = usePrograms();

const errorMessage = ref("");

const { handleSubmit, defineField, isSubmitting } = useForm({
    validationSchema: createProgramCreateFormSchema(t),
    initialValues: {
        name: "",
        description: "",
        themeColor: "#0F766E",
        address: {
            line_1: "",
            line_2: "",
            city: "",
            postal_code: "",
            country: "",
        },
        imagesModel: null,
    },
});

const quasarField = createQuasarFieldBinder(defineField);

const [name, nameProps] = quasarField("name");
const [description, descriptionProps] = quasarField("description");
const [themeColor, themeColorProps] = quasarField("themeColor");
const [line1, line1Props] = quasarField("address.line_1");
const [line2, line2Props] = quasarField("address.line_2");
const [city, cityProps] = quasarField("address.city");
const [postalCode, postalCodeProps] = quasarField("address.postal_code");
const [country, countryProps] = quasarField("address.country");
const [imagesModel, imagesModelProps] = quasarField("imagesModel");

function goToProgramsList() {
    void router.push({ name: "programs.list" });
}

/**
 * @returns {File[]}
 */
function normalizeFiles(value) {
    if (value == null) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.filter((f) => f instanceof File);
    }

    return value instanceof File ? [value] : [];
}

const onFormSubmit = handleSubmit(async (values) => {
    errorMessage.value = "";

    try {
        const programId = await createProgramWithOptionalAddress({
            name: values.name,
            description: values.description,
            themeColor: values.themeColor,
            address: { ...values.address },
        });

        const files = normalizeFiles(values.imagesModel);
        if (files.length > 0) {
            const formData = new FormData();
            for (const file of files) {
                formData.append("images[]", file);
            }

            await requestFormData(
                mediaRoutes.store.url({ type: "program", id: programId }),
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
