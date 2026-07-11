import { describe, expect, it } from 'vitest';
import {
    formatTripSelectCapacitySuffix,
    isTripSelectableForBooking,
    tripHasCapacityForBookingMove,
} from '../../utilities/booking-admin-validation';

describe('isTripSelectableForBooking', () => {
    it('allows trips with no voyage (scheduled)', () => {
        expect(isTripSelectableForBooking(null)).toBe(true);
    });

    it('allows scheduled and boarding voyage statuses', () => {
        expect(isTripSelectableForBooking({ status: 'draft' })).toBe(true);
        expect(isTripSelectableForBooking({ status: 'ready' })).toBe(true);
    });

    it('rejects underway, completed, and cancelled voyages', () => {
        expect(isTripSelectableForBooking({ status: 'underway' })).toBe(false);
        expect(isTripSelectableForBooking({ status: 'completed' })).toBe(false);
        expect(isTripSelectableForBooking({ status: 'cancelled' })).toBe(false);
    });
});

describe('tripHasCapacityForBookingMove', () => {
    it('allows when capacity is null', () => {
        expect(
            tripHasCapacityForBookingMove({
                tripCapacity: null,
                activeBookedTicketCount: 10,
                bookingTicketCount: 5,
            }),
        ).toBe(true);
    });

    it('allows when active plus booking tickets fit capacity', () => {
        expect(
            tripHasCapacityForBookingMove({
                tripCapacity: 10,
                activeBookedTicketCount: 7,
                bookingTicketCount: 3,
            }),
        ).toBe(true);
    });

    it('blocks when active plus booking tickets exceed capacity', () => {
        expect(
            tripHasCapacityForBookingMove({
                tripCapacity: 10,
                activeBookedTicketCount: 8,
                bookingTicketCount: 3,
            }),
        ).toBe(false);
    });
});

describe('formatTripSelectCapacitySuffix', () => {
    const t = (key: string, params?: Record<string, string | number>) =>
        `${key}:${String(params?.remaining)}/${String(params?.capacity)}`;

    it('returns empty string when capacity is null', () => {
        expect(formatTripSelectCapacitySuffix(3, null, t)).toBe('');
    });

    it('formats remaining and capacity', () => {
        expect(formatTripSelectCapacitySuffix(3, 12, t)).toBe(
            'programsControlAdmin.tripCapacitySuffix:3/12',
        );
    });
});
