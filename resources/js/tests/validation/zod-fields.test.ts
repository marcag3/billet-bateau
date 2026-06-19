import { describe, expect, it } from 'vitest';
import { powerSyncNullableIsoDate } from '../../validation/zod-fields';
import { voyagesSchema } from '../../powersync/voyages.collection';

describe('powerSyncNullableIsoDate', () => {
    const field = powerSyncNullableIsoDate();

    it('parses ISO strings and empty strings as null', () => {
        const iso = '2026-05-31T14:30:00.000Z';
        const fromIso = field.parse(iso);
        expect(fromIso).toBeInstanceOf(Date);
        expect(fromIso?.toISOString()).toBe(iso);

        expect(field.parse('')).toBeNull();
        expect(field.parse(null)).toBeNull();
    });

    it('accepts Date instances (post-sync in-memory rows)', () => {
        const date = new Date('2026-05-31T14:30:00.000Z');
        expect(field.parse(date)).toBe(date);
    });
});

describe('voyagesSchema update merge', () => {
    it('validates status-only patch when started_at is a Date', () => {
        const startedAt = new Date('2026-05-31T12:00:00.000Z');
        const merged = {
            id: '01HXYZ',
            program_id: 'prog-1',
            user_id: null,
            trip_id: 'trip-1',
            water_route_id: 'route-1',
            scheduled_departure_at: null,
            started_at: startedAt,
            arrived_at: null,
            status: 'completed',
        };

        const result = voyagesSchema.safeParse(merged);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.started_at?.toISOString()).toBe(startedAt.toISOString());
            expect(result.data.status).toBe('completed');
        }
    });
});
