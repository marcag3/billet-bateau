import { createAppPowerSyncCollection } from "./collection-defaults";
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appBoatsPowerSyncTable } from './app.powersync-schema';

export const boatsSchema = z.object({
    id: z.string(),
    boat_type_id: z.string().nullable().default(null),
    program_id: z.string().nullable().default(null),
    name: z.string().min(1, "Boat name is required").nullable().default(null),
    capacity: z.number().int().min(0, "Capacity cannot be negative").nullable().default(null),
    notes: z.string().nullable().default(null),
});

export type BoatInput = z.input<typeof boatsSchema>;
export type BoatOutput = z.output<typeof boatsSchema>;

export function createBoatsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createAppPowerSyncCollection('boats', {
        ...powerSyncCollectionOptions({
            database,
            table: appBoatsPowerSyncTable,
            schema: boatsSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);
    collection.createIndex((row) => row.program_id);
    collection.createIndex((row) => row.boat_type_id);

    return collection;
}
