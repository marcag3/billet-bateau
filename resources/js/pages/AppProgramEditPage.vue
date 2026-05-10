<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('programsEdit.title')"
            :description="t('programsEdit.subtitle')"
            description-size="body2"
        />

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

                <AppImageUploadField
                    ref="imageUploadField"
                    :label="t('programsCreate.images')"
                    :disabled="isSubmitting"
                    accept="image/jpeg,image/png,image/webp"
                    :existing-image-url="currentProgramBannerUrl"
                    :existing-image-caption="t('programsEdit.currentBannerCaption')"
                    :presign-url="presignUpload.url()"
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
    </q-page>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { computed, ref, watch, nextTick } from "vue";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import {
    createProgramEditFormSchema,
    type ProgramEditFormValues,
} from "../models/programs/programs.validation";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import type { ProgramOutput } from "../powersync/programs.collection";
import {
    normalizeAddressRowFields,
} from "../utilities/program-helpers";
import { mediaObjectPublicUrl } from "../utilities/media-url";
import { presignUpload } from "../actions/App/Http/Controllers/Api/PresignUploadController";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppImageUploadField from "../components/molecules/AppImageUploadField.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const programsCollection = powersync.collections.programs;
const programId = computed(() => String(route.params.programId ?? "").trim());

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

const imageUploadField = ref<InstanceType<typeof AppImageUploadField> | null>(
    null,
);
const hasBootstrapped = powersync.hasBootstrappedCollection;
const currentProgram = computed<ProgramOutput | null>(() => {
    const id = programId.value;
    if (id.length === 0) {
        return null;
    }
    const row = (programs.value ?? []).find((candidateRow) => {
        if (candidateRow == null) {
            return false;
        }
        const candidate = candidateRow as unknown as ProgramOutput;
        return String(candidate.id) === id;
    });
    return row ? (row as unknown as ProgramOutput) : null;
});

const showNotFound = computed(() => {
    if (!hasBootstrapped.value) {
        return false;
    }
    const id = programId.value;
    if (id.length === 0) {
        return true;
    }
    return currentProgram.value == null;
});
const currentProgramBannerUrlRemote = ref("");
const currentProgramBannerUrlFromReplica = computed(() => {
    const p = currentProgram.value;
    if (p == null) {
        return "";
    }
    return mediaObjectPublicUrl(p.banner_object_key);
});
const currentProgramBannerUrl = computed(() => {
    const remoteUrl = currentProgramBannerUrlRemote.value;
    if (remoteUrl.length > 0) {
        return remoteUrl;
    }
    return currentProgramBannerUrlFromReplica.value;
});

const programEditSchema = createProgramEditFormSchema(t);
const { handleSubmit, defineField, isSubmitting, meta, resetForm } =
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

function programToFormValues(p: ProgramOutput): ProgramEditFormValues {
    return {
        name: String(p.name ?? "").trim(),
        description: typeof p.description === "string" ? p.description : "",
        themeColor:
            typeof p.theme_color === "string" && p.theme_color.length > 0
                ? String(p.theme_color).trim()
                : "#08758A",
        slug: String(p.slug ?? "")
            .trim()
            .toLowerCase(),
        isActive: p.is_active ?? true,
        isArchived: p.is_archived ?? false,
        address: {
            line_1: typeof p.line_1 === "string" ? String(p.line_1) : "",
            line_2: typeof p.line_2 === "string" ? String(p.line_2) : "",
            city: typeof p.city === "string" ? String(p.city) : "",
            postal_code:
                typeof p.postal_code === "string" ? String(p.postal_code) : "",
            country: typeof p.country === "string" ? String(p.country) : "",
        },
    } satisfies ProgramEditFormValues;
}

type ProgramDraftPatch = {
    name: string;
    description: string | null;
    theme_color: string;
    slug: string;
    is_active: number;
    is_archived: number;
    line_1: string | null;
    line_2: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
};

function toProgramDraftPatch(values: ProgramEditFormValues): ProgramDraftPatch {
    const addressFields = normalizeAddressRowFields({ ...values.address });
    return {
        name: values.name,
        description: values.description.length > 0 ? values.description : null,
        theme_color: values.themeColor,
        slug: values.slug,
        is_active: values.isActive ? 1 : 0,
        is_archived: values.isArchived ? 1 : 0,
        line_1: addressFields.line_1,
        line_2: addressFields.line_2,
        city: addressFields.city,
        postal_code: addressFields.postal_code,
        country: addressFields.country,
    };
}

watch(
    [programId, currentProgram],
    async ([id, p], previousTuple) => {
        if (id.length === 0) {
            return;
        }
        if (!p) {
            return;
        }
        const previousId = Array.isArray(previousTuple)
            ? String(previousTuple[0] ?? "")
            : "";
        const routeChanged = id !== previousId;
        if (meta.value.dirty && !routeChanged) {
            return;
        }
        resetForm({
            values: programToFormValues(p),
        });
        currentProgramBannerUrlRemote.value = "";
        await nextTick();
        imageUploadField.value?.clearSelection();
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
        const patch = toProgramDraftPatch(values);

        const uploadResult = await imageUploadField.value?.uploadIfNeeded();

        const bannerPatch =
            uploadResult != null
                ? {
                      banner_object_key: uploadResult.objectKey,
                      banner_mime_type: uploadResult.mimeType,
                      banner_size_bytes: uploadResult.sizeBytes,
                      banner_etag: uploadResult.etag,
                      banner_uploaded_at: new Date().toISOString(),
                  }
                : {};

        col.update(id, (draft) => {
            Object.assign(draft, patch, bannerPatch);
        });

        void powersync.refreshOutboxSnapshot();

        if (uploadResult != null && uploadResult.publicUrl.length > 0) {
            currentProgramBannerUrlRemote.value = uploadResult.publicUrl;
        }
        void powersync.refreshOutboxSnapshot();

        $q.notify({ type: "positive", message: t("programsEdit.success") });
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : String(error);
    }
});
</script>
