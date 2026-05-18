import type { BookingTicketTypeOption, BookingTripOption } from '../models/public-booking/public-booking.types';

export type PublicBookingTicketValidationResult = {
    errors: Record<string, string>;
    totalSelected: number;
    canContinue: boolean;
};

export function normalizePublicBookingTicketQuantity(value: unknown): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return 0;
    }

    return Math.max(0, Math.floor(numeric));
}

export function validatePublicBookingTickets(input: {
    ticketTypeOptions: BookingTicketTypeOption[];
    ticketQuantities: Record<string, number>;
    selectedTrip: BookingTripOption | undefined;
    t: (key: string, params?: Record<string, string>) => string;
}): PublicBookingTicketValidationResult {
    const { ticketTypeOptions, ticketQuantities, selectedTrip, t } = input;
    const errors: Record<string, string> = {};
    const firstTicketTypeId = ticketTypeOptions.length > 0 ? String(ticketTypeOptions[0].id) : null;
    let anySelected = false;
    let totalSelected = 0;

    for (const ticketTypeOption of ticketTypeOptions) {
        const ticketTypeId = String(ticketTypeOption.id);
        const quantity = normalizePublicBookingTicketQuantity(ticketQuantities[ticketTypeId]);
        totalSelected += quantity;

        if (quantity <= 0) {
            continue;
        }

        anySelected = true;

        if (quantity < ticketTypeOption.min_per_purchase) {
            errors[ticketTypeId] = t('publicBooking.minPerType', { min: String(ticketTypeOption.min_per_purchase) });
            return {
                errors,
                totalSelected,
                canContinue: false,
            };
        }

        if (ticketTypeOption.max_per_purchase !== null && quantity > ticketTypeOption.max_per_purchase) {
            errors[ticketTypeId] = t('publicBooking.maxPerType', { max: String(ticketTypeOption.max_per_purchase) });
            return {
                errors,
                totalSelected,
                canContinue: false,
            };
        }
    }

    if (!anySelected) {
        if (firstTicketTypeId !== null) {
            errors[firstTicketTypeId] = t('publicBooking.selectAtLeastOneTicket');
        }

        return {
            errors,
            totalSelected,
            canContinue: false,
        };
    }

    if (selectedTrip === undefined) {
        return {
            errors,
            totalSelected,
            canContinue: false,
        };
    }

    if (totalSelected > selectedTrip.remaining_capacity) {
        if (firstTicketTypeId !== null) {
            errors[firstTicketTypeId] = t('publicBooking.totalExceedsTrip');
        }

        return {
            errors,
            totalSelected,
            canContinue: false,
        };
    }

    return {
        errors,
        totalSelected,
        canContinue: true,
    };
}
