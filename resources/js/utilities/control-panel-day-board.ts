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

export function todayLocalDateYmd(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
