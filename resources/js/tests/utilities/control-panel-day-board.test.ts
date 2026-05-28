import { describe, expect, it } from 'vitest';
import {
    addDaysToYmd,
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
});
