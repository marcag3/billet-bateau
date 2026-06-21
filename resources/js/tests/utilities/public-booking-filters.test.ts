import { describe, expect, it } from 'vitest';
import {
    buildDailyAvailabilityMap,
    filterPublicBookingTrips,
    isPublicBookingDayHashSelectable,
    publicBookingTripHasAvailability,
    qDateDayHashToIsoYmd,
    type PublicBookingDailyAvailability,
    type PublicBookingTripFilterInput,
} from '../../utilities/public-booking-filters';

const TZ = 'America/Toronto';

function makeTrip(
    overrides: Partial<PublicBookingTripFilterInput> = {},
): PublicBookingTripFilterInput {
    return {
        id: 'trip-1',
        scheduled_departure_at: '2026-06-01T13:00:00Z',
        capacity: 10,
        remaining_capacity: 10,
        product_id: 'product-1',
        ...overrides,
    };
}

describe('public-booking-filters', () => {
    it('qDateDayHashToIsoYmd converts Quasar day hash to YYYY-MM-DD', () => {
        expect(qDateDayHashToIsoYmd('2026/06/05')).toBe('2026-06-05');
    });

    it('isPublicBookingDayHashSelectable is true only for days present in availability map', () => {
        const availability: Record<string, PublicBookingDailyAvailability> = {
            '2026-06-05': {
                dateYmd: '2026-06-05',
                totalCapacity: 10,
                totalReserved: 0,
                remainingRatio: 1,
                dotColor: 'green',
            },
        };

        expect(isPublicBookingDayHashSelectable('2026/06/05', availability)).toBe(true);
        expect(isPublicBookingDayHashSelectable('2026/06/06', availability)).toBe(false);
    });

    it('isPublicBookingDayHashSelectable respects optional program bounds', () => {
        const availability: Record<string, PublicBookingDailyAvailability> = {
            '2026-06-05': {
                dateYmd: '2026-06-05',
                totalCapacity: 10,
                totalReserved: 0,
                remainingRatio: 1,
                dotColor: 'green',
            },
        };

        expect(
            isPublicBookingDayHashSelectable('2026/06/05', availability, '2026-06-01', '2026-06-30'),
        ).toBe(true);
        expect(
            isPublicBookingDayHashSelectable('2026/06/05', availability, '2026-06-10', '2026-06-30'),
        ).toBe(false);
    });

    it('buildDailyAvailabilityMap aggregates seats and reserved per local day', () => {
        const availability = buildDailyAvailabilityMap(
            [
            makeTrip({ id: 'a', capacity: 10, remaining_capacity: 4 }),
            makeTrip({ id: 'b', capacity: 20, remaining_capacity: 10 }),
            ],
            TZ,
        );

        const days = Object.keys(availability);
        expect(days).toHaveLength(1);

        const aggregate = availability[days[0]];
        expect(aggregate.totalCapacity).toBe(30);
        expect(aggregate.totalReserved).toBe(16);
        expect(aggregate.remainingRatio).toBeCloseTo(14 / 30, 5);
        expect(aggregate.dotColor).toBe('green');
    });

    it('buildDailyAvailabilityMap omits days where every trip is sold out', () => {
        const availability = buildDailyAvailabilityMap(
            [
            makeTrip({
                capacity: 12,
                remaining_capacity: 0,
            }),
            ],
            TZ,
        );

        expect(Object.keys(availability)).toHaveLength(0);
    });

    it('buildDailyAvailabilityMap aggregates only trips that still have seats', () => {
        const availability = buildDailyAvailabilityMap(
            [
            makeTrip({
                id: 'sold',
                capacity: 100,
                remaining_capacity: 0,
            }),
            makeTrip({
                id: 'open',
                capacity: 10,
                remaining_capacity: 3,
            }),
            ],
            TZ,
        );

        const days = Object.keys(availability);
        expect(days).toHaveLength(1);
        const day = availability[days[0]];
        expect(day.totalCapacity).toBe(10);
        expect(day.totalReserved).toBe(7);
        expect(day.dotColor).toBe('yellow');
    });

    it('buildDailyAvailabilityMap returns yellow below 40 percent remaining', () => {
        const availability = buildDailyAvailabilityMap(
            [
            makeTrip({
                capacity: 10,
                remaining_capacity: 3,
            }),
            ],
            TZ,
        );

        const day = availability[Object.keys(availability)[0]];
        expect(day.dotColor).toBe('yellow');
        expect(day.remainingRatio).toBeCloseTo(0.3, 5);
    });

    it('filterPublicBookingTrips applies combined product and date filters', () => {
        const trips: PublicBookingTripFilterInput[] = [
            makeTrip({
                id: 'one',
                product_id: 'product-a',
                scheduled_departure_at: '2026-06-05T12:00:00Z',
            }),
            makeTrip({
                id: 'two',
                product_id: 'product-b',
                scheduled_departure_at: '2026-06-05T14:00:00Z',
            }),
            makeTrip({
                id: 'three',
                product_id: 'product-a',
                scheduled_departure_at: '2026-06-06T12:00:00Z',
            }),
        ];

        const filtered = filterPublicBookingTrips(
            trips,
            {
            productId: 'product-a',
            dateYmd: '2026-06-05',
            },
            TZ,
        );

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('one');
    });

    it('filterPublicBookingTrips excludes sold-out trips', () => {
        const trips: PublicBookingTripFilterInput[] = [
            makeTrip({ id: 'open', remaining_capacity: 1 }),
            makeTrip({ id: 'gone', remaining_capacity: 0 }),
        ];

        const filtered = filterPublicBookingTrips(trips, { productId: '', dateYmd: '' }, TZ);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('open');
    });

    it('publicBookingTripHasAvailability is false when remaining is zero', () => {
        expect(
            publicBookingTripHasAvailability(
                makeTrip({
                    remaining_capacity: 0,
                }),
            ),
        ).toBe(false);
        expect(
            publicBookingTripHasAvailability(
                makeTrip({
                    remaining_capacity: 1,
                }),
            ),
        ).toBe(true);
    });
});
