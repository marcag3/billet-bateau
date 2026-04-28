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
