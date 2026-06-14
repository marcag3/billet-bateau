import { describe, expect, it } from 'vitest';
import type { BookingTicketTypeOption, BookingTripOption } from '../../models/public-booking/public-booking.types';
import { validatePublicBookingTickets } from '../../utilities/public-booking-validation';

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

const trip: BookingTripOption = {
    id: 'trip-1',
    scheduled_departure_at: '2026-01-01T10:00:00Z',
    capacity: 10,
    remaining_capacity: 4,
    product_id: 'product-1',
    product_name: 'Tour',
    product_description: null,
    product_banner_url: null,
    boat_type_id: null,
    boat_type_name: null,
    boat_type_banner_url: null,
    water_route_id: null,
    water_route_name: null,
    water_route_duration_minutes: null,
    water_route_trace_geojson: null,
};

function t(key: string, params?: Record<string, string>): string {
    if (params === undefined) {
        return key;
    }

    return `${key}:${JSON.stringify(params)}`;
}

describe('validatePublicBookingTickets', () => {
    it('blocks continue when no ticket is selected', () => {
        const result = validatePublicBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 0,
                child: 0,
            },
            selectedTrip: trip,
            t,
        });

        expect(result.canContinue).toBe(false);
        expect(result.errors).toEqual({
            adult: 'publicBooking.selectAtLeastOneTicket',
        });
    });

    it('blocks continue when selected quantity is below min per purchase', () => {
        const result = validatePublicBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 1,
                child: 0,
            },
            selectedTrip: trip,
            t,
        });

        expect(result.canContinue).toBe(false);
        expect(result.errors).toEqual({
            adult: 'publicBooking.minPerType:{"min":"2"}',
        });
    });

    it('blocks continue when selected quantity exceeds max per purchase', () => {
        const result = validatePublicBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 6,
                child: 0,
            },
            selectedTrip: trip,
            t,
        });

        expect(result.canContinue).toBe(false);
        expect(result.errors).toEqual({
            adult: 'publicBooking.maxPerType:{"max":"5"}',
        });
    });

    it('blocks continue when total selected tickets exceed remaining capacity', () => {
        const result = validatePublicBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 2,
                child: 3,
            },
            selectedTrip: trip,
            t,
        });

        expect(result.canContinue).toBe(false);
        expect(result.errors).toEqual({
            adult: 'publicBooking.totalExceedsTrip',
        });
    });

    it('allows continue when constraints are met', () => {
        const result = validatePublicBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 2,
                child: 1,
            },
            selectedTrip: trip,
            t,
        });

        expect(result.canContinue).toBe(true);
        expect(result.errors).toEqual({});
    });

    it('blocks continue when no trip is selected', () => {
        const result = validatePublicBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 2,
                child: 0,
            },
            selectedTrip: undefined,
            t,
        });

        expect(result.canContinue).toBe(false);
        expect(result.errors).toEqual({});
    });

    it('blocks continue when dependent tickets are selected without reference tickets', () => {
        const result = validatePublicBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 0,
                child: 1,
            },
            selectedTrip: trip,
            t,
        });

        expect(result.canContinue).toBe(false);
        expect(result.errors).toEqual({
            child: 'publicBooking.dependencyRequiresReference:{"reference":"Adult","dependent":"Child"}',
        });
    });

    it('blocks continue when dependent tickets exceed max per reference ticket', () => {
        const result = validatePublicBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 2,
                child: 5,
            },
            selectedTrip: {
                ...trip,
                remaining_capacity: 10,
            },
            t,
        });

        expect(result.canContinue).toBe(false);
        expect(result.errors).toEqual({
            child: 'publicBooking.dependencyExceedsMax:{"max":"2","dependent":"Child","reference":"Adult"}',
        });
    });

    it('allows continue when dependent tickets are within max per reference ticket', () => {
        const result = validatePublicBookingTickets({
            ticketTypeOptions: ticketTypes,
            ticketQuantities: {
                adult: 2,
                child: 4,
            },
            selectedTrip: {
                ...trip,
                remaining_capacity: 10,
            },
            t,
        });

        expect(result.canContinue).toBe(true);
        expect(result.errors).toEqual({});
    });
});
