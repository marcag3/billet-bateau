import { toBrowserLocalDateYmd } from './public-booking-filters';

export type ControlPanelDayStats = {
    total: number;
    booked: number;
    returned: number;
};

export type ControlPanelStatsVoyage = {
    id: string;
    trip_id: string | null;
    arrived_at: Date | string | null;
};

export type ControlPanelTripDisplayStatus =
    | 'scheduled'
    | 'on_water'
    | 'returned'
    | 'cancelled';

export function resolveControlPanelTripDisplayStatus(
    voyage: { status: string } | null,
): ControlPanelTripDisplayStatus {
    if (voyage == null) {
        return 'scheduled';
    }

    const status = String(voyage.status ?? '').trim();

    if (status === 'underway') {
        return 'on_water';
    }
    if (status === 'completed') {
        return 'returned';
    }
    if (status === 'cancelled') {
        return 'cancelled';
    }

    return 'scheduled';
}

export function todayLocalDateYmd(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Normalize Quasar QDate output (`YYYY/MM/DD` or `YYYY-MM-DD`) to `YYYY-MM-DD`. */
export function normalizeCalendarYmd(raw: unknown): string | null {
    const value = Array.isArray(raw) ? raw[0] : raw;
    const s = String(value ?? '').trim();
    if (s.length === 0) {
        return null;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return s;
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) {
        return s.replaceAll('/', '-');
    }
    return null;
}

/** Parse route/query date; falls back to today when missing or invalid. */
export function parseRouteDateYmdOrToday(raw: unknown): string {
    return normalizeCalendarYmd(raw) ?? todayLocalDateYmd();
}

export function addDaysToYmd(ymd: string, deltaDays: number): string {
    const [y, m, d] = ymd.split('-').map((x) => Number(x));
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDays);
    const ny = dt.getFullYear();
    const nm = String(dt.getMonth() + 1).padStart(2, '0');
    const nd = String(dt.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
}

export type TripDepartureAtRow = {
    scheduled_departure_at: string | null;
};

/** Local calendar dates (`YYYY-MM-DD`) with at least one scheduled trip departure. */
export function reduceTripDepartureDateYmds(
    rows: TripDepartureAtRow[] | undefined,
): string[] {
    const set = new Set<string>();
    for (const row of rows ?? []) {
        const raw = row.scheduled_departure_at;
        if (raw == null || String(raw).trim() === '') {
            continue;
        }
        const ymd = toBrowserLocalDateYmd(String(raw));
        if (ymd != null) {
            set.add(ymd);
        }
    }
    return [...set].sort();
}

export function voyageArrivedOnDateYmd(
    voyage: ControlPanelStatsVoyage,
    dateYmd: string,
): boolean {
    if (voyage.arrived_at == null) {
        return false;
    }
    const iso =
        voyage.arrived_at instanceof Date
            ? voyage.arrived_at.toISOString()
            : String(voyage.arrived_at);
    return toBrowserLocalDateYmd(iso) === dateYmd;
}

type ControlPanelDayStatsCardInput = {
    bookedCount: number;
    passengers: readonly unknown[];
    voyage: ControlPanelStatsVoyage | null;
};

/** Derive toolbar stats from day-filtered trip cards (keeps stats in sync with the strip). */
export function computeControlPanelDayStatsFromCards(
    cards: readonly ControlPanelDayStatsCardInput[],
    dateYmd: string,
): ControlPanelDayStats {
    let booked = 0;
    let manifestCount = 0;
    let returned = 0;
    for (const card of cards) {
        booked += card.bookedCount;
        manifestCount += card.passengers.length;
        if (card.voyage != null && voyageArrivedOnDateYmd(card.voyage, dateYmd)) {
            returned += card.passengers.length;
        }
    }
    return {
        booked,
        returned,
        total: manifestCount > 0 ? manifestCount : booked,
    };
}
