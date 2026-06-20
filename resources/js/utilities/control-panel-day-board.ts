import { toBrowserLocalDateYmd } from './public-booking-filters';

export type ControlPanelDayStats = {
    booked: number;
    /** Passengers on voyages currently underway. */
    onWater: number;
    returned: number;
    /** Sum of booked, on-water, and returned passenger counts. */
    totalPassengers: number;
    /** Sum of product capacity across all trips on the selected day. */
    places: number;
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

/** Shared hex colors for boat outline, status label, and day-toolbar stat chips. */
export const CONTROL_PANEL_STATUS_COLOR = {
    scheduled: '#2563eb',
    on_water: '#16a34a',
    returned: '#616161',
    cancelled: '#616161',
    places: '#9333ea',
    totalPassengers: '#c2410c',
} as const;

export function controlPanelTripDisplayStatusColor(
    displayStatus: ControlPanelTripDisplayStatus,
): string {
    switch (displayStatus) {
        case 'on_water':
            return CONTROL_PANEL_STATUS_COLOR.on_water;
        case 'returned':
            return CONTROL_PANEL_STATUS_COLOR.returned;
        case 'cancelled':
            return CONTROL_PANEL_STATUS_COLOR.cancelled;
        default:
            return CONTROL_PANEL_STATUS_COLOR.scheduled;
    }
}

export type ControlPanelStatChipKind =
    | 'booked'
    | 'onWater'
    | 'returned'
    | 'totalPassengers'
    | 'places';

/** Inline style for outline q-chips (Quasar overrides Tailwind text-* on .q-chip). */
export function controlPanelStatChipStyle(
    kind: ControlPanelStatChipKind,
): { color: string } {
    const color =
        kind === 'booked'
            ? CONTROL_PANEL_STATUS_COLOR.scheduled
            : kind === 'onWater'
              ? CONTROL_PANEL_STATUS_COLOR.on_water
              : kind === 'returned'
                ? CONTROL_PANEL_STATUS_COLOR.returned
                : kind === 'totalPassengers'
                  ? CONTROL_PANEL_STATUS_COLOR.totalPassengers
                  : CONTROL_PANEL_STATUS_COLOR.places;
    return { color };
}

export function hasControlPanelTripDeparted(
    voyage: { status: string } | null,
): boolean {
    if (voyage == null) {
        return false;
    }
    const status = String(voyage.status ?? '').trim();
    return (
        status === 'underway' ||
        status === 'completed' ||
        status === 'cancelled'
    );
}

export function resolveControlPanelDepartedAssignmentLabels(
    boatIds: readonly string[],
    guideIds: readonly string[],
    boatNamesById: Readonly<Record<string, string>>,
    guideNamesById: Readonly<Record<string, string>>,
): { boatLabel: string; guideLabel: string } {
    const namesForIds = (
        ids: readonly string[],
        namesById: Readonly<Record<string, string>>,
    ): string => {
        const labels = ids
            .map((id) => String(namesById[id] ?? '').trim())
            .filter((label) => label.length > 0);
        return labels.length > 0 ? labels.join(', ') : '—';
    };

    return {
        boatLabel: namesForIds(boatIds, boatNamesById),
        guideLabel: namesForIds(guideIds, guideNamesById),
    };
}

export function isControlPanelTripFinished(
    voyage: { status?: string | null } | null,
): boolean {
    const displayStatus = resolveControlPanelTripDisplayStatus(voyage);
    return displayStatus === 'returned' || displayStatus === 'cancelled';
}

export function resolveControlPanelTripDisplayStatus(
    voyage: { status?: string | null } | null,
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
    voyage: (ControlPanelStatsVoyage & { status?: string | null }) | null;
    trip: { capacity: number | null };
};

function tripCapacitySeats(capacity: number | null): number {
    if (capacity == null || !Number.isFinite(Number(capacity))) {
        return 0;
    }
    return Math.max(0, Math.floor(Number(capacity)));
}

/** Derive toolbar stats from day-filtered trip cards (keeps stats in sync with the strip). */
export function computeControlPanelDayStatsFromCards(
    cards: readonly ControlPanelDayStatsCardInput[],
    _dateYmd: string,
): ControlPanelDayStats {
    let booked = 0;
    let onWater = 0;
    let returned = 0;
    let places = 0;
    for (const card of cards) {
        booked += card.bookedCount;
        places += tripCapacitySeats(card.trip.capacity);
        if (card.voyage == null) {
            continue;
        }
        const displayStatus = resolveControlPanelTripDisplayStatus(card.voyage);
        if (displayStatus === 'on_water') {
            onWater += card.passengers.length;
        } else if (displayStatus === 'returned') {
            returned += card.passengers.length;
        }
    }
    return {
        booked,
        onWater,
        returned,
        totalPassengers: booked + onWater + returned,
        places,
    };
}
