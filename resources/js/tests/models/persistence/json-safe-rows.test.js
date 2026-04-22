import { describe, expect, it, vi } from 'vitest';
import { stripBigIntsDeep, wrapCollectionSyncWritesForJsonSafeRows } from '../../../models/persistence/json-safe-rows.js';

describe('stripBigIntsDeep', () => {
    it('converts small bigint to number', () => {
        expect(stripBigIntsDeep(42n)).toBe(42);
    });

    it('converts bigint outside safe integer range to string', () => {
        expect(stripBigIntsDeep(9007199254740993n)).toBe('9007199254740993');
    });

    it('walks plain objects and arrays', () => {
        expect(
            stripBigIntsDeep({
                a: 1n,
                b: [{ c: 2n }],
            }),
        ).toEqual({ a: 1, b: [{ c: 2 }] });
    });

    it('preserves Date', () => {
        const d = new Date('2020-01-01T00:00:00.000Z');
        expect(stripBigIntsDeep({ d })).toEqual({ d });
    });
});

describe('wrapCollectionSyncWritesForJsonSafeRows', () => {
    it('passes through options without sync.sync', () => {
        const opts = { id: 'x' };
        expect(wrapCollectionSyncWritesForJsonSafeRows(opts)).toBe(opts);
    });

    it('wraps write to strip bigint from value', () => {
        const writes = [];
        const inner = vi.fn((params) => {
            params.write({ type: 'insert', value: { id: '1', n: 9n } });
        });

        const wrapped = wrapCollectionSyncWritesForJsonSafeRows({
            sync: { sync: inner, mode: 'eager' },
        });

        wrapped.sync.sync({
            write: (msg) => writes.push(msg),
        });

        expect(writes).toEqual([{ type: 'insert', value: { id: '1', n: 9 } }]);
        expect(inner).toHaveBeenCalled();
    });

    it('strips bigint from previousValue and stringifies bigint key', () => {
        const writes = [];
        const inner = vi.fn((params) => {
            params.write({
                type: 'update',
                key: 99n,
                value: { id: '1', title: 'x' },
                previousValue: { id: '1', user_id: 7n },
            });
        });

        const wrapped = wrapCollectionSyncWritesForJsonSafeRows({
            sync: { sync: inner, mode: 'eager' },
        });

        wrapped.sync.sync({
            write: (msg) => writes.push(msg),
        });

        expect(writes).toEqual([
            {
                type: 'update',
                key: '99',
                value: { id: '1', title: 'x' },
                previousValue: { id: '1', user_id: 7 },
            },
        ]);
    });
});
