import type { BookingTripOption } from '../models/public-booking/public-booking.types';

export type TripBannerSource = {
    product_banner_url?: string | null;
    boat_type_banner_url?: string | null;
};

export function pickTripBannerUrl(trip: TripBannerSource): string | null {
    const product = trip.product_banner_url?.trim() ?? '';
    if (product.length > 0) {
        return trip.product_banner_url;
    }
    const boat = trip.boat_type_banner_url?.trim() ?? '';
    if (boat.length > 0) {
        return trip.boat_type_banner_url;
    }

    return null;
}

type TranslateDuration = (key: string, params?: Record<string, string | number>) => string;

export function formatWaterRouteDurationLabel(
    minutes: number,
    t: TranslateDuration,
): string {
    const total = Math.max(0, Math.round(minutes));
    if (total < 60) {
        return t('publicBooking.waterRouteDurationMinutes', { minutes: total });
    }
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    if (remainder === 0) {
        return t('publicBooking.waterRouteDurationHoursOnly', { hours });
    }

    return t('publicBooking.waterRouteDurationHoursMinutes', {
        hours,
        minutes: remainder,
    });
}

export function formatWaterRouteLine(
    trip: BookingTripOption,
    formatDuration: (minutes: number) => string,
): string | null {
    const name = String(trip.water_route_name ?? '').trim();
    const duration = trip.water_route_duration_minutes;
    const hasDuration = duration != null && duration > 0;

    if (name.length === 0 && !hasDuration) {
        return null;
    }
    if (name.length > 0 && hasDuration) {
        return `${name} · ${formatDuration(duration)}`;
    }
    if (name.length > 0) {
        return name;
    }

    return formatDuration(duration!);
}
