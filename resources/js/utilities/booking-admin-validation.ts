export function tripHasCapacityForBookingMove(input: {
    tripCapacity: number | null;
    activeBookedTicketCount: number;
    bookingTicketCount: number;
}): boolean {
    const capacity = input.tripCapacity;
    if (capacity == null || !Number.isFinite(Number(capacity))) {
        return true;
    }

    const maxSeats = Math.max(0, Math.floor(Number(capacity)));
    const needed = Math.max(0, input.bookingTicketCount);
    const occupied = Math.max(0, input.activeBookedTicketCount);

    return occupied + needed <= maxSeats;
}

export function formatTripSelectCapacitySuffix(
    remaining: number,
    capacity: number | null,
    t: (key: string, params?: Record<string, string | number>) => string,
): string {
    if (capacity == null || !Number.isFinite(Number(capacity))) {
        return '';
    }

    const maxSeats = Math.max(0, Math.floor(Number(capacity)));
    const seatsRemaining = Math.max(0, Math.floor(remaining));

    return t('programsControlAdmin.tripCapacitySuffix', {
        remaining: seatsRemaining,
        capacity: maxSeats,
    });
}
