import { BasicIndex, createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTripsPowerSyncTable } from './app.powersync-schema';

export const tripsSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    boat_type_id: z.string().nullable().default(null),
    water_route_id: z.string().nullable().default(null),
    template_day_slot_id: z.string().nullable().default(null),
    scheduled_departure_at: z.string().transform((v) => new Date(v)).nullable().default(null),
    capacity: z.number().int().min(0, 'Capacity cannot be negative').nullable().default(null),
});

export type TripInput = z.input<typeof tripsSchema>;
export type TripOutput = z.output<typeof tripsSchema>;

export function createTripsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createCollection({
        defaultIndexType: BasicIndex,
        ...powerSyncCollectionOptions({
            database,
            table: appTripsPowerSyncTable,
            schema: tripsSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);

    return collection;
}
