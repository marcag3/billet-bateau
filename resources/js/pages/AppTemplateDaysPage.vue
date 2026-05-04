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

        <AppBootstrapGate
            :ready="hasBootstrapped"
            content-class="q-gutter-y-md"
        >
            <AppCardSection :label="t('templateDaysList.listForProgram')">
                <p class="text-body2 text-grey-8 q-mb-none">
                    {{
                        t("templateDaysList.rosterForProgram", {
                            name: selectedProgramName,
                        })
                    }}
                </p>
            </AppCardSection>

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
        </AppBootstrapGate>
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
    getAppPowerSyncBootstrappedRef,
    getProgramsCollection,
    getTemplateDaysCollection,
    refreshOutboxSnapshot,
} from "../powersync/app-powersync.runtime";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import type { TemplateDayOutput } from "../powersync/template-days.collection";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
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

const programsCollection = getProgramsCollection();
const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        if (!col) return undefined;
        return queryBuilder.from({ p: col });
    },
    [programsCollection],
);

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const programId = computed(() => String(route.params.programId ?? "").trim());

const programNameById = computed(() => {
    const map = new Map<string, string>();
    for (const p of programs.value) {
        if (p != null && p.id) {
            map.set(String(p.id), String(p.name ?? p.id));
        }
    }
    return map;
});

const selectedProgramName = computed(() => {
    const id = programId.value;
    if (id.length === 0) return "";
    return programNameById.value.get(id) ?? id;
});

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
