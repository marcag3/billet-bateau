import { describe, expect, it } from 'vitest';
import {
    addDaysToYmd,
    computeControlPanelDayStats,
    todayLocalDateYmd,
} from '../../utilities/control-panel-day-board';

describe('control-panel-day-board', () => {
    it('addDaysToYmd shifts calendar days', () => {
        expect(addDaysToYmd('2026-06-01', 1)).toBe('2026-06-02');
        expect(addDaysToYmd('2026-06-01', -1)).toBe('2026-05-31');
    });

    it('computeControlPanelDayStats uses booked when no manifest', () => {
        const stats = computeControlPanelDayStats({
            selectedDateYmd: '2026-06-05',
            tripIdsForDay: ['trip-1'],
            bookings: [{ id: 'b1', trip_id: 'trip-1' }],
            bookingTickets: [{ booking_id: 'b1' }, { booking_id: 'b1' }],
            voyages: [],
            passengers: [],
        });
        expect(stats.booked).toBe(2);
        expect(stats.total).toBe(2);
        expect(stats.returned).toBe(0);
    });

    it('computeControlPanelDayStats counts returned passengers on arrived voyages', () => {
        const stats = computeControlPanelDayStats({
            selectedDateYmd: '2026-06-05',
            tripIdsForDay: ['trip-1'],
            bookings: [],
            bookingTickets: [],
            voyages: [
                {
                    id: 'v1',
                    trip_id: 'trip-1',
                    arrived_at: '2026-06-05T18:00:00.000Z',
                },
            ],
            passengers: [
                { voyage_id: 'v1' },
                { voyage_id: 'v1' },
            ],
        });
        expect(stats.total).toBe(2);
        expect(stats.returned).toBe(2);
    });

    it('todayLocalDateYmd returns YYYY-MM-DD', () => {
        expect(todayLocalDateYmd()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
