import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTemplateDaySlotsPowerSyncTable } from './app.powersync-schema';

export const templateDaySlotsSchema = z.object({
    id: z.string(),
    template_day_id: z.string().nullable(),
    sort_order: z.number().int().nullable(),
    departure_time: z.string().nullable(),
    capacity: z.number().int().nullable(),
    boat_type_id: z.string().nullable(),
    water_route_id: z.string().nullable(),
    internal_notes: z.string().nullable(),
    ticket_setup: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type TemplateDaySlotInput = z.input<typeof templateDaySlotsSchema>;
export type TemplateDaySlotOutput = z.output<typeof templateDaySlotsSchema>;

export const templateDaySlotsDeserializationSchema = z.object({
    id: z.string(),
    template_day_id: z.string().nullable(),
    sort_order: z.number().int().nullable(),
    departure_time: z.string().nullable(),
    capacity: z.number().int().nullable(),
    boat_type_id: z.string().nullable(),
    water_route_id: z.string().nullable(),
    internal_notes: z.string().nullable(),
    ticket_setup: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
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
            deserializationSchema: templateDaySlotsDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
