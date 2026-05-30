import { computed, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import {
    areControlPanelQueryCollectionsReady,
    buildControlPanelDayStatsQuery,
    buildControlPanelTripCardsQuery,
    mapControlPanelTripCardRow,
    reduceDayStatsRows,
} from '../powersync/control-panel-queries';
import {
    addDaysToYmd,
    todayLocalDateYmd,
    type ControlPanelDayStats,
} from '../utilities/control-panel-day-board';

export type ControlPanelTripCardModel = ReturnType<typeof mapControlPanelTripCardRow>;

function parseRouteDateYmd(raw: unknown): string {
    const s = String(raw ?? '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return s;
    }
    return todayLocalDateYmd();
}

export function useControlPanelDayBoard(programId: Ref<string>) {
    const powersync = getAppPowerSyncContext();
    const route = useRoute();
    const router = useRouter();

    const selectedDateYmd = ref(parseRouteDateYmd(route.query.date));

    watch(
        () => route.query.date,
        (value) => {
            selectedDateYmd.value = parseRouteDateYmd(value);
        },
    );

    watch(selectedDateYmd, (ymd) => {
        const next = String(ymd).trim();
        if (route.query.date === next) {
            return;
        }
        void router.replace({
            query: { ...route.query, date: next },
        });
    });

    const collections = {
        trips: powersync.collections.trips,
        products: powersync.collections.products,
        boat_types: powersync.collections.boat_types,
        water_routes: powersync.collections.water_routes,
        voyages: powersync.collections.voyages,
        passengers: powersync.collections.passengers,
        bookings: powersync.collections.bookings,
        booking_tickets: powersync.collections.booking_tickets,
        voyage_boat: powersync.collections.voyage_boat,
        voyage_guide: powersync.collections.voyage_guide,
    };

    const liveQueryDeps = [
        collections.trips,
        collections.products,
        collections.boat_types,
        collections.water_routes,
        collections.voyages,
        collections.passengers,
        collections.bookings,
        collections.booking_tickets,
        collections.voyage_boat,
        collections.voyage_guide,
        programId,
        selectedDateYmd,
    ] as const;

    const { data: tripCardsRaw } = useLiveQuery(
        (queryBuilder) => {
            const cols = {
                trips: collections.trips.value,
                products: collections.products.value,
                boat_types: collections.boat_types.value,
                water_routes: collections.water_routes.value,
                voyages: collections.voyages.value,
                passengers: collections.passengers.value,
                bookings: collections.bookings.value,
                booking_tickets: collections.booking_tickets.value,
                voyage_boat: collections.voyage_boat.value,
                voyage_guide: collections.voyage_guide.value,
            };
            if (!areControlPanelQueryCollectionsReady(cols, programId.value)) {
                return undefined;
            }
            return buildControlPanelTripCardsQuery(
                queryBuilder,
                cols,
                programId.value,
                selectedDateYmd.value,
            );
        },
        [...liveQueryDeps],
    );

    const { data: dayStatsRaw } = useLiveQuery(
        (queryBuilder) => {
            const cols = {
                trips: collections.trips.value,
                products: collections.products.value,
                boat_types: collections.boat_types.value,
                water_routes: collections.water_routes.value,
                voyages: collections.voyages.value,
                passengers: collections.passengers.value,
                bookings: collections.bookings.value,
                booking_tickets: collections.booking_tickets.value,
                voyage_boat: collections.voyage_boat.value,
                voyage_guide: collections.voyage_guide.value,
            };
            if (!areControlPanelQueryCollectionsReady(cols, programId.value)) {
                return undefined;
            }
            return buildControlPanelDayStatsQuery(
                queryBuilder,
                cols,
                programId.value,
                selectedDateYmd.value,
            );
        },
        [...liveQueryDeps],
    );

    const tripCards = computed((): ControlPanelTripCardModel[] =>
        (tripCardsRaw.value ?? []).map(mapControlPanelTripCardRow),
    );

    const dayStats = computed((): ControlPanelDayStats => {
        const totals = reduceDayStatsRows(dayStatsRaw.value ?? []);
        const manifestCount = totals.manifestCount;
        const booked = totals.booked;
        return {
            booked,
            returned: totals.returned,
            total: manifestCount > 0 ? manifestCount : booked,
        };
    });

    function shiftSelectedDay(deltaDays: number): void {
        selectedDateYmd.value = addDaysToYmd(selectedDateYmd.value, deltaDays);
    }

    function goToToday(): void {
        selectedDateYmd.value = todayLocalDateYmd();
    }

    return {
        selectedDateYmd,
        tripCards,
        dayStats,
        shiftSelectedDay,
        goToToday,
    };
}
