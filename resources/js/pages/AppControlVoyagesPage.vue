<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader :title="t('programsControlAdmin.voyagesTitle')">
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('programsControlAdmin.addVoyage')"
                        :to="controlContextNamedRoute(route, 'control.voyages.create')"
                    />
                </template>
            </AppPageHeader>
        </template>

        <AppControlDayDateToolbar
            v-model:selected-date-ymd="selectedDateYmd"
            v-model:show-all-dates="showAllDates"
            @prev-day="goPrevDay"
            @next-day="goNextDay"
            @go-today="goToday"
        />

        <AppEntityList>
            <AppEmptyListRow
                :show="filteredVoyages.length === 0"
                :message="t('programsControlAdmin.voyagesEmpty')"
            />
            <q-item
                v-for="row in filteredVoyages"
                :key="String(row.id)"
                class="p-4"
            >
                <q-item-section>
                    <q-item-label class="text-h6">
                        {{ departureLabel(row) }}
                    </q-item-label>
                    <q-item-label caption>
                        {{ row.productName ?? '—' }} · {{ statusLabel(row.status) }}
                    </q-item-label>
                    <q-item-label caption>
                        {{ t('programsControl.passengers') }}: {{ row.passengerCount }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <div class="column gap-1 items-end">
                        <q-btn
                            color="primary"
                            outline
                            dense
                            :label="t('common.edit')"
                            :to="controlContextNamedRoute(route, 'control.voyages.edit', {
                                voyageId: String(row.id),
                            })"
                        />
                        <q-btn
                            v-if="canDeleteVoyage(row.status)"
                            flat
                            dense
                            color="negative"
                            icon="delete"
                            :label="t('common.delete')"
                            @click="() => confirmDelete(row)"
                        />
                    </div>
                </q-item-section>
            </q-item>
        </AppEntityList>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { liveQueryRows } from '../powersync/live-query-casts';
import { tripDepartureMatchesLocalDateYmd } from '../powersync/control-panel-queries';
import { resolveProgramTimezone } from '../utilities/program-timezone-datetime';
import { useControlDayDateRoute } from '../composables/useControlDayDateRoute';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import { useControlVoyageAdminOps } from '../composables/useControlVoyageAdminOps';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useNotifyErrorFromCatch } from '../composables/useNotifyErrorFromCatch';
import AppEntityIndexPageLayout from '../layouts/AppEntityIndexPageLayout.vue';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import AppEntityList from '../components/ui/AppEntityList.vue';
import AppEmptyListRow from '../components/ui/AppEmptyListRow.vue';
import AppControlDayDateToolbar from '../components/control-panel/AppControlDayDateToolbar.vue';

type VoyageListRow = {
    id: string;
    status: string | null;
    trip_id: string | null;
    scheduled_departure_at: string | null;
    productName: string | null;
    tripDepartureAt: string | null;
    passengerCount: number;
};

const powersync = getAppPowerSyncContext();
const { t, locale } = useI18n();
const $q = useQuasar();
const route = useRoute();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();
const { deleteVoyage } = useControlVoyageAdminOps();
const { selectedDateYmd, showAllDates, goPrevDay, goNextDay, goToday } =
    useControlDayDateRoute();

const activeProgramIdRef = powersync.activeProgramIdRef;

const { data: programRow } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.programs.value;
        const pid = activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return qb
            .from({ p: col })
            .where(({ p }) => eq(p.id, pid))
            .select(({ p }) => ({
                timezone: p.timezone,
            }));
    },
    [powersync.collections.programs, activeProgramIdRef],
);

const programTimezone = computed(() =>
    resolveProgramTimezone(
        liveQueryRows<{ timezone: string | null }>(programRow.value)[0]?.timezone,
    ),
);

const { data: voyagesRaw } = useLiveQuery(
    (qb) => {
        const voyagesCol = powersync.collections.voyages.value;
        const tripsCol = powersync.collections.trips.value;
        const productsCol = powersync.collections.products.value;
        const boatTypesCol = powersync.collections.boat_types.value;
        const waterRoutesCol = powersync.collections.water_routes.value;
        const passengersCol = powersync.collections.passengers.value;
        const pid = activeProgramIdRef.value.trim();

        if (
            !voyagesCol ||
            !tripsCol ||
            !productsCol ||
            !boatTypesCol ||
            !waterRoutesCol ||
            !passengersCol ||
            pid.length === 0
        ) {
            return undefined;
        }

        return qb
            .from({ v: voyagesCol })
            .leftJoin({ trip: tripsCol }, ({ v, trip }) => eq(v.trip_id, trip.id))
            .leftJoin({ product: productsCol }, ({ trip, product }) =>
                eq(trip.product_id, product.id),
            )
            .where(({ v }) => eq(v.program_id, pid))
            .select(({ v, trip, product }) => ({
                id: v.id,
                status: v.status,
                trip_id: v.trip_id,
                scheduled_departure_at: v.scheduled_departure_at,
                productName: product.name,
                tripDepartureAt: trip.scheduled_departure_at,
            }));
    },
    [
        powersync.collections.voyages,
        powersync.collections.trips,
        powersync.collections.products,
        powersync.collections.boat_types,
        powersync.collections.water_routes,
        powersync.collections.passengers,
        activeProgramIdRef,
    ],
);

const { data: passengerCountsRaw } = useLiveQuery(
    (qb) => {
        const passengersCol = powersync.collections.passengers.value;
        const voyagesCol = powersync.collections.voyages.value;
        const pid = activeProgramIdRef.value.trim();
        if (!passengersCol || !voyagesCol || pid.length === 0) {
            return undefined;
        }
        return qb
            .from({ p: passengersCol })
            .innerJoin({ v: voyagesCol }, ({ p, v }) => eq(p.voyage_id, v.id))
            .where(({ v }) => eq(v.program_id, pid))
            .select(({ p, v }) => ({
                voyageId: v.id,
                passengerId: p.id,
            }));
    },
    [powersync.collections.passengers, powersync.collections.voyages, activeProgramIdRef],
);

const passengerCountByVoyageId = computed(() => {
    const map = new Map<string, number>();
    for (const row of liveQueryRows<{ voyageId: string }>(passengerCountsRaw.value)) {
        const id = String(row.voyageId ?? '').trim();
        if (id.length === 0) {
            continue;
        }
        map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
});

const voyages = computed((): VoyageListRow[] => {
    return liveQueryRows<VoyageListRow>(voyagesRaw.value).map((row) => ({
        ...row,
        passengerCount: passengerCountByVoyageId.value.get(String(row.id)) ?? 0,
    }));
});

const filteredVoyages = computed(() => {
    if (showAllDates.value) {
        return voyages.value;
    }
    const ymd = selectedDateYmd.value.trim();
    const tz = programTimezone.value;
    return voyages.value.filter((row) => {
        const dep = row.tripDepartureAt ?? row.scheduled_departure_at;
        return tripDepartureMatchesLocalDateYmd(dep, ymd, tz);
    });
});

function departureLabel(row: VoyageListRow): string {
    const dep = row.tripDepartureAt ?? row.scheduled_departure_at;
    if (dep == null || String(dep).trim() === '') {
        return '—';
    }
    try {
        return new Intl.DateTimeFormat(String(locale.value), {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(String(dep)));
    } catch {
        return String(dep);
    }
}

function statusLabel(status: string | null): string {
    const key = String(status ?? '').trim();
    const map: Record<string, string> = {
        draft: t('programsControl.statusDraft'),
        ready: t('programsControl.statusReady'),
        underway: t('programsControl.statusUnderway'),
        completed: t('programsControl.statusCompleted'),
        cancelled: t('programsControl.statusCancelled'),
    };
    return map[key] ?? key;
}

function canDeleteVoyage(status: string | null): boolean {
    const s = String(status ?? '').trim();
    return s !== 'underway' && s !== 'completed';
}

function confirmDelete(row: VoyageListRow): void {
    confirm({
        title: t('programsControlAdmin.deleteVoyageTitle'),
        message: t('programsControlAdmin.deleteVoyageMessage'),
        onOk: async () => {
            try {
                await deleteVoyage(String(row.id));
                $q.notify({ type: 'positive', message: t('programsControlAdmin.voyageDeleted') });
            } catch (error) {
                notifyError(error, t('programsControl.errorGeneric'));
            }
        },
    });
}
</script>
