import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTicketTypesPowerSyncTable } from './app.powersync-schema';

export const ticketTypesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    title: z.string().min(1, "Title is required").nullable().default(null),
    price_cents: z.number().int().min(0, "Price cannot be negative").nullable().default(null),
    is_pay_what_you_can: z.number().int().transform((v) => v === 1).nullable().default(false),
    min_per_purchase: z.number().int().min(0, "Minimum per purchase cannot be negative").nullable().default(null),
    max_per_purchase: z.number().int().min(0, "Maximum per purchase cannot be negative").nullable().default(null),
    trip_inventory_caps: z.string().nullable().default(null),
    created_at: z.string().transform((v) => new Date(v)).nullable().default(() => new Date()),
    updated_at: z.string().transform((v) => new Date(v)).nullable().default(() => new Date()),
});

export type TicketTypeInput = z.input<typeof ticketTypesSchema>;
export type TicketTypeOutput = z.output<typeof ticketTypesSchema>;

export function createTicketTypesCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appTicketTypesPowerSyncTable,
            schema: ticketTypesSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    );
}
