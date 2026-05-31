import { describe, expect, it, vi } from 'vitest';
import {
    areControlPanelQueryCollectionsReady,
    buildControlPanelDayStatsQuery,
    buildControlPanelTripCardsQuery,
    buildProgramTripDepartureRowsQuery,
    buildProgramTripsJoinedSubquery,
    buildTripsForProgramDayQuery,
    mapControlPanelTripCardRow,
    passengerOnReturnedVoyage,
    reduceDayStatsRows,
    tripDepartureMatchesLocalDateYmd,
} from '../../powersync/control-panel-queries';
import { reduceTripDepartureDateYmds } from '../../utilities/control-panel-day-board';

function mockCollection(name: string): { table: string; isReady: () => boolean } {
    return { table: name, isReady: () => true };
}

function mockQueryBuilder() {
    const chain = {
        where: vi.fn(() => chain),
        fn: { where: vi.fn(() => chain) },
        innerJoin: vi.fn(() => chain),
        leftJoin: vi.fn(() => chain),
        join: vi.fn(() => chain),
        select: vi.fn(() => chain),
        orderBy: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        findOne: vi.fn(() => chain),
        from: vi.fn(() => chain),
        unionAll: vi.fn(() => chain),
    };
    return chain;
}

const allCollections = {
    trips: mockCollection('trips'),
    products: mockCollection('products'),
    boat_types: mockCollection('boat_types'),
    water_routes: mockCollection('water_routes'),
    voyages: mockCollection('voyages'),
    passengers: mockCollection('passengers'),
    bookings: mockCollection('bookings'),
    booking_tickets: mockCollection('booking_tickets'),
    voyage_boat: mockCollection('voyage_boat'),
    voyage_guide: mockCollection('voyage_guide'),
};

describe('control-panel-queries', () => {
    it('tripDepartureMatchesLocalDateYmd compares local calendar day', () => {
        expect(
            tripDepartureMatchesLocalDateYmd('2026-06-05T12:00:00.000Z', '2026-06-05'),
        ).toBe(true);
        expect(
            tripDepartureMatchesLocalDateYmd('2026-06-05T12:00:00.000Z', '2026-06-06'),
        ).toBe(false);
        expect(tripDepartureMatchesLocalDateYmd(null, '2026-06-05')).toBe(false);
    });

    it('passengerOnReturnedVoyage matches completed voyage status', () => {
        expect(
            passengerOnReturnedVoyage({
                status: 'completed',
            }),
        ).toBe(true);
        expect(
            passengerOnReturnedVoyage({
                status: 'underway',
            }),
        ).toBe(false);
        expect(
            passengerOnReturnedVoyage({
                status: null,
            }),
        ).toBe(false);
    });

    it('reduceDayStatsRows maps union metric rows', () => {
        expect(
            reduceDayStatsRows([
                { metric: 'booked', value: 4 },
                { metric: 'manifestCount', value: 2 },
                { metric: 'returned', value: 1 },
            ]),
        ).toEqual({
            booked: 4,
            manifestCount: 2,
            returned: 1,
        });
    });

    it('areControlPanelQueryCollectionsReady requires program id and collections', () => {
        expect(areControlPanelQueryCollectionsReady(allCollections as never, 'prog-1')).toBe(true);
        expect(areControlPanelQueryCollectionsReady(allCollections as never, '   ')).toBe(false);
        expect(
            areControlPanelQueryCollectionsReady(
                { ...allCollections, trips: undefined } as never,
                'prog-1',
            ),
        ).toBe(false);
        expect(
            areControlPanelQueryCollectionsReady(
                {
                    ...allCollections,
                    voyages: { table: 'voyages', isReady: () => false },
                } as never,
                'prog-1',
            ),
        ).toBe(true);
    });

    it('buildProgramTripsJoinedSubquery chains join and program filter', () => {
        const qb = mockQueryBuilder();
        buildProgramTripsJoinedSubquery(qb as never, allCollections as never, 'prog-1');
        expect(qb.from).toHaveBeenCalled();
        expect(qb.where).toHaveBeenCalled();
        expect(qb.fn.where).not.toHaveBeenCalled();
    });

    it('buildTripsForProgramDayQuery adds fn.where date filter', () => {
        const qb = mockQueryBuilder();
        buildTripsForProgramDayQuery(
            qb as never,
            allCollections as never,
            'prog-1',
            '2026-06-05',
        );
        expect(qb.fn.where).toHaveBeenCalled();
    });

    it('buildControlPanelDayStatsQuery unions three aggregate branches', () => {
        const qb = mockQueryBuilder();
        buildControlPanelDayStatsQuery(
            qb as never,
            allCollections as never,
            'prog-1',
            '2026-06-05',
        );
        expect(qb.unionAll).toHaveBeenCalledTimes(1);
        expect(qb.unionAll.mock.calls[0]).toHaveLength(3);
    });

    it('buildProgramTripDepartureRowsQuery selects departure timestamps for program', () => {
        const qb = mockQueryBuilder();
        buildProgramTripDepartureRowsQuery(
            qb as never,
            allCollections.trips as never,
            'prog-1',
        );
        expect(qb.from).toHaveBeenCalled();
        expect(qb.where).toHaveBeenCalled();
        expect(qb.select).toHaveBeenCalled();
    });

    it('reduceTripDepartureDateYmds collects unique local calendar days', () => {
        expect(
            reduceTripDepartureDateYmds([
                { scheduled_departure_at: '2026-06-05T12:00:00.000Z' },
                { scheduled_departure_at: '2026-06-05T18:00:00.000Z' },
                { scheduled_departure_at: '2026-06-06T12:00:00.000Z' },
                { scheduled_departure_at: null },
            ]),
        ).toEqual(['2026-06-05', '2026-06-06']);
    });

    it('buildControlPanelTripCardsQuery orders day trips with nested voyage includes', () => {
        const qb = mockQueryBuilder();
        buildControlPanelTripCardsQuery(qb as never, allCollections as never, 'prog-1');
        expect(qb.from).toHaveBeenCalled();
        expect(qb.orderBy).toHaveBeenCalled();
        expect(qb.select).toHaveBeenCalled();

        type TopSelectFn = (ctx: { trip: { id: string } }) => Record<string, unknown>;
        const topSelect = (qb.select.mock.calls.at(-1) as unknown as [TopSelectFn] | undefined)?.[0];
        expect(topSelect).toEqual(expect.any(Function));
        const topProjection = topSelect!({ trip: { id: 'trip-1' } });
        expect(topProjection).toHaveProperty('bookingTickets');
        expect(topProjection).toHaveProperty('voyage');
        expect(topProjection).not.toHaveProperty('passengers');
        expect(topProjection).not.toHaveProperty('voyageBoatPivotIds');
        expect(topProjection).not.toHaveProperty('voyageGuidePivotIds');
        expect(qb.limit).toHaveBeenCalledWith(1);
        expect(qb.findOne).not.toHaveBeenCalled();
    });

    it('mapControlPanelTripCardRow maps nested voyage pivots for depart modal', () => {
        const mapped = mapControlPanelTripCardRow({
            id: 'trip-1',
            program_id: 'prog-1',
            voyage: {
                id: 'v1',
                program_id: 'prog-1',
                user_id: null,
                trip_id: 'trip-1',
                water_route_id: 'wr-1',
                scheduled_departure_at: null,
                started_at: null,
                arrived_at: null,
                status: null,
                passengers: [],
                voyageBoatPivotIds: [
                    { id: 'vb-1', boat_id: 'boat-a' },
                    { id: 'vb-2', boat_id: 'boat-b' },
                ],
                voyageGuidePivotIds: [{ id: 'vg-1', guide_id: 'guide-x' }],
            },
            bookingTickets: [],
        } as never);

        expect(mapped.voyage?.id).toBe('v1');
        expect(mapped.voyageBoatPivotIds).toEqual(['vb-1', 'vb-2']);
        expect(mapped.voyageGuidePivotIds).toEqual(['vg-1']);
        expect(mapped.initialBoatIds).toEqual(['boat-a', 'boat-b']);
        expect(mapped.initialGuideIds).toEqual(['guide-x']);
    });

    it('mapControlPanelTripCardRow maps voyage from one-element array after depart', () => {
        const mapped = mapControlPanelTripCardRow({
            id: '01kswq5ryy30ymzwwrmt7hzwfj',
            program_id: 'prog-1',
            voyage: [
                {
                    id: 'v1',
                    program_id: 'prog-1',
                    user_id: null,
                    trip_id: '01kswq5ryy30ymzwwrmt7hzwfj',
                    water_route_id: 'wr-1',
                    scheduled_departure_at: null,
                    started_at: null,
                    arrived_at: null,
                    status: 'underway',
                    passengers: [
                        {
                            id: 'p-1',
                            voyage_id: 'v1',
                            name: 'Ada',
                            booking_id: 'b-1',
                            check_in_id: null,
                            notes: null,
                        },
                    ],
                    voyageBoatPivotIds: [],
                    voyageGuidePivotIds: [],
                },
            ],
            bookingTickets: [],
        } as never);

        expect(mapped.voyage?.status).toBe('underway');
        expect(mapped.passengers).toHaveLength(1);
        expect(mapped.passengers[0]?.name).toBe('Ada');
    });

    it('mapControlPanelTripCardRow handles null voyage', () => {
        const mapped = mapControlPanelTripCardRow({
            id: 'trip-1',
            program_id: 'prog-1',
            voyage: null,
            bookingTickets: [],
        } as never);

        expect(mapped.voyage).toBeNull();
        expect(mapped.passengers).toEqual([]);
        expect(mapped.voyageBoatPivotIds).toEqual([]);
        expect(mapped.voyageGuidePivotIds).toEqual([]);
        expect(mapped.initialBoatIds).toEqual([]);
        expect(mapped.initialGuideIds).toEqual([]);
    });

    it('mapControlPanelTripCardRow maps included booking tickets with email fallback', () => {
        const mapped = mapControlPanelTripCardRow({
            id: '01kswq5ryy30ymzwwrmt7hzwfj',
            program_id: 'prog-1',
            voyage: null,
            bookingTickets: [
                {
                    id: 'bt-1',
                    booking_id: 'b-1',
                    ticket_type_id: null,
                    name: 'Ada',
                    email: 'ada@example.com',
                    country: null,
                    custom_fields: null,
                    waiver_confirmation_id: null,
                },
                {
                    id: 'bt-2',
                    booking_id: 'b-2',
                    ticket_type_id: null,
                    name: '',
                    email: 'bob@example.com',
                    country: null,
                    custom_fields: null,
                    waiver_confirmation_id: null,
                },
            ],
        } as never);

        expect(mapped.bookedCount).toBe(2);
        expect(mapped.bookingTickets).toEqual([
            { id: 'bt-1', name: 'Ada', booking_id: 'b-1' },
            { id: 'bt-2', name: 'bob@example.com', booking_id: 'b-2' },
        ]);
        expect(mapped.bookedTicketNames).toEqual(['Ada', 'bob@example.com']);
    });
});
