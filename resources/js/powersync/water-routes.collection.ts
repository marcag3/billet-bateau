import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appWaterRoutesPowerSyncTable } from './app.powersync-schema';

export const waterRoutesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    trace: z.string().nullable(),
    duration_minutes: z.number().int().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type WaterRouteInput = z.input<typeof waterRoutesSchema>;
export type WaterRouteOutput = z.output<typeof waterRoutesSchema>;

export const waterRoutesDeserializationSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    trace: z.string().nullable(),
    duration_minutes: z.number().int().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
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
            deserializationSchema: waterRoutesDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
