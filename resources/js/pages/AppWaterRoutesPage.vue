<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader
                :title="t('waterRoutesList.title')"
                :description="t('waterRoutesList.description')"
            >
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('waterRoutesList.addWaterRoute')"
                        :to="{
                            name: 'water-routes.create',
                            params: { programId },
                        }"
                    />
                </template>
            </AppPageHeader>
        </template>

        <div class="row q-col-gutter-md">
            <AppEmptyListRow
                class="col-12"
                :show="waterRoutes.length === 0"
                :message="t('waterRoutesList.empty')"
            />
            <div
                v-for="wr in waterRoutes"
                :key="String(wr.id)"
                class="col-12 col-sm-6 col-md-4"
            >
                <q-card
                    tabindex="0"
                    class="water-route-card cursor-pointer full-height column relative-position"
                    @click="goEdit(wr)"
                    @keydown.enter.prevent="goEdit(wr)"
                >
                    <AppWaterRouteTracePreview
                        :title="routeHeading(wr)"
                        :trace-geo-json="wr.trace"
                    />
                    <div
                        class="water-route-card__hint absolute-full flex flex-center text-white text-body1 text-weight-medium text-center q-px-md"
                    >
                        {{ t("common.edit") }}
                    </div>
                </q-card>
            </div>
        </div>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppWaterRouteTracePreview from "../components/molecules/AppWaterRouteTracePreview.vue";

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const waterRoutesCollection = powersync.collections.water_routes;

const programId = computed(() => String(route.params.programId ?? "").trim());

const { data: waterRoutesRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = waterRoutesCollection.value;
        const pid = programId.value;
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ wr: col })
            .where(({ wr }) => eq(wr.program_id, pid))
            .orderBy(({ wr }) => wr.id, "desc");
    },
    [waterRoutesCollection, programId],
);

const waterRoutes = computed(() => waterRoutesRaw.value ?? []);

function displayRouteName(wr: Record<string, unknown>): string {
    const n = wr.name;
    if (n == null || String(n).trim().length === 0) {
        return "Untitled";
    }
    return String(n).trim();
}

function routeHeading(wr: Record<string, unknown>): string {
    const name = displayRouteName(wr);
    const raw = wr.duration_minutes;
    if (raw == null || raw === "") {
        return name;
    }
    const minutes = String(raw).trim();
    if (minutes.length === 0) {
        return name;
    }
    return t("waterRoutesList.routeCardHeading", {
        name,
        minutes,
    });
}

function goEdit(wr: Record<string, unknown>): void {
    void router.push({
        name: "water-routes.edit",
        params: {
            programId: programId.value,
            waterRouteId: String(wr.id),
        },
    });
}
</script>

<style scoped>
.water-route-card__hint {
    opacity: 0;
    transition: opacity 0.2s ease;
    background: rgba(0, 0, 0, 0.45);
    pointer-events: none;
    z-index: 600;
}

.water-route-card:hover .water-route-card__hint,
.water-route-card:focus-visible .water-route-card__hint {
    opacity: 1;
}

.water-route-card:focus-visible {
    outline: 2px solid var(--q-primary);
    outline-offset: 2px;
}
</style>
