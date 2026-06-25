import { describe, expect, it } from 'vitest';
import {
    buildManifestSlots,
    derivePendingBookingGroups,
    groupTicketsByBookingId,
    isControlPanelManifestModifiable,
} from '../../utilities/control-panel-manifest';

describe('control-panel-manifest', () => {
    it('groupTicketsByBookingId groups tickets and formats multi-ticket label', () => {
        expect(
            groupTicketsByBookingId([
                { id: 't1', name: 'Ada', booking_id: 'b1' },
                { id: 't2', name: 'Bob', booking_id: 'b1' },
                { id: 't3', name: 'Eve', booking_id: 'b2' },
            ]),
        ).toEqual([
            {
                bookingId: 'b1',
                tickets: [
                    { id: 't1', name: 'Ada', booking_id: 'b1' },
                    { id: 't2', name: 'Bob', booking_id: 'b1' },
                ],
                displayName: 'Ada (2)',
                ticketCount: 2,
            },
            {
                bookingId: 'b2',
                tickets: [{ id: 't3', name: 'Eve', booking_id: 'b2' }],
                displayName: 'Eve',
                ticketCount: 1,
            },
        ]);
    });

    it('derivePendingBookingGroups excludes checked-in bookings', () => {
        const tickets = [
            { id: 't1', name: 'Ada', booking_id: 'b1' },
            { id: 't2', name: 'Bob', booking_id: 'b2' },
        ];

        expect(derivePendingBookingGroups(tickets, ['b1'])).toEqual([
            {
                bookingId: 'b2',
                tickets: [{ id: 't2', name: 'Bob', booking_id: 'b2' }],
                displayName: 'Bob',
                ticketCount: 1,
            },
        ]);
    });

    it('buildManifestSlots shows passengers, pending bookings, and empty seats', () => {
        const slots = buildManifestSlots(
            {
                voyage: { id: 'v1', status: 'ready' } as never,
                passengers: [
                    {
                        id: 'p1',
                        name: 'Checked In',
                        booking_id: 'b1',
                        check_in_id: 'ci-1',
                    } as never,
                ],
                bookingTickets: [
                    { id: 't1', name: 'Ada', booking_id: 'b1' },
                    { id: 't2', name: 'Bob', booking_id: 'b2' },
                ],
                checkedInBookingIds: ['b1'],
                pendingBookingGroups: [
                    {
                        bookingId: 'b2',
                        tickets: [{ id: 't2', name: 'Bob', booking_id: 'b2' }],
                        displayName: 'Bob',
                        ticketCount: 1,
                    },
                ],
            },
            4,
            true,
        );

        expect(slots[0]).toMatchObject({
            kind: 'passenger',
            bookingId: 'b1',
        });
        expect(slots.map((slot) => slot.kind)).toEqual([
            'passenger',
            'pendingBooking',
            'empty',
            'empty',
        ]);
        expect(slots[1]).toMatchObject({
            kind: 'pendingBooking',
            bookingId: 'b2',
            canCheckIn: true,
        });
    });

    it('buildManifestSlots uses ticket count for empty seats before voyage', () => {
        const slots = buildManifestSlots(
            {
                voyage: null,
                passengers: [],
                bookingTickets: [
                    { id: 't1', name: 'Ada', booking_id: 'b1' },
                    { id: 't2', name: 'Bob', booking_id: 'b1' },
                    { id: 't3', name: 'Eve', booking_id: 'b2' },
                    { id: 't4', name: 'Mia', booking_id: 'b2' },
                ],
                checkedInBookingIds: [],
                pendingBookingGroups: [],
            },
            4,
            true,
        );

        expect(slots.map((slot) => slot.kind)).toEqual(['booked', 'booked']);
    });

    it('buildManifestSlots shows no empty seats when multi-ticket bookings fill capacity', () => {
        const slots = buildManifestSlots(
            {
                voyage: null,
                passengers: [],
                bookingTickets: [
                    { id: 't1', name: 'A', booking_id: 'b1' },
                    { id: 't2', name: 'A', booking_id: 'b1' },
                    { id: 't3', name: 'B', booking_id: 'b2' },
                    { id: 't4', name: 'B', booking_id: 'b2' },
                    { id: 't5', name: 'C', booking_id: 'b3' },
                    { id: 't6', name: 'C', booking_id: 'b3' },
                    { id: 't7', name: 'D', booking_id: 'b4' },
                    { id: 't8', name: 'D', booking_id: 'b4' },
                    { id: 't9', name: 'D', booking_id: 'b4' },
                    { id: 't10', name: 'D', booking_id: 'b4' },
                ],
                checkedInBookingIds: [],
                pendingBookingGroups: [],
            },
            10,
            true,
        );

        expect(slots.map((slot) => slot.kind)).toEqual([
            'booked',
            'booked',
            'booked',
            'booked',
        ]);
    });

    it('buildManifestSlots shows booked rows before voyage exists', () => {
        const slots = buildManifestSlots(
            {
                voyage: null,
                passengers: [],
                bookingTickets: [{ id: 't1', name: 'Ada', booking_id: 'b1' }],
                checkedInBookingIds: [],
                pendingBookingGroups: [
                    {
                        bookingId: 'b1',
                        tickets: [{ id: 't1', name: 'Ada', booking_id: 'b1' }],
                        displayName: 'Ada',
                        ticketCount: 1,
                    },
                ],
            },
            2,
            true,
        );

        expect(slots.map((slot) => slot.kind)).toEqual(['booked', 'empty']);
        expect(slots[0]).toMatchObject({
            kind: 'booked',
            bookingId: 'b1',
            ticketId: 't1',
            name: 'Ada',
            canCheckIn: true,
        });
    });

    it('buildManifestSlots hides check-in when manifest is locked', () => {
        const slots = buildManifestSlots(
            {
                voyage: null,
                passengers: [],
                bookingTickets: [{ id: 't1', name: 'Ada', booking_id: 'b1' }],
                checkedInBookingIds: [],
                pendingBookingGroups: [],
            },
            2,
            false,
        );

        expect(slots[0]).toMatchObject({
            kind: 'booked',
            canCheckIn: false,
        });
    });

    it('buildManifestSlots hides pending bookings after trip has departed', () => {
        const slots = buildManifestSlots(
            {
                voyage: { id: 'v1', status: 'underway' } as never,
                passengers: [
                    {
                        id: 'p1',
                        name: 'Checked In',
                        booking_id: 'b1',
                        check_in_id: 'ci-1',
                    } as never,
                ],
                bookingTickets: [],
                checkedInBookingIds: ['b1'],
                pendingBookingGroups: [
                    {
                        bookingId: 'b2',
                        tickets: [{ id: 't2', name: 'Bob', booking_id: 'b2' }],
                        displayName: 'Bob',
                        ticketCount: 1,
                    },
                ],
            },
            4,
            false,
        );

        expect(slots.map((slot) => slot.kind)).toEqual(['passenger']);
        expect(slots[0]).toMatchObject({
            kind: 'passenger',
            bookingId: 'b1',
        });
    });

    it('isControlPanelManifestModifiable is false once underway or terminal', () => {
        expect(isControlPanelManifestModifiable(null)).toBe(true);
        expect(isControlPanelManifestModifiable({ status: 'ready' } as never)).toBe(
            true,
        );
        expect(isControlPanelManifestModifiable({ status: 'underway' } as never)).toBe(
            false,
        );
        expect(isControlPanelManifestModifiable({ status: 'completed' } as never)).toBe(
            false,
        );
        expect(isControlPanelManifestModifiable({ status: 'cancelled' } as never)).toBe(
            false,
        );
    });
});
