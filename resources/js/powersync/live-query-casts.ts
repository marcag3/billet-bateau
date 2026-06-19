/**
 * TanStack DB 0.6+ live-query rows include virtual props ($synced, $origin, …).
 * Use at boundaries when passing query results into app/domain types.
 */
export function liveQueryRows<T>(rows: readonly unknown[] | undefined | null): T[] {
    return (rows ?? []) as unknown as T[];
}

export function liveQueryRow<T>(row: unknown): T | undefined {
    if (row == null) {
        return undefined;
    }

    return row as unknown as T;
}

/** Unwrap a TanStack DB ref proxy in query builder callbacks (0.6.9+). */
export function queryRef<T extends Record<string, unknown>>(row: unknown): T {
    return row as T;
}
