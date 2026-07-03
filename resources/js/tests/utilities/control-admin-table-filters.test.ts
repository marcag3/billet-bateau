import { describe, expect, it } from 'vitest';
import {
    filterRowsBySearch,
    filterRowsByVoyageStatus,
} from '../../utilities/control-admin-table-filters';

describe('control-admin-table-filters', () => {
    it('filterRowsBySearch returns all rows when search is empty', () => {
        const rows = [{ name: 'Alice' }, { name: 'Bob' }];
        expect(filterRowsBySearch(rows, '', [(row) => row.name])).toEqual(rows);
        expect(filterRowsBySearch(rows, '   ', [(row) => row.name])).toEqual(rows);
    });

    it('filterRowsBySearch matches case-insensitively across fields', () => {
        const rows = [
            { name: 'Alice', email: 'alice@example.com' },
            { name: 'Bob', email: 'bob@example.com' },
        ];

        expect(
            filterRowsBySearch(rows, 'ALICE', [
                (row) => row.name,
                (row) => row.email,
            ]),
        ).toEqual([rows[0]]);

        expect(
            filterRowsBySearch(rows, 'example', [(row) => row.email]),
        ).toEqual(rows);
    });

    it('filterRowsByVoyageStatus returns all rows when no statuses selected', () => {
        const rows = [
            { status: 'draft' },
            { status: 'ready' },
        ];

        expect(filterRowsByVoyageStatus(rows, [])).toEqual(rows);
    });

    it('filterRowsByVoyageStatus keeps only matching statuses', () => {
        const rows = [
            { id: '1', status: 'draft' },
            { id: '2', status: 'ready' },
            { id: '3', status: 'cancelled' },
        ];

        expect(filterRowsByVoyageStatus(rows, ['ready', 'cancelled'])).toEqual([
            rows[1],
            rows[2],
        ]);
    });
});
