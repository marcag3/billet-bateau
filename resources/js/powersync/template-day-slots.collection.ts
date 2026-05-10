import { BasicIndex, createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTemplateDaySlotsPowerSyncTable } from './app.powersync-schema';

export const templateDaySlotsSchema = z.object({
    id: z.string(),
    template_day_id: z.string().nullable().default(null),
    sort_order: z.number().int().min(0, 'Sort order cannot be negative').nullable().default(null),
    departure_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Departure time must be in HH:MM format').nullable().default(null),
    capacity: z.number().int().min(0, 'Capacity cannot be negative').nullable().default(null),
    boat_type_id: z.string().nullable().default(null),
    water_route_id: z.string().nullable().default(null),
    internal_notes: z.string().nullable().default(null),
    ticket_setup: z.string().nullable().default(null),
});

export type TemplateDaySlotInput = z.input<typeof templateDaySlotsSchema>;
export type TemplateDaySlotOutput = z.output<typeof templateDaySlotsSchema>;

export function createTemplateDaySlotsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createCollection({
        defaultIndexType: BasicIndex,
        ...powerSyncCollectionOptions({
            database,
            table: appTemplateDaySlotsPowerSyncTable,
            schema: templateDaySlotsSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);

    return collection;
}
