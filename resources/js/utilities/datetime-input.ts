/**
 * Map stored ISO timestamps to `datetime-local` input values (local wall time).
 */
export function isoToLocalDatetimeInputValue(iso: string): string {
    const date = new Date(String(iso).trim());
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Parse a `datetime-local` value to the same string shape as `Date.prototype.toISOString()`
 * (RFC 3339 UTC, milliseconds, `Z`), matching Spatie Laravel Data `config('data.date_format')`.
 */
export function localDatetimeInputValueToIso(local: string): string {
    const date = new Date(String(local).trim());
    if (Number.isNaN(date.getTime())) {
        return String(local).trim();
    }

    return date.toISOString();
}

/**
 * Normalize a time string from `<input type="time">` (HH:MM) to the canonical
 * `HH:MM:SS` format used for storage and backend validation.
 */
export function normalizeTime(val: string): string {
    // Accept HH:MM from time input, ensure HH:MM:SS
    if (val.length === 5 && val[2] === ':') {
        return val + ':00';
    }
    // Already HH:MM:SS
    if (val.length === 8 && val[2] === ':' && val[5] === ':') {
        return val;
    }
    return val;
}
