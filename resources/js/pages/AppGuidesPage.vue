<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader :title="t('guidesList.title')">
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('guidesList.addGuide')"
                        @click="guideModalRef?.openCreateModal()"
                    />
                </template>
            </AppPageHeader>
        </template>

        <AppEntityList>
            <AppEmptyListRow
                :show="guides.length === 0"
                :message="t('guidesList.empty')"
            />
            <q-item
                v-for="row in guides"
                :key="String(row.id)"
                class="p-4"
            >
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        guideDisplayName(row)
                    }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <div class="column gap-1 items-end">
                        <q-btn
                            color="primary"
                            outline
                            dense
                            :label="t('common.edit')"
                            @click="() => guideModalRef?.openEditModal(row)"
                        />
                        <q-btn
                            flat
                            dense
                            color="negative"
                            icon="delete"
                            :label="t('guidesList.delete')"
                            @click="() => confirmDelete(row)"
                        />
                    </div>
                </q-item-section>
            </q-item>
        </AppEntityList>

        <AppGuideUpsertModal ref="guideModalRef" />
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useLiveQuery } from "@tanstack/vue-db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import { liveQueryRows } from "../powersync/live-query-casts";
import type { GuideOutput } from "../powersync/guides.collection";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppGuideUpsertModal from "../components/organisms/AppGuideUpsertModal.vue";

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const $q = useQuasar();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();
const guidesCollection = powersync.collections.guides;

const { data: guidesRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = guidesCollection.value;
        if (!col) {
            return undefined;
        }
        return queryBuilder
            .from({ g: col })
            .orderBy(({ g }) => g.name, "asc");
    },
    [guidesCollection],
);

const guides = computed(() => liveQueryRows<GuideOutput>(guidesRaw.value));

const guideModalRef = ref<InstanceType<typeof AppGuideUpsertModal> | null>(
    null,
);

function guideDisplayName(row: GuideOutput): string {
    const n = row.name;
    if (n == null || String(n).trim().length === 0) {
        return "Untitled";
    }
    return String(n).trim();
}

function confirmDelete(row: GuideOutput): void {
    confirm({
        title: t("guidesList.deleteConfirmTitle"),
        message: t("guidesList.deleteConfirmMessage", {
            name: guideDisplayName(row),
        }),
        onOk: async () => {
            try {
                const col = guidesCollection.value;
                if (!col) {
                    return;
                }
                col.delete(String(row.id));
                void powersync.refreshOutboxSnapshot();
                $q.notify({
                    type: "positive",
                    message: t("guidesList.deleted"),
                });
            } catch (e) {
                notifyError(e, t("guidesList.errorGeneric"));
            }
        },
    });
}
</script>
