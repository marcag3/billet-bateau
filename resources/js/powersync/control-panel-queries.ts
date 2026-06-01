/**
 * Control panel live queries (TanStack DB).
 *
 * Day-scoped joins, includes, and aggregates for the program control panel.
 * Prefer composing queries here over hand-rolled Maps in Vue composables.
 *
 * @see docs/liveQuery.md
 * @see https://tanstack.com/db/latest/docs/guides/live-queries
 */

import {
    count,
    eq,
    toArray,
    type InitialQueryBuilder,
    type QueryResult,
} from '@tanstack/db';
import { joinTripsWithRelationsFrom, type TripWithRelationsRow } from './joined-queries';
import type { ControlPanelQueryCollections } from './control-panel-collection-types';
import { toBrowserLocalDateYmd } from '../utilities/public-booking-filters';
import { resolveControlPanelTripDisplayStatus } from '../utilities/control-panel-day-board';
import type { VoyageOutput } from './voyages.collection';
import type { PassengerOutput } from './passengers.collection';
import type { BookingTicketOutput } from './booking-tickets.collection';
import type { CheckInOutput } from './check-ins.collection';
import {
    derivePendingBookingGroups,
    type ControlPanelPendingBookingGroup,
} from '../utilities/control-panel-manifest';

export type { ControlPanelQueryCollections } from './control-panel-collection-types';

export type ControlPanelDayStatsRow = {
    metric: 'booked' | 'manifestCount' | 'returned';
    value: number;
};

const DAY_STATS_METRICS = ['booked', 'manifestCount', 'returned'] as const;

type VoyageBoatPivotRow = { id: string; boat_id: string | null };
type VoyageGuidePivotRow = { id: string; guide_id: string | null };

type VoyageIncludeRow = VoyageOutput & {
    passengers: PassengerOutput[];
    checkIns: CheckInOutput[];
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

export function passengerOnReturnedVoyage(voyage: Pick<VoyageOutput, 'status'>): boolean {
    return resolveControlPanelTripDisplayStatus(voyage) === 'returned';
}

function programTripWhere(
    programId: string,
): (row: Record<string, Record<string, unknown>>) => ReturnType<typeof eq> {
    const pid = programId.trim();
    return ({ trip }) => eq(trip.program_id, pid);
}

/**
 * Subquery: all program trips with product / boat type / water route relations.
 * Day filtering is applied in Vue (see `useControlPanelDayBoard`) so results stay
 * live when PowerSync collections finish syncing after the query is first built.
 */
export function buildProgramTripsJoinedSubquery(
    qb: InitialQueryBuilder,
    cols: ControlPanelQueryCollections,
    programId: string,
) {
    return joinTripsWithRelationsFrom(
        qb,
        cols.trips,
        cols.products,
        cols.boat_types,
        cols.water_routes,
    )
        .where(programTripWhere(programId))
        .select(({ trip, product, boatType, waterRoute }) => ({
            id: trip.id,
            program_id: trip.program_id,
            product_id: trip.product_id,
            product_name: product.name,
            scheduled_departure_at: trip.scheduled_departure_at,
            boat_type_id: product.boat_type_id,
            water_route_id: product.water_route_id,
            capacity: product.capacity,
            boatTypeName: boatType.name,
            waterRouteName: waterRoute.name,
            waterRouteDurationMinutes: waterRoute.duration_minutes,
            productBannerObjectKey: product.banner_object_key,
        }));
}

/** Used by day-stats union query only; trip cards filter by date in Vue. */
export function buildTripsForProgramDayQuery(
    qb: InitialQueryBuilder,
    cols: ControlPanelQueryCollections,
    programId: string,
    dateYmd: string,
) {
    const ymd = dateYmd.trim();
    return buildProgramTripsJoinedSubquery(qb, cols, programId).fn.where((row) => {
        const tripRow = row as unknown as TripWithRelationsRow & {
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
            passengerOnReturnedVoyage(row.returnedVoyage as unknown as VoyageOutput),
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
 * Day trips with nested includes: booking tickets and voyage (passengers + pivots).
 * Booking include correlates from `bookings` (`eq(booking.trip_id, trip.id)`), not via a join alias.
 */
export function buildControlPanelTripCardsQuery(
    qb: InitialQueryBuilder,
    cols: ControlPanelQueryCollections,
    programId: string,
) {
    const programTrips = buildProgramTripsJoinedSubquery(qb, cols, programId);

    return qb
        .from({ trip: programTrips })
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
            bookingTickets: toArray(
                qb
                    .from({ booking: cols.bookings })
                    .where(({ booking }) => eq(booking.trip_id, trip.id))
                    .innerJoin({ ticket: cols.booking_tickets }, ({ booking, ticket }) =>
                        eq(booking.id, ticket.booking_id),
                    )
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
            voyage: toArray(
                qb
                    .from({ voyage: cols.voyages })
                    .where(({ voyage }) => eq(voyage.trip_id, trip.id))
                    .orderBy(({ voyage }) => voyage.id, 'asc')
                    .limit(1)
                    .select(({ voyage }) => ({
                        id: voyage.id,
                        program_id: voyage.program_id,
                        user_id: voyage.user_id,
                        trip_id: voyage.trip_id,
                        water_route_id: voyage.water_route_id,
                        scheduled_departure_at: voyage.scheduled_departure_at,
                        started_at: voyage.started_at,
                        arrived_at: voyage.arrived_at,
                        status: voyage.status,
                        passengers: toArray(
                            qb
                                .from({ passenger: cols.passengers })
                                .where(({ passenger }) => eq(passenger.voyage_id, voyage.id))
                                .select(({ passenger }) => ({
                                    id: passenger.id,
                                    voyage_id: passenger.voyage_id,
                                    name: passenger.name,
                                    booking_id: passenger.booking_id,
                                    check_in_id: passenger.check_in_id,
                                    notes: passenger.notes,
                                })),
                        ),
                        checkIns: toArray(
                            qb
                                .from({ checkIn: cols.check_ins })
                                .where(({ checkIn }) => eq(checkIn.voyage_id, voyage.id))
                                .select(({ checkIn }) => ({
                                    id: checkIn.id,
                                    booking_id: checkIn.booking_id,
                                    voyage_id: checkIn.voyage_id,
                                    notes: checkIn.notes,
                                })),
                        ),
                        voyageBoatPivotIds: toArray(
                            qb
                                .from({ voyageBoat: cols.voyage_boat })
                                .where(({ voyageBoat }) => eq(voyageBoat.voyage_id, voyage.id))
                                .select(({ voyageBoat }) => ({
                                    id: voyageBoat.id,
                                    boat_id: voyageBoat.boat_id,
                                })),
                        ),
                        voyageGuidePivotIds: toArray(
                            qb
                                .from({ voyageGuide: cols.voyage_guide })
                                .where(({ voyageGuide }) => eq(voyageGuide.voyage_id, voyage.id))
                                .select(({ voyageGuide }) => ({
                                    id: voyageGuide.id,
                                    guide_id: voyageGuide.guide_id,
                                })),
                        ),
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

function asArray<T>(value: T[] | { toArray?: T[] | (() => T[]) } | null | undefined): T[] {
    if (value == null) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    const nested = value.toArray;
    if (typeof nested === 'function') {
        return nested.call(value);
    }
    if (Array.isArray(nested)) {
        return nested;
    }
    return [];
}

function normalizeBookingTicketRow(raw: unknown): BookingTicketOutput {
    const row = raw as Record<string, unknown>;
    const ticket =
        row.ticket != null && typeof row.ticket === 'object'
            ? (row.ticket as Record<string, unknown>)
            : row;

    return {
        id: String(ticket.id ?? row.id ?? ''),
        booking_id:
            ticket.booking_id != null
                ? String(ticket.booking_id)
                : row.booking_id != null
                  ? String(row.booking_id)
                  : null,
        ticket_type_id:
            ticket.ticket_type_id != null
                ? String(ticket.ticket_type_id)
                : row.ticket_type_id != null
                  ? String(row.ticket_type_id)
                  : null,
        name:
            ticket.name != null
                ? String(ticket.name)
                : row.name != null
                  ? String(row.name)
                  : null,
        email:
            ticket.email != null
                ? String(ticket.email)
                : row.email != null
                  ? String(row.email)
                  : null,
        country:
            ticket.country != null
                ? String(ticket.country)
                : row.country != null
                  ? String(row.country)
                  : null,
        custom_fields:
            ticket.custom_fields != null
                ? String(ticket.custom_fields)
                : row.custom_fields != null
                  ? String(row.custom_fields)
                  : null,
        waiver_confirmation_id:
            ticket.waiver_confirmation_id != null
                ? String(ticket.waiver_confirmation_id)
                : row.waiver_confirmation_id != null
                  ? String(row.waiver_confirmation_id)
                  : null,
    };
}

function bookingTicketDisplayName(ticket: BookingTicketOutput): string {
    const name = String(ticket.name ?? '').trim();
    if (name.length > 0) {
        return name;
    }
    const email = String(ticket.email ?? '').trim();
    if (email.length > 0) {
        return email;
    }
    return '—';
}

function extractVoyageInclude(voyage: ControlPanelTripCardQueryRow['voyage']): VoyageIncludeRow | null {
    return firstRowOrValue(
        voyage as unknown as
            | VoyageIncludeRow
            | VoyageIncludeRow[]
            | { toArray: VoyageIncludeRow[] }
            | null
            | undefined,
    );
}

function stripVoyageInclude(voyageInclude: VoyageIncludeRow): VoyageOutput {
    const {
        passengers: _passengers,
        checkIns: _checkIns,
        voyageBoatPivotIds: _voyageBoatPivotIds,
        voyageGuidePivotIds: _voyageGuidePivotIds,
        ...voyage
    } = voyageInclude;
    return voyage;
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
    checkedInBookingIds: string[];
    pendingBookingGroups: ControlPanelPendingBookingGroup[];
    voyageBoatPivotIds: string[];
    voyageGuidePivotIds: string[];
    initialBoatIds: string[];
    initialGuideIds: string[];
} {
    const tickets = asArray(row.bookingTickets).map(normalizeBookingTicketRow);
    const names: string[] = [];
    for (const bt of tickets) {
        const label = bookingTicketDisplayName(bt);
        if (label !== '—') {
            names.push(label);
        }
    }

    const voyageInclude = extractVoyageInclude(row.voyage);
    const voyage: VoyageOutput | null = voyageInclude
        ? stripVoyageInclude(voyageInclude)
        : null;
    const passengers = asArray(voyageInclude?.passengers);
    const checkIns = asArray(voyageInclude?.checkIns);
    const voyageBoatPivots = asArray(voyageInclude?.voyageBoatPivotIds);
    const voyageGuidePivots = asArray(voyageInclude?.voyageGuidePivotIds);

    const bookingTickets = tickets.map((bt) => ({
        id: String(bt.id),
        name: bookingTicketDisplayName(bt),
        booking_id: String(bt.booking_id ?? ''),
    }));

    const checkedInBookingIds = checkIns
        .map((checkIn) => String(checkIn.booking_id ?? '').trim())
        .filter((id) => id.length > 0);

    const pendingBookingGroups = derivePendingBookingGroups(
        bookingTickets,
        checkedInBookingIds,
    );

    return {
        trip: row,
        voyage,
        passengers,
        bookedTicketNames: names,
        bookedCount: tickets.length,
        bookingTickets,
        checkedInBookingIds,
        pendingBookingGroups,
        voyageBoatPivotIds: voyageBoatPivots.map((p) => String(p.id)),
        voyageGuidePivotIds: voyageGuidePivots.map((p) => String(p.id)),
        initialBoatIds: voyageBoatPivots
            .map((p) => String(p.boat_id ?? '').trim())
            .filter((id) => id.length > 0),
        initialGuideIds: voyageGuidePivots
            .map((p) => String(p.guide_id ?? '').trim())
            .filter((id) => id.length > 0),
    };
}

function isLiveQueryCollectionPresent(
    col: ControlPanelQueryCollections[keyof ControlPanelQueryCollections] | null | undefined,
): boolean {
    return col != null;
}

export type TripDepartureAtRow = {
    scheduled_departure_at: string | null;
};

/**
 * All trip departure timestamps for a program (for calendar day markers).
 */
export function buildProgramTripDepartureRowsQuery(
    qb: InitialQueryBuilder,
    tripsCollection: ControlPanelQueryCollections['trips'],
    programId: string,
) {
    const pid = programId.trim();
    if (pid.length === 0) {
        return undefined;
    }

    return qb
        .from({ trip: tripsCollection })
        .where(({ trip }) => eq(trip.program_id, pid))
        .select(({ trip }) => ({
            scheduled_departure_at: trip.scheduled_departure_at,
        }));
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
        isLiveQueryCollectionPresent(cols.trips) &&
        isLiveQueryCollectionPresent(cols.products) &&
        isLiveQueryCollectionPresent(cols.boat_types) &&
        isLiveQueryCollectionPresent(cols.water_routes) &&
        isLiveQueryCollectionPresent(cols.voyages) &&
        isLiveQueryCollectionPresent(cols.passengers) &&
        isLiveQueryCollectionPresent(cols.bookings) &&
        isLiveQueryCollectionPresent(cols.booking_tickets) &&
        isLiveQueryCollectionPresent(cols.voyage_boat) &&
        isLiveQueryCollectionPresent(cols.voyage_guide) &&
        isLiveQueryCollectionPresent(cols.check_ins)
    );
}

function __controlPanelTripCardsQueryForTypes(
    qb: InitialQueryBuilder,
    cols: ControlPanelQueryCollections,
) {
    return buildControlPanelTripCardsQuery(qb, cols, '');
}

export type ControlPanelTripCardQueryRow = QueryResult<
    ReturnType<typeof __controlPanelTripCardsQueryForTypes>
>;
