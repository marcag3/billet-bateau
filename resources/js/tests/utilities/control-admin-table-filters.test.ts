import { describe, expect, it } from 'vitest';
import {
    filterRowsByCheckIn,
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
        expect(filterRowsByVoyageStatus(rows, null)).toEqual(rows);
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

    it('filterRowsByCheckIn returns all rows when no states selected', () => {
        const rows = [
            { isCheckedIn: true },
            { isCheckedIn: false },
        ];

        expect(filterRowsByCheckIn(rows, [])).toEqual(rows);
        expect(filterRowsByCheckIn(rows, null)).toEqual(rows);
    });

    it('filterRowsByCheckIn keeps only matching check-in states', () => {
        const rows = [
            { id: '1', isCheckedIn: true },
            { id: '2', isCheckedIn: false },
            { id: '3', isCheckedIn: true },
        ];

        expect(filterRowsByCheckIn(rows, ['not_checked_in'])).toEqual([rows[1]]);
        expect(filterRowsByCheckIn(rows, ['checked_in', 'not_checked_in'])).toEqual(rows);
    });
});
