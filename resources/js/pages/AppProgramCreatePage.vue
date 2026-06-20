<template>
    <q-page class="p-4">
        <AppPageHeader :title="t('programsCreate.title')" />

        <AppCardSection :label="t('programsCreate.formSection')">
            <AppAlertBanner v-if="errorMessage.length > 0" variant="error">
                {{ errorMessage }}
            </AppAlertBanner>

            <AppProgramForm
                mode="create"
                :disabled="isBootstrapping"
                :submit-fn="onCreateProgram"
                @submitted="onProgramCreated"
            >
                <template #actions="{ isSubmitting: formSubmitting, fieldsDisabled }">
                    <div class="row gap-2">
                        <q-btn
                            color="primary"
                            type="submit"
                            :loading="formSubmitting"
                            :disable="fieldsDisabled"
                            :label="t('programsCreate.submit')"
                        />
                        <q-btn
                            flat
                            color="primary"
                            :disable="fieldsDisabled"
                            :label="t('common.programs')"
                            @click="goToProgramsList"
                        />
                    </div>
                </template>
            </AppProgramForm>
        </AppCardSection>
    </q-page>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { ulid } from "ulid";
import { ref } from "vue";
import type { ProgramCreateFormValues } from "../models/programs/programs.validation";
import type { ProgramFormSubmitPayload } from "../models/programs/program-form";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import {
    normalizeThemeColor,
    buildInitialProgramSlug,
    normalizeAddressRowFields,
} from "../utilities/program-helpers";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppProgramForm from "../components/molecules/AppProgramForm.vue";

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const powersync = getAppPowerSyncContext();

const errorMessage = ref("");
const isBootstrapping = ref(false);

async function ensureBootstrapped(): Promise<void> {
    if (!powersync.hasBootstrappedCollection.value) {
        isBootstrapping.value = true;
        try {
            await powersync.bootstrapAppPowerSync();
        } finally {
            isBootstrapping.value = false;
        }
    }
}

function goToProgramsList() {
    void router.push({ name: "programs.list" });
}

async function onCreateProgram({
    values,
    bookingQuestions,
}: ProgramFormSubmitPayload): Promise<string> {
    errorMessage.value = "";

    try {
        await ensureBootstrapped();

        const col = powersync.collections.programs.value;
        if (!col) {
            throw new Error("Programs collection is not ready.");
        }

        const formValues = values as ProgramCreateFormValues;
        const id = ulid();
        const themeColor = normalizeThemeColor(formValues.themeColor);
        const addressFields = normalizeAddressRowFields({ ...formValues.address });

        await col.insert({
            id,
            name: formValues.name.trim(),
            description:
                formValues.description.trim().length > 0
                    ? formValues.description.trim()
                    : null,
            theme_color: themeColor,
            is_active: formValues.isActive ? 1 : 0,
            slug: buildInitialProgramSlug(formValues.name, id),
            start_date: formValues.startDate,
            end_date: formValues.endDate,
            booking_questions: JSON.stringify(bookingQuestions),
            email_signature: formValues.emailSignature.trim().length > 0
                ? formValues.emailSignature.trim()
                : null,
            line_1: addressFields.line_1,
            line_2: addressFields.line_2,
            city: addressFields.city,
            postal_code: addressFields.postal_code,
            country: addressFields.country,
            banner_object_key: null,
            banner_mime_type: null,
            banner_size_bytes: null,
            banner_etag: null,
            banner_uploaded_at: null,
        }).isPersisted.promise;

        void powersync.refreshOutboxSnapshot();

        return id;
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : String(error);
        throw error;
    }
}

function onProgramCreated(): void {
    $q.notify({ type: "positive", message: t("programsCreate.success") });
    void router.push({ name: "programs.list" });
}
</script>
