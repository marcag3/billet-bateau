<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader
                :title="t('tripsList.title')"
                :description="t('tripsList.description')"
            >
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('tripsList.addTrip')"
                        :to="{ name: 'trips.create', params: { programId } }"
                    />
                </template>
            </AppPageHeader>
        </template>

        <AppCardSection :label="t('tripsList.listForProgram')">
            <p class="text-body2 text-grey-8 q-mb-none">
                {{
                    t("tripsList.rosterForProgram", {
                        name: selectedProgramName,
                    })
                }}
            </p>
        </AppCardSection>

        <AppEntityList>
            <AppEmptyListRow
                :show="trips.length === 0"
                :message="t('tripsList.empty')"
            />
            <q-item v-for="tr in trips" :key="String(tr.id)" class="q-pa-md">
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        formatDeparture(tr)
                    }}</q-item-label>
                    <q-item-label caption>
                        {{ t("tripsList.capacity") }}: {{ tr.capacity }}
                        <template v-if="tr.boatTypeName">
                            · {{ t("tripsList.boatType") }}:
                            {{ tr.boatTypeName }}
                        </template>
                        <template v-if="tr.waterRouteName">
                            · {{ t("tripsList.waterRoute") }}:
                            {{ tr.waterRouteName }}
                        </template>
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn
                        color="primary"
                        outline
                        dense
                        :label="t('tripsList.edit')"
                        :to="{
                            name: 'trips.edit',
                            params: { programId, tripId: String(tr.id) },
                        }"
                    />
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
    getAppPowerSyncBootstrappedRef,
    getProgramsCollection,
    getBoatTypesCollection,
    getWaterRoutesCollection,
    getTripsCollection,
    getActiveProgramIdRef,
} from "../powersync/app-powersync.runtime";
import { joinTripsWithRelations } from "../powersync/joined-queries";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";

const { t, locale } = useI18n();
const route = useRoute();
const tripsCollection = getTripsCollection();
const boatTypesCollection = getBoatTypesCollection();
const waterRoutesCollection = getWaterRoutesCollection();

// Trips joined with boat_types and water_routes — eliminates per-row .find() lookups
const { data: trips } = useLiveQuery(
    (queryBuilder) => {
        const col = tripsCollection.value;
        const btCol = boatTypesCollection.value;
        const wrCol = waterRoutesCollection.value;

        const pid = getActiveProgramIdRef().value.trim();
        if (!col || !btCol || !wrCol || pid.length === 0) return undefined;
        return joinTripsWithRelations(queryBuilder, col, btCol, wrCol)
            .where(({ t }: Record<string, Record<string, unknown>>) =>
                eq(t.program_id, pid),
            )
            .orderBy(
                ({ t }: Record<string, Record<string, unknown>>) =>
                    t.scheduled_departure_at,
                "desc",
            )
            .orderBy(
                ({ t }: Record<string, Record<string, unknown>>) =>
                    t.updated_at,
                "desc",
            )
            .orderBy(
                ({ t }: Record<string, Record<string, unknown>>) => t.id,
                "desc",
            );
    },
    [
        tripsCollection,
        boatTypesCollection,
        waterRoutesCollection,

        getActiveProgramIdRef(),
    ],
);

// Programs loaded for the header name display (small table, efficient)
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

// O(1) program name lookup via Map instead of O(n) .find()
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

function formatDeparture(tr: { scheduled_departure_at?: unknown }) {
    const raw = tr.scheduled_departure_at;
    if (raw == null || String(raw) === "") {
        return "—";
    }
    const d = new Date(String(raw));
    if (Number.isNaN(d.getTime())) {
        return String(raw);
    }
    return new Intl.DateTimeFormat(locale.value === "fr" ? "fr-CA" : "en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(d);
}
</script>
