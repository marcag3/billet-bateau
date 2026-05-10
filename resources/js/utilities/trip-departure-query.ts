import type { LocationQueryValue } from "vue-router";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HM_RE = /^\d{2}:\d{2}$/;

/**
 * True when `s` is a valid calendar date in `YYYY-MM-DD` (local components).
 */
export function isValidCalendarDateYmd(s: string): boolean {
    const v = s.trim();
    if (!YMD_RE.test(v)) {
        return false;
    }
    const [y, m, d] = v.split("-").map((x) => Number(x));
    const dt = new Date(y, m - 1, d);
    return (
        dt.getFullYear() === y &&
        dt.getMonth() === m - 1 &&
        dt.getDate() === d
    );
}

/**
 * True when `s` is a valid 24h clock time `HH:mm`.
 */
export function isValidTimeHm(s: string): boolean {
    const v = s.trim();
    if (!HM_RE.test(v)) {
        return false;
    }
    const [h, mm] = v.split(":").map((x) => Number(x));
    return h >= 0 && h <= 23 && mm >= 0 && mm <= 59;
}

function pickQueryString(
    raw: LocationQueryValue | LocationQueryValue[] | undefined,
): string {
    if (raw == null) {
        return "";
    }
    if (Array.isArray(raw)) {
        return String(raw[0] ?? "").trim();
    }
    return String(raw).trim();
}

export interface TripCreateDepartureQuery {
    scheduledDepartureDate: string;
    scheduledDepartureTime: string;
}

/**
 * Reads `departureDate` / `departureTime` from the route query for trip create prefill.
 * Malformed values are ignored (treated as empty).
 */
export function parseTripCreateDepartureQuery(
    query: Record<string, LocationQueryValue | LocationQueryValue[] | undefined>,
): TripCreateDepartureQuery | null {
    const dateRaw = pickQueryString(query.departureDate);
    const timeRaw = pickQueryString(query.departureTime);

    const scheduledDepartureDate =
        dateRaw.length > 0 && isValidCalendarDateYmd(dateRaw) ? dateRaw : "";
    const scheduledDepartureTime =
        timeRaw.length > 0 && isValidTimeHm(timeRaw) ? timeRaw : "";

    if (scheduledDepartureDate === "" && scheduledDepartureTime === "") {
        return null;
    }

    return { scheduledDepartureDate, scheduledDepartureTime };
}
