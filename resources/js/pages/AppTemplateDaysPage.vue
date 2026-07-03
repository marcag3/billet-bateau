<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader :title="t('templateDaysList.title')">
                <template #actions>
                    <q-btn color="primary" icon="add" :label="t('templateDaysList.addTemplateDay')" :to="{
                        name: 'template-days.create',
                        params: { programId },
                    }" />
                </template>
            </AppPageHeader>
        </template>

        <AppEntityList>
            <AppEmptyListRow :show="templateDayRows.length === 0" :message="t('templateDaysList.empty')" />
            <q-item
                v-for="td in templateDayRows"
                :key="String(td.id)"
                clickable
                class="p-4"
                @click="goEdit(td)"
            >
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        td.name ?? "Untitled"
                        }}</q-item-label>
                </q-item-section>
                <q-item-section side @click.stop>
                    <q-btn flat round dense icon="delete" color="negative"
                        :aria-label="t('templateDaysList.delete')" @click="confirmDeleteTemplateDay(td)" />
                </q-item-section>
            </q-item>
        </AppEntityList>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

const powersync = getAppPowerSyncContext();
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import { liveQueryRows } from "../powersync/live-query-casts";
import type { TemplateDayOutput } from "../powersync/template-days.collection";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();
const templateDaysCollection = powersync.collections.template_days;

const { data: templateDays } = useLiveQuery(
    (queryBuilder) => {
        const col = templateDaysCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ td: col })
            .where(({ td }) => eq(td.program_id, pid))
            .orderBy(({ td }) => td.id, "desc");
    },
    [templateDaysCollection, powersync.activeProgramIdRef],
);

const programId = computed(() => String(route.params.programId ?? "").trim());

const templateDayRows = computed(() =>
    liveQueryRows<TemplateDayOutput>(templateDays.value),
);

function goEdit(td: TemplateDayOutput): void {
    void router.push({
        name: "template-days.edit",
        params: {
            programId: programId.value,
            templateDayId: String(td.id),
        },
    });
}

function confirmDeleteTemplateDay(td: TemplateDayOutput) {
    const name = String(td.name ?? "Untitled");
    confirm({
        title: t("templateDaysList.deleteConfirmTitle"),
        message: t("templateDaysList.deleteConfirmMessage", { name }),
        onOk: async () => {
            const col = templateDaysCollection.value;
            if (!col) return;
            try {
                await col.delete(String(td.id)).isPersisted.promise;
                void powersync.refreshOutboxSnapshot();
            } catch (e) {
                notifyError(e, t("templateDaysList.errorGeneric"));
            }
        },
    });
}
</script>
