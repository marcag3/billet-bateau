export type SearchableRow = Record<string, unknown>;

export function filterRowsBySearch<T extends SearchableRow>(
    rows: T[],
    searchText: string,
    searchableFields: Array<(row: T) => string | null | undefined>,
): T[] {
    const needle = searchText.trim().toLowerCase();
    if (needle.length === 0) {
        return rows;
    }

    return rows.filter((row) =>
        searchableFields.some((field) =>
            String(field(row) ?? '')
                .toLowerCase()
                .includes(needle),
        ),
    );
}

export function filterRowsByVoyageStatus<T extends { status?: string | null }>(
    rows: T[],
    selectedStatuses: string[] | null | undefined,
): T[] {
    if (selectedStatuses == null || selectedStatuses.length === 0) {
        return rows;
    }

    const allowed = new Set(selectedStatuses.map((status) => status.trim()).filter(Boolean));

    return rows.filter((row) => allowed.has(String(row.status ?? '').trim()));
}

export const CHECK_IN_FILTER_VALUES = ['checked_in', 'not_checked_in'] as const;

export type CheckInFilterValue = (typeof CHECK_IN_FILTER_VALUES)[number];

export function filterRowsByCheckIn<T extends { isCheckedIn?: boolean }>(
    rows: T[],
    selectedCheckInStates: string[] | null | undefined,
): T[] {
    if (selectedCheckInStates == null || selectedCheckInStates.length === 0) {
        return rows;
    }

    const allowed = new Set(
        selectedCheckInStates.map((state) => state.trim()).filter(Boolean),
    );

    return rows.filter((row) => {
        const state: CheckInFilterValue = row.isCheckedIn === true ? 'checked_in' : 'not_checked_in';

        return allowed.has(state);
    });
}
