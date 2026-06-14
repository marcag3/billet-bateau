/**
 * Map stored ISO timestamps to `datetime-local` input values (local wall time).
 */
export function isoToLocalDatetimeInputValue(iso: string): string {
    const date = new Date(String(iso).trim());
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const pad = (n: number) => String(n).padStart(2, "0");
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
 * Split a `datetime-local` style value (`YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`) into date and time parts.
 */
export function splitLocalDatetimeInputToDateAndTime(value: string): {
    date: string;
    time: string;
} {
    const v = String(value).trim();
    if (v === "") {
        return { date: "", time: "" };
    }
    const tIndex = v.indexOf("T");
    if (tIndex === -1) {
        return { date: v, time: "" };
    }
    const date = v.slice(0, tIndex);
    let time = v.slice(tIndex + 1);
    if (time.length >= 8 && time[2] === ":" && time[5] === ":") {
        time = time.slice(0, 5);
    }
    return { date, time };
}

/**
 * Combine local date (`YYYY-MM-DD`) and time (`HH:mm` or `HH:mm:ss`) for `Date` parsing / ISO conversion.
 */
export function composeLocalDatetimeFromParts(
    date: string,
    time: string,
): string {
    const d = String(date).trim();
    let t = String(time).trim();
    if (t.length === 5 && t[2] === ":") {
        t = `${t}:00`;
    }
    return `${d}T${t}`;
}

/**
 * Normalize a time string from `<input type="time">` (HH:MM) to the canonical
 * `HH:MM:SS` format used for storage and backend validation.
 */
export function normalizeTime(val: string): string {
    // Accept HH:MM from time input, ensure HH:MM:SS
    if (val.length === 5 && val[2] === ":") {
        return val + ":00";
    }
    // Already HH:MM:SS
    if (val.length === 8 && val[2] === ":" && val[5] === ":") {
        return val;
    }
    return val;
}
