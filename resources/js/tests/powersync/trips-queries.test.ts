import { describe, expect, it, vi } from 'vitest';
import {
    buildProgramBookedTripIdsQuery,
    reduceBookedTripIds,
} from '../../powersync/trips-queries';

function mockCollection(name: string): { table: string } {
    return { table: name };
}

function mockQueryBuilder() {
    const chain = {
        where: vi.fn(() => chain),
        select: vi.fn(() => chain),
        from: vi.fn(() => chain),
    };
    return chain;
}

describe('trips-queries', () => {
    it('buildProgramBookedTripIdsQuery returns undefined when program id is empty', () => {
        const qb = mockQueryBuilder();
        const result = buildProgramBookedTripIdsQuery(
            qb as never,
            mockCollection('bookings') as never,
            '   ',
        );
        expect(result).toBeUndefined();
        expect(qb.from).not.toHaveBeenCalled();
    });

    it('buildProgramBookedTripIdsQuery chains from, where, and select', () => {
        const qb = mockQueryBuilder();
        const col = mockCollection('bookings');
        const result = buildProgramBookedTripIdsQuery(qb as never, col as never, 'prog-1');
        expect(qb.from).toHaveBeenCalledWith({ b: col });
        expect(qb.where).toHaveBeenCalled();
        expect(qb.select).toHaveBeenCalled();
        expect(result).toBe(qb);
    });

    it('reduceBookedTripIds builds a set of non-empty trip ids', () => {
        expect(
            reduceBookedTripIds([
                { trip_id: 't1' },
                { trip_id: 't1' },
                { trip_id: 't2' },
                { trip_id: null },
                { trip_id: '   ' },
            ]),
        ).toEqual(new Set(['t1', 't2']));
    });

    it('reduceBookedTripIds returns empty set for undefined rows', () => {
        expect(reduceBookedTripIds(undefined)).toEqual(new Set());
    });
});
