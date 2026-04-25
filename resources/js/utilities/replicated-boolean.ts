/**
 * Read a boolean flag from replicated row data where Postgres (bool / text) and
 * local SQLite (0/1 integers) may disagree on representation, and offline writes
 * may use integers.
 *
 * @param value Raw cell value from the row
 * @returns Normalized boolean
 */
export function readReplicatedBoolean(value: unknown): boolean {
    if (value === true || value === 1) {
        return true;
    }
    if (value === false || value === 0) {
        return false;
    }
    if (typeof value === 'string') {
        const s = value.trim().toLowerCase();
        if (s === '1' || s === 'true' || s === 't') {
            return true;
        }
        if (s === '0' || s === 'false' || s === 'f' || s.length === 0) {
            return false;
        }
    }
    const n = Number(value);
    if (Number.isFinite(n)) {
        return n === 1;
    }
    return false;
}
