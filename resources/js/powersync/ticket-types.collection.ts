import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTicketTypesPowerSyncTable } from './app.powersync-schema';

export const ticketTypesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    title: z.string().nullable().default(null),
    price_cents: z.number().int().nullable().default(null),
    is_pay_what_you_can: z.boolean().nullable().default(null),
    min_per_purchase: z.number().int().nullable().default(null),
    max_per_purchase: z.number().int().nullable().default(null),
    trip_inventory_caps: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export type TicketTypeInput = z.input<typeof ticketTypesSchema>;
export type TicketTypeOutput = z.output<typeof ticketTypesSchema>;

export const ticketTypesDeserializationSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    title: z.string().nullable().default(null),
    price_cents: z.number().int().nullable().default(null),
    is_pay_what_you_can: z.number().nullable().default(null).transform((v) => (v != null ? v === 1 : null)),
    min_per_purchase: z.number().int().nullable().default(null),
    max_per_purchase: z.number().int().nullable().default(null),
    trip_inventory_caps: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export function createTicketTypesCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appTicketTypesPowerSyncTable,
            schema: ticketTypesSchema,
            deserializationSchema: ticketTypesDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
