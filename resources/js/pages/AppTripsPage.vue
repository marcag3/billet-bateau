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

        <AppAlertBanner
            v-if="hasOutboxCommitError"
            variant="warning"
            dismissible
            :dismiss-label="t('common.dismiss')"
            @dismiss="dismissOutboxCommitError"
        >
            {{ outboxCommitError }}
        </AppAlertBanner>

        <AppBootstrapGate
            :ready="hasBootstrapped"
            content-class="q-gutter-y-md"
        >
            <AppCardSection :label="t('tripsList.listForProgram')">
                <p class="text-body2 text-grey-8 q-mb-none">
                    {{ t('tripsList.rosterForProgram', { name: selectedProgramName }) }}
                </p>
            </AppCardSection>

            <AppEntityList>
                <AppEmptyListRow
                    :show="trips.length === 0"
                    :message="t('tripsList.empty')"
                />
                <q-item
                    v-for="tr in trips"
                    :key="String(tr.id)"
                    class="q-pa-md"
                >
                    <q-item-section>
                        <q-item-label class="text-h6">{{ formatDeparture(tr) }}</q-item-label>
                        <q-item-label caption>
                            {{ t('tripsList.capacity') }}: {{ tr.capacity }}
                            <template v-if="boatTypeLabelFor(tr)">
                                · {{ t('tripsList.boatType') }}: {{ boatTypeLabelFor(tr) }}
                            </template>
                            <template v-if="waterRouteLabelFor(tr)">
                                · {{ t('tripsList.waterRoute') }}: {{ waterRouteLabelFor(tr) }}
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
        </AppBootstrapGate>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { useTrips } from '../models/trips/trips.model';
import { getAppPowerSyncBootstrappedRef, useAppPowerSyncOutbox, getProgramsCollection, getBoatTypesCollection, getWaterRoutesCollection } from '../powersync/app-powersync.runtime';
import AppEntityIndexPageLayout from '../layouts/AppEntityIndexPageLayout.vue';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import AppBootstrapGate from '../components/ui/AppBootstrapGate.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppEntityList from '../components/ui/AppEntityList.vue';
import AppEmptyListRow from '../components/ui/AppEmptyListRow.vue';

const { t, locale } = useI18n();
const route = useRoute();
const { trips, ensureTripsReady } = useTrips();
const programsCollection = getProgramsCollection();

const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        if (!col) return undefined;
        return queryBuilder.from({ p: col });
    },
    [programsCollection],
);

const boatTypesCollection = getBoatTypesCollection();

const { data: boatTypes } = useLiveQuery(
    (queryBuilder) => {
        const col = boatTypesCollection.value;
        if (!col) return undefined;
        return queryBuilder.from({ bt: col });
    },
    [boatTypesCollection],
);

const waterRoutesCollection = getWaterRoutesCollection();
const { data: waterRoutes } = useLiveQuery(
    (queryBuilder) => {
        const col = waterRoutesCollection.value;
        if (!col) return undefined;
        return queryBuilder.from({ wr: col });
    },
    [waterRoutesCollection],
);

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const programId = computed(() => String(route.params.programId ?? '').trim());

const selectedProgramName = computed(() => {
    const id = programId.value;
    if (id.length === 0) {
        return '';
    }
    const row = (programs.value ?? []).find((p) => p != null && String(p.id) === id);
    if (row) {
        return String(row.name ?? id);
    }
    return id;
});

const boatTypeOptions = computed(() =>
    boatTypes.value.map((bt) => ({
        label: String(bt.name ?? ''),
        value: String(bt.id),
    })),
);

const waterRouteOptions = computed(() =>
    waterRoutes.value.map((wr) => ({
        label: String(wr.name ?? ''),
        value: String(wr.id),
    })),
);

function formatDeparture(tr: Record<string, unknown>) {
    const raw = tr.scheduled_departure_at;
    if (raw == null || String(raw) === '') {
        return '—';
    }
    const d = new Date(String(raw));
    if (Number.isNaN(d.getTime())) {
        return String(raw);
    }
    return new Intl.DateTimeFormat(locale.value === 'fr' ? 'fr-CA' : 'en-CA', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(d);
}

function boatTypeLabelFor(tr: Record<string, unknown>) {
    const id = tr.boat_type_id;
    if (id == null || String(id) === '') {
        return '';
    }
    const opt = boatTypeOptions.value.find((o) => o.value === String(id));
    return opt?.label ?? '';
}

function waterRouteLabelFor(tr: Record<string, unknown>) {
    const id = tr.water_route_id;
    if (id == null || String(id) === '') {
        return '';
    }
    const opt = waterRouteOptions.value.find((o) => o.value === String(id));
    return opt?.label ?? '';
}

onMounted(() => {
    void ensureTripsReady();
});
</script>
