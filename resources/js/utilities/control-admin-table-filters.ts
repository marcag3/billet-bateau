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
    selectedStatuses: string[],
): T[] {
    if (selectedStatuses.length === 0) {
        return rows;
    }

    const allowed = new Set(selectedStatuses.map((status) => status.trim()).filter(Boolean));

    return rows.filter((row) => allowed.has(String(row.status ?? '').trim()));
}
