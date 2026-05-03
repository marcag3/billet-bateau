import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appBookingTicketsPowerSyncTable } from './app.powersync-schema';

export const bookingTicketsSchema = z.object({
    id: z.string(),
    booking_id: z.string().nullable().default(null),
    ticket_type_id: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    email: z.string().nullable().default(null),
    country: z.string().nullable().default(null),
    custom_fields: z.string().nullable().default(null),
    waiver_confirmation_id: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export type BookingTicketInput = z.input<typeof bookingTicketsSchema>;
export type BookingTicketOutput = z.output<typeof bookingTicketsSchema>;

export const bookingTicketsDeserializationSchema = z.object({
    id: z.string(),
    booking_id: z.string().nullable().default(null),
    ticket_type_id: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    email: z.string().nullable().default(null),
    country: z.string().nullable().default(null),
    custom_fields: z.string().nullable().default(null),
    waiver_confirmation_id: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export function createBookingTicketsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appBookingTicketsPowerSyncTable,
            schema: bookingTicketsSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    );
}
