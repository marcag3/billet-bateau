<template>
    <AppEntityCreatePageLayout
        :ready="hasBootstrapped"
        :title="t('templateDaysList.createPageTitle')"
        :description="t('templateDaysList.createPageDescription')"
        :back-to="backTo"
        :back-label="t('templateDaysList.backToList')"
    >
        <template #alerts>
            <AppAlertBanner
                v-if="hasOutboxCommitError"
                variant="warning"
                dismissible
                :dismiss-label="t('common.dismiss')"
                @dismiss="dismissOutboxCommitError"
            >
                {{ outboxCommitError }}
            </AppAlertBanner>
        </template>

        <AppCardSection :label="t('templateDaysList.addNew')">
            <q-form @submit.prevent="onCreateSubmit">
                <AppFormStack>
                    <q-input
                        v-model="createName"
                        outlined
                        :label="t('templateDaysList.name')"
                        :disable="isSubmitting"
                    />
                    <q-btn
                        color="primary"
                        type="submit"
                        :label="t('templateDaysList.create')"
                        :loading="isSubmitting"
                        :disable="isSubmitting || programId.length === 0"
                        class="self-start"
                    />
                </AppFormStack>
            </q-form>
        </AppCardSection>
    </AppEntityCreatePageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
    getAppPowerSyncBootstrappedRef,
    useAppPowerSyncOutbox,
} from "../powersync/app-powersync.runtime";
import { createTemplateDayRow } from "../models/template-days/template-days.model";
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import AppEntityCreatePageLayout from "../layouts/AppEntityCreatePageLayout.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { runWithNotify } = useNotifyAsyncAction();

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const programId = computed(() => String(route.params.programId ?? "").trim());

const backTo = computed(() => ({
    name: "template-days.list" as const,
    params: { programId: programId.value },
}));

const createName = ref("");
const isSubmitting = ref(false);

async function onCreateSubmit() {
    isSubmitting.value = true;
    await runWithNotify(
        async () => {
            const id = await createTemplateDayRow({ name: createName.value });
            await router.push({
                name: "template-days.edit",
                params: { programId: programId.value, templateDayId: id },
            });
        },
        {
            successMessage: t("templateDaysList.created"),
            errorGeneric: t("templateDaysList.errorGeneric"),
        },
    );
    isSubmitting.value = false;
}
</script>
