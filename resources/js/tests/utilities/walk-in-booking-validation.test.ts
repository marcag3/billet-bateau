import { describe, expect, it } from 'vitest';
import type { BookingTicketTypeOption } from '../../models/public-booking/public-booking.types';
import { validateWalkInBookingTickets } from '../../utilities/public-booking-validation';

const ticketTypes: BookingTicketTypeOption[] = [
    {
        id: 'adult',
        title: 'Adult',
        price_cents: 2500,
        is_pay_what_you_can: false,
        min_per_purchase: 2,
        max_per_purchase: 5,
        depends_on_ticket_type_id: null,
        max_per_reference_ticket: null,
    },
    {
        id: 'child',
        title: 'Child',
        price_cents: 1000,
        is_pay_what_you_can: false,
        min_per_purchase: 1,
        max_per_purchase: null,
        depends_on_ticket_type_id: 'adult',
        max_per_reference_ticket: 2,
    },
];

function t(key: string, params?: Record<string, string>): string {
    if (params === undefined) {
        return key;
    }

    return `${key}:${JSON.stringify(params)}`;
}

describe('validateWalkInBookingTickets', () => {
    it('blocks continue when no ticket is selected', () => {
        const result = validateWalkInBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 0,
                child: 0,
            },
            bookedCount: 0,
            tripCapacity: 10,
            t,
        });

        expect(result.canContinue).toBe(false);
        expect(result.errors).toEqual({
            adult: 'publicBooking.selectAtLeastOneTicket',
        });
    });

    it('blocks continue when total selected exceeds trip capacity', () => {
        const result = validateWalkInBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 2,
                child: 1,
            },
            bookedCount: 8,
            tripCapacity: 10,
            t,
        });

        expect(result.canContinue).toBe(false);
        expect(result.errors).toEqual({
            adult: 'programsControl.capacityFull',
        });
    });

    it('allows continue for valid multi-type selection', () => {
        const result = validateWalkInBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 2,
                child: 1,
            },
            bookedCount: 5,
            tripCapacity: 10,
            t,
        });

        expect(result.canContinue).toBe(true);
        expect(result.errors).toEqual({});
        expect(result.totalSelected).toBe(3);
    });

    it('allows selection that would fail public min and ratio rules', () => {
        const result = validateWalkInBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 1,
                child: 3,
            },
            bookedCount: 0,
            tripCapacity: 10,
            t,
        });

        expect(result.canContinue).toBe(true);
        expect(result.errors).toEqual({});
        expect(result.totalSelected).toBe(4);
    });
});
