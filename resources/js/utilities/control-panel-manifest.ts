import type { ControlPanelTripCardModel } from '../composables/useControlPanelDayBoard';
import type { VoyageOutput } from '../powersync/voyages.collection';

/** Manifest edits allowed only before the trip has departed (not underway / terminal). */
export function isControlPanelManifestModifiable(
    voyage: Pick<VoyageOutput, 'status'> | null,
): boolean {
    const status = String(voyage?.status ?? '').trim();
    return (
        status !== 'underway' && status !== 'completed' && status !== 'cancelled'
    );
}

export type ControlPanelBookingTicketRow = {
    id: string;
    name: string;
    booking_id: string;
};

export type ControlPanelPendingBookingGroup = {
    bookingId: string;
    tickets: ControlPanelBookingTicketRow[];
    displayName: string;
    ticketCount: number;
};

export type ManifestPassengerSlot = {
    kind: 'passenger';
    key: string;
    name: string;
    passengerId: string;
    bookingId: string | null;
};

export type ManifestPendingBookingSlot = {
    kind: 'pendingBooking';
    key: string;
    bookingId: string;
    name: string;
    displayName: string;
    ticketCount: number;
    canCheckIn: boolean;
};

export type ManifestBookedSlot = {
    kind: 'booked';
    key: string;
    name: string;
    ticketId: string;
    bookingId: string;
    canCheckIn: boolean;
};

export type ManifestEmptySlot = {
    kind: 'empty';
    key: string;
};

export type ManifestOccupiedSlot =
    | ManifestPassengerSlot
    | ManifestPendingBookingSlot
    | ManifestBookedSlot;

export type ManifestSlot = ManifestOccupiedSlot | ManifestEmptySlot;

function slotDisplayName(raw: unknown): string {
    const trimmed = String(raw ?? '').trim();
    return trimmed.length > 0 ? trimmed : '—';
}

export function groupTicketsByBookingId(
    tickets: ControlPanelBookingTicketRow[],
): ControlPanelPendingBookingGroup[] {
    const byBooking = new Map<string, ControlPanelBookingTicketRow[]>();

    for (const ticket of tickets) {
        const bookingId = String(ticket.booking_id ?? '').trim();
        if (bookingId.length === 0) {
            continue;
        }
        const list = byBooking.get(bookingId) ?? [];
        list.push(ticket);
        byBooking.set(bookingId, list);
    }

    const groups: ControlPanelPendingBookingGroup[] = [];

    for (const [bookingId, bookingTickets] of byBooking) {
        const firstName = bookingTickets
            .map((ticket) => slotDisplayName(ticket.name))
            .find((name) => name !== '—');
        const baseName = firstName ?? '—';
        const ticketCount = bookingTickets.length;
        const displayName =
            ticketCount > 1 ? `${baseName} (${ticketCount})` : baseName;

        groups.push({
            bookingId,
            tickets: bookingTickets,
            displayName,
            ticketCount,
        });
    }

    return groups;
}

export function derivePendingBookingGroups(
    bookingTickets: ControlPanelBookingTicketRow[],
    checkedInBookingIds: readonly string[],
): ControlPanelPendingBookingGroup[] {
    const checkedIn = new Set(checkedInBookingIds.map((id) => String(id).trim()));
    return groupTicketsByBookingId(bookingTickets).filter(
        (group) => !checkedIn.has(group.bookingId),
    );
}

export function buildManifestSlots(
    card: Pick<
        ControlPanelTripCardModel,
        'voyage' | 'passengers' | 'bookingTickets' | 'checkedInBookingIds' | 'pendingBookingGroups'
    >,
    capacity: number,
    manifestModifiable: boolean,
): ManifestSlot[] {
    const slots: ManifestSlot[] = [];
    const hasVoyage = card.voyage != null;

    if (hasVoyage) {
        for (const passenger of card.passengers) {
            const bookingId = String(passenger.booking_id ?? '').trim();
            slots.push({
                kind: 'passenger',
                key: `passenger-${passenger.id}`,
                name: slotDisplayName(passenger.name),
                passengerId: String(passenger.id),
                bookingId: bookingId.length > 0 ? bookingId : null,
            });
        }

        for (const group of card.pendingBookingGroups) {
            slots.push({
                kind: 'pendingBooking',
                key: `pending-${group.bookingId}`,
                bookingId: group.bookingId,
                name: group.displayName,
                displayName: group.displayName,
                ticketCount: group.ticketCount,
                canCheckIn: manifestModifiable,
            });
        }
    } else {
        for (const group of groupTicketsByBookingId(card.bookingTickets)) {
            const firstTicket = group.tickets[0];
            if (firstTicket == null) {
                continue;
            }
            slots.push({
                kind: 'booked',
                key: `booked-${group.bookingId}`,
                name: group.displayName,
                ticketId: firstTicket.id,
                bookingId: group.bookingId,
                canCheckIn: manifestModifiable,
            });
        }
    }

    const emptyCount = capacity > 0 ? Math.max(0, capacity - slots.length) : 0;
    for (let index = 0; index < emptyCount; index += 1) {
        slots.push({ kind: 'empty', key: `empty-${index}` });
    }

    return slots;
}
