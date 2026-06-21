import { describe, expect, it } from 'vitest';
import {
    formatDepartureLabel,
    isoToProgramDateAndTime,
    programWallClockToIso,
    toTimezoneDateYmd,
} from '../../utilities/program-timezone-datetime';

describe('program-timezone-datetime', () => {
    it('programWallClockToIso converts Montreal wall clock to UTC', () => {
        const iso = programWallClockToIso('2026-06-15', '14:00', 'America/Toronto');

        expect(iso).toBe('2026-06-15T18:00:00.000Z');
    });

    it('isoToProgramDateAndTime splits UTC instant into Montreal parts', () => {
        expect(
            isoToProgramDateAndTime('2026-06-15T18:00:00.000Z', 'America/Toronto'),
        ).toEqual({
            date: '2026-06-15',
            time: '14:00',
        });
    });

    it('toTimezoneDateYmd buckets by program timezone calendar day', () => {
        expect(
            toTimezoneDateYmd('2026-06-15T03:30:00.000Z', 'America/Toronto'),
        ).toBe('2026-06-14');
    });

    it('formatDepartureLabel uses program timezone', () => {
        const label = formatDepartureLabel(
            '2026-06-15T18:00:00.000Z',
            'America/Toronto',
            'en-CA',
        );

        expect(label).toContain('2:00');
    });
});
