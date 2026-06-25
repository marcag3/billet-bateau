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

    const quantityByTicketTypeId = new Map<string, number>();
    const ticketTypeById = new Map<string, BookingTicketTypeOption>();

    for (const ticketTypeOption of ticketTypeOptions) {
        const ticketTypeId = String(ticketTypeOption.id);
        ticketTypeById.set(ticketTypeId, ticketTypeOption);
        const quantity = normalizePublicBookingTicketQuantity(ticketQuantities[ticketTypeId]);
        quantityByTicketTypeId.set(ticketTypeId, quantity);
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

    for (const ticketTypeOption of ticketTypeOptions) {
        const dependsOnTicketTypeId = ticketTypeOption.depends_on_ticket_type_id;
        const maxPerReferenceTicket = ticketTypeOption.max_per_reference_ticket;

        if (dependsOnTicketTypeId === null || maxPerReferenceTicket === null) {
            continue;
        }

        const dependentTicketTypeId = String(ticketTypeOption.id);
        const dependentQuantity = quantityByTicketTypeId.get(dependentTicketTypeId) ?? 0;

        if (dependentQuantity <= 0) {
            continue;
        }

        const referenceTicketType = ticketTypeById.get(String(dependsOnTicketTypeId));
        const referenceQuantity = quantityByTicketTypeId.get(String(dependsOnTicketTypeId)) ?? 0;
        const referenceTitle = referenceTicketType?.title ?? String(dependsOnTicketTypeId);

        if (referenceQuantity <= 0) {
            errors[dependentTicketTypeId] = t('publicBooking.dependencyRequiresReference', {
                reference: referenceTitle,
                dependent: ticketTypeOption.title,
            });
            return {
                errors,
                totalSelected,
                canContinue: false,
            };
        }

        const allowedDependentQuantity = referenceQuantity * maxPerReferenceTicket;

        if (dependentQuantity > allowedDependentQuantity) {
            errors[dependentTicketTypeId] = t('publicBooking.dependencyExceedsMax', {
                max: String(maxPerReferenceTicket),
                dependent: ticketTypeOption.title,
                reference: referenceTitle,
            });
            return {
                errors,
                totalSelected,
                canContinue: false,
            };
        }
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

export function validateWalkInBookingTickets(input: {
    ticketTypeOptions: BookingTicketTypeOption[];
    ticketQuantities: Record<string, number>;
    bookedCount: number;
    tripCapacity: number | null;
    t: (key: string, params?: Record<string, string>) => string;
}): PublicBookingTicketValidationResult {
    const { ticketTypeOptions, ticketQuantities, bookedCount, tripCapacity, t } = input;
    const errors: Record<string, string> = {};
    const firstTicketTypeId = ticketTypeOptions.length > 0 ? String(ticketTypeOptions[0].id) : null;
    let totalSelected = 0;

    for (const ticketTypeOption of ticketTypeOptions) {
        const ticketTypeId = String(ticketTypeOption.id);
        const quantity = normalizePublicBookingTicketQuantity(ticketQuantities[ticketTypeId]);
        totalSelected += quantity;
    }

    if (totalSelected <= 0) {
        if (firstTicketTypeId !== null) {
            errors[firstTicketTypeId] = t('publicBooking.selectAtLeastOneTicket');
        }

        return {
            errors,
            totalSelected,
            canContinue: false,
        };
    }

    const capacity = tripCapacity;
    if (
        capacity != null &&
        Number.isFinite(Number(capacity)) &&
        bookedCount + totalSelected > Math.max(0, Math.floor(Number(capacity)))
    ) {
        if (firstTicketTypeId !== null) {
            errors[firstTicketTypeId] = t('programsControl.capacityFull');
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
