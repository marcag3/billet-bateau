import { describe, expect, it } from 'vitest';
import {
    buildManifestSlots,
    derivePendingBookingGroups,
    groupTicketsByBookingId,
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
                passengers: [{ id: 'p1', name: 'Checked In' } as never],
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
            false,
        );

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

    it('buildManifestSlots shows pending bookings before voyage exists', () => {
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
            false,
        );

        expect(slots[0]).toMatchObject({
            kind: 'pendingBooking',
            bookingId: 'b1',
            canCheckIn: true,
        });
    });
});
