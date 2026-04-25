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

            <AppCardSection
                v-else
                :label="t('programsCreate.formSection')"
            >
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
import {
    createProgramEditFormSchema,
    type ProgramEditFormValues,
} from "../models/programs/programs.validation";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import { usePrograms } from "../models/programs/programs.model";
import { useEntityList } from "../models/entity.queries";
import {
    getAppPowerSyncBootstrappedRef,
    getAddressesCollectionRef,
} from "../powersync/app-powersync.runtime";
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
const { programs, ensureProgramsReady, updateProgramWithOptionalAddress } =
    usePrograms();

const errorMessage = ref("");
const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const lastHydratedSignature = ref("");

const programId = computed(() => String(route.params.programId ?? "").trim());

const { data: addressRows } = useEntityList({
    enabledRef: hasBootstrapped,
    alias: "addresses",
    collection: getAddressesCollectionRef(),
    orderBy: [],
});

const showNotFound = computed(() => {
    if (!hasBootstrapped.value) {
        return false;
    }
    const id = programId.value;
    if (id.length === 0) {
        return true;
    }
    const list = programs.value ?? [];
    return !list.some((p) => p != null && String(p.id) === id);
});

/**
 * @param {Record<string, unknown>} p
 * @returns {boolean}
 */
function programRowIsActive(p: Record<string, unknown>) {
    const v = p.is_active;
    if (v === true || v === 1) {
        return true;
    }
    if (v === false || v === 0) {
        return false;
    }
    if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (s === "1" || s === "true" || s === "t") {
            return true;
        }
        if (s === "0" || s === "false" || s === "f" || s.length === 0) {
            return false;
        }
    }
    const n = Number(v);
    if (Number.isFinite(n)) {
        return n === 1;
    }
    return false;
}

/**
 * @param {Record<string, unknown>} p
 * @returns {boolean}
 */
function programRowIsArchived(p: Record<string, unknown>) {
    const v = p.is_archived;
    if (v === true || v === 1) {
        return true;
    }
    if (v === false || v === 0) {
        return false;
    }
    if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (s === "1" || s === "true" || s === "t") {
            return true;
        }
        if (s === "0" || s === "false" || s === "f" || s.length === 0) {
            return false;
        }
    }
    const n = Number(v);
    if (Number.isFinite(n)) {
        return n === 1;
    }
    return false;
}

/**
 * @param {Record<string, unknown>} p
 * @returns {Record<string, unknown> | null}
 */
function findAddressForProgram(p: Record<string, unknown>) {
    const id = p.address_id;
    if (id == null || String(id).length === 0) {
        return null;
    }
    const rows = addressRows.value ?? [];
    return (
        (rows.find(
            (a) =>
                a != null &&
                String((a as Record<string, unknown>).id) === String(id),
        ) as Record<string, unknown> | undefined) ?? null
    );
}

const programEditSchema = createProgramEditFormSchema(t);
const { handleSubmit, defineField, isSubmitting, resetForm } =
    useForm<ProgramEditFormValues>({
        validationSchema: programEditSchema,
        initialValues: {
            name: "",
            description: "",
            themeColor: "#0F766E",
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
    [programId, programs, addressRows],
    () => {
        const id = programId.value;
        if (id.length === 0) {
            return;
        }
        const p = (programs.value ?? []).find(
            (row) => row != null && String(row.id) === id,
        ) as Record<string, unknown> | undefined;
        if (!p) {
            return;
        }
        const addrId =
            p.address_id != null && String(p.address_id).length > 0
                ? String(p.address_id)
                : "";
        const a = findAddressForProgram(p);
        if (addrId.length > 0 && !a) {
            return;
        }
        const signature = `${id}:${String(p.updated_at ?? "")}:${String((a as Record<string, unknown> | null)?.updated_at ?? "")}`;
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
                    typeof p.theme_color === "string" && p.theme_color.length > 0
                        ? String(p.theme_color).trim()
                        : "#0F766E",
                slug: String(p.slug ?? "")
                    .trim()
                    .toLowerCase(),
                isActive: programRowIsActive(p),
                isArchived: programRowIsArchived(p),
                address: {
                    line_1:
                        a && typeof a.line_1 === "string"
                            ? String(a.line_1)
                            : "",
                    line_2:
                        a && typeof a.line_2 === "string"
                            ? String(a.line_2)
                            : "",
                    city:
                        a && typeof a.city === "string" ? String(a.city) : "",
                    postal_code:
                        a && typeof a.postal_code === "string"
                            ? String(a.postal_code)
                            : "",
                    country:
                        a && typeof a.country === "string"
                            ? String(a.country)
                            : "",
                },
                imagesModel: null,
            } satisfies ProgramEditFormValues,
        });
    },
    { immediate: true },
);

void ensureProgramsReady();

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
        await updateProgramWithOptionalAddress(id, {
            name: values.name,
            description: values.description,
            themeColor: values.themeColor,
            slug: values.slug,
            isActive: values.isActive,
            isArchived: values.isArchived,
            address: { ...values.address },
        });

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
