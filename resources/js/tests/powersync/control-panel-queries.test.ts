import { describe, expect, it, vi } from 'vitest';
import {
    areControlPanelQueryCollectionsReady,
    buildControlPanelDayStatsQuery,
    buildControlPanelTripCardsQuery,
    buildTripsForProgramDayQuery,
    mapControlPanelTripCardRow,
    passengerOnReturnedVoyageForDateYmd,
    reduceDayStatsRows,
    tripDepartureMatchesLocalDateYmd,
} from '../../powersync/control-panel-queries';

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

    it('passengerOnReturnedVoyageForDateYmd uses voyage arrival local date', () => {
        expect(
            passengerOnReturnedVoyageForDateYmd(
                {
                    id: 'v1',
                    trip_id: 't1',
                    arrived_at: new Date('2026-06-05T18:00:00.000Z'),
                },
                '2026-06-05',
            ),
        ).toBe(true);
        expect(
            passengerOnReturnedVoyageForDateYmd(
                {
                    id: 'v1',
                    trip_id: 't1',
                    arrived_at: null,
                },
                '2026-06-05',
            ),
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
        ).toBe(false);
    });

    it('buildTripsForProgramDayQuery chains join, where, and fn.where', () => {
        const qb = mockQueryBuilder();
        buildTripsForProgramDayQuery(
            qb as never,
            allCollections as never,
            'prog-1',
            '2026-06-05',
        );
        expect(qb.from).toHaveBeenCalled();
        expect(qb.where).toHaveBeenCalled();
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

    it('buildControlPanelTripCardsQuery orders day trips with nested voyage includes', () => {
        const qb = mockQueryBuilder();
        buildControlPanelTripCardsQuery(
            qb as never,
            allCollections as never,
            'prog-1',
            '2026-06-05',
        );
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
        expect(qb.findOne).toHaveBeenCalled();
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
});
