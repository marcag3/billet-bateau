import { BasicIndex, createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appWaterRoutesPowerSyncTable } from './app.powersync-schema';

export const waterRoutesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    name: z.string().min(1, 'Water route name is required').nullable().default(null),
    trace: z.string().nullable().default(null),
    duration_minutes: z.number().int().min(0, 'Duration cannot be negative').nullable().default(null),
});

export type WaterRouteInput = z.input<typeof waterRoutesSchema>;
export type WaterRouteOutput = z.output<typeof waterRoutesSchema>;

export function createWaterRoutesCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createCollection({
        defaultIndexType: BasicIndex,
        ...powerSyncCollectionOptions({
            database,
            table: appWaterRoutesPowerSyncTable,
            schema: waterRoutesSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);

    return collection;
}
