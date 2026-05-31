import { describe, expect, it } from 'vitest';
import {
    addDaysToYmd,
    computeControlPanelDayStatsFromCards,
    normalizeCalendarYmd,
    parseRouteDateYmdOrToday,
    resolveControlPanelTripDisplayStatus,
    todayLocalDateYmd,
    voyageArrivedOnDateYmd,
} from '../../utilities/control-panel-day-board';

describe('control-panel-day-board', () => {
    it('addDaysToYmd shifts calendar days', () => {
        expect(addDaysToYmd('2026-06-01', 1)).toBe('2026-06-02');
        expect(addDaysToYmd('2026-06-01', -1)).toBe('2026-05-31');
    });

    it('voyageArrivedOnDateYmd matches local arrival day', () => {
        expect(
            voyageArrivedOnDateYmd(
                {
                    id: 'v1',
                    trip_id: 't1',
                    arrived_at: '2026-06-05T18:00:00.000Z',
                },
                '2026-06-05',
            ),
        ).toBe(true);
        expect(
            voyageArrivedOnDateYmd(
                { id: 'v1', trip_id: 't1', arrived_at: null },
                '2026-06-05',
            ),
        ).toBe(false);
    });

    it('todayLocalDateYmd returns YYYY-MM-DD', () => {
        expect(todayLocalDateYmd()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('normalizeCalendarYmd accepts ISO and Quasar day hashes', () => {
        expect(normalizeCalendarYmd('2026-06-28')).toBe('2026-06-28');
        expect(normalizeCalendarYmd('2026/06/28')).toBe('2026-06-28');
        expect(normalizeCalendarYmd('')).toBeNull();
        expect(normalizeCalendarYmd('not-a-date')).toBeNull();
    });

    it('parseRouteDateYmdOrToday falls back to today for invalid values', () => {
        expect(parseRouteDateYmdOrToday('2026/06/28')).toBe('2026-06-28');
        expect(parseRouteDateYmdOrToday(undefined)).toBe(todayLocalDateYmd());
    });

    it('computeControlPanelDayStatsFromCards aggregates booked, manifest, and returned', () => {
        expect(
            computeControlPanelDayStatsFromCards(
                [
                    {
                        bookedCount: 2,
                        passengers: [{}, {}],
                        voyage: {
                            id: 'v1',
                            trip_id: 't1',
                            status: 'completed',
                            arrived_at: '2026-06-05T18:00:00.000Z',
                        },
                    },
                    {
                        bookedCount: 1,
                        passengers: [{}],
                        voyage: {
                            id: 'v2',
                            trip_id: 't2',
                            status: 'underway',
                            arrived_at: null,
                        },
                    },
                ],
                '2026-06-05',
            ),
        ).toEqual({
            booked: 3,
            returned: 2,
            total: 3,
        });
    });

    it('computeControlPanelDayStatsFromCards counts returned from completed status, not arrival date', () => {
        expect(
            computeControlPanelDayStatsFromCards(
                [
                    {
                        bookedCount: 1,
                        passengers: [{}, {}],
                        voyage: {
                            id: 'v1',
                            trip_id: 't1',
                            status: 'completed',
                            arrived_at: '2026-06-06T12:00:00.000Z',
                        },
                    },
                ],
                '2026-06-05',
            ),
        ).toEqual({
            booked: 1,
            returned: 2,
            total: 2,
        });
    });

    it('resolveControlPanelTripDisplayStatus maps voyage lifecycle to display buckets', () => {
        expect(resolveControlPanelTripDisplayStatus(null)).toBe('scheduled');
        expect(resolveControlPanelTripDisplayStatus({ status: 'draft' })).toBe('scheduled');
        expect(resolveControlPanelTripDisplayStatus({ status: 'ready' })).toBe('scheduled');
        expect(resolveControlPanelTripDisplayStatus({ status: 'underway' })).toBe('on_water');
        expect(resolveControlPanelTripDisplayStatus({ status: 'completed' })).toBe('returned');
        expect(resolveControlPanelTripDisplayStatus({ status: 'cancelled' })).toBe('cancelled');
    });
});
