import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appWaterRoutesPowerSyncTable } from './app.powersync-schema';

export const waterRoutesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    trace: z.string().nullable().default(null),
    duration_minutes: z.number().int().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export type WaterRouteInput = z.input<typeof waterRoutesSchema>;
export type WaterRouteOutput = z.output<typeof waterRoutesSchema>;

export const waterRoutesDeserializationSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    trace: z.string().nullable().default(null),
    duration_minutes: z.number().int().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export function createWaterRoutesCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appWaterRoutesPowerSyncTable,
            schema: waterRoutesSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
