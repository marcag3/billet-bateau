/**
 * Control panel live queries (TanStack DB).
 *
 * Day-scoped joins, includes, and aggregates for the program control panel.
 * Prefer composing queries here over hand-rolled Maps in Vue composables.
 *
 * @see https://tanstack.com/db/latest/docs/guides/live-queries
 */

import { count, eq, toArray, type Collection, type InitialQueryBuilder } from '@tanstack/db';
import { joinTripsWithRelations, type TripWithRelationsRow } from './joined-queries';
import { toBrowserLocalDateYmd } from '../utilities/public-booking-filters';
import { voyageArrivedOnDateYmd } from '../utilities/control-panel-day-board';
import type { VoyageOutput } from './voyages.collection';
import type { PassengerOutput } from './passengers.collection';
import type { BookingTicketOutput } from './booking-tickets.collection';

/* eslint-disable @typescript-eslint/no-explicit-any -- TanStack Collection generics */

export type ControlPanelQueryCollections = {
    trips: Collection<any, any>;
    products: Collection<any, any>;
    boat_types: Collection<any, any>;
    water_routes: Collection<any, any>;
    voyages: Collection<any, any>;
    passengers: Collection<any, any>;
    bookings: Collection<any, any>;
    booking_tickets: Collection<any, any>;
    voyage_boat: Collection<any, any>;
    voyage_guide: Collection<any, any>;
};

export type ControlPanelDayStatsRow = {
    metric: 'booked' | 'manifestCount' | 'returned';
    value: number;
};

type VoyageBoatPivotRow = { id: string; boat_id: string };
type VoyageGuidePivotRow = { id: string; guide_id: string };

const DAY_STATS_METRICS = ['booked', 'manifestCount', 'returned'] as const;

export type ControlPanelTripCardQueryRow = TripWithRelationsRow & {
    voyage: VoyageOutput | undefined;
    passengers: PassengerOutput[];
    bookingTickets: BookingTicketOutput[];
    voyageBoatPivotIds: VoyageBoatPivotRow[];
    voyageGuidePivotIds: VoyageGuidePivotRow[];
};

export function tripDepartureMatchesLocalDateYmd(
    scheduledDepartureAt: unknown,
    dateYmd: string,
): boolean {
    if (scheduledDepartureAt == null || String(scheduledDepartureAt).trim() === '') {
        return false;
    }
    const local = toBrowserLocalDateYmd(String(scheduledDepartureAt));
    return local != null && local === dateYmd.trim();
}

export function passengerOnReturnedVoyageForDateYmd(
    voyage: Pick<VoyageOutput, 'id' | 'trip_id' | 'arrived_at'>,
    dateYmd: string,
): boolean {
    return voyageArrivedOnDateYmd(
        {
            id: String(voyage.id),
            trip_id: voyage.trip_id,
            arrived_at: voyage.arrived_at,
        },
        dateYmd,
    );
}

function programTripWhere(
    programId: string,
): (row: Record<string, Record<string, unknown>>) => ReturnType<typeof eq> {
    const pid = programId.trim();
    return ({ trip }) => eq(trip.program_id, pid);
}

/**
 * Subquery: program trips whose local departure date matches `dateYmd`.
 */
export function buildTripsForProgramDayQuery(
    qb: InitialQueryBuilder,
    cols: ControlPanelQueryCollections,
    programId: string,
    dateYmd: string,
) {
    const ymd = dateYmd.trim();
    return joinTripsWithRelations(
        qb,
        cols.trips,
        cols.products,
        cols.boat_types,
        cols.water_routes,
    )
        .where(programTripWhere(programId))
        .fn.where((row) => {
            const tripRow = row as TripWithRelationsRow & {
                trip?: { scheduled_departure_at?: unknown };
            };
            const dep =
                tripRow.trip?.scheduled_departure_at ?? tripRow.scheduled_departure_at;
            return tripDepartureMatchesLocalDateYmd(dep, ymd);
        });
}

/**
 * Day-level counts via unionAll of three aggregate branches (requires @tanstack/db >= 0.6.7).
 */
export function buildControlPanelDayStatsQuery(
    qb: InitialQueryBuilder,
    cols: ControlPanelQueryCollections,
    programId: string,
    dateYmd: string,
) {
    const tripsForDay = buildTripsForProgramDayQuery(qb, cols, programId, dateYmd);
    const ymd = dateYmd.trim();

    const bookedBranch = qb
        .from({ ticket: cols.booking_tickets })
        .innerJoin({ booking: cols.bookings }, ({ ticket, booking }) =>
            eq(ticket.booking_id, booking.id),
        )
        .innerJoin({ bookedDayTrip: tripsForDay }, ({ booking, bookedDayTrip }) =>
            eq(booking.trip_id, bookedDayTrip.id),
        )
        .select(({ ticket }) => ({
            metric: 'booked' as const,
            value: count(ticket.id),
        }));

    const manifestBranch = qb
        .from({ manifestPassenger: cols.passengers })
        .innerJoin({ manifestVoyage: cols.voyages }, ({ manifestPassenger, manifestVoyage }) =>
            eq(manifestPassenger.voyage_id, manifestVoyage.id),
        )
        .innerJoin({ manifestDayTrip: tripsForDay }, ({ manifestVoyage, manifestDayTrip }) =>
            eq(manifestVoyage.trip_id, manifestDayTrip.id),
        )
        .select(({ manifestPassenger }) => ({
            metric: 'manifestCount' as const,
            value: count(manifestPassenger.id),
        }));

    const returnedBranch = qb
        .from({ returnedPassenger: cols.passengers })
        .innerJoin({ returnedVoyage: cols.voyages }, ({ returnedPassenger, returnedVoyage }) =>
            eq(returnedPassenger.voyage_id, returnedVoyage.id),
        )
        .innerJoin({ returnedDayTrip: tripsForDay }, ({ returnedVoyage, returnedDayTrip }) =>
            eq(returnedVoyage.trip_id, returnedDayTrip.id),
        )
        .fn.where((row) =>
            passengerOnReturnedVoyageForDateYmd(
                row.returnedVoyage as VoyageOutput,
                ymd,
            ),
        )
        .select(({ returnedPassenger }) => ({
            metric: 'returned' as const,
            value: count(returnedPassenger.id),
        }));

    return qb.unionAll(bookedBranch, manifestBranch, returnedBranch);
}

export function reduceDayStatsRows(
    rows: ControlPanelDayStatsRow[] | undefined,
): { booked: number; manifestCount: number; returned: number } {
    const totals = {
        booked: 0,
        manifestCount: 0,
        returned: 0,
    };
    for (const row of rows ?? []) {
        const metric = row.metric;
        if (!DAY_STATS_METRICS.includes(metric)) {
            continue;
        }
        totals[metric] = Number(row.value ?? 0);
    }
    return totals;
}

/**
 * Day trips with nested voyage, passengers, tickets, and voyage pivots (includes).
 */
export function buildControlPanelTripCardsQuery(
    qb: InitialQueryBuilder,
    cols: ControlPanelQueryCollections,
    programId: string,
    dateYmd: string,
) {
    const tripsForDay = buildTripsForProgramDayQuery(qb, cols, programId, dateYmd);

    return qb
        .from({ trip: tripsForDay })
        .orderBy(({ trip }) => trip.scheduled_departure_at, 'asc')
        .select(({ trip }) => ({
            id: trip.id,
            program_id: trip.program_id,
            product_id: trip.product_id,
            product_name: trip.product_name,
            scheduled_departure_at: trip.scheduled_departure_at,
            boat_type_id: trip.boat_type_id,
            water_route_id: trip.water_route_id,
            capacity: trip.capacity,
            boatTypeName: trip.boatTypeName,
            waterRouteName: trip.waterRouteName,
            waterRouteDurationMinutes: trip.waterRouteDurationMinutes,
            productBannerObjectKey: trip.productBannerObjectKey,
            voyage: qb
                .from({ voyage: cols.voyages })
                .where(({ voyage }) => eq(voyage.trip_id, trip.id))
                .orderBy(({ voyage }) => voyage.id, 'asc')
                .findOne(),
            passengers: toArray(
                qb
                    .from({ passenger: cols.passengers })
                    .join({ voyage: cols.voyages }, ({ passenger, voyage }) =>
                        eq(passenger.voyage_id, voyage.id),
                    )
                    .where(({ voyage }) => eq(voyage.trip_id, trip.id))
                    .select(({ passenger }) => ({
                        id: passenger.id,
                        voyage_id: passenger.voyage_id,
                        name: passenger.name,
                        booking_id: passenger.booking_id,
                        check_in_id: passenger.check_in_id,
                        notes: passenger.notes,
                    })),
            ),
            bookingTickets: toArray(
                qb
                    .from({ ticket: cols.booking_tickets })
                    .join({ booking: cols.bookings }, ({ ticket, booking }) =>
                        eq(ticket.booking_id, booking.id),
                    )
                    .where(({ booking }) => eq(booking.trip_id, trip.id))
                    .select(({ ticket }) => ({
                        id: ticket.id,
                        booking_id: ticket.booking_id,
                        ticket_type_id: ticket.ticket_type_id,
                        name: ticket.name,
                        email: ticket.email,
                        country: ticket.country,
                        custom_fields: ticket.custom_fields,
                        waiver_confirmation_id: ticket.waiver_confirmation_id,
                    })),
            ),
            voyageBoatPivotIds: toArray(
                qb
                    .from({ voyageBoat: cols.voyage_boat })
                    .join({ voyage: cols.voyages }, ({ voyageBoat, voyage }) =>
                        eq(voyageBoat.voyage_id, voyage.id),
                    )
                    .where(({ voyage }) => eq(voyage.trip_id, trip.id))
                    .select(({ voyageBoat }) => ({
                        id: voyageBoat.id,
                        boat_id: voyageBoat.boat_id,
                    })),
            ),
            voyageGuidePivotIds: toArray(
                qb
                    .from({ voyageGuide: cols.voyage_guide })
                    .join({ voyage: cols.voyages }, ({ voyageGuide, voyage }) =>
                        eq(voyageGuide.voyage_id, voyage.id),
                    )
                    .where(({ voyage }) => eq(voyage.trip_id, trip.id))
                    .select(({ voyageGuide }) => ({
                        id: voyageGuide.id,
                        guide_id: voyageGuide.guide_id,
                    })),
            ),
        }));
}

function firstRowOrValue<T>(value: T | T[] | { toArray: T[] } | null | undefined): T | null {
    if (value == null) {
        return null;
    }
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    if (typeof value === 'object' && 'toArray' in value) {
        const rows = (value as { toArray: T[] }).toArray;
        return rows[0] ?? null;
    }
    return value;
}

export function mapControlPanelTripCardRow(
    row: ControlPanelTripCardQueryRow,
): {
    trip: TripWithRelationsRow;
    voyage: VoyageOutput | null;
    passengers: PassengerOutput[];
    bookedTicketNames: string[];
    bookedCount: number;
    bookingTickets: { id: string; name: string; booking_id: string }[];
    voyageBoatPivotIds: string[];
    voyageGuidePivotIds: string[];
    initialBoatIds: string[];
    initialGuideIds: string[];
} {
    const tickets = Array.isArray(row.bookingTickets)
        ? row.bookingTickets
        : ((row.bookingTickets as { toArray?: BookingTicketOutput[] } | undefined)
              ?.toArray ?? []);
    const names: string[] = [];
    for (const bt of tickets) {
        const name = String(bt.name ?? '').trim();
        if (name.length > 0) {
            names.push(name);
        }
    }

    const voyage = firstRowOrValue(
        row.voyage as VoyageOutput | VoyageOutput[] | { toArray: VoyageOutput[] } | undefined,
    );

    return {
        trip: row,
        voyage,
        passengers: Array.isArray(row.passengers)
            ? row.passengers
            : ((row.passengers as { toArray?: PassengerOutput[] } | undefined)?.toArray ??
              []),
        bookedTicketNames: names,
        bookedCount: tickets.length,
        bookingTickets: tickets.map((bt) => ({
            id: String(bt.id),
            name: String(bt.name ?? '').trim(),
            booking_id: String(bt.booking_id),
        })),
        voyageBoatPivotIds: normalizePivotRows(row.voyageBoatPivotIds).map((p) =>
            String(p.id),
        ),
        voyageGuidePivotIds: normalizePivotRows(row.voyageGuidePivotIds).map((p) =>
            String(p.id),
        ),
        initialBoatIds: normalizePivotRows(row.voyageBoatPivotIds)
            .map((p) => String(p.boat_id ?? '').trim())
            .filter((id) => id.length > 0),
        initialGuideIds: normalizePivotRows(row.voyageGuidePivotIds)
            .map((p) => String(p.guide_id ?? '').trim())
            .filter((id) => id.length > 0),
    };
}

function normalizePivotRows<T>(value: T | T[] | { toArray: T[] } | null | undefined): T[] {
    if (value == null) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'object' && 'toArray' in value) {
        return (value as { toArray: T[] }).toArray;
    }
    return [value];
}

function isLiveQueryCollectionReady(
    col: ControlPanelQueryCollections[keyof ControlPanelQueryCollections] | null | undefined,
): boolean {
    return col != null && col.isReady();
}

export function areControlPanelQueryCollectionsReady(
    cols: Partial<ControlPanelQueryCollections>,
    programId: string,
): cols is ControlPanelQueryCollections {
    const pid = programId.trim();
    if (pid.length === 0) {
        return false;
    }
    return (
        isLiveQueryCollectionReady(cols.trips) &&
        isLiveQueryCollectionReady(cols.products) &&
        isLiveQueryCollectionReady(cols.boat_types) &&
        isLiveQueryCollectionReady(cols.water_routes) &&
        isLiveQueryCollectionReady(cols.voyages) &&
        isLiveQueryCollectionReady(cols.passengers) &&
        isLiveQueryCollectionReady(cols.bookings) &&
        isLiveQueryCollectionReady(cols.booking_tickets) &&
        isLiveQueryCollectionReady(cols.voyage_boat) &&
        isLiveQueryCollectionReady(cols.voyage_guide)
    );
}
