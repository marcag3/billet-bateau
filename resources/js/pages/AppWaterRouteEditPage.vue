<template>
    <AppEntityEditPageLayout
        :title="t('waterRoutesList.editPageTitle')"
        :description="t('waterRoutesList.editPageDescription')"
        :back-to="backTo"
        :back-label="t('waterRoutesList.backToList')"
    >
        <q-banner
            v-if="showNotFound"
            class="bg-warning text-dark q-mb-md"
            rounded
        >
            {{ t("waterRoutesList.notFound") }}
            <template #action>
                <q-btn
                    color="primary"
                    flat
                    :label="t('waterRoutesList.backToList')"
                    :to="backTo"
                />
            </template>
        </q-banner>

        <AppCardSection
            v-else-if="currentWaterRoute"
            :label="formSectionLabel"
        >
            <AppWaterRouteForm
                :program-id="programId"
                :water-route-id="waterRouteId"
                @cancel="onCancel"
                @success="onSuccess"
            />
            <div class="row q-mt-md">
                <q-btn
                    flat
                    color="negative"
                    icon="delete"
                    :label="t('waterRoutesList.delete')"
                    :disable="isDeleting"
                    @click="confirmDelete"
                />
            </div>
        </AppCardSection>
    </AppEntityEditPageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import type { WaterRouteOutput } from "../powersync/water-routes.collection";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import AppEntityEditPageLayout from "../layouts/AppEntityEditPageLayout.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppWaterRouteForm from "../components/molecules/AppWaterRouteForm.vue";

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();

const waterRoutesCollection = powersync.collections.water_routes;
const hasBootstrapped = powersync.hasBootstrappedCollection;

const programId = computed(() => String(route.params.programId ?? "").trim());
const waterRouteId = computed(() =>
    String(route.params.waterRouteId ?? "").trim(),
);

const backTo = computed(() => ({
    name: "water-routes.list" as const,
    params: { programId: programId.value },
}));

const { data: waterRoutes } = useLiveQuery(
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

const currentWaterRoute = computed((): WaterRouteOutput | null => {
    const id = waterRouteId.value;
    if (id.length === 0) {
        return null;
    }
    const row = (waterRoutes.value ?? []).find((wr) => String(wr.id) === id);
    return row != null ? (row as WaterRouteOutput) : null;
});

const showNotFound = computed(
    () =>
        hasBootstrapped.value &&
        waterRouteId.value.length > 0 &&
        currentWaterRoute.value == null,
);

const formSectionLabel = computed(() => {
    const wr = currentWaterRoute.value;
    if (wr) {
        return String(wr.name ?? t("waterRoutesList.editTitle"));
    }
    return t("waterRoutesList.editTitle");
});

const isDeleting = ref(false);

function onCancel(): void {
    void router.push(backTo.value);
}

function onSuccess(payload: { id: string; mode: "create" | "edit" }): void {
    $q.notify({
        type: "positive",
        message:
            payload.mode === "create"
                ? t("waterRoutesList.created")
                : t("waterRoutesList.updated"),
    });
    void router.push(backTo.value);
}

function confirmDelete(): void {
    const wr = currentWaterRoute.value;
    if (!wr) {
        return;
    }
    confirm({
        title: t("waterRoutesList.deleteConfirmTitle"),
        message: t("waterRoutesList.deleteConfirmMessage", {
            name: String(wr.name ?? ""),
        }),
        onOk: async () => {
            isDeleting.value = true;
            try {
                const col = waterRoutesCollection.value;
                if (!col) {
                    return;
                }
                col.delete(String(wr.id));
                void powersync.refreshOutboxSnapshot();
                $q.notify({
                    type: "positive",
                    message: t("waterRoutesList.deleted"),
                });
                await router.push(backTo.value);
            } catch (e) {
                notifyError(e, t("waterRoutesList.errorGeneric"));
            } finally {
                isDeleting.value = false;
            }
        },
    });
}
</script>
