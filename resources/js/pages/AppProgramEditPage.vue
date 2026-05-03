<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('programsEdit.title')"
            :description="t('programsEdit.subtitle')"
            description-size="body2"
        />

        <AppBootstrapGate :ready="hasBootstrapped">
            <AppAlertBanner v-if="showNotFound" variant="error">
                {{ t("programsEdit.notFound") }}
                <div class="q-mt-sm">
                    <q-btn
                        color="primary"
                        outline
                        :label="t('programsEdit.backToList')"
                        :to="{ name: 'programs.list' }"
                    />
                </div>
            </AppAlertBanner>

            <AppCardSection v-else :label="t('programsCreate.formSection')">
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
                            <span class="text-negative" aria-hidden="true"
                                >*</span
                            >
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
                            <span class="text-negative" aria-hidden="true"
                                >*</span
                            >
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

                    <q-input
                        v-model="slug"
                        v-bind="slugProps"
                        outlined
                        :label="t('programsList.slug')"
                        :hint="t('programsList.slugHint')"
                        :disable="isSubmitting"
                    />

                    <q-toggle
                        v-model="isActive"
                        v-bind="isActiveProps"
                        :label="t('programsList.isActive')"
                        :disable="isSubmitting"
                    />

                    <q-toggle
                        v-model="isArchived"
                        v-bind="isArchivedProps"
                        :label="t('programsEdit.isArchived')"
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
                            :disable="isSubmitting || showNotFound"
                            :label="t('programsEdit.submit')"
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
        </AppBootstrapGate>
    </q-page>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { computed, ref, watch } from "vue";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import {
    createProgramEditFormSchema,
    type ProgramEditFormValues,
} from "../models/programs/programs.validation";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import {
    getAppPowerSyncBootstrappedRef,
    getProgramsCollection,
    refreshOutboxSnapshot,
} from "../powersync/app-powersync.runtime";
import type { ProgramOutput } from "../powersync/programs.collection";
import {
    normalizeThemeColor,
    normalizeAddressRowFields,
} from "../utilities/program-helpers";
import mediaRoutes from "../routes/api/media";
import { requestFormData } from "../services/http.client";
import { normalizeImageFiles } from "../utilities/image-files";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const programsCollection = getProgramsCollection();

const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        const pid = programId.value;
        if (!col || pid.length === 0) return undefined;
        return queryBuilder.from({ p: col }).where(({ p }) => eq(p.id, pid));
    },
    [programsCollection, programId],
);

const errorMessage = ref("");
const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const lastHydratedSignature = ref("");

const programId = computed(() => String(route.params.programId ?? "").trim());

const showNotFound = computed(() => {
    if (!hasBootstrapped.value) {
        return false;
    }
    const id = programId.value;
    if (id.length === 0) {
        return true;
    }
    const list = programs.value ?? [];
    return !list.some((row) => {
        if (row == null) {
            return false;
        }
        const p = row as unknown as ProgramOutput;
        return String(p.id) === id;
    });
});

const programEditSchema = createProgramEditFormSchema(t);
const { handleSubmit, defineField, isSubmitting, resetForm } =
    useForm<ProgramEditFormValues>({
        validationSchema: programEditSchema,
        initialValues: {
            name: "",
            description: "",
            themeColor: "#08758A",
            slug: "",
            isActive: true,
            isArchived: false,
            address: {
                line_1: "",
                line_2: "",
                city: "",
                postal_code: "",
                country: "",
            },
            imagesModel: null,
        } satisfies ProgramEditFormValues,
    });

const quasarField = createQuasarFieldBinder(defineField);

const [name, nameProps] = quasarField("name");
const [description, descriptionProps] = quasarField("description");
const [themeColor, themeColorProps] = quasarField("themeColor");
const [slug, slugProps] = quasarField("slug");
const [isActive, isActiveProps] = quasarField("isActive");
const [isArchived, isArchivedProps] = quasarField("isArchived");
const [line1, line1Props] = quasarField("address.line_1");
const [line2, line2Props] = quasarField("address.line_2");
const [city, cityProps] = quasarField("address.city");
const [postalCode, postalCodeProps] = quasarField("address.postal_code");
const [country, countryProps] = quasarField("address.country");
const [imagesModel, imagesModelProps] = quasarField("imagesModel");

watch(
    () => route.params.programId,
    (next, prev) => {
        if (String(next ?? "") !== String(prev ?? "")) {
            lastHydratedSignature.value = "";
        }
    },
);

watch(
    [programId, programs],
    () => {
        const id = programId.value;
        if (id.length === 0) {
            return;
        }
        const row = (programs.value ?? []).find((r) => {
            if (r == null) {
                return false;
            }
            const candidate = r as unknown as ProgramOutput;
            return String(candidate.id) === id;
        });
        if (!row) {
            return;
        }
        const p = row as unknown as ProgramOutput;
        const signature = `${id}:${String(p.updated_at ?? "")}`;
        if (lastHydratedSignature.value === signature) {
            return;
        }
        lastHydratedSignature.value = signature;
        resetForm({
            values: {
                name: String(p.name ?? "").trim(),
                description:
                    typeof p.description === "string" ? p.description : "",
                themeColor:
                    typeof p.theme_color === "string" &&
                    p.theme_color.length > 0
                        ? String(p.theme_color).trim()
                        : "#08758A",
                slug: String(p.slug ?? "")
                    .trim()
                    .toLowerCase(),
                isActive: p.is_active ?? true,
                isArchived: p.is_archived ?? false,
                address: {
                    line_1:
                        typeof p.line_1 === "string" ? String(p.line_1) : "",
                    line_2:
                        typeof p.line_2 === "string" ? String(p.line_2) : "",
                    city: typeof p.city === "string" ? String(p.city) : "",
                    postal_code:
                        typeof p.postal_code === "string"
                            ? String(p.postal_code)
                            : "",
                    country:
                        typeof p.country === "string" ? String(p.country) : "",
                },
                imagesModel: null,
            } satisfies ProgramEditFormValues,
        });
    },
    { immediate: true },
);

function goToProgramsList() {
    void router.push({ name: "programs.list" });
}

const onFormSubmit = handleSubmit(async (values: ProgramEditFormValues) => {
    errorMessage.value = "";
    const id = programId.value;
    if (id.length === 0 || showNotFound.value) {
        return;
    }

    try {
        const col = programsCollection.value;
        if (!col) {
            throw new Error("Programs collection is not ready.");
        }

        const themeColor = normalizeThemeColor(values.themeColor);
        const now = new Date().toISOString();
        const addressFields = normalizeAddressRowFields({ ...values.address });

        col.update(id, (draft) => {
            draft.name = values.name.trim();
            draft.description =
                values.description.trim().length > 0
                    ? values.description.trim()
                    : null;
            draft.theme_color = themeColor;
            draft.slug = values.slug;
            draft.is_active = values.isActive ? 1 : 0;
            draft.is_archived = values.isArchived ? 1 : 0;
            draft.line_1 = addressFields.line_1;
            draft.line_2 = addressFields.line_2;
            draft.city = addressFields.city;
            draft.postal_code = addressFields.postal_code;
            draft.country = addressFields.country;
            draft.updated_at = now;
        });

        void refreshOutboxSnapshot();

        const files = normalizeImageFiles(values.imagesModel);
        if (files.length > 0) {
            const formData = new FormData();
            for (const file of files) {
                formData.append("images[]", file);
            }

            await requestFormData(
                mediaRoutes.store.url({ type: "program", id }),
                formData,
                {
                    withCsrf: true,
                },
            );
        }

        $q.notify({ type: "positive", message: t("programsEdit.success") });
        await router.push({ name: "programs.list" });
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : String(error);
    }
});
</script>
