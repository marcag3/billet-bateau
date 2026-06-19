/**
 * Trips calendar live queries (TanStack DB).
 *
 * Narrow projections for staff trips UI — prefer here over full-table scans in pages.
 *
 * @see https://tanstack.com/db/latest/docs/guides/live-queries
 */

import { eq, type Collection, type InitialQueryBuilder } from '@tanstack/db';
import { queryRef } from './live-query-casts';

/* eslint-disable @typescript-eslint/no-explicit-any -- TanStack Collection generics */

export type BookedTripIdRow = {
    trip_id: string | null;
};

export function buildProgramBookedTripIdsQuery(
    qb: InitialQueryBuilder,
    bookingsCollection: Collection<any, any>,
    programId: string,
) {
    const pid = programId.trim();
    if (pid.length === 0) {
        return undefined;
    }

    return qb
        .from({ b: bookingsCollection })
        .where(({ b }) => eq(queryRef(b).program_id, pid))
        .select(({ b }) => ({ trip_id: queryRef(b).trip_id }));
}

export function reduceBookedTripIds(rows: BookedTripIdRow[] | undefined): Set<string> {
    const set = new Set<string>();
    for (const row of rows ?? []) {
        const tid = row.trip_id;
        if (tid != null && String(tid).trim() !== '') {
            set.add(String(tid));
        }
    }
    return set;
}
