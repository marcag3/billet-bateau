import { describe, expect, it } from 'vitest';
import {
    buildDailyAvailabilityMap,
    filterPublicBookingTrips,
    isPublicBookingDayHashSelectable,
    qDateDayHashToIsoYmd,
    type PublicBookingDailyAvailability,
    type PublicBookingTripFilterInput,
} from '../../utilities/public-booking-filters';

function makeTrip(
    overrides: Partial<PublicBookingTripFilterInput> = {},
): PublicBookingTripFilterInput {
    return {
        id: 'trip-1',
        scheduled_departure_at: '2026-06-01T13:00:00Z',
        capacity: 10,
        remaining_capacity: 10,
        boat_type_id: null,
        water_route_id: null,
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

    it('buildDailyAvailabilityMap aggregates seats and reserved per local day', () => {
        const availability = buildDailyAvailabilityMap([
            makeTrip({ id: 'a', capacity: 10, remaining_capacity: 4 }),
            makeTrip({ id: 'b', capacity: 20, remaining_capacity: 10 }),
        ]);

        const days = Object.keys(availability);
        expect(days).toHaveLength(1);

        const aggregate = availability[days[0]];
        expect(aggregate.totalCapacity).toBe(30);
        expect(aggregate.totalReserved).toBe(16);
        expect(aggregate.remainingRatio).toBeCloseTo(14 / 30, 5);
        expect(aggregate.dotColor).toBe('green');
    });

    it('buildDailyAvailabilityMap returns red when no seats remain', () => {
        const availability = buildDailyAvailabilityMap([
            makeTrip({
                capacity: 12,
                remaining_capacity: 0,
            }),
        ]);

        const day = availability[Object.keys(availability)[0]];
        expect(day.dotColor).toBe('red');
        expect(day.remainingRatio).toBe(0);
    });

    it('buildDailyAvailabilityMap returns yellow below 40 percent remaining', () => {
        const availability = buildDailyAvailabilityMap([
            makeTrip({
                capacity: 10,
                remaining_capacity: 3,
            }),
        ]);

        const day = availability[Object.keys(availability)[0]];
        expect(day.dotColor).toBe('yellow');
        expect(day.remainingRatio).toBeCloseTo(0.3, 5);
    });

    it('filterPublicBookingTrips applies combined boat route and date filters', () => {
        const trips: PublicBookingTripFilterInput[] = [
            makeTrip({
                id: 'one',
                boat_type_id: 'boat-a',
                water_route_id: 'route-a',
                scheduled_departure_at: '2026-06-05T12:00:00Z',
            }),
            makeTrip({
                id: 'two',
                boat_type_id: 'boat-a',
                water_route_id: 'route-b',
                scheduled_departure_at: '2026-06-05T14:00:00Z',
            }),
            makeTrip({
                id: 'three',
                boat_type_id: 'boat-b',
                water_route_id: 'route-a',
                scheduled_departure_at: '2026-06-06T12:00:00Z',
            }),
        ];

        const filtered = filterPublicBookingTrips(trips, {
            boatTypeId: 'boat-a',
            waterRouteId: 'route-a',
            dateYmd: '2026-06-05',
        });

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('one');
    });
});
