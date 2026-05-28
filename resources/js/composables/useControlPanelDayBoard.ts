import { computed, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { joinTripsWithRelations, type TripWithRelationsRow } from '../powersync/joined-queries';
import { toBrowserLocalDateYmd } from '../utilities/public-booking-filters';
import {
    addDaysToYmd,
    computeControlPanelDayStats,
    todayLocalDateYmd,
    type ControlPanelDayStats,
} from '../utilities/control-panel-day-board';
import type { VoyageOutput } from '../powersync/voyages.collection';
import type { PassengerOutput } from '../powersync/passengers.collection';
import type { BookingOutput } from '../powersync/bookings.collection';
import type { BookingTicketOutput } from '../powersync/booking-tickets.collection';
import type { VoyageBoatOutput } from '../powersync/voyage-boat.collection';
import type { VoyageGuideOutput } from '../powersync/voyage-guide.collection';

export type ControlPanelTripCardModel = {
    trip: TripWithRelationsRow;
    voyage: VoyageOutput | null;
    passengers: PassengerOutput[];
    bookedTicketNames: string[];
    bookedCount: number;
    bookingTickets: { id: string; name: string; booking_id: string }[];
    voyageBoatPivotIds: string[];
    voyageGuidePivotIds: string[];
};

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

    const tripsCollection = powersync.collections.trips;
    const productsCollection = powersync.collections.products;
    const boatTypesCollection = powersync.collections.boat_types;
    const waterRoutesCollection = powersync.collections.water_routes;
    const voyagesCollection = powersync.collections.voyages;
    const passengersCollection = powersync.collections.passengers;
    const bookingsCollection = powersync.collections.bookings;
    const bookingTicketsCollection = powersync.collections.booking_tickets;
    const voyageBoatCollection = powersync.collections.voyage_boat;
    const voyageGuideCollection = powersync.collections.voyage_guide;

    const { data: tripsRaw } = useLiveQuery(
        (queryBuilder) => {
            const col = tripsCollection.value;
            const pCol = productsCollection.value;
            const btCol = boatTypesCollection.value;
            const wrCol = waterRoutesCollection.value;
            const pid = programId.value.trim();
            if (!col || !pCol || !btCol || !wrCol || pid.length === 0) {
                return undefined;
            }
            return joinTripsWithRelations(queryBuilder, col, pCol, btCol, wrCol).where(
                ({ t: trip }: Record<string, Record<string, unknown>>) =>
                    eq(trip.program_id, pid),
            );
        },
        [
            tripsCollection,
            productsCollection,
            boatTypesCollection,
            waterRoutesCollection,
            programId,
        ],
    );

    const { data: voyagesRaw } = useLiveQuery(
        (queryBuilder) => {
            const col = voyagesCollection.value;
            if (!col) {
                return undefined;
            }
            return queryBuilder.from({ v: col });
        },
        [voyagesCollection],
    );

    const { data: passengersRaw } = useLiveQuery(
        (queryBuilder) => {
            const col = passengersCollection.value;
            if (!col) {
                return undefined;
            }
            return queryBuilder.from({ p: col });
        },
        [passengersCollection],
    );

    const { data: bookingsRaw } = useLiveQuery(
        (queryBuilder) => {
            const col = bookingsCollection.value;
            const pid = programId.value.trim();
            if (!col || pid.length === 0) {
                return undefined;
            }
            return queryBuilder
                .from({ b: col })
                .where(({ b }) => eq(b.program_id, pid));
        },
        [bookingsCollection, programId],
    );

    const { data: voyageBoatRaw } = useLiveQuery(
        (queryBuilder) => {
            const col = voyageBoatCollection.value;
            if (!col) {
                return undefined;
            }
            return queryBuilder.from({ vb: col });
        },
        [voyageBoatCollection],
    );

    const { data: voyageGuideRaw } = useLiveQuery(
        (queryBuilder) => {
            const col = voyageGuideCollection.value;
            if (!col) {
                return undefined;
            }
            return queryBuilder.from({ vg: col });
        },
        [voyageGuideCollection],
    );

    const { data: bookingTicketsRaw } = useLiveQuery(
        (queryBuilder) => {
            const col = bookingTicketsCollection.value;
            if (!col) {
                return undefined;
            }
            return queryBuilder.from({ bt: col });
        },
        [bookingTicketsCollection],
    );

    const tripsForSelectedDay = computed((): TripWithRelationsRow[] => {
        const ymd = selectedDateYmd.value.trim();
        const rows = (tripsRaw.value ?? []) as TripWithRelationsRow[];
        return rows
            .filter((trip) => {
                const dep = trip.scheduled_departure_at;
                if (dep == null || String(dep).trim() === '') {
                    return false;
                }
                return toBrowserLocalDateYmd(String(dep)) === ymd;
            })
            .sort((a, b) => {
                const ta = new Date(String(a.scheduled_departure_at ?? 0)).getTime();
                const tb = new Date(String(b.scheduled_departure_at ?? 0)).getTime();
                return ta - tb;
            });
    });

    const voyageByTripId = computed(() => {
        const map = new Map<string, VoyageOutput>();
        for (const row of (voyagesRaw.value ?? []) as VoyageOutput[]) {
            const tripId = row.trip_id != null ? String(row.trip_id).trim() : '';
            if (tripId.length > 0 && !map.has(tripId)) {
                map.set(tripId, row);
            }
        }
        return map;
    });

    const passengersByVoyageId = computed(() => {
        const map = new Map<string, PassengerOutput[]>();
        for (const row of (passengersRaw.value ?? []) as PassengerOutput[]) {
            const vid = row.voyage_id != null ? String(row.voyage_id).trim() : '';
            if (vid.length === 0) {
                continue;
            }
            const list = map.get(vid) ?? [];
            list.push(row);
            map.set(vid, list);
        }
        return map;
    });

    const voyageBoatPivotIdsByVoyageId = computed(() => {
        const map = new Map<string, string[]>();
        for (const row of (voyageBoatRaw.value ?? []) as VoyageBoatOutput[]) {
            const vid = row.voyage_id != null ? String(row.voyage_id).trim() : '';
            if (vid.length === 0) {
                continue;
            }
            const list = map.get(vid) ?? [];
            list.push(String(row.id));
            map.set(vid, list);
        }
        return map;
    });

    const voyageGuidePivotIdsByVoyageId = computed(() => {
        const map = new Map<string, string[]>();
        for (const row of (voyageGuideRaw.value ?? []) as VoyageGuideOutput[]) {
            const vid = row.voyage_id != null ? String(row.voyage_id).trim() : '';
            if (vid.length === 0) {
                continue;
            }
            const list = map.get(vid) ?? [];
            list.push(String(row.id));
            map.set(vid, list);
        }
        return map;
    });

    const bookingTicketsByTripId = computed(() => {
        const bookings = (bookingsRaw.value ?? []) as BookingOutput[];
        const tickets = (bookingTicketsRaw.value ?? []) as BookingTicketOutput[];
        const bookingById = new Map(bookings.map((b) => [String(b.id), b]));
        const map = new Map<
            string,
            { names: string[]; count: number; tickets: { id: string; name: string; booking_id: string }[] }
        >();

        for (const bt of tickets) {
            const booking = bookingById.get(String(bt.booking_id));
            if (booking?.trip_id == null) {
                continue;
            }
            const tripId = String(booking.trip_id);
            const entry = map.get(tripId) ?? { names: [], count: 0, tickets: [] };
            entry.count += 1;
            const name = String(bt.name ?? '').trim();
            if (name.length > 0) {
                entry.names.push(name);
            }
            entry.tickets.push({
                id: String(bt.id),
                name,
                booking_id: String(bt.booking_id),
            });
            map.set(tripId, entry);
        }

        return map;
    });

    const tripCards = computed((): ControlPanelTripCardModel[] => {
        return tripsForSelectedDay.value.map((trip) => {
            const tripId = String(trip.id);
            const voyage = voyageByTripId.value.get(tripId) ?? null;
            const voyageId =
                voyage?.id != null ? String(voyage.id).trim() : '';
            const passengers =
                voyageId.length > 0
                    ? (passengersByVoyageId.value.get(voyageId) ?? [])
                    : [];
            const booked = bookingTicketsByTripId.value.get(tripId) ?? {
                names: [],
                count: 0,
                tickets: [],
            };

            return {
                trip,
                voyage,
                passengers,
                bookedTicketNames: booked.names,
                bookedCount: booked.count,
                bookingTickets: booked.tickets,
                voyageBoatPivotIds:
                    voyageId.length > 0
                        ? (voyageBoatPivotIdsByVoyageId.value.get(voyageId) ?? [])
                        : [],
                voyageGuidePivotIds:
                    voyageId.length > 0
                        ? (voyageGuidePivotIdsByVoyageId.value.get(voyageId) ?? [])
                        : [],
            };
        });
    });

    const dayStats = computed((): ControlPanelDayStats => {
        const tripIds = tripsForSelectedDay.value.map((t) => String(t.id));
        return computeControlPanelDayStats({
            selectedDateYmd: selectedDateYmd.value,
            tripIdsForDay: tripIds,
            bookings: (bookingsRaw.value ?? []) as BookingOutput[],
            bookingTickets: (bookingTicketsRaw.value ?? []) as BookingTicketOutput[],
            voyages: (voyagesRaw.value ?? []) as VoyageOutput[],
            passengers: (passengersRaw.value ?? []) as PassengerOutput[],
        });
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
        voyageBoatPivotIdsByVoyageId,
        voyageGuidePivotIdsByVoyageId,
    };
}
