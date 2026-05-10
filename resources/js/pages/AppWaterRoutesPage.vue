<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('waterRoutesList.title')"
            :description="t('waterRoutesList.description')"
        />

        <AppCardSection v-if="programId.length > 0" :label="waterRouteCardLabel">
            <AppWaterRouteForm
                :program-id="programId"
                :water-route-id="editingWaterRouteId"
                @cancel="onWaterRouteFormCancel"
                @success="onWaterRouteFormSuccess"
            />
        </AppCardSection>

        <AppEntityList>
            <AppEmptyListRow
                :show="waterRoutes.length === 0"
                :message="t('waterRoutesList.empty')"
            />
            <q-item
                v-for="wr in waterRoutes"
                :key="String(wr.id)"
                class="q-pa-md"
                style="align-items: flex-start"
            >
                <q-item-section>
                    <q-item-label class="text-h6 q-mb-sm">{{
                        wr.name
                    }}</q-item-label>
                    <div class="row q-gutter-sm">
                        <q-btn
                            outline
                            color="primary"
                            dense
                            :label="t('waterRoutesList.edit')"
                            @click="editingWaterRouteId = String(wr.id)"
                        />
                        <q-btn
                            flat
                            color="negative"
                            icon="delete"
                            :label="t('waterRoutesList.delete')"
                            @click="() => confirmDelete(wr)"
                        />
                    </div>
                </q-item-section>
            </q-item>
        </AppEntityList>
    </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppWaterRouteForm from "../components/molecules/AppWaterRouteForm.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const $q = useQuasar();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();

const waterRoutesCollection = powersync.collections.water_routes;
const activeProgramIdRef = powersync.activeProgramIdRef;

const programId = computed(() => activeProgramIdRef.value.trim());

const editingWaterRouteId = ref<string | null>(null);

const waterRouteCardLabel = computed(() =>
    editingWaterRouteId.value != null &&
    String(editingWaterRouteId.value).length > 0
        ? t("waterRoutesList.editTitle")
        : t("waterRoutesList.addNew"),
);

const { data: waterRoutesRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = waterRoutesCollection.value;
        const pid = programId.value;
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ wr: col })
            .where(({ wr }) => eq(wr.program_id, pid));
    },
    [waterRoutesCollection, programId],
);

const waterRoutes = computed(() => waterRoutesRaw.value ?? []);

function onWaterRouteFormCancel(): void {
    editingWaterRouteId.value = null;
}

function onWaterRouteFormSuccess(payload: {
    id: string;
    mode: "create" | "edit";
}): void {
    editingWaterRouteId.value = null;
    $q.notify({
        type: "positive",
        message:
            payload.mode === "create"
                ? t("waterRoutesList.created")
                : t("waterRoutesList.updated"),
    });
}

function confirmDelete(wr: Record<string, unknown>) {
    confirm({
        title: t("waterRoutesList.deleteConfirmTitle"),
        message: t("waterRoutesList.deleteConfirmMessage", {
            name: String(wr.name ?? ""),
        }),
        onOk: async () => {
            try {
                const col = waterRoutesCollection.value;
                if (!col) return;
                col.delete(String(wr.id));
                void powersync.refreshOutboxSnapshot();
                $q.notify({
                    type: "positive",
                    message: t("waterRoutesList.deleted"),
                });
            } catch (e) {
                notifyError(e, t("waterRoutesList.errorGeneric"));
            }
        },
    });
}
</script>
