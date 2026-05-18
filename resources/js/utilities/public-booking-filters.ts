export type PublicBookingTripFilterInput = {
    id: string;
    scheduled_departure_at: string;
    capacity: number;
    remaining_capacity: number;
    product_id: string;
};

export type PublicBookingAvailabilityDotColor = 'red' | 'yellow' | 'green';

export type PublicBookingDailyAvailability = {
    dateYmd: string;
    totalCapacity: number;
    totalReserved: number;
    remainingRatio: number;
    dotColor: PublicBookingAvailabilityDotColor;
};

export type PublicBookingTripFilterState = {
    productId: string;
    dateYmd: string;
};

/**
 * Convert a Quasar QDate day hash (`YYYY/MM/DD`) to ISO-like `YYYY-MM-DD`.
 */
export function qDateDayHashToIsoYmd(dayHash: string): string {
    return dayHash.replaceAll('/', '-');
}

export function isPublicBookingDayHashSelectable(
    dayHash: string,
    dailyAvailabilityByDate: Record<string, PublicBookingDailyAvailability>,
): boolean {
    const ymd = qDateDayHashToIsoYmd(dayHash);

    return dailyAvailabilityByDate[ymd] !== undefined;
}

export function toBrowserLocalDateYmd(isoDatetime: string): string | null {
    const departure = new Date(isoDatetime);
    if (Number.isNaN(departure.getTime())) {
        return null;
    }

    const year = departure.getFullYear();
    const month = String(departure.getMonth() + 1).padStart(2, '0');
    const day = String(departure.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function buildDailyAvailabilityMap(
    trips: PublicBookingTripFilterInput[],
): Record<string, PublicBookingDailyAvailability> {
    const aggregateByDate: Record<string, { totalCapacity: number; totalReserved: number }> = {};

    for (const trip of trips) {
        const day = toBrowserLocalDateYmd(trip.scheduled_departure_at);
        if (day === null) {
            continue;
        }

        const capacity = Math.max(0, Number(trip.capacity) || 0);
        const remaining = Math.max(0, Number(trip.remaining_capacity) || 0);
        const reserved = Math.min(capacity, Math.max(0, capacity - remaining));

        if (!(day in aggregateByDate)) {
            aggregateByDate[day] = {
                totalCapacity: 0,
                totalReserved: 0,
            };
        }

        aggregateByDate[day].totalCapacity += capacity;
        aggregateByDate[day].totalReserved += reserved;
    }

    const mapped: Record<string, PublicBookingDailyAvailability> = {};
    for (const [dateYmd, aggregate] of Object.entries(aggregateByDate)) {
        const totalCapacity = aggregate.totalCapacity;
        const totalReserved = Math.min(totalCapacity, aggregate.totalReserved);
        const totalRemaining = Math.max(0, totalCapacity - totalReserved);
        const remainingRatio = totalCapacity > 0 ? totalRemaining / totalCapacity : 0;

        let dotColor: PublicBookingAvailabilityDotColor = 'green';
        if (totalRemaining <= 0) {
            dotColor = 'red';
        } else if (remainingRatio < 0.4) {
            dotColor = 'yellow';
        }

        mapped[dateYmd] = {
            dateYmd,
            totalCapacity,
            totalReserved,
            remainingRatio,
            dotColor,
        };
    }

    return mapped;
}

export function filterPublicBookingTrips(
    trips: PublicBookingTripFilterInput[],
    filterState: PublicBookingTripFilterState,
): PublicBookingTripFilterInput[] {
    const selectedProductId = filterState.productId.trim();
    const selectedDateYmd = filterState.dateYmd.trim();

    return trips.filter((trip) => {
        if (selectedProductId.length > 0 && String(trip.product_id ?? '') !== selectedProductId) {
            return false;
        }
        if (selectedDateYmd.length > 0) {
            const tripDateYmd = toBrowserLocalDateYmd(trip.scheduled_departure_at);
            if (tripDateYmd !== selectedDateYmd) {
                return false;
            }
        }

        return true;
    });
}
