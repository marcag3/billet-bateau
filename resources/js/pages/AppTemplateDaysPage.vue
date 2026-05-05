<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader
                :title="t('templateDaysList.title')"
                :description="t('templateDaysList.description')"
            >
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('templateDaysList.addTemplateDay')"
                        :to="{
                            name: 'template-days.create',
                            params: { programId },
                        }"
                    />
                </template>
            </AppPageHeader>
        </template>

        <AppEntityList>
            <AppEmptyListRow
                :show="templateDays.length === 0"
                :message="t('templateDaysList.empty')"
            />
            <q-item
                v-for="td in templateDays"
                :key="String(td.id)"
                class="q-pa-md"
            >
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        td.name ?? "Untitled"
                    }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <div class="row q-gutter-xs">
                        <q-btn
                            flat
                            round
                            dense
                            icon="edit"
                            :aria-label="t('templateDaysList.edit')"
                            :to="{
                                name: 'template-days.edit',
                                params: {
                                    programId: programId,
                                    templateDayId: String(td.id),
                                },
                            }"
                        />
                        <q-btn
                            flat
                            round
                            dense
                            icon="delete"
                            color="negative"
                            :aria-label="t('templateDaysList.delete')"
                            @click="confirmDeleteTemplateDay(td)"
                        />
                    </div>
                </q-item-section>
            </q-item>
        </AppEntityList>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import {
    getActiveProgramIdRef,
    getTemplateDaysCollection,
    refreshOutboxSnapshot,
} from "../powersync/app-powersync.runtime";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import type { TemplateDayOutput } from "../powersync/template-days.collection";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";

const { t } = useI18n();
const route = useRoute();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();
const templateDaysCollection = getTemplateDaysCollection();

const { data: templateDays } = useLiveQuery(
    (queryBuilder) => {
        const col = templateDaysCollection.value;
        const pid = getActiveProgramIdRef().value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ td: col })
            .where(({ td }) => eq(td.program_id, pid))
            .orderBy(({ td }) => td.updated_at, "desc")
            .orderBy(({ td }) => td.id, "desc");
    },
    [templateDaysCollection, getActiveProgramIdRef()],
);

const programId = computed(() => String(route.params.programId ?? "").trim());

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
                void refreshOutboxSnapshot();
            } catch (e) {
                notifyError(e, t("templateDaysList.errorGeneric"));
            }
        },
    });
}
</script>
