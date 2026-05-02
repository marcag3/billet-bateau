import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appBookingTicketsPowerSyncTable } from './app.powersync-schema';

export const bookingTicketsSchema = z.object({
    id: z.string(),
    booking_id: z.string().nullable(),
    ticket_type_id: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    country: z.string().nullable(),
    custom_fields: z.string().nullable(),
    waiver_confirmation_id: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type BookingTicketInput = z.input<typeof bookingTicketsSchema>;
export type BookingTicketOutput = z.output<typeof bookingTicketsSchema>;

export const bookingTicketsDeserializationSchema = z.object({
    id: z.string(),
    booking_id: z.string().nullable(),
    ticket_type_id: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    country: z.string().nullable(),
    custom_fields: z.string().nullable(),
    waiver_confirmation_id: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export function createBookingTicketsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appBookingTicketsPowerSyncTable,
            schema: bookingTicketsSchema,
            deserializationSchema: bookingTicketsDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
