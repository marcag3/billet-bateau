import { describe, expect, it, vi } from 'vitest';
import {
    areControlPanelQueryCollectionsReady,
    buildControlPanelDayStatsQuery,
    buildControlPanelTripCardsQuery,
    buildTripsForProgramDayQuery,
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
        expect(areControlPanelQueryCollectionsReady(allCollections, 'prog-1')).toBe(true);
        expect(areControlPanelQueryCollectionsReady(allCollections, '   ')).toBe(false);
        expect(
            areControlPanelQueryCollectionsReady(
                { ...allCollections, trips: undefined },
                'prog-1',
            ),
        ).toBe(false);
        expect(
            areControlPanelQueryCollectionsReady(
                { ...allCollections, voyages: { table: 'voyages', isReady: () => false } },
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

    it('buildControlPanelTripCardsQuery orders day trips and selects includes', () => {
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
    });
});
