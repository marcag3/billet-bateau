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

        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
            <q-input
                v-model="name"
                outlined
                :label="t('programsCreate.name')"
                :rules="[requiredRule]"
            />

            <q-input
                v-model="description"
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
                        outlined
                        dense
                        :rules="[hexColorRule]"
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
                        v-model="address.line_1"
                        outlined
                        dense
                        :label="t('programsCreate.line1')"
                    />
                    <q-input
                        v-model="address.line_2"
                        outlined
                        dense
                        :label="t('programsCreate.line2')"
                    />
                    <div class="row q-col-gutter-sm">
                        <div class="col-12 col-sm-6">
                            <q-input
                                v-model="address.city"
                                outlined
                                dense
                                :label="t('programsCreate.city')"
                            />
                        </div>
                        <div class="col-12 col-sm-6">
                            <q-input
                                v-model="address.postal_code"
                                outlined
                                dense
                                :label="t('programsCreate.postalCode')"
                            />
                        </div>
                    </div>
                    <q-input
                        v-model="address.country"
                        outlined
                        dense
                        :label="t('programsCreate.country')"
                    />
                </div>
            </q-expansion-item>

            <q-file
                v-model="imagesModel"
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
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { usePrograms } from "../models/programs/programs.model";
import mediaRoutes from "../routes/api/media";
import { requestFormData } from "../services/http.client";

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const { createProgramWithOptionalAddress } = usePrograms();

const name = ref("");
const description = ref("");
const themeColor = ref("#0F766E");
const address = reactive({
    line_1: "",
    line_2: "",
    city: "",
    postal_code: "",
    country: "",
});
/** @type {import('vue').Ref<File | File[] | null>} */
const imagesModel = ref(null);

const errorMessage = ref("");
const isSubmitting = ref(false);

function requiredRule(val) {
    return (
        (typeof val === "string" && val.trim().length > 0) ||
        t("programsCreate.validationRequired")
    );
}

function hexColorRule(val) {
    return (
        /^#[0-9A-Fa-f]{6}$/.test(String(val ?? "")) ||
        t("programsCreate.validationHex")
    );
}

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

async function onSubmit() {
    errorMessage.value = "";
    isSubmitting.value = true;

    try {
        const programId = await createProgramWithOptionalAddress({
            name: name.value,
            description: description.value,
            themeColor: themeColor.value,
            address: { ...address },
        });

        const files = normalizeFiles(imagesModel.value);
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
    } finally {
        isSubmitting.value = false;
    }
}
</script>
