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

export type ControlPanelStatsPassenger = {
    voyage_id: string | null;
};

export type ControlPanelStatsBookingTicket = {
    booking_id: string;
};

export type ControlPanelStatsBooking = {
    id: string;
    trip_id: string | null;
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

export function computeControlPanelDayStats(input: {
    selectedDateYmd: string;
    tripIdsForDay: string[];
    bookings: ControlPanelStatsBooking[];
    bookingTickets: ControlPanelStatsBookingTicket[];
    voyages: ControlPanelStatsVoyage[];
    passengers: ControlPanelStatsPassenger[];
}): ControlPanelDayStats {
    const tripIdSet = new Set(input.tripIdsForDay);

    const bookingsForDay = input.bookings.filter(
        (b) => b.trip_id != null && tripIdSet.has(String(b.trip_id)),
    );
    const bookingIdSet = new Set(bookingsForDay.map((b) => String(b.id)));
    const booked = input.bookingTickets.filter((bt) =>
        bookingIdSet.has(String(bt.booking_id)),
    ).length;

    const voyageIdsForDay = new Set(
        input.voyages
            .filter((v) => v.trip_id != null && tripIdSet.has(String(v.trip_id)))
            .map((v) => String(v.id)),
    );

    const manifestCount = input.passengers.filter(
        (p) => p.voyage_id != null && voyageIdsForDay.has(String(p.voyage_id)),
    ).length;

    const returned = input.passengers.filter((p) => {
        if (p.voyage_id == null) {
            return false;
        }
        const voyage = input.voyages.find(
            (v) => String(v.id) === String(p.voyage_id),
        );
        if (voyage == null) {
            return false;
        }
        return voyageArrivedOnDateYmd(voyage, input.selectedDateYmd);
    }).length;

    const total = manifestCount > 0 ? manifestCount : booked;

    return { total, booked, returned };
}
