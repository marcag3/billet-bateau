import { computed, type Ref } from 'vue';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { activeProgramIdRef } from '../powersync/powersync-runtime-state';
import {
    areControlPanelQueryCollectionsReady,
    buildControlPanelTripCardsQuery,
    buildProgramTripDepartureRowsQuery,
    mapControlPanelTripCardRow,
    tripDepartureMatchesLocalDateYmd,
    type TripDepartureAtRow,
} from '../powersync/control-panel-queries';
import type { ProgramOutput } from '../powersync/programs.collection';
import {
    computeControlPanelDayStatsFromCards,
    reduceTripDepartureDateYmds,
    type ControlPanelDayStats,
} from '../utilities/control-panel-day-board';
import { parseProgramBookingQuestions } from '../utilities/program-booking-questions';
import { resolveProgramTimezone } from '../utilities/program-timezone-datetime';
import { useControlDayDateRoute } from './useControlDayDateRoute';

export type ControlPanelTripCardModel = ReturnType<typeof mapControlPanelTripCardRow>;

export function useControlPanelDayBoard(programId: Ref<string>) {
    const powersync = getAppPowerSyncContext();

    const {
        selectedDateYmd,
        shiftSelectedDay,
        goToday: goToToday,
    } = useControlDayDateRoute();

    const dayFilterYmd = computed(() => selectedDateYmd.value.trim());

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
        check_ins: powersync.collections.check_ins,
        programs: powersync.collections.programs,
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
        collections.check_ins,
        collections.programs,
        programId,
        activeProgramIdRef,
    ] as const;

    /** Rebuild live queries when program_scope rows land (collection refs alone do not change). */
    const controlPanelCollectionSyncKey = computed(() => {
        const sizes = [
            collections.trips.value,
            collections.products.value,
            collections.boat_types.value,
            collections.water_routes.value,
            collections.voyages.value,
            collections.passengers.value,
            collections.bookings.value,
            collections.booking_tickets.value,
            collections.voyage_boat.value,
            collections.voyage_guide.value,
            collections.check_ins.value,
        ].map((col) => col?.size ?? 0);
        return `${activeProgramIdRef.value}:${sizes.join(',')}`;
    });

    const { data: programRowsRaw } = useLiveQuery(
        (queryBuilder) => {
            const col = collections.programs.value;
            const pid = programId.value.trim();
            if (!col || pid.length === 0) {
                return undefined;
            }
            return queryBuilder.from({ p: col }).where(({ p }) => eq(p.id, pid));
        },
        [collections.programs, programId],
    );

    const programDateBounds = computed((): { startYmd: string; endYmd: string } => {
        const row = (programRowsRaw.value ?? [])[0] as unknown as ProgramOutput | undefined;
        const start = row != null ? String(row.start_date ?? '').trim() : '';
        const end = row != null ? String(row.end_date ?? '').trim() : '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
            return { startYmd: start, endYmd: end };
        }
        return { startYmd: '', endYmd: '' };
    });

    const programTimezone = computed((): string => {
        const row = (programRowsRaw.value ?? [])[0] as unknown as ProgramOutput | undefined;

        return resolveProgramTimezone(row?.timezone);
    });

    const bookingQuestions = computed((): string[] => {
        const row = (programRowsRaw.value ?? [])[0] as unknown as ProgramOutput | undefined;
        if (row == null) {
            return [];
        }
        return parseProgramBookingQuestions(row.booking_questions);
    });

    const { data: tripDepartureRowsRaw } = useLiveQuery(
        (queryBuilder) => {
            const tripsCol = collections.trips.value;
            const pid = programId.value.trim();
            if (tripsCol == null || pid.length === 0) {
                return undefined;
            }
            return buildProgramTripDepartureRowsQuery(queryBuilder, tripsCol, pid);
        },
        [collections.trips, programId, controlPanelCollectionSyncKey],
    );

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
                check_ins: collections.check_ins.value,
            };
            if (!areControlPanelQueryCollectionsReady(cols, programId.value)) {
                return undefined;
            }
            return buildControlPanelTripCardsQuery(queryBuilder, cols, programId.value);
        },
        [...liveQueryDeps, controlPanelCollectionSyncKey],
    );

    const tripCards = computed((): ControlPanelTripCardModel[] => {
        const ymd = dayFilterYmd.value;
        return (tripCardsRaw.value ?? [])
            .filter((row) =>
                tripDepartureMatchesLocalDateYmd(
                    row.scheduled_departure_at,
                    ymd,
                    programTimezone.value,
                ),
            )
            .map(mapControlPanelTripCardRow);
    });

    const tripDateYmds = computed((): string[] =>
        reduceTripDepartureDateYmds(
            (tripDepartureRowsRaw.value ?? []) as unknown as TripDepartureAtRow[],
            programTimezone.value,
        ),
    );

    const dayStats = computed((): ControlPanelDayStats =>
        computeControlPanelDayStatsFromCards(tripCards.value, dayFilterYmd.value),
    );

    return {
        selectedDateYmd,
        tripCards,
        dayStats,
        tripDateYmds,
        programDateBounds,
        programTimezone,
        bookingQuestions,
        shiftSelectedDay,
        goToToday,
    };
}
