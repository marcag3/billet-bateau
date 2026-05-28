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

            <q-form @submit.prevent="onFormSubmit">
                <AppFormStack>
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

                <AppFormRow>
                    <div class="col-12 col-sm-6">
                        <q-input
                            v-model="startDate"
                            v-bind="startDateProps"
                            type="date"
                            outlined
                            label-slot
                            :disable="isSubmitting"
                        >
                            <template #label>
                                {{ t("programsEdit.startDate") }}
                                <span class="text-negative" aria-hidden="true">*</span>
                            </template>
                        </q-input>
                    </div>
                    <div class="col-12 col-sm-6">
                        <q-input
                            v-model="endDate"
                            v-bind="endDateProps"
                            type="date"
                            outlined
                            label-slot
                            :disable="isSubmitting"
                        >
                            <template #label>
                                {{ t("programsEdit.endDate") }}
                                <span class="text-negative" aria-hidden="true">*</span>
                            </template>
                        </q-input>
                    </div>
                </AppFormRow>

                <AppTextRepeaterField
                    v-model="bookingQuestionRows"
                    :label="t('programsEdit.bookingQuestions')"
                    :hint="t('programsEdit.bookingQuestionsHint')"
                    :item-label-template="t('programsEdit.bookingQuestionLabel')"
                    :add-label="t('programsEdit.addBookingQuestion')"
                    :remove-label="t('programsEdit.removeBookingQuestion')"
                    :disabled="isSubmitting"
                >
                    <template #fields="{ value, setValue, label, disabled }">
                        <q-input
                            :model-value="value"
                            outlined
                            :disable="disabled"
                            :label="label"
                            @update:model-value="setValue"
                        />
                    </template>
                </AppTextRepeaterField>

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
                        <AppFormRow gutter="sm">
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
                        </AppFormRow>
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
                </AppFormStack>
            </q-form>
        </AppCardSection>

        <AppCardSection
            v-if="eligibilityLoaded && canInviteAdmins && !showNotFound"
            :label="t('programsInvite.editSectionTitle')"
            class="q-mt-lg"
        >
            <p class="text-body2 text-grey-8">
                {{ t("programsInvite.editSectionSubtitle") }}
            </p>
            <q-form class="q-gutter-md" @submit.prevent="onInviteSubmit">
                <AppAlertBanner v-if="inviteError.length > 0" variant="error">
                    {{ inviteError }}
                </AppAlertBanner>
                <AppAlertBanner v-if="inviteSuccess" variant="info">
                    {{ t("programsInvite.inviteSent") }}
                </AppAlertBanner>
                <q-input
                    v-model="inviteEmail"
                    type="email"
                    outlined
                    :label="t('programsInvite.emailLabel')"
                    :disable="inviteSubmitting"
                    autocomplete="off"
                />
                <q-btn
                    color="primary"
                    type="submit"
                    :loading="inviteSubmitting"
                    :disable="inviteSubmitting"
                    :label="t('programsInvite.sendInvite')"
                />
            </q-form>
        </AppCardSection>

        <AppAlertBanner
            v-else-if="eligibilityLoaded && !canInviteAdmins && !showNotFound"
            variant="info"
            class="q-mt-lg"
        >
            {{ t("programsInvite.notOwner") }}
        </AppAlertBanner>
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
import AppFormRow from "../components/ui/AppFormRow.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";
import AppTextRepeaterField from "../components/ui/AppTextRepeaterField.vue";
import AppImageUploadField from "../components/molecules/AppImageUploadField.vue";
import {
    fetchInvitationEligibility,
    sendProgramAdminInvitation,
} from "../models/programs/program-invitations.api";
import { useAuthStore } from "../store/auth.store";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
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

const eligibilityLoaded = ref(false);
const canInviteAdmins = ref(false);
const inviteEmail = ref("");
const inviteSubmitting = ref(false);
const inviteError = ref("");
const inviteSuccess = ref(false);

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
            startDate: "",
            endDate: "",
            bookingQuestionsText: "",
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
const [startDate, startDateProps] = quasarField("startDate");
const [endDate, endDateProps] = quasarField("endDate");
const [isActive, isActiveProps] = quasarField("isActive");
const [line1, line1Props] = quasarField("address.line_1");
const [line2, line2Props] = quasarField("address.line_2");
const [city, cityProps] = quasarField("address.city");
const [postalCode, postalCodeProps] = quasarField("address.postal_code");
const [country, countryProps] = quasarField("address.country");
const bookingQuestionRows = ref<string[]>([""]);

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
        startDate:
            typeof p.start_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.start_date)
                ? p.start_date
                : "",
        endDate:
            typeof p.end_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.end_date)
                ? p.end_date
                : "",
        bookingQuestionsText: parseProgramBookingQuestions(p.booking_questions).join("\n"),
        isActive: p.is_active ?? true,
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
    start_date: string;
    end_date: string;
    booking_questions: string;
    line_1: string | null;
    line_2: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
};

function parseProgramBookingQuestions(raw: unknown): string[] {
    if (typeof raw !== "string" || raw.trim().length === 0) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .map((question) => (typeof question === "string" ? question.trim() : ""))
            .filter((question) => question.length > 0);
    } catch {
        return [];
    }
}

function parseBookingQuestionsInput(raw: string[]): string[] {
    return Array.from(
        new Set(
            raw
                .map((line) => line.trim())
                .filter((line) => line.length > 0),
        ),
    );
}

function toProgramDraftPatch(values: ProgramEditFormValues, bookingQuestions: string[]): ProgramDraftPatch {
    const addressFields = normalizeAddressRowFields({ ...values.address });
    return {
        name: values.name,
        description: values.description.length > 0 ? values.description : null,
        theme_color: values.themeColor,
        slug: values.slug,
        is_active: values.isActive ? 1 : 0,
        start_date: values.startDate,
        end_date: values.endDate,
        booking_questions: JSON.stringify(bookingQuestions),
        line_1: addressFields.line_1,
        line_2: addressFields.line_2,
        city: addressFields.city,
        postal_code: addressFields.postal_code,
        country: addressFields.country,
    };
}

watch(
    [
        programId,
        currentProgram,
        hasBootstrapped,
        () => authStore.isAuthenticated,
    ],
    async () => {
        eligibilityLoaded.value = false;
        canInviteAdmins.value = false;
        inviteSuccess.value = false;
        inviteError.value = "";

        const id = programId.value;
        if (
            !authStore.isAuthenticated ||
            id.length === 0 ||
            !hasBootstrapped.value ||
            currentProgram.value === null
        ) {
            eligibilityLoaded.value = true;
            return;
        }

        try {
            const eligibility = await fetchInvitationEligibility(id);
            canInviteAdmins.value = eligibility.can_invite_admins;
        } catch {
            canInviteAdmins.value = false;
        } finally {
            eligibilityLoaded.value = true;
        }
    },
    { immediate: true },
);

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
        const parsedBookingQuestions = parseProgramBookingQuestions(p.booking_questions);
        bookingQuestionRows.value = parsedBookingQuestions.length > 0 ? parsedBookingQuestions : [""];
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

async function onInviteSubmit() {
    inviteError.value = "";
    inviteSuccess.value = false;

    const id = programId.value;
    const email = inviteEmail.value.trim();
    if (id.length === 0) {
        return;
    }
    if (email.length === 0) {
        inviteError.value = t("programsInvite.invalidEmail");
        return;
    }

    inviteSubmitting.value = true;
    try {
        await sendProgramAdminInvitation(id, email);
        inviteSuccess.value = true;
        inviteEmail.value = "";
    } catch (error) {
        inviteError.value =
            error instanceof Error
                ? error.message
                : t("programsInvite.sendFailed");
    } finally {
        inviteSubmitting.value = false;
    }
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
        const bookingQuestions = parseBookingQuestionsInput(bookingQuestionRows.value);
        const patch = toProgramDraftPatch(values, bookingQuestions);

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
