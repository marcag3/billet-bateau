import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTemplateDaySlotsPowerSyncTable } from './app.powersync-schema';

export const templateDaySlotsSchema = z.object({
    id: z.string(),
    template_day_id: z.string().nullable().default(null),
    sort_order: z.number().int().nullable().default(null),
    departure_time: z.string().nullable().default(null),
    capacity: z.number().int().nullable().default(null),
    boat_type_id: z.string().nullable().default(null),
    water_route_id: z.string().nullable().default(null),
    internal_notes: z.string().nullable().default(null),
    ticket_setup: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export type TemplateDaySlotInput = z.input<typeof templateDaySlotsSchema>;
export type TemplateDaySlotOutput = z.output<typeof templateDaySlotsSchema>;

export const templateDaySlotsDeserializationSchema = z.object({
    id: z.string(),
    template_day_id: z.string().nullable().default(null),
    sort_order: z.number().int().nullable().default(null),
    departure_time: z.string().nullable().default(null),
    capacity: z.number().int().nullable().default(null),
    boat_type_id: z.string().nullable().default(null),
    water_route_id: z.string().nullable().default(null),
    internal_notes: z.string().nullable().default(null),
    ticket_setup: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export function createTemplateDaySlotsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appTemplateDaySlotsPowerSyncTable,
            schema: templateDaySlotsSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
